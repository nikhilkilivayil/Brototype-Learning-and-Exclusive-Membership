"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PlaylistPlayRoundedIcon from "@mui/icons-material/PlaylistPlayRounded";
import VideoLibraryRoundedIcon from "@mui/icons-material/VideoLibraryRounded";
import type { TutorialSeries } from "@/lib/types";
import { deleteSeriesAction } from "./actions";
import SeriesFormDialog from "./SeriesFormDialog";

function inr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function SeriesTable({
  series,
  videoCounts,
}: {
  series: TutorialSeries[];
  videoCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TutorialSeries | null>(null);
  const [deleting, setDeleting] = React.useState<TutorialSeries | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (s: TutorialSeries) => {
    setEditing(s);
    setFormOpen(true);
  };

  const openDelete = (s: TutorialSeries) => {
    setDeleteError(null);
    setDeleting(s);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    const result = await deleteSeriesAction(deleting.id);
    setDeleteBusy(false);
    if (result.ok) {
      setDeleting(null);
      router.refresh();
    } else {
      setDeleteError(result.error ?? "Could not delete the series.");
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
            Tutorial series
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={openCreate}
          >
            New series
          </Button>
        </Stack>

        {series.length === 0 ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <VideoLibraryRoundedIcon
              sx={{ fontSize: 56, color: "text.disabled", mb: 1 }}
            />
            <Typography variant="h6" color="text.secondary">
              No series yet
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5, mb: 2 }}
            >
              Create your first tutorial series to get started.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddRoundedIcon />}
              onClick={openCreate}
            >
              New series
            </Button>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Series</TableCell>
                  <TableCell>Base price</TableCell>
                  <TableCell>Videos</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {series.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          component="img"
                          src={s.thumbnail_url}
                          alt={s.title}
                          sx={{
                            width: 72,
                            height: 44,
                            borderRadius: 1.5,
                            objectFit: "cover",
                            bgcolor: "action.hover",
                            flexShrink: 0,
                          }}
                        />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" noWrap>
                            {s.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            sx={{ maxWidth: 320 }}
                          >
                            {s.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {inr(s.base_price)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${videoCounts[s.id] ?? 0} video${
                          (videoCounts[s.id] ?? 0) === 1 ? "" : "s"
                        }`}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="flex-end"
                      >
                        <Button
                          component={Link}
                          href={`/admin/series/${s.id}`}
                          size="small"
                          variant="outlined"
                          startIcon={<PlaylistPlayRoundedIcon />}
                        >
                          Manage videos
                        </Button>
                        <Tooltip title="Edit series">
                          <IconButton
                            size="small"
                            aria-label={`Edit ${s.title}`}
                            onClick={() => openEdit(s)}
                          >
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete series">
                          <IconButton
                            size="small"
                            color="error"
                            aria-label={`Delete ${s.title}`}
                            onClick={() => openDelete(s)}
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

      <SeriesFormDialog
        open={formOpen}
        series={editing}
        onClose={() => setFormOpen(false)}
      />

      <Dialog
        open={Boolean(deleting)}
        onClose={() => (deleteBusy ? undefined : setDeleting(null))}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete series?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently remove &ldquo;{deleting?.title}&rdquo; and all
            of its videos from the catalog. This cannot be undone.
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
    </>
  );
}
