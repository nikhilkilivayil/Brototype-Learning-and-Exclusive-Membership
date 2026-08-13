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

export default async function AdminSalesUsersPage() {
  await requireRole(["admin"], "/admin/users/sales");

  const staff = await db.listUsersByRole("sales");

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
          <Typography color="text.primary">Sales team</Typography>
        </Breadcrumbs>

        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontSize: { xs: "1.75rem", sm: "2.125rem" } }}
          >
            Sales team
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            The team that tracks revenue and learner purchases.
          </Typography>
        </Box>

        <StaffTable role="sales" staff={staff} />
      </Stack>
    </Container>
  );
}
