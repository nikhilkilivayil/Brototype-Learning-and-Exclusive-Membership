import * as React from "react";
import Link from "next/link";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import VideoLibraryRoundedIcon from "@mui/icons-material/VideoLibraryRounded";
import OndemandVideoRoundedIcon from "@mui/icons-material/OndemandVideoRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/pricing";
import SeriesTable from "./SeriesTable";

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Stack direction="row" spacing={{ xs: 1.5, md: 2 }} alignItems="center">
          <Avatar
            sx={{
              bgcolor: "primary.light",
              color: "primary.dark",
              width: { xs: 40, md: 48 },
              height: { xs: 40, md: 48 },
            }}
          >
            {icon}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1.2rem", md: "1.5rem" },
              }}
              noWrap
            >
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {label}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const user = await requireRole(["admin"], "/admin");

  const [series, users, purchases] = await Promise.all([
    db.listSeries(),
    db.listUsers(),
    db.listPurchases(),
  ]);
  const videosBySeries = await Promise.all(
    series.map((s) => db.listVideos(s.id))
  );

  const videoCounts: Record<string, number> = {};
  series.forEach((s, i) => {
    videoCounts[s.id] = videosBySeries[i].length;
  });
  const totalVideos = videosBySeries.reduce((sum, v) => sum + v.length, 0);
  const totalLearners = users.filter((u) => u.role === "learner").length;
  const totalRevenue = purchases.reduce((sum, p) => sum + p.amount_paid, 0);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontSize: { xs: "1.75rem", sm: "2.125rem" } }}
            >
              Admin dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              Welcome back, {user.name}. Manage your tutorial catalog and
              pricing.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Button
              component={Link}
              href="/admin/users"
              variant="outlined"
              startIcon={<GroupRoundedIcon />}
            >
              Manage users
            </Button>
            <Button
              component={Link}
              href="/admin/settings"
              variant="outlined"
              startIcon={<TuneRoundedIcon />}
            >
              Pricing settings
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              icon={<VideoLibraryRoundedIcon />}
              label="Tutorial series"
              value={String(series.length)}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              icon={<OndemandVideoRoundedIcon />}
              label="Videos"
              value={String(totalVideos)}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              icon={<GroupsRoundedIcon />}
              label="Learners"
              value={String(totalLearners)}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              icon={<PaymentsRoundedIcon />}
              label="Total revenue"
              value={formatINR(totalRevenue)}
            />
          </Grid>
        </Grid>

        <SeriesTable series={series} videoCounts={videoCounts} />
      </Stack>
    </Container>
  );
}
