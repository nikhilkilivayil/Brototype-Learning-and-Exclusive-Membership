"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { keyframes } from "@mui/material/styles";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
`;

function formatSeconds(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * In-browser voice recorder built on the MediaRecorder API. Produces a webm
 * audio Blob handed to the parent via onAudioChange; parent appends it to
 * the FormData it submits.
 */
export default function AudioRecorder({
  audioBlob,
  onAudioChange,
  disabled = false,
}: {
  audioBlob: Blob | null;
  onAudioChange: (blob: Blob | null) => void;
  disabled?: boolean;
}) {
  const [recording, setRecording] = React.useState(false);
  const [seconds, setSeconds] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep an object URL in sync with the blob for playback preview.
  React.useEffect(() => {
    if (!audioBlob) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(audioBlob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audioBlob]);

  // Stop everything if the component unmounts mid-recording.
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      const rec = recorderRef.current;
      if (rec && rec.state !== "inactive") {
        rec.stream.getTracks().forEach((t) => t.stop());
        rec.stop();
      }
    };
  }, []);

  async function startRecording() {
    setError(null);
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError("Audio recording is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : undefined;
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        stream.getTracks().forEach((t) => t.stop());
        if (blob.size > 0) onAudioChange(blob);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError(
        "Microphone access was denied. Allow mic access in your browser to record audio."
      );
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setRecording(false);
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
  }

  return (
    <Box>
      {!recording && !audioBlob && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<MicRoundedIcon />}
          onClick={startRecording}
          disabled={disabled}
        >
          Record audio
        </Button>
      )}

      {recording && (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: "error.main",
              animation: `${pulse} 1.1s ease-in-out infinite`,
            }}
          />
          <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
            Recording… {formatSeconds(seconds)}
          </Typography>
          <Button
            variant="contained"
            color="error"
            size="small"
            startIcon={<StopRoundedIcon />}
            onClick={stopRecording}
          >
            Stop
          </Button>
        </Stack>
      )}

      {!recording && audioBlob && previewUrl && (
        <Stack direction="row" spacing={1} alignItems="center">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls src={previewUrl} style={{ height: 40, maxWidth: 260 }} />
          <Tooltip title="Discard recording">
            <IconButton
              size="small"
              onClick={() => onAudioChange(null)}
              disabled={disabled}
              aria-label="Discard recording"
            >
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )}

      {error && (
        <Alert severity="warning" sx={{ mt: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
