import Link from "next/link";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import MuiLink from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

function UserGroupCard({
  icon,
  title,
  count,
  countLabel,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  countLabel: string;
  href: string;
}) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardActionArea
        component={Link}
        href={href}
        sx={{ height: "100%", alignItems: "stretch" }}
      >
        <CardContent>
          <Stack spacing={2}>
            <Avatar
              sx={{
                bgcolor: "primary.light",
                color: "primary.dark",
                width: 48,
                height: 48,
              }}
            >
              {icon}
            </Avatar>
            <Box>
              <Typography variant="h6" component="h2">
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {count} {countLabel}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default async function AdminUsersHubPage() {
  await requireRole(["admin"], "/admin/users");

  const [support, sales, learners] = await Promise.all([
    db.listUsersByRole("support"),
    db.listUsersByRole("sales"),
    db.listUsersByRole("learner"),
  ]);

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
          <Typography color="text.primary">Users</Typography>
        </Breadcrumbs>

        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontSize: { xs: "1.75rem", sm: "2.125rem" } }}
          >
            Manage users
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Support and sales accounts are created here by you — staff
            can&apos;t self-register. Learners sign up themselves with phone
            OTP.
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <UserGroupCard
              icon={<SupportAgentRoundedIcon />}
              title="Support executives"
              count={support.length}
              countLabel={support.length === 1 ? "account" : "accounts"}
              href="/admin/users/support"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <UserGroupCard
              icon={<BadgeRoundedIcon />}
              title="Sales team"
              count={sales.length}
              countLabel={sales.length === 1 ? "account" : "accounts"}
              href="/admin/users/sales"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <UserGroupCard
              icon={<SchoolRoundedIcon />}
              title="Learners"
              count={learners.length}
              countLabel={learners.length === 1 ? "learner" : "learners"}
              href="/admin/users/learners"
            />
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}
