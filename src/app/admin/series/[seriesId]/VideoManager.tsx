"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import OndemandVideoRoundedIcon from "@mui/icons-material/OndemandVideoRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import type { Video } from "@/lib/types";
import {
  createVideoAction,
  deleteVideoAction,
  swapVideoOrderAction,
  updateVideoAction,
} from "../../actions";

/**
 * Accepts a bare 11-character YouTube video ID or any common YouTube URL
 * (watch, youtu.be, embed, shorts, live) and returns the extracted ID.
 */
function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const patterns = [
    /youtube\.com\/watch\?(?:[^#\s]*&)?v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const match = trimmed.match(re);
    if (match) return match[1];
  }
  return null;
}

export default function VideoManager({
  seriesId,
  videos,
}: {
  seriesId: string;
  videos: Video[];
}) {
  const router = useRouter();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // Add/edit dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingVideo, setEditingVideo] = React.useState<Video | null>(null);
  const [title, setTitle] = React.useState("");
  const [youtubeInput, setYoutubeInput] = React.useState("");
  const [titleError, setTitleError] = React.useState<string | null>(null);
  const [youtubeError, setYoutubeError] = React.useState<string | null>(null);
  const [dialogError, setDialogError] = React.useState<string | null>(null);
  const [dialogBusy, setDialogBusy] = React.useState(false);

  // Delete confirm state
  const [deleting, setDeleting] = React.useState<Video | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // Reorder state
  const [swapBusy, setSwapBusy] = React.useState(false);
  const [snackError, setSnackError] = React.useState<string | null>(null);

  const extractedId = extractYouTubeId(youtubeInput);

  const openAdd = () => {
    setEditingVideo(null);
    setTitle("");
    setYoutubeInput("");
    setTitleError(null);
    setYoutubeError(null);
    setDialogError(null);
    setDialogOpen(true);
  };

  const openEdit = (video: Video) => {
    setEditingVideo(video);
    setTitle(video.title);
    setYoutubeInput(video.youtube_id);
    setTitleError(null);
    setYoutubeError(null);
    setDialogError(null);
    setDialogOpen(true);
  };

  const handleDialogSubmit = async () => {
    let valid = true;
    if (title.trim().length === 0) {
      setTitleError("Video title is required.");
      valid = false;
    } else {
      setTitleError(null);
    }
    const youtubeId = extractYouTubeId(youtubeInput);
    if (!youtubeId) {
      setYoutubeError(
        "Paste a YouTube link or an 11-character video ID."
      );
      valid = false;
    } else {
      setYoutubeError(null);
    }
    if (!valid || !youtubeId) return;

    setDialogBusy(true);
    setDialogError(null);
    const result = editingVideo
      ? await updateVideoAction(editingVideo.id, {
          title: title.trim(),
          youtube_id: youtubeId,
        })
      : await createVideoAction({
          series_id: seriesId,
          title: title.trim(),
          youtube_id: youtubeId,
        });
    setDialogBusy(false);
    if (result.ok) {
      setDialogOpen(false);
      router.refresh();
    } else {
      setDialogError(result.error ?? "Could not save the video.");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    const result = await deleteVideoAction(deleting.id);
    setDeleteBusy(false);
    if (result.ok) {
      setDeleting(null);
      router.refresh();
    } else {
      setDeleteError(result.error ?? "Could not delete the video.");
    }
  };

  const handleSwap = async (a: Video, b: Video) => {
    setSwapBusy(true);
    const result = await swapVideoOrderAction(seriesId, a.id, b.id);
    setSwapBusy(false);
    if (result.ok) {
      router.refresh();
    } else {
      setSnackError(result.error ?? "Could not reorder the videos.");
    }
  };

  return (
    <>
      <Card variant="outlined">
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          sx={{ px: { xs: 2, sm: 3 }, py: 2 }}
        >
          <Typography variant="h6" component="h2">
            Videos
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={openAdd}
          >
            Add video
          </Button>
        </Stack>

        {videos.length === 0 ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <OndemandVideoRoundedIcon
              sx={{ fontSize: 56, color: "text.disabled", mb: 1 }}
            />
            <Typography variant="h6" color="text.secondary">
              No videos yet
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5, mb: 2 }}
            >
              Add the first video of this series from YouTube.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddRoundedIcon />}
              onClick={openAdd}
            >
              Add video
            </Button>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 64 }}>#</TableCell>
                  <TableCell>Video</TableCell>
                  <TableCell>YouTube ID</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {videos.map((video, index) => (
                  <TableRow key={video.id} hover>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {video.order_index}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          component="img"
                          src={`https://i.ytimg.com/vi/${video.youtube_id}/mqdefault.jpg`}
                          alt={video.title}
                          sx={{
                            width: 96,
                            height: 54,
                            borderRadius: 1.5,
                            objectFit: "cover",
                            bgcolor: "action.hover",
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          variant="subtitle2"
                          noWrap
                          sx={{ maxWidth: 320 }}
                        >
                          {video.title}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontFamily: "monospace" }}
                      >
                        {video.youtube_id}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="flex-end"
                      >
                        <Tooltip title="Move up">
                          <span>
                            <IconButton
                              size="small"
                              aria-label={`Move ${video.title} up`}
                              disabled={index === 0 || swapBusy}
                              onClick={() =>
                                handleSwap(video, videos[index - 1])
                              }
                            >
                              <ArrowUpwardRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Move down">
                          <span>
                            <IconButton
                              size="small"
                              aria-label={`Move ${video.title} down`}
                              disabled={
                                index === videos.length - 1 || swapBusy
                              }
                              onClick={() =>
                                handleSwap(video, videos[index + 1])
                              }
                            >
                              <ArrowDownwardRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Edit video">
                          <IconButton
                            size="small"
                            aria-label={`Edit ${video.title}`}
                            onClick={() => openEdit(video)}
                          >
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete video">
                          <IconButton
                            size="small"
                            color="error"
                            aria-label={`Delete ${video.title}`}
                            onClick={() => {
                              setDeleteError(null);
                              setDeleting(video);
                            }}
                          >
                            <DeleteRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Add / edit dialog */}
      <Dialog
        open={dialogOpen}
        onClose={dialogBusy ? undefined : () => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={fullScreen}
      >
        <DialogTitle>
          {editingVideo ? "Edit video" : "Add video"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {dialogError && <Alert severity="error">{dialogError}</Alert>}
            <TextField
              label="Video title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={Boolean(titleError)}
              helperText={titleError ?? " "}
              required
              fullWidth
              autoFocus
            />
            <TextField
              label="YouTube URL or video ID"
              value={youtubeInput}
              onChange={(e) => setYoutubeInput(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              error={Boolean(youtubeError)}
              helperText={
                youtubeError ??
                (extractedId
                  ? `Video ID: ${extractedId}`
                  : "Paste a full YouTube link — the video ID is extracted automatically.")
              }
              required
              fullWidth
            />
            {extractedId && (
              <Box
                component="img"
                src={`https://i.ytimg.com/vi/${extractedId}/mqdefault.jpg`}
                alt="YouTube thumbnail preview"
                sx={{
                  width: 160,
                  height: 90,
                  borderRadius: 1.5,
                  objectFit: "cover",
                  bgcolor: "action.hover",
                }}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={dialogBusy}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDialogSubmit}
            disabled={dialogBusy}
            startIcon={
              dialogBusy ? (
                <CircularProgress size={16} color="inherit" />
              ) : editingVideo ? (
                <SaveRoundedIcon />
              ) : (
                <AddRoundedIcon />
              )
            }
          >
            {dialogBusy
              ? "Saving…"
              : editingVideo
                ? "Save changes"
                : "Add video"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog
        open={Boolean(deleting)}
        onClose={deleteBusy ? undefined : () => setDeleting(null)}
        maxWidth="xs"
        fullWidth
        fullScreen={fullScreen}
      >
        <DialogTitle>Delete video?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will remove &ldquo;{deleting?.title}&rdquo; from the series.
            This cannot be undone.
          </DialogContentText>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleting(null)} disabled={deleteBusy}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleteBusy}
            startIcon={
              deleteBusy ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <DeleteRoundedIcon />
              )
            }
          >
            {deleteBusy ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(snackError)}
        autoHideDuration={5000}
        onClose={() => setSnackError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={() => setSnackError(null)}
        >
          {snackError}
        </Alert>
      </Snackbar>
    </>
  );
}
