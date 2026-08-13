import type { Metadata } from "next";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import QuestionAnswerRoundedIcon from "@mui/icons-material/QuestionAnswerRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import VideoLibraryRoundedIcon from "@mui/icons-material/VideoLibraryRounded";
import CheckoutButton from "@/components/checkout/CheckoutButton";
import { getCurrentUser } from "@/lib/auth";
import { DEMO_MODE, db } from "@/lib/db";
import { formatINR, getPriceQuote } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Exclusive Membership",
  description:
    "Unlock 1-on-1 doubt support from Brototype engineers on every video — per-series Exclusive Membership.",
};

const BENEFITS = [
  {
    icon: <QuestionAnswerRoundedIcon />,
    title: "Unlimited doubts",
    text: "Ask as many questions as you need on every video — no limits, no queues.",
  },
  {
    icon: <ImageRoundedIcon />,
    title: "Share screenshots",
    text: "Attach screenshots of your code or error messages so nothing is lost in translation.",
  },
  {
    icon: <MicRoundedIcon />,
    title: "Voice notes",
    text: "Record your doubt as audio right in the browser — explain it the way you would to a friend.",
  },
  {
    icon: <SupportAgentRoundedIcon />,
    title: "Real engineers",
    text: "Every answer comes from a Brototype engineer, in text, images or voice.",
  },
];

export default async function PricingPage() {
  const user = await getCurrentUser();

  const [seriesList, settings] = await Promise.all([
    db.listSeries(),
    db.getSettings(),
  ]);

  const quotes = await Promise.all(
    seriesList.map((s) => getPriceQuote(user?.id ?? null, s.id))
  );
  const videoCounts = await Promise.all(
    seriesList.map(async (s) => (await db.listVideos(s.id)).length)
  );

  const discountPct = settings.addon_discount_percentage;
  let isReturningMember = false;
  if (user && user.role === "learner") {
    const purchases = await db.listPurchasesByLearner(user.id);
    isReturningMember = purchases.length >= 1;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* ---- Hero ----------------------------------------------------------- */}
      <Stack spacing={2} alignItems="center" textAlign="center" sx={{ mb: 6 }}>
        <Avatar
          sx={{
            width: 64,
            height: 64,
            bgcolor: "primary.light",
            color: "primary.dark",
          }}
        >
          <BoltRoundedIcon fontSize="large" />
        </Avatar>
        <Typography
          variant="h2"
          component="h1"
          sx={{ fontSize: { xs: "1.75rem", sm: "2.125rem" } }}
        >
          Exclusive Membership
        </Typography>
        <Typography
          variant="h6"
          component="p"
          color="text.secondary"
          sx={{ fontWeight: 400, maxWidth: 560 }}
        >
          1-on-1 doubt support from Brototype engineers on every video
        </Typography>
      </Stack>

      {/* ---- Benefits ------------------------------------------------------- */}
      <Grid container spacing={{ xs: 1.5, sm: 2.5 }} sx={{ mb: 6 }}>
        {BENEFITS.map((benefit) => (
          <Grid key={benefit.title} size={{ xs: 6, md: 3 }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Avatar
                  sx={{
                    bgcolor: "secondary.light",
                    color: "secondary.dark",
                    mb: 1.5,
                  }}
                >
                  {benefit.icon}
                </Avatar>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontSize: { xs: "1rem", sm: "1.1rem" } }}
                >
                  {benefit.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {benefit.text}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ---- Returning-member discount banner ------------------------------- */}
      {isReturningMember && discountPct > 0 && (
        <Alert severity="success" sx={{ mb: 4 }}>
          Returning member — {discountPct}% add-on discount is applied
          automatically to your next series!
        </Alert>
      )}

      {/* ---- Series picker -------------------------------------------------- */}
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="h4" component="h2">
          Choose your series
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Membership is per series — unlock doubt support for the series you are
          learning right now.
        </Typography>
      </Stack>

      {seriesList.length === 0 ? (
        <Card variant="outlined" sx={{ py: 8, textAlign: "center" }}>
          <Stack spacing={1} alignItems="center">
            <VideoLibraryRoundedIcon
              sx={{ fontSize: 48, color: "text.disabled" }}
            />
            <Typography variant="h6">No series yet</Typography>
            <Typography variant="body2" color="text.secondary">
              New tutorial series are on the way — check back soon!
            </Typography>
          </Stack>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {seriesList.map((series, index) => {
            const quote = quotes[index];
            const videoCount = videoCounts[index];
            return (
              <Grid key={series.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardMedia
                    component="img"
                    height="160"
                    image={series.thumbnail_url}
                    alt={series.title}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {series.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {series.description}
                    </Typography>

                    <Box sx={{ mt: 2 }}>
                      {quote.already_purchased ? (
                        <Chip
                          icon={<CheckRoundedIcon />}
                          label="Owned ✓"
                          color="success"
                          variant="outlined"
                        />
                      ) : quote.discount_applied ? (
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="baseline"
                          flexWrap="wrap"
                        >
                          <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ textDecoration: "line-through" }}
                          >
                            {formatINR(quote.base_price)}
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            {formatINR(quote.final_price)}
                          </Typography>
                          <Chip
                            label={`−${quote.discount_percentage}%`}
                            color="success"
                            size="small"
                          />
                        </Stack>
                      ) : (
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                          {formatINR(quote.final_price)}
                        </Typography>
                      )}
                      {!quote.already_purchased && (
                        <Typography variant="caption" color="text.secondary">
                          One-time payment · lifetime access to doubt support
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                  <Box sx={{ px: 2, pb: 2 }}>
                    {videoCount === 0 && !quote.already_purchased ? (
                      <Stack spacing={0.5}>
                        <Button
                          variant="outlined"
                          disabled
                          fullWidth
                          startIcon={<HourglassEmptyRoundedIcon />}
                        >
                          Coming soon
                        </Button>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          textAlign="center"
                        >
                          Membership sales open when videos are published.
                        </Typography>
                      </Stack>
                    ) : (
                      <CheckoutButton
                        seriesId={series.id}
                        seriesTitle={series.title}
                        quote={quote}
                        user={user}
                        fullWidth
                      />
                    )}
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ---- Trust footer --------------------------------------------------- */}
      <Stack spacing={0.5} alignItems="center" sx={{ mt: 6 }}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <VerifiedUserRoundedIcon
            sx={{ fontSize: 16, color: "text.secondary" }}
          />
          <Typography variant="caption" color="text.secondary">
            Payments are processed securely by Razorpay.
          </Typography>
        </Stack>
        {DEMO_MODE && (
          <Typography variant="caption" color="text.secondary">
            Demo mode: payments are simulated — no money moves.
          </Typography>
        )}
      </Stack>
    </Container>
  );
}
