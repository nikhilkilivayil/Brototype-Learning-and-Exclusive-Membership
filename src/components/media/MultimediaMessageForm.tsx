"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import AudioRecorder from "./AudioRecorder";

export type MultimediaSubmitAction = (
  formData: FormData
) => Promise<{ ok: boolean; error?: string }>;

/**
 * Shared composer for multimedia messages — used for learner questions AND
 * support-executive answers. Supports text, one image upload, and one
 * in-browser audio recording. Submits as FormData with keys:
 *   text  — string
 *   image — File (optional)
 *   audio — Blob "recording.webm" (optional)
 */
export default function MultimediaMessageForm({
  onSubmitAction,
  textLabel = "Your message",
  textPlaceholder = "Type your message…",
  submitLabel = "Send",
  successMessage = "Sent!",
}: {
  onSubmitAction: MultimediaSubmitAction;
  textLabel?: string;
  textPlaceholder?: string;
  submitLabel?: string;
  successMessage?: string;
}) {
  const router = useRouter();
  const [text, setText] = React.useState("");
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && !file.type.startsWith("image/")) {
      setError("Only image files can be attached.");
      return;
    }
    if (file && file.size > 8 * 1024 * 1024) {
      setError("Image is too large (max 8 MB).");
      return;
    }
    setImageFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!text.trim() && !audioBlob && !imageFile) {
      setError("Write a message, attach an image, or record audio first.");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("text", text.trim());
      if (imageFile) formData.set("image", imageFile);
      if (audioBlob) {
        formData.set(
          "audio",
          new File([audioBlob], "recording.webm", {
            type: audioBlob.type || "audio/webm",
          })
        );
      }
      const result = await onSubmitAction(formData);
      if (result.ok) {
        setText("");
        setImageFile(null);
        setAudioBlob(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setSuccess(true);
        router.refresh();
      } else {
        setError(result.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={1.75}>
        <TextField
          label={textLabel}
          placeholder={textPlaceholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          multiline
          minRows={3}
          fullWidth
          disabled={submitting}
        />

        {imagePreview && (
          <Box sx={{ position: "relative", alignSelf: "flex-start" }}>
            <Box
              component="img"
              src={imagePreview}
              alt="Attachment preview"
              sx={{
                maxHeight: 160,
                maxWidth: "100%",
                borderRadius: 3,
                border: 1,
                borderColor: "divider",
                display: "block",
              }}
            />
            <IconButton
              size="small"
              onClick={() => {
                setImageFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              aria-label="Remove image"
              sx={{
                position: "absolute",
                top: 6,
                right: 6,
                bgcolor: "background.paper",
                boxShadow: 1,
                "&:hover": { bgcolor: "background.paper" },
              }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          <Tooltip title="Attach a screenshot or photo">
            <Button
              variant="outlined"
              size="small"
              component="label"
              startIcon={<ImageRoundedIcon />}
              disabled={submitting}
            >
              {imageFile ? "Change image" : "Attach image"}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={pickImage}
              />
            </Button>
          </Tooltip>

          <AudioRecorder
            audioBlob={audioBlob}
            onAudioChange={setAudioBlob}
            disabled={submitting}
          />

          <Box sx={{ flexGrow: 1 }} />

          <Button
            type="submit"
            variant="contained"
            size="large"
            endIcon={
              submitting ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <SendRoundedIcon />
              )
            }
            disabled={submitting}
          >
            {submitLabel}
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Divider sx={{ display: { xs: "none", sm: "block" } }}>
          <Typography variant="caption" color="text.secondary">
            Text · Image · Voice — ask however it&apos;s easiest
          </Typography>
        </Divider>
      </Stack>

      <Snackbar
        open={success}
        autoHideDuration={3500}
        onClose={() => setSuccess(false)}
        message={successMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
