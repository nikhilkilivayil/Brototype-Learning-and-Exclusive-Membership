import NextLink from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import HelpOutlineRounded from "@mui/icons-material/HelpOutlineRounded";
import LocalPhoneRounded from "@mui/icons-material/LocalPhoneRounded";
import ShoppingBagRounded from "@mui/icons-material/ShoppingBagRounded";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatDateTime, formatINR } from "@/lib/format";
import type { QuestionStatus } from "@/lib/types";

const STATUS_CHIP: Record<
  QuestionStatus,
  { label: string; color: "warning" | "success" | "default" }
> = {
  OPEN: { label: "Open", color: "warning" },
  ANSWERED: { label: "Answered", color: "success" },
  CLOSED_BY_USER: { label: "Resolved", color: "default" },
};

export default async function SalesLearnerDetailPage({
  params,
}: {
  params: Promise<{ learnerId: string }>;
}) {
  const { learnerId } = await params;
  await requireRole(["sales", "admin"], `/sales/learners/${learnerId}`);

  // Strict hierarchy: sales only ever sees learner accounts. Any other role
  // (or unknown id) is a 404, indistinguishable from a missing record.
  const learner = await db.getUserById(learnerId);
  if (!learner || learner.role !== "learner") notFound();

  const [purchases, series, questions] = await Promise.all([
    db.listPurchasesByLearner(learnerId),
    db.listSeries(),
    db.listQuestionsByLearner(learnerId),
  ]);

  const seriesById = new Map(series.map((s) => [s.id, s]));
  const sortedPurchases = [...purchases].sort((a, b) =>
    b.purchased_at.localeCompare(a.purchased_at)
  );
  const totalSpent = purchases.reduce((sum, p) => sum + p.amount_paid, 0);
  const isPaying = purchases.length > 0;

  const statusCounts: Record<QuestionStatus, number> = {
    OPEN: 0,
    ANSWERED: 0,
    CLOSED_BY_USER: 0,
  };
  for (const q of questions) statusCounts[q.status] += 1;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Breadcrumbs>
          <Link
            component={NextLink}
            href="/sales"
            underline="hover"
            color="inherit"
          >
            Sales dashboard
          </Link>
          <Typography color="text.primary">{learner.name}</Typography>
        </Breadcrumbs>

        {/* Profile card */}
        <Card variant="outlined">
          <CardContent>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2.5}
              alignItems={{ xs: "flex-start", sm: "center" }}
            >
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: "primary.light",
                  color: "primary.dark",
                  fontSize: "1.6rem",
                  fontWeight: 600,
                }}
              >
                {learner.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography
                  variant="h5"
                  component="h1"
                  sx={{
                    fontSize: { xs: "1.35rem", md: "1.5rem" },
                    wordBreak: "break-word",
                  }}
                >
                  {learner.name}
                </Typography>
                <Stack
                  direction="row"
                  spacing={0.75}
                  alignItems="center"
                  sx={{ color: "text.secondary", mt: 0.5 }}
                >
                  <LocalPhoneRounded sx={{ fontSize: 16 }} />
                  <Typography variant="body2">
                    {learner.phone_number}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Registered {formatDate(learner.created_at)}
                </Typography>
              </Box>
              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
                useFlexGap
                sx={{ maxWidth: "100%" }}
              >
                <Chip
                  label={isPaying ? "Paying member" : "Free learner"}
                  color={isPaying ? "success" : "default"}
                  variant={isPaying ? "filled" : "outlined"}
                  size="small"
                />
                <Chip
                  label={`Total spent: ${formatINR(totalSpent)}`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Purchases */}
        <Card variant="outlined">
          <CardContent>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <ShoppingBagRounded fontSize="small" color="primary" />
              <Typography variant="h6" component="h2">
                Enrolled &amp; purchased courses
              </Typography>
            </Stack>

            {sortedPurchases.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No purchases yet — a good lead 😉
              </Typography>
            ) : (
              <Stack divider={<Divider flexItem />} spacing={2}>
                {sortedPurchases.map((purchase) => {
                  const purchasedSeries = seriesById.get(purchase.series_id);
                  const title = purchasedSeries?.title ?? "Unknown series";
                  return (
                    <Stack
                      key={purchase.id}
                      direction={{ xs: "column", sm: "row" }}
                      spacing={{ xs: 1, sm: 2 }}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                    >
                      <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        sx={{ minWidth: 0, width: { xs: "100%", sm: "auto" }, flexGrow: 1 }}
                      >
                        <Avatar
                          variant="rounded"
                          src={purchasedSeries?.thumbnail_url}
                          alt={title}
                          sx={{ width: 64, height: 40, flexShrink: 0 }}
                        >
                          {title.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" noWrap>
                            {title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Purchased {formatDateTime(purchase.purchased_at)}
                          </Typography>
                        </Box>
                      </Stack>
                      <Typography
                        variant="subtitle2"
                        sx={{ flexShrink: 0, pl: { xs: 0, sm: 1 } }}
                      >
                        {formatINR(purchase.amount_paid)}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
            )}
          </CardContent>
        </Card>

        {/* Doubt activity */}
        <Card variant="outlined">
          <CardContent>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <HelpOutlineRounded fontSize="small" color="primary" />
              <Typography variant="h6" component="h2">
                Doubt activity
              </Typography>
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {questions.length === 0
                ? "This learner hasn't asked any doubts yet."
                : questions.length === 1
                  ? "1 question asked so far."
                  : `${questions.length} questions asked so far.`}
            </Typography>

            {questions.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {(Object.keys(STATUS_CHIP) as QuestionStatus[]).map(
                  (status) =>
                    statusCounts[status] > 0 && (
                      <Chip
                        key={status}
                        size="small"
                        color={STATUS_CHIP[status].color}
                        variant="outlined"
                        label={`${STATUS_CHIP[status].label}: ${statusCounts[status]}`}
                      />
                    )
                )}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
