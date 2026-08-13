import type { Metadata } from "next";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatINR } from "@/lib/pricing";
import { formatDate, formatDateTime } from "@/lib/format";
import type { QuestionStatus } from "@/lib/types";
import SeriesCard from "@/components/learner/SeriesCard";

export const metadata: Metadata = {
  title: "My Learning",
};

const STATUS_CHIP: Record<
  QuestionStatus,
  { label: string; color: "warning" | "success" | "default" }
> = {
  OPEN: { label: "Open", color: "warning" },
  ANSWERED: { label: "Answered", color: "success" },
  CLOSED_BY_USER: { label: "Closed", color: "default" },
};

export default async function MyLearningPage() {
  const user = await requireUser("/my-learning");

  const [purchases, questions] = await Promise.all([
    db.listPurchasesByLearner(user.id),
    db.listQuestionsByLearner(user.id),
  ]);

  const ownedSeries = (
    await Promise.all(
      purchases.map(async (p) => {
        const series = await db.getSeries(p.series_id);
        if (!series) return null;
        const videoCount = (await db.listVideos(series.id)).length;
        return { series, videoCount };
      })
    )
  ).filter((s): s is NonNullable<typeof s> => s !== null);

  const totalSpent = purchases.reduce((sum, p) => sum + p.amount_paid, 0);
  const latestPurchase = purchases.reduce<(typeof purchases)[number] | null>(
    (latest, p) =>
      !latest || p.purchased_at > latest.purchased_at ? p : latest,
    null
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h3"
        component="h1"
        sx={{ mb: 0.5, fontSize: { xs: "1.5rem", sm: "1.75rem" } }}
      >
        My Learning
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome back, {user.name.split(" ")[0]}. Your memberships and doubts in
        one place.
      </Typography>

      <Grid container spacing={{ xs: 3, md: 4 }}>
        {/* Main column */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={{ xs: 4, md: 5 }}>
            {/* My series */}
            <Box>
              <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
                My series
              </Typography>
              {ownedSeries.length === 0 ? (
                <Card variant="outlined" sx={{ py: 6, px: 3, textAlign: "center" }}>
                  <AutoStoriesRoundedIcon
                    sx={{ fontSize: 56, color: "text.secondary", mb: 1 }}
                  />
                  <Typography variant="h6">No memberships yet</Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2.5, maxWidth: 420, mx: "auto" }}
                  >
                    All videos are free to watch. An Exclusive Membership adds
                    1-on-1 Q&amp;A support on every video of a series.
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    justifyContent="center"
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Button component={Link} href="/" variant="contained">
                      Browse series
                    </Button>
                    <Button
                      component={Link}
                      href="/pricing"
                      variant="outlined"
                      color="warning"
                      startIcon={<WorkspacePremiumRoundedIcon />}
                    >
                      See pricing
                    </Button>
                  </Stack>
                </Card>
              ) : (
                <Grid container spacing={3}>
                  {ownedSeries.map(({ series, videoCount }) => (
                    <Grid key={series.id} size={{ xs: 12, sm: 6 }}>
                      <SeriesCard series={series} owned videoCount={videoCount} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>

            {/* My questions */}
            <Box>
              <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
                My questions
              </Typography>
              {questions.length === 0 ? (
                <Card variant="outlined" sx={{ py: 6, px: 3, textAlign: "center" }}>
                  <ForumRoundedIcon
                    sx={{ fontSize: 56, color: "text.secondary", mb: 1 }}
                  />
                  <Typography variant="h6">No questions asked yet</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Stuck on a video of a series you own? Ask right below the
                    player — with text, a screenshot or a voice note.
                  </Typography>
                </Card>
              ) : (
                <Card variant="outlined">
                  <List disablePadding>
                    {questions.map((q, i) => (
                      <ListItemButton
                        key={q.id}
                        component={Link}
                        href={`/watch/${q.video_id}`}
                        divider={i < questions.length - 1}
                        sx={{ py: 1.5, gap: 2, alignItems: "flex-start" }}
                      >
                        <ListItemText
                          primary={q.question_text}
                          secondary={
                            <>
                              {q.series?.title ?? "Series"}
                              {q.video ? ` · ${q.video.title}` : ""}
                              {" · "}
                              {formatDateTime(q.created_at)}
                            </>
                          }
                          slotProps={{
                            primary: {
                              fontWeight: 500,
                              sx: {
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              },
                            },
                            secondary: { variant: "caption" },
                          }}
                        />
                        <Chip
                          size="small"
                          label={STATUS_CHIP[q.status].label}
                          color={STATUS_CHIP[q.status].color}
                          sx={{ mt: 0.5, flexShrink: 0 }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Card>
              )}
            </Box>
          </Stack>
        </Grid>

        {/* Summary sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <ReceiptLongRoundedIcon color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Purchases summary
                </Typography>
              </Stack>
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total spent
                  </Typography>
                  <Typography variant="h4">{formatINR(totalSpent)}</Typography>
                </Box>
                <Divider />
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2" color="text.secondary">
                    Memberships owned
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {purchases.length}
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2" color="text.secondary">
                    Questions asked
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {questions.length}
                  </Typography>
                </Stack>
                {latestPurchase && (
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="body2" color="text.secondary">
                      Last purchase
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatDate(latestPurchase.purchased_at)}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
