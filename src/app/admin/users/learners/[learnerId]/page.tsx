import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import MuiLink from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import QuestionAnswerRoundedIcon from "@mui/icons-material/QuestionAnswerRounded";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatINR } from "@/lib/format";
import type { QuestionStatus } from "@/lib/types";

const STATUS_CHIP: Record<
  QuestionStatus,
  { label: string; color: "warning" | "success" | "default" }
> = {
  OPEN: { label: "Open", color: "warning" },
  ANSWERED: { label: "Answered", color: "success" },
  CLOSED_BY_USER: { label: "Resolved", color: "default" },
};

const STATUS_ORDER: QuestionStatus[] = ["OPEN", "ANSWERED", "CLOSED_BY_USER"];

export default async function AdminLearnerDetailPage({
  params,
}: {
  params: Promise<{ learnerId: string }>;
}) {
  const { learnerId } = await params;
  await requireRole(["admin"], `/admin/users/learners/${learnerId}`);

  const learner = await db.getUserById(learnerId);
  if (!learner || learner.role !== "learner") notFound();

  const [purchases, questions, series] = await Promise.all([
    db.listPurchasesByLearner(learner.id),
    db.listQuestionsByLearner(learner.id),
    db.listSeries(),
  ]);

  const seriesById = new Map(series.map((s) => [s.id, s]));
  const totalSpent = purchases.reduce((sum, p) => sum + p.amount_paid, 0);

  const statusCounts: Record<QuestionStatus, number> = {
    OPEN: 0,
    ANSWERED: 0,
    CLOSED_BY_USER: 0,
  };
  for (const q of questions) {
    statusCounts[q.status] += 1;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
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
            href="/admin/users/learners"
            underline="hover"
            color="inherit"
          >
            Learners
          </MuiLink>
          <Typography color="text.primary">{learner.name}</Typography>
        </Breadcrumbs>

        <Card variant="outlined">
          <CardContent>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={3}
              alignItems={{ xs: "flex-start", sm: "center" }}
            >
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: "primary.light",
                  color: "primary.dark",
                  fontSize: 32,
                }}
              >
                {learner.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{ fontSize: { xs: "1.75rem", sm: "2.125rem" } }}
                >
                  {learner.name}
                </Typography>
                <Stack
                  direction="row"
                  spacing={0.75}
                  alignItems="center"
                  sx={{ mt: 0.5, color: "text.secondary" }}
                >
                  <PhoneRoundedIcon fontSize="inherit" />
                  <Typography variant="body2" color="text.secondary">
                    {learner.phone_number} · Registered{" "}
                    {formatDate(learner.created_at)}
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  spacing={1}
                  flexWrap="wrap"
                  useFlexGap
                  sx={{ mt: 1.5 }}
                >
                  <Chip
                    icon={<PaymentsRoundedIcon />}
                    label={`${formatINR(totalSpent)} spent`}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    icon={<QuestionAnswerRoundedIcon />}
                    label={`${questions.length} question${
                      questions.length === 1 ? "" : "s"
                    }`}
                    variant="outlined"
                    size="small"
                  />
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Box>
          <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
            Enrolled courses
          </Typography>
          {purchases.length === 0 ? (
            <Card variant="outlined">
              <Box sx={{ py: 6, textAlign: "center" }}>
                <MenuBookRoundedIcon
                  sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
                />
                <Typography variant="subtitle1" color="text.secondary">
                  No purchases yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This learner hasn&apos;t bought a membership so far.
                </Typography>
              </Box>
            </Card>
          ) : (
            <Card variant="outlined">
              <Stack divider={<Divider />}>
                {purchases.map((purchase) => {
                  const purchasedSeries = seriesById.get(purchase.series_id);
                  return (
                    <Stack
                      key={purchase.id}
                      direction={{ xs: "column", sm: "row" }}
                      spacing={{ xs: 1.5, sm: 2 }}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      sx={{ px: { xs: 2, sm: 2.5 }, py: 2 }}
                    >
                      <Box
                        component="img"
                        src={purchasedSeries?.thumbnail_url}
                        alt={purchasedSeries?.title ?? "Series thumbnail"}
                        sx={{
                          width: 88,
                          height: 52,
                          borderRadius: 1.5,
                          objectFit: "cover",
                          bgcolor: "action.hover",
                          flexShrink: 0,
                        }}
                      />
                      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                        {purchasedSeries ? (
                          <MuiLink
                            component={Link}
                            href={`/series/${purchasedSeries.id}`}
                            underline="hover"
                            color="inherit"
                          >
                            <Typography variant="subtitle2" noWrap>
                              {purchasedSeries.title}
                            </Typography>
                          </MuiLink>
                        ) : (
                          <Typography variant="subtitle2" noWrap>
                            Removed series
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary">
                          Purchased {formatDate(purchase.purchased_at)}
                        </Typography>
                      </Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, flexShrink: 0 }}
                      >
                        {formatINR(purchase.amount_paid)}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
            </Card>
          )}
        </Box>

        <Box>
          <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
            Doubt activity
          </Typography>
          <Card variant="outlined">
            <CardContent>
              {questions.length === 0 ? (
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ color: "text.secondary" }}
                >
                  <HelpOutlineRoundedIcon fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    This learner hasn&apos;t asked any doubts yet.
                  </Typography>
                </Stack>
              ) : (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {STATUS_ORDER.map((status) => (
                    <Chip
                      key={status}
                      label={`${statusCounts[status]} ${STATUS_CHIP[status].label.toLowerCase()}`}
                      color={STATUS_CHIP[status].color}
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Box>
      </Stack>
    </Container>
  );
}
