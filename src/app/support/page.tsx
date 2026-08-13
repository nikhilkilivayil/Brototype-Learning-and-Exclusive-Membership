import NextLink from "next/link";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import CelebrationRounded from "@mui/icons-material/CelebrationRounded";
import ImageRounded from "@mui/icons-material/ImageRounded";
import InboxRounded from "@mui/icons-material/InboxRounded";
import MicRounded from "@mui/icons-material/MicRounded";
import QuestionAnswerRounded from "@mui/icons-material/QuestionAnswerRounded";
import ReplyRounded from "@mui/icons-material/ReplyRounded";
import TaskAltRounded from "@mui/icons-material/TaskAltRounded";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import type { QuestionStatus, QuestionWithContext } from "@/lib/types";
import QueueTabs, { type QueueTabValue } from "./QueueTabs";

const STATUS_CHIP: Record<
  QuestionStatus,
  { label: string; color: "warning" | "success" | "default" }
> = {
  OPEN: { label: "Open", color: "warning" },
  ANSWERED: { label: "Answered", color: "success" },
  CLOSED_BY_USER: { label: "Resolved", color: "default" },
};

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "warning" | "success" | "secondary" | "primary";
}) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: `${color}.main`, color: `${color}.contrastText` }}>
            {icon}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h4"
              component="div"
              sx={{ fontSize: { xs: "1.4rem", md: "2rem" } }}
            >
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function QuestionRow({ question }: { question: QuestionWithContext }) {
  const chip = STATUS_CHIP[question.status];
  const learnerName = question.learner?.name ?? "Unknown learner";
  return (
    <Card variant="outlined">
      <CardActionArea
        component={NextLink}
        href={`/support/questions/${question.id}`}
      >
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <Avatar sx={{ bgcolor: "primary.light", color: "primary.dark" }}>
              {learnerName.charAt(0).toUpperCase()}
            </Avatar>

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="subtitle1">{learnerName}</Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {question.series?.title ?? "Unknown series"} ·{" "}
                {question.video?.title ?? "Unknown video"}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.5,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  wordBreak: "break-word",
                }}
              >
                {question.question_text || "(voice question)"}
              </Typography>
            </Box>

            <Stack
              spacing={1}
              alignItems={{ xs: "flex-start", sm: "flex-end" }}
              sx={{ minWidth: 0, maxWidth: "100%" }}
            >
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip size="small" label={chip.label} color={chip.color} />
                {question.status === "OPEN" &&
                  question.messages.length > 0 && (
                    <Chip
                      size="small"
                      color="warning"
                      variant="outlined"
                      icon={<ReplyRounded />}
                      label="Follow-up"
                    />
                  )}
                {question.image_url && (
                  <Chip
                    size="small"
                    variant="outlined"
                    icon={<ImageRounded />}
                    label="Image"
                  />
                )}
                {question.audio_url && (
                  <Chip
                    size="small"
                    variant="outlined"
                    icon={<MicRounded />}
                    label="Voice"
                  />
                )}
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {formatDateTime(question.created_at)}
                {question.messages.length > 0 &&
                  ` · ${question.messages.length} ${
                    question.messages.length === 1 ? "message" : "messages"
                  }`}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default async function SupportDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireRole(["support", "admin"], "/support");
  const { tab: rawTab } = await searchParams;
  const tab: QueueTabValue =
    rawTab === "answered" || rawTab === "closed" || rawTab === "all"
      ? rawTab
      : "open";

  const [openQuestions, answeredQuestions, closedQuestions] = await Promise.all([
    db.listQuestions("OPEN"),
    db.listQuestions("ANSWERED"),
    db.listQuestions("CLOSED_BY_USER"),
  ]);
  const total =
    openQuestions.length + answeredQuestions.length + closedQuestions.length;

  const listByTab: Record<Exclude<QueueTabValue, "all">, QuestionWithContext[]> =
    {
      open: openQuestions,
      answered: answeredQuestions,
      closed: closedQuestions,
    };
  const questions =
    tab === "all" ? await db.listQuestions() : listByTab[tab];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontSize: { xs: "1.75rem", md: "2.125rem" } }}
          >
            Support helpdesk
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {user.name.split(" ")[0]} — answer learner doubts
            with text, screenshots, or voice notes.
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              label="Open"
              value={openQuestions.length}
              icon={<InboxRounded />}
              color="warning"
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              label="Answered"
              value={answeredQuestions.length}
              icon={<CheckCircleRounded />}
              color="success"
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              label="Resolved by learner"
              value={closedQuestions.length}
              icon={<TaskAltRounded />}
              color="secondary"
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              label="Total"
              value={total}
              icon={<QuestionAnswerRounded />}
              color="primary"
            />
          </Grid>
        </Grid>

        <QueueTabs
          value={tab}
          counts={{
            open: openQuestions.length,
            answered: answeredQuestions.length,
            closed: closedQuestions.length,
            all: total,
          }}
        />

        {tab === "open" && questions.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            Oldest first — clear the backlog in order.
          </Typography>
        )}

        {questions.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <CelebrationRounded
              sx={{ fontSize: 56, color: "text.disabled", mb: 1 }}
            />
            <Typography variant="h6">Queue clear! 🎉</Typography>
            <Typography variant="body2" color="text.secondary">
              No questions here right now. Check back soon.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {questions.map((question) => (
              <QuestionRow key={question.id} question={question} />
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
