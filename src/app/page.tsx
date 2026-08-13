import type { Metadata } from "next";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import VideoLibraryRoundedIcon from "@mui/icons-material/VideoLibraryRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getPriceQuote } from "@/lib/pricing";
import SeriesCard from "@/components/learner/SeriesCard";

export const metadata: Metadata = {
  title: "Browse free series",
};

export default async function HomePage() {
  const user = await getCurrentUser();

  const seriesList = await db.listSeries();
  const [videoCounts, purchases, quotes] = await Promise.all([
    Promise.all(
      seriesList.map(async (s) => (await db.listVideos(s.id)).length)
    ),
    user?.role === "learner"
      ? db.listPurchasesByLearner(user.id)
      : Promise.resolve([]),
    user?.role === "learner"
      ? Promise.all(seriesList.map((s) => getPriceQuote(user.id, s.id)))
      : Promise.resolve(null),
  ]);
  const ownedSeriesIds = new Set(purchases.map((p) => p.series_id));

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero */}
      <Box
        sx={{
          borderRadius: 4,
          px: { xs: 3, md: 6 },
          py: { xs: 5, md: 8 },
          mb: 5,
          background:
            "linear-gradient(135deg, rgba(var(--mui-palette-primary-mainChannel) / 0.20) 0%, rgba(var(--mui-palette-primary-mainChannel) / 0.04) 60%, transparent 100%)",
        }}
      >
        <Stack spacing={2} sx={{ maxWidth: 640 }}>
          <Typography
            variant="h1"
            component="h1"
            sx={{ fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.75rem" } }}
          >
            Learn to code in Malayalam. Free.
          </Typography>
          <Typography variant="h6" component="p" color="text.secondary" sx={{ fontWeight: 400 }}>
            Structured programming tutorial series, completely free to watch.
            When you get stuck, an Exclusive Support membership unlocks 1-on-1
            doubt clearing from Brototype engineers — ask with text,
            screenshots, or voice notes.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ pt: 1 }}>
            <Button
              variant="contained"
              size="large"
              href="#catalog"
              startIcon={<PlayArrowRoundedIcon />}
            >
              Start learning
            </Button>
            <Button
              component={Link}
              href="/pricing"
              variant="contained"
              color="warning"
              size="large"
              startIcon={<WorkspacePremiumRoundedIcon />}
            >
              Unlock Exclusive Support
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Catalog */}
      <Box id="catalog" sx={{ scrollMarginTop: 96 }}>
        <Typography variant="h4" component="h2" sx={{ mb: 3 }}>
          All series
        </Typography>
        {seriesList.length === 0 ? (
          <Card variant="outlined" sx={{ py: 8, textAlign: "center" }}>
            <VideoLibraryRoundedIcon
              sx={{ fontSize: 56, color: "text.secondary", mb: 1 }}
            />
            <Typography variant="h6">No series published yet</Typography>
            <Typography variant="body2" color="text.secondary">
              Check back soon — new Malayalam tutorial series are on the way.
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {seriesList.map((series, i) => {
              const owned = ownedSeriesIds.has(series.id);
              const quote = quotes?.[i];
              const discounted = !owned && quote?.discount_applied;
              return (
                <Grid key={series.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <SeriesCard
                    series={series}
                    owned={owned}
                    videoCount={videoCounts[i]}
                    finalPrice={discounted ? quote.final_price : undefined}
                    discountPercentage={
                      discounted ? quote.discount_percentage : undefined
                    }
                  />
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </Container>
  );
}
