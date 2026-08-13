import Link from "next/link";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import MuiLink from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import SellRoundedIcon from "@mui/icons-material/SellRounded";
import OndemandVideoRoundedIcon from "@mui/icons-material/OndemandVideoRounded";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/pricing";
import VideoManager from "./VideoManager";

export default async function AdminSeriesDetailPage({
  params,
}: {
  params: Promise<{ seriesId: string }>;
}) {
  const { seriesId } = await params;
  const user = await requireRole(["admin"], `/admin/series/${seriesId}`);
  void user;

  const series = await db.getSeries(seriesId);
  if (!series) notFound();
  const videos = await db.listVideos(seriesId);

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
          <Typography color="text.primary">{series.title}</Typography>
        </Breadcrumbs>

        <Card variant="outlined">
          <CardContent>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={3}
              alignItems={{ xs: "flex-start", sm: "center" }}
            >
              <Box
                component="img"
                src={series.thumbnail_url}
                alt={series.title}
                sx={{
                  width: { xs: "100%", sm: 200 },
                  height: { xs: "auto", sm: 120 },
                  maxWidth: "100%",
                  borderRadius: 2,
                  objectFit: "cover",
                  bgcolor: "action.hover",
                  flexShrink: 0,
                }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h4"
                  component="h1"
                  gutterBottom
                  sx={{ fontSize: { xs: "1.75rem", sm: "2.125rem" } }}
                >
                  {series.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1.5 }}
                >
                  {series.description}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    icon={<SellRoundedIcon />}
                    label={formatINR(series.base_price)}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    icon={<OndemandVideoRoundedIcon />}
                    label={`${videos.length} video${
                      videos.length === 1 ? "" : "s"
                    }`}
                    variant="outlined"
                    size="small"
                  />
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <VideoManager seriesId={series.id} videos={videos} />
      </Stack>
    </Container>
  );
}
