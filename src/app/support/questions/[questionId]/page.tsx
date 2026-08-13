import NextLink from "next/link";
import { notFound } from "next/navigation";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import OpenInNewRounded from "@mui/icons-material/OpenInNewRounded";
import MediaAttachmentDisplay from "@/components/media/MediaAttachmentDisplay";
import MessageBubble from "@/components/media/MessageBubble";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import type { QuestionStatus } from "@/lib/types";
import ReplyForm from "../../ReplyForm";

const STATUS_CHIP: Record<
  QuestionStatus,
  { label: string; color: "warning" | "success" | "default" }
> = {
  OPEN: { label: "Open", color: "warning" },
  ANSWERED: { label: "Answered", color: "success" },
  CLOSED_BY_USER: { label: "Resolved", color: "default" },
};

function ContextItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      {children}
    </Box>
  );
}

export default async function SupportQuestionPage({
  params,
}: {
  params: Promise<{ questionId: string }>;
}) {
  const { questionId } = await params;
  await requireRole(["support", "admin"], `/support/questions/${questionId}`);

  const question = await db.getQuestionWithContext(questionId);
  if (!question) notFound();

  const chip = STATUS_CHIP[question.status];
  const learnerName = question.learner?.name ?? "Unknown learner";
  const learnerFirstName = learnerName.split(" ")[0];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Breadcrumbs>
          <Link
            component={NextLink}
            href="/support"
            underline="hover"
            color="inherit"
          >
            Helpdesk
          </Link>
          <Typography color="text.primary">Question</Typography>
        </Breadcrumbs>

        {/* Context card */}
        <Card variant="outlined">
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <ContextItem label="Learner">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        fontSize: "0.9rem",
                        bgcolor: "primary.light",
                        color: "primary.dark",
                      }}
                    >
                      {learnerName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2">{learnerName}</Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ wordBreak: "break-word" }}
                      >
                        {question.learner?.phone_number ?? "—"}
                      </Typography>
                    </Box>
                  </Stack>
                </ContextItem>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <ContextItem label="Series">
                  <Typography variant="body2">
                    {question.series?.title ?? "Unknown series"}
                  </Typography>
                </ContextItem>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <ContextItem label="Video">
                  {question.video ? (
                    <Link
                      component={NextLink}
                      href={`/watch/${question.video.id}`}
                      underline="hover"
                      variant="body2"
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      {question.video.title}
                      <OpenInNewRounded sx={{ fontSize: 16 }} />
                    </Link>
                  ) : (
                    <Typography variant="body2">Unknown video</Typography>
                  )}
                </ContextItem>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <ContextItem label="Asked">
                  <Typography variant="body2">
                    {formatDateTime(question.created_at)}
                  </Typography>
                </ContextItem>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Question card */}
        <Card variant="outlined">
          <CardContent>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1.5 }}
            >
              <Typography variant="h6" component="h1">
                Question
              </Typography>
              <Chip
                size="small"
                label={chip.label}
                color={chip.color}
                sx={{ flexShrink: 0 }}
              />
            </Stack>
            <Typography
              variant="body1"
              sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
            >
              {question.question_text || "(voice question — listen below)"}
            </Typography>
            <MediaAttachmentDisplay
              imageUrl={question.image_url}
              audioUrl={question.audio_url}
            />
          </CardContent>
        </Card>

        {/* Conversation — answers and learner follow-ups, oldest first */}
        {question.messages.length > 0 && (
          <Stack spacing={1.5}>
            <Typography variant="h6" component="h2">
              Conversation ({question.messages.length})
            </Typography>
            {question.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </Stack>
        )}

        {/* Reply */}
        {question.status === "CLOSED_BY_USER" ? (
          <Alert severity="info">
            Learner marked this resolved — no further replies needed.
          </Alert>
        ) : (
          <ReplyForm
            questionId={question.id}
            learnerFirstName={learnerFirstName}
          />
        )}
      </Stack>
    </Container>
  );
}
