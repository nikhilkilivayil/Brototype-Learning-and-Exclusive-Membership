import Link from "next/link";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import VideoLibraryRoundedIcon from "@mui/icons-material/VideoLibraryRounded";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatINR, getPriceQuote } from "@/lib/pricing";
import SeriesCheckoutButton from "@/components/checkout/CheckoutButton";

export default async function SeriesDetailPage({
  params,
}: {
  params: Promise<{ seriesId: string }>;
}) {
  const { seriesId } = await params;

  const series = await db.getSeries(seriesId);
  if (!series) notFound();

  const [videos, user] = await Promise.all([
    db.listVideos(seriesId),
    getCurrentUser(),
  ]);
  const owned = user ? await db.hasPurchased(user.id, seriesId) : false;
  const quote = owned ? null : await getPriceQuote(user?.id ?? null, seriesId);
  const firstVideo = videos[0];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Grid
        container
        spacing={{ xs: 3, md: 4 }}
        sx={{ mb: { xs: 4, md: 5 } }}
        alignItems="flex-start"
      >
        <Grid size={{ xs: 12, md: 5 }}>
          <Box
            component="img"
            src={series.thumbnail_url}
            alt={series.title}
            sx={{
              width: "100%",
              maxWidth: "100%",
              aspectRatio: "16 / 9",
              maxHeight: { xs: 220, sm: 300, md: "none" },
              objectFit: "cover",
              borderRadius: 4,
              bgcolor: "action.hover",
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={2}>
            <Typography
              variant="h3"
              component="h1"
              sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" } }}
            >
              {series.title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {series.description}
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                icon={<VideoLibraryRoundedIcon />}
                label={`${videos.length} ${videos.length === 1 ? "video" : "videos"}`}
              />
              {owned ? (
                <Chip
                  size="small"
                  color="success"
                  icon={<CheckCircleRoundedIcon />}
                  label="Owned"
                />
              ) : (
                <Chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  label={`Exclusive Membership ${formatINR(
                    quote ? quote.final_price : series.base_price
                  )}`}
                />
              )}
            </Stack>

            <Stack direction="row" spacing={1} alignItems="flex-start">
              {owned ? (
                <LockOpenRoundedIcon color="success" fontSize="small" sx={{ mt: 0.25 }} />
              ) : (
                <LockRoundedIcon color="warning" fontSize="small" sx={{ mt: 0.25 }} />
              )}
              <Typography variant="body2" color="text.secondary">
                {owned
                  ? "Exclusive Q&A support is unlocked — ask doubts on any video of this series."
                  : "Exclusive Q&A support: ask doubts with text, screenshots and voice notes. Unlocks with membership."}
              </Typography>
            </Stack>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ pt: 1 }}
            >
              {firstVideo && (
                <Button
                  component={Link}
                  href={`/watch/${firstVideo.id}`}
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrowRoundedIcon />}
                >
                  Watch first video
                </Button>
              )}
              {!owned &&
                quote &&
                (videos.length === 0 ? (
                  <Stack spacing={0.5}>
                    <Button
                      variant="outlined"
                      size="large"
                      disabled
                      startIcon={<HourglassEmptyRoundedIcon />}
                    >
                      Coming soon
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      Membership sales open when videos are published.
                    </Typography>
                  </Stack>
                ) : (
                  <SeriesCheckoutButton
                    seriesId={series.id}
                    seriesTitle={series.title}
                    quote={quote}
                    user={user}
                    size="large"
                  />
                ))}
            </Stack>
          </Stack>
        </Grid>
      </Grid>

      {/* Video list */}
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        Videos in this series
      </Typography>
      {videos.length === 0 ? (
        <Card variant="outlined" sx={{ py: 8, textAlign: "center" }}>
          <VideoLibraryRoundedIcon
            sx={{ fontSize: 56, color: "text.secondary", mb: 1 }}
          />
          <Typography variant="h6">No videos yet</Typography>
          <Typography variant="body2" color="text.secondary">
            This series is being prepared — videos land here soon.
          </Typography>
        </Card>
      ) : (
        <Card variant="outlined">
          <List disablePadding>
            {videos.map((video, i) => (
              <ListItemButton
                key={video.id}
                component={Link}
                href={`/watch/${video.id}`}
                divider={i < videos.length - 1}
                sx={{ py: 1.5 }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ width: 32, fontWeight: 600 }}
                >
                  {i + 1}
                </Typography>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <PlayCircleRoundedIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={video.title}
                  secondary="Free to watch"
                  slotProps={{ primary: { fontWeight: 500 } }}
                />
              </ListItemButton>
            ))}
          </List>
        </Card>
      )}
    </Container>
  );
}
