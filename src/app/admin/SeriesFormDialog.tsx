"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import type { TutorialSeries } from "@/lib/types";
import { createSeriesAction, updateSeriesAction } from "./actions";

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Create/edit dialog for a tutorial series. Pass `series` to edit an
 * existing one, or null to create a new series.
 */
export default function SeriesFormDialog({
  open,
  series,
  onClose,
}: {
  open: boolean;
  series: TutorialSeries | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isEdit = Boolean(series);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [thumbnailUrl, setThumbnailUrl] = React.useState("");
  const [basePrice, setBasePrice] = React.useState("");
  const [titleError, setTitleError] = React.useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = React.useState<string | null>(
    null
  );
  const [priceError, setPriceError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  // Re-seed the form every time the dialog opens (create vs. edit).
  React.useEffect(() => {
    if (!open) return;
    setTitle(series?.title ?? "");
    setDescription(series?.description ?? "");
    setThumbnailUrl(series?.thumbnail_url ?? "");
    setBasePrice(series ? String(series.base_price) : "");
    setTitleError(null);
    setThumbnailError(null);
    setPriceError(null);
    setSubmitError(null);
    setBusy(false);
  }, [open, series]);

  const handleSubmit = async () => {
    let valid = true;
    if (title.trim().length === 0) {
      setTitleError("Title is required.");
      valid = false;
    } else {
      setTitleError(null);
    }
    if (!isHttpUrl(thumbnailUrl.trim())) {
      setThumbnailError("Enter a valid URL starting with http:// or https://.");
      valid = false;
    } else {
      setThumbnailError(null);
    }
    const price = Number(basePrice);
    if (basePrice.trim() === "" || !Number.isFinite(price) || price < 0) {
      setPriceError("Enter a price of ₹0 or more.");
      valid = false;
    } else {
      setPriceError(null);
    }
    if (!valid) return;

    setBusy(true);
    setSubmitError(null);
    const input = {
      title: title.trim(),
      description: description.trim(),
      thumbnail_url: thumbnailUrl.trim(),
      base_price: price,
    };
    const result = series
      ? await updateSeriesAction(series.id, input)
      : await createSeriesAction(input);
    setBusy(false);
    if (result.ok) {
      onClose();
      router.refresh();
    } else {
      setSubmitError(result.error ?? "Could not save the series.");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
    >
      <DialogTitle>{isEdit ? "Edit series" : "New series"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {submitError && <Alert severity="error">{submitError}</Alert>}
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={Boolean(titleError)}
            helperText={titleError ?? " "}
            required
            fullWidth
            autoFocus
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={3}
            fullWidth
          />
          <TextField
            label="Thumbnail URL"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="https://…"
            error={Boolean(thumbnailError)}
            helperText={thumbnailError ?? " "}
            required
            fullWidth
          />
          <TextField
            label="Base price"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            type="number"
            error={Boolean(priceError)}
            helperText={
              priceError ?? "Whole rupees for the Exclusive Membership."
            }
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">₹</InputAdornment>
                ),
              },
              htmlInput: { min: 0, step: 1 },
            }}
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
          {busy ? "Saving…" : isEdit ? "Save changes" : "Create series"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
