import Link from "next/link";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Container from "@mui/material/Container";
import MuiLink from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import StaffTable from "../StaffTable";

export default async function AdminSupportUsersPage() {
  await requireRole(["admin"], "/admin/users/support");

  const staff = await db.listUsersByRole("support");

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Breadcrumbs
          separator={<NavigateNextRoundedIcon fontSize="small" />}
          aria-label="breadcrumb"
        >
          <MuiLink
            component={Link}
            href="/admin"
            underline="hover"
            color="inherit"
          >
            Admin
          </MuiLink>
          <MuiLink
            component={Link}
            href="/admin/users"
            underline="hover"
            color="inherit"
          >
            Users
          </MuiLink>
          <Typography color="text.primary">Support executives</Typography>
        </Breadcrumbs>

        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontSize: { xs: "1.75rem", sm: "2.125rem" } }}
          >
            Support executives
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            The team that answers learner doubts from the helpdesk.
          </Typography>
        </Box>

        <StaffTable role="support" staff={staff} />
      </Stack>
    </Container>
  );
}
