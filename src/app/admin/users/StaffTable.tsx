"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
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
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import { formatDate } from "@/lib/format";
import type { User } from "@/lib/types";
import { deleteStaffUserAction } from "./actions";
import StaffFormDialog from "./StaffFormDialog";

const COPY: Record<
  "support" | "sales",
  { title: string; addLabel: string; noun: string; empty: string }
> = {
  support: {
    title: "Support executives",
    addLabel: "Add support executive",
    noun: "support executive",
    empty: "No support executives yet. Add one to start answering learner doubts.",
  },
  sales: {
    title: "Sales team",
    addLabel: "Add sales user",
    noun: "sales user",
    empty: "No sales users yet. Add one to give your sales team access.",
  },
};

/** Admin-managed table of staff accounts for one role (support or sales). */
export default function StaffTable({
  role,
  staff,
}: {
  role: "support" | "sales";
  staff: User[];
}) {
  const router = useRouter();
  const copy = COPY[role];

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<User | null>(null);
  const [deleting, setDeleting] = React.useState<User | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setFormOpen(true);
  };

  const openDelete = (u: User) => {
    setDeleteError(null);
    setDeleting(u);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    const result = await deleteStaffUserAction(deleting.id);
    setDeleteBusy(false);
    if (result.ok) {
      setDeleting(null);
      router.refresh();
    } else {
      setDeleteError(result.error ?? `Could not delete the ${copy.noun}.`);
    }
  };

  return (
    <Stack spacing={2}>
      <Alert severity="info">
        They sign in with this phone number via OTP — the account is claimed
        automatically on first sign-in.
      </Alert>

      <Card variant="outlined">
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          sx={{ px: { xs: 2, sm: 3 }, py: 2 }}
        >
          <Typography variant="h6" component="h2">
            {copy.title}
          </Typography>
          <Button
            variant="contained"
            startIcon={<PersonAddRoundedIcon />}
            onClick={openCreate}
          >
            {copy.addLabel}
          </Button>
        </Stack>

        {staff.length === 0 ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            {role === "support" ? (
              <SupportAgentRoundedIcon
                sx={{ fontSize: 56, color: "text.disabled", mb: 1 }}
              />
            ) : (
              <BadgeRoundedIcon
                sx={{ fontSize: 56, color: "text.disabled", mb: 1 }}
              />
            )}
            <Typography variant="h6" color="text.secondary">
              Nobody here yet
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5, mb: 2 }}
            >
              {copy.empty}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<PersonAddRoundedIcon />}
              onClick={openCreate}
            >
              {copy.addLabel}
            </Button>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 560 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Added</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staff.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: "primary.light",
                            color: "primary.dark",
                            fontSize: 16,
                          }}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="subtitle2" noWrap>
                          {u.name}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {u.phone_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(u.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="flex-end"
                      >
                        <Tooltip title={`Edit ${copy.noun}`}>
                          <IconButton
                            size="small"
                            aria-label={`Edit ${u.name}`}
                            onClick={() => openEdit(u)}
                          >
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={`Delete ${copy.noun}`}>
                          <IconButton
                            size="small"
                            color="error"
                            aria-label={`Delete ${u.name}`}
                            onClick={() => openDelete(u)}
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

      <StaffFormDialog
        open={formOpen}
        role={role}
        staff={editing}
        onClose={() => setFormOpen(false)}
      />

      <Dialog
        open={Boolean(deleting)}
        onClose={deleteBusy ? undefined : () => setDeleting(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete {copy.noun}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will remove &ldquo;{deleting?.name}&rdquo;&apos;s account and
            their access to the portal. Replies they already posted stay in
            learner threads, attributed to Brototype.
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
    </Stack>
  );
}
