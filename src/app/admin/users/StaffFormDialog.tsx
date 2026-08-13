"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import { normalizePhone } from "@/lib/format";
import type { User } from "@/lib/types";
import { createStaffUserAction, updateStaffUserAction } from "./actions";

const PHONE_RE = /^\+?\d{10,13}$/;

const ROLE_NOUN: Record<"support" | "sales", string> = {
  support: "support executive",
  sales: "sales user",
};

/**
 * Create/edit dialog for a staff account (support or sales). Pass `staff`
 * to edit an existing account, or null to create a new one.
 */
export default function StaffFormDialog({
  open,
  role,
  staff,
  onClose,
}: {
  open: boolean;
  role: "support" | "sales";
  staff: User | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isEdit = Boolean(staff);
  const noun = ROLE_NOUN[role];

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [phoneError, setPhoneError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  // Re-seed the form every time the dialog opens (create vs. edit).
  React.useEffect(() => {
    if (!open) return;
    setName(staff?.name ?? "");
    setPhone(staff?.phone_number ?? "");
    setNameError(null);
    setPhoneError(null);
    setSubmitError(null);
    setBusy(false);
  }, [open, staff]);

  const handleSubmit = async () => {
    let valid = true;
    if (name.trim().length === 0) {
      setNameError("Name is required.");
      valid = false;
    } else {
      setNameError(null);
    }
    if (!PHONE_RE.test(normalizePhone(phone.trim()))) {
      setPhoneError(
        "Enter a valid phone number (10–13 digits, optional + country code)."
      );
      valid = false;
    } else {
      setPhoneError(null);
    }
    if (!valid) return;

    setBusy(true);
    setSubmitError(null);
    const result = staff
      ? await updateStaffUserAction(staff.id, {
          name: name.trim(),
          phone: phone.trim(),
        })
      : await createStaffUserAction(role, name.trim(), phone.trim());
    setBusy(false);
    if (result.ok) {
      onClose();
      router.refresh();
    } else {
      setSubmitError(result.error ?? `Could not save the ${noun}.`);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      fullScreen={fullScreen}
    >
      <DialogTitle>
        {isEdit ? `Edit ${noun}` : `Add ${noun}`}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {submitError && <Alert severity="error">{submitError}</Alert>}
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={Boolean(nameError)}
            helperText={nameError ?? " "}
            required
            fullWidth
            autoFocus
          />
          <TextField
            label="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            error={Boolean(phoneError)}
            helperText={
              phoneError ?? "They'll sign in with this number via phone OTP."
            }
            required
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={busy}
          startIcon={
            busy ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <SaveRoundedIcon />
            )
          }
        >
          {busy ? "Saving…" : isEdit ? "Save changes" : `Add ${noun}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
