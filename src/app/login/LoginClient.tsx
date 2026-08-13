"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import List from "@mui/material/List";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded";
import SmsRoundedIcon from "@mui/icons-material/SmsRounded";
import type { Role, User } from "@/lib/types";
import { completeSupabaseLogin, loginAsDemoUser } from "@/lib/auth-actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const ROLE_CHIP: Record<
  Role,
  { label: string; color: "primary" | "secondary" | "info" | "success" }
> = {
  learner: { label: "Learner", color: "primary" },
  admin: { label: "Admin", color: "secondary" },
  support: { label: "Support", color: "info" },
  sales: { label: "Sales", color: "success" },
};

/**
 * Accepts a 10-digit Indian mobile number (the +91 prefix is shown as an
 * input adornment) or a full 91-prefixed number; returns E.164 or null.
 */
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return null;
}

// ---------------------------------------------------------------------------
// Demo mode — pick a seeded profile
// ---------------------------------------------------------------------------

function DemoLogin({ users, next }: { users: User[]; next: string | null }) {
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handlePick(userId: string) {
    setError(null);
    setPendingId(userId);
    // On success the action redirect()s — the resulting navigation is handled
    // by Next itself, so we only ever see the {ok:false} return shape here.
    const result = await loginAsDemoUser(userId, next);
    if (result && !result.ok) {
      setError(result.error ?? "Could not sign in as this profile.");
      setPendingId(null);
    }
  }

  return (
    <Stack spacing={2}>
      <Alert severity="info">
        Demo mode — pick a profile to explore. No password or OTP needed.
      </Alert>

      {error && <Alert severity="error">{error}</Alert>}

      {users.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <PersonOffRoundedIcon
            sx={{ fontSize: 44, color: "text.disabled", mb: 1 }}
          />
          <Typography variant="subtitle1">No demo profiles found</Typography>
          <Typography variant="body2" color="text.secondary">
            The seeded users could not be loaded. Restart the dev server and
            try again.
          </Typography>
        </Box>
      ) : (
        <List disablePadding sx={{ display: "grid", gap: 1 }}>
          {users.map((u) => {
            const chip = ROLE_CHIP[u.role];
            const isPending = pendingId === u.id;
            return (
              <ListItemButton
                key={u.id}
                onClick={() => handlePick(u.id)}
                disabled={pendingId !== null}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 3,
                  px: 2,
                  py: 1.25,
                  "&:hover": { borderColor: "primary.main" },
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: `${chip.color}.main`,
                      color: `${chip.color}.contrastText`,
                      fontWeight: 600,
                    }}
                  >
                    {u.name.trim().charAt(0).toUpperCase() || "U"}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={u.name}
                  secondary={u.phone_number}
                  sx={{ minWidth: 0 }}
                  slotProps={{
                    primary: { fontWeight: 600 },
                    secondary: {
                      variant: "body2",
                      noWrap: true,
                      sx: { textOverflow: "ellipsis", overflow: "hidden" },
                    },
                  }}
                />
                {isPending ? (
                  <CircularProgress size={22} sx={{ ml: 1, flexShrink: 0 }} />
                ) : (
                  <Chip
                    label={chip.label}
                    color={chip.color}
                    size="small"
                    variant="outlined"
                    sx={{ ml: 1, flexShrink: 0 }}
                  />
                )}
              </ListItemButton>
            );
          })}
        </List>
      )}
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Production mode — phone OTP via Supabase
// ---------------------------------------------------------------------------

function PhoneOtpLogin({ next }: { next: string | null }) {
  const [step, setStep] = React.useState<0 | 1>(0);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [fullPhone, setFullPhone] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSendOtp(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const normalized = normalizePhone(phone);
    if (!normalized) {
      setError("Enter your 10-digit mobile number (digits only).");
      return;
    }

    setPending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: normalized,
      });
      if (otpError) {
        setError(otpError.message);
        return;
      }
      setFullPhone(normalized);
      setOtp("");
      setStep(1);
    } catch {
      setError("Could not send the OTP. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const token = otp.trim();
    if (!/^\d{6}$/.test(token)) {
      setError("Enter the 6-digit code sent to your phone.");
      return;
    }

    setPending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token,
        type: "sms",
      });
      if (verifyError) {
        setError(verifyError.message);
        setPending(false);
        return;
      }
    } catch {
      setError("Verification failed. Please try again.");
      setPending(false);
      return;
    }

    // On success this server action redirect()s (which propagates through the
    // await as a Next-handled navigation) — only the {ok:false} shape returns.
    const result = await completeSupabaseLogin(name.trim() || null, next);
    if (result && !result.ok) {
      setError(result.error ?? "Could not complete sign-in. Please try again.");
      setPending(false);
    }
  }

  function handleChangeNumber() {
    setStep(0);
    setOtp("");
    setError(null);
  }

  return (
    <Stack spacing={3}>
      <Stepper activeStep={step}>
        <Step>
          <StepLabel>Phone number</StepLabel>
        </Step>
        <Step>
          <StepLabel>Verify OTP</StepLabel>
        </Step>
      </Stepper>

      {error && <Alert severity="error">{error}</Alert>}

      {step === 0 ? (
        <Box component="form" onSubmit={handleSendOtp}>
          <Stack spacing={2.5}>
            <TextField
              label="Your name"
              placeholder="e.g. Anjali K"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={pending}
              fullWidth
              autoComplete="name"
              helperText="Optional — used to create your profile the first time."
            />
            <TextField
              label="Phone number"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={pending}
              required
              fullWidth
              autoComplete="tel-national"
              helperText="We'll text a one-time code to this number."
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">+91</InputAdornment>
                  ),
                },
                htmlInput: { inputMode: "numeric" },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={pending}
              startIcon={
                pending ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <SmsRoundedIcon />
                )
              }
            >
              {pending ? "Sending OTP…" : "Send OTP"}
            </Button>
          </Stack>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleVerify}>
          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary">
              We sent a 6-digit code to <strong>{fullPhone}</strong>. Enter it
              below to finish signing in.
            </Typography>
            <TextField
              label="One-time code"
              placeholder="••••••"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              disabled={pending}
              required
              fullWidth
              autoFocus
              autoComplete="one-time-code"
              slotProps={{
                htmlInput: {
                  inputMode: "numeric",
                  maxLength: 6,
                  style: { letterSpacing: "0.4em", textAlign: "center" },
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={pending}
              startIcon={
                pending ? (
                  <CircularProgress size={18} color="inherit" />
                ) : undefined
              }
            >
              {pending ? "Verifying…" : "Verify & sign in"}
            </Button>
            <Button
              onClick={handleChangeNumber}
              disabled={pending}
              startIcon={<ArrowBackRoundedIcon />}
              sx={{ alignSelf: "center" }}
            >
              Change number
            </Button>
          </Stack>
        </Box>
      )}
    </Stack>
  );
}

// ---------------------------------------------------------------------------

/**
 * Client half of the login screen. Renders the demo profile picker when the
 * app runs in demo mode, otherwise the two-step Supabase phone-OTP flow.
 */
export default function LoginClient({
  demoMode,
  demoUsers,
  next,
}: {
  demoMode: boolean;
  demoUsers: User[];
  next: string | null;
}) {
  return demoMode ? (
    <DemoLogin users={demoUsers} next={next} />
  ) : (
    <PhoneOtpLogin next={next} />
  );
}
