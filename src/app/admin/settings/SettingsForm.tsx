"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import { updateSettingsAction } from "../actions";

export default function SettingsForm({
  initialPercentage,
}: {
  initialPercentage: number;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState(String(initialPercentage));
  const [fieldError, setFieldError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [savedOpen, setSavedOpen] = React.useState(false);

  const parsed = Number(value);
  const parsedValid =
    value.trim() !== "" &&
    Number.isFinite(parsed) &&
    parsed >= 0 &&
    parsed <= 100;

  const handleSave = async () => {
    if (!parsedValid) {
      setFieldError("Enter a percentage between 0 and 100.");
      return;
    }
    setFieldError(null);
    setBusy(true);
    setSubmitError(null);
    const result = await updateSettingsAction(parsed);
    setBusy(false);
    if (result.ok) {
      setSavedOpen(true);
      router.refresh();
    } else {
      setSubmitError(result.error ?? "Could not save the settings.");
    }
  };

  const sampleBase = 1000;
  const sampleFinal = parsedValid
    ? Math.round((sampleBase * (100 - Math.round(parsed))) / 100)
    : null;

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Stack spacing={2.5}>
          <Typography variant="h6">Discount percentage</Typography>
          {submitError && <Alert severity="error">{submitError}</Alert>}
          <TextField
            label="Add-on discount"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setFieldError(null);
            }}
            type="number"
            error={Boolean(fieldError)}
            helperText={fieldError ?? "Between 0 and 100."}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">%</InputAdornment>
                ),
              },
              htmlInput: { min: 0, max: 100, step: 1 },
            }}
            fullWidth
          />
          {sampleFinal !== null && (
            <Typography variant="body2" color="text.secondary">
              Example: a ₹{sampleBase.toLocaleString("en-IN")} series would
              cost a returning learner ₹{sampleFinal.toLocaleString("en-IN")}.
            </Typography>
          )}
          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={busy}
              sx={{ width: { xs: "100%", sm: "auto" } }}
              startIcon={
                busy ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <SaveRoundedIcon />
                )
              }
            >
              {busy ? "Saving…" : "Save settings"}
            </Button>
          </Stack>
        </Stack>
      </CardContent>

      <Snackbar
        open={savedOpen}
        autoHideDuration={4000}
        onClose={() => setSavedOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSavedOpen(false)}
        >
          Discount settings saved.
        </Alert>
      </Snackbar>
    </Card>
  );
}
