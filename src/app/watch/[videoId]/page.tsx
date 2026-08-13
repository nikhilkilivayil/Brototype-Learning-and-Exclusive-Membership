import Link from "next/link";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NavigateBeforeRoundedIcon from "@mui/icons-material/NavigateBeforeRounded";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import VideoLibraryRoundedIcon from "@mui/icons-material/VideoLibraryRounded";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getPriceQuote } from "@/lib/pricing";
import YouTubePlayer from "@/components/learner/YouTubePlayer";
import SuggestionsSidebar from "@/components/learner/SuggestionsSidebar";
import QASection from "@/components/qa/QASection";

export default async function WatchPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;

  const video = await db.getVideo(videoId);
  if (!video) notFound();

  const [series, seriesVideos, allSeries, user] = await Promise.all([
    db.getSeries(video.series_id),
    db.listVideos(video.series_id),
    db.listSeries(),
    getCurrentUser(),
  ]);
  if (!series) notFound();

  const [hasPurchased, purchases] = await Promise.all([
    user ? db.hasPurchased(user.id, video.series_id) : Promise.resolve(false),
    user?.role === "learner"
      ? db.listPurchasesByLearner(user.id)
      : Promise.resolve([]),
  ]);
  const ownedSeriesIds = new Set(purchases.map((p) => p.series_id));

  const position = seriesVideos.findIndex((v) => v.id === video.id);
  const prevVideo = position > 0 ? seriesVideos[position - 1] : null;
  const nextVideo =
    position >= 0 && position < seriesVideos.length - 1
      ? seriesVideos[position + 1]
      : null;
  const upNext = position >= 0 ? seriesVideos.slice(position + 1, position + 4) : [];

  const exploreSeries = allSeries.filter((s) => s.id !== series.id);
  const exploreQuotes =
    user?.role === "learner"
      ? await Promise.all(
          exploreSeries.map((s) => getPriceQuote(user.id, s.id))
        )
      : null;
  const otherSeries = exploreSeries.map((s, i) => {
    const owned = ownedSeriesIds.has(s.id);
    const quote = exploreQuotes?.[i];
    return {
      series: s,
      owned,
      finalPrice: !owned && quote?.discount_applied ? quote.final_price : undefined,
    };
  });

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
      <Grid container spacing={{ xs: 3, md: 4 }}>
        {/* Main column */}
        <Grid size={{ xs: 12, md: 8 }}>
          <YouTubePlayer youtubeId={video.youtube_id} title={video.title} />

          <Stack spacing={1.5} sx={{ mt: 2.5 }}>
            <Typography
              variant="h5"
              component="h1"
              sx={{ overflowWrap: "anywhere" }}
            >
              {video.title}
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
            >
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
                sx={{ minWidth: 0 }}
              >
                <Chip
                  component={Link}
                  href={`/series/${series.id}`}
                  clickable
                  icon={<VideoLibraryRoundedIcon />}
                  label={series.title}
                  variant="outlined"
                  color="primary"
                  size="small"
                  sx={{ maxWidth: "100%" }}
                />
                <Typography variant="body2" color="text.secondary" noWrap>
                  Video {position + 1} of {seriesVideos.length}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1}>
                {prevVideo ? (
                  <Button
                    component={Link}
                    href={`/watch/${prevVideo.id}`}
                    variant="outlined"
                    size="small"
                    startIcon={<NavigateBeforeRoundedIcon />}
                  >
                    Prev
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    size="small"
                    disabled
                    startIcon={<NavigateBeforeRoundedIcon />}
                  >
                    Prev
                  </Button>
                )}
                {nextVideo ? (
                  <Button
                    component={Link}
                    href={`/watch/${nextVideo.id}`}
                    variant="outlined"
                    size="small"
                    endIcon={<NavigateNextRoundedIcon />}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    size="small"
                    disabled
                    endIcon={<NavigateNextRoundedIcon />}
                  >
                    Next
                  </Button>
                )}
              </Stack>
            </Stack>
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* Exclusive Q&A support */}
          <Box>
            <QASection video={video} user={user} hasPurchased={hasPurchased} />
          </Box>
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <SuggestionsSidebar upNext={upNext} otherSeries={otherSeries} />
        </Grid>
      </Grid>
    </Container>
  );
}
