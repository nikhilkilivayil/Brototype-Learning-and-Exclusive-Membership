"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import type { PriceQuote, User } from "@/lib/types";
import { confirmDemoPurchaseAction } from "./checkout-actions";

declare global {
  interface Window {
    /** Injected by https://checkout.razorpay.com/v1/checkout.js */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay?: any;
  }
}

/**
 * Local ₹ formatter (same output as formatINR in @/lib/pricing, which cannot
 * be imported here — it would pull the server-only db module into the client
 * bundle).
 */
function inr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

let razorpayScriptPromise: Promise<void> | null = null;

/** Injects the Razorpay checkout script once and reuses it afterwards. */
function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        razorpayScriptPromise = null;
        script.remove();
        reject(new Error("Could not load the Razorpay checkout script."));
      };
      document.body.appendChild(script);
    });
  }
  return razorpayScriptPromise;
}

interface CheckoutButtonProps {
  seriesId: string;
  seriesTitle: string;
  quote: PriceQuote;
  user: User | null;
  fullWidth?: boolean;
  size?: "small" | "medium" | "large";
  label?: string;
}

export default function CheckoutButton({
  seriesId,
  seriesTitle,
  quote,
  user,
  fullWidth = false,
  size = "medium",
  label,
}: CheckoutButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = React.useState(false);
  const [purchased, setPurchased] = React.useState(false);
  const [demoOpen, setDemoOpen] = React.useState(false);
  const [demoSubmitting, setDemoSubmitting] = React.useState(false);
  const [demoError, setDemoError] = React.useState<string | null>(null);
  const [snack, setSnack] = React.useState<{
    message: string;
    severity: "success" | "error";
  } | null>(null);

  const buttonLabel = label ?? `Buy ${inr(quote.final_price)}`;
  const discountAmount = quote.base_price - quote.final_price;

  // ---- Already owned -------------------------------------------------------
  if (purchased || quote.already_purchased) {
    return (
      <Button
        disabled
        fullWidth={fullWidth}
        size={size}
        variant="contained"
        startIcon={<CheckRoundedIcon />}
        sx={{
          "&.Mui-disabled": {
            bgcolor: "success.light",
            color: "success.dark",
          },
        }}
      >
        Purchased
      </Button>
    );
  }

  // ---- Signed out → send to login, then back here --------------------------
  if (user === null) {
    return (
      <Button
        fullWidth={fullWidth}
        size={size}
        variant="contained"
        startIcon={<ShoppingCartRoundedIcon />}
        onClick={() => router.push(`/login?next=${encodeURIComponent(pathname)}`)}
      >
        {buttonLabel}
      </Button>
    );
  }

  const showError = (message: string) => setSnack({ message, severity: "error" });

  const celebrate = () => {
    setPurchased(true);
    setSnack({ message: "Membership unlocked! 🎉", severity: "success" });
    router.refresh();
  };

  const handleVerify = async (resp: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    try {
      const res = await fetch("/api/razorpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: resp.razorpay_order_id,
          razorpay_payment_id: resp.razorpay_payment_id,
          razorpay_signature: resp.razorpay_signature,
          seriesId,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;
      if (res.ok && data?.ok) {
        celebrate();
      } else {
        showError(data?.error ?? "Payment verification failed. Please contact support.");
      }
    } catch {
      showError("Payment verification failed. Please contact support.");
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seriesId }),
      });
      const data = (await res.json().catch(() => null)) as {
        demo?: boolean;
        error?: string;
        orderId?: string;
        amount?: number;
        currency?: string;
        keyId?: string;
        name?: string;
        description?: string;
      } | null;

      if (!res.ok || !data) {
        showError(data?.error ?? "Could not start checkout. Please try again.");
        setLoading(false);
        return;
      }

      if (data.demo) {
        setDemoError(null);
        setDemoOpen(true);
        setLoading(false);
        return;
      }

      await loadRazorpayScript();
      const razorpay = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: data.name,
        description: data.description,
        order_id: data.orderId,
        prefill: { contact: user.phone_number, name: user.name },
        theme: { color: "#6750A4" },
        modal: { ondismiss: () => setLoading(false) },
        handler: handleVerify,
      });
      razorpay.on(
        "payment.failed",
        (failure: { error?: { description?: string } }) => {
          showError(failure?.error?.description ?? "Payment failed. Please try again.");
          setLoading(false);
        }
      );
      razorpay.open();
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Could not start checkout. Please try again."
      );
      setLoading(false);
    }
  };

  const handleDemoConfirm = async () => {
    setDemoSubmitting(true);
    setDemoError(null);
    try {
      const result = await confirmDemoPurchaseAction(seriesId);
      if (result.ok) {
        setDemoOpen(false);
        celebrate();
      } else {
        setDemoError(result.error ?? "Purchase failed. Please try again.");
      }
    } catch {
      setDemoError("Purchase failed. Please try again.");
    } finally {
      setDemoSubmitting(false);
    }
  };

  return (
    <>
      <Button
        fullWidth={fullWidth}
        size={size}
        variant="contained"
        disabled={loading}
        startIcon={
          loading ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <ShoppingCartRoundedIcon />
          )
        }
        onClick={handleBuy}
      >
        {loading ? "Starting checkout…" : buttonLabel}
      </Button>

      {/* ---- Demo-mode mini checkout ------------------------------------- */}
      <Dialog
        open={demoOpen}
        onClose={() => {
          if (!demoSubmitting) setDemoOpen(false);
        }}
        maxWidth="xs"
        fullWidth
        fullScreen={fullScreen}
        slotProps={{
          paper: { sx: fullScreen ? { borderRadius: 0 } : undefined },
        }}
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <BoltRoundedIcon color="primary" />
            <span>Complete your purchase</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.5}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Exclusive Membership — {seriesTitle}
            </Typography>

            <Stack spacing={0.75}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Base price
                </Typography>
                <Typography variant="body2">{inr(quote.base_price)}</Typography>
              </Stack>
              {quote.discount_applied && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="success.main">
                    Returning-member discount (−{quote.discount_percentage}%)
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    −{inr(discountAmount)}
                  </Typography>
                </Stack>
              )}
              <Divider sx={{ my: 0.5 }} />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="subtitle2">Total</Typography>
                <Typography variant="subtitle2">{inr(quote.final_price)}</Typography>
              </Stack>
            </Stack>

            <Typography variant="caption" color="text.secondary">
              Demo mode — no real payment
            </Typography>

            {demoError && <Alert severity="error">{demoError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            color="inherit"
            disabled={demoSubmitting}
            onClick={() => setDemoOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={demoSubmitting}
            startIcon={
              demoSubmitting ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <CheckRoundedIcon />
              )
            }
            onClick={handleDemoConfirm}
          >
            {demoSubmitting ? "Processing…" : "Simulate successful payment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---- Result toast ------------------------------------------------- */}
      <Snackbar
        open={snack !== null}
        autoHideDuration={5000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack?.severity ?? "success"}
          variant="filled"
          onClose={() => setSnack(null)}
          sx={{ width: "100%" }}
        >
          {snack?.message}
        </Alert>
      </Snackbar>
    </>
  );
}
