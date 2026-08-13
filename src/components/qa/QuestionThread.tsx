"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip, { type ChipProps } from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import ReplyRoundedIcon from "@mui/icons-material/ReplyRounded";
import MediaAttachmentDisplay from "@/components/media/MediaAttachmentDisplay";
import MessageBubble from "@/components/media/MessageBubble";
import MultimediaMessageForm from "@/components/media/MultimediaMessageForm";
import { formatDateTime } from "@/lib/format";
import type { QuestionStatus, QuestionWithContext } from "@/lib/types";
import { askFollowUpAction, markQuestionResolvedAction } from "./actions";

const STATUS_CHIP: Record<
  QuestionStatus,
  { label: string; color: ChipProps["color"] }
> = {
  OPEN: { label: "Awaiting answer", color: "warning" },
  ANSWERED: { label: "Answered", color: "success" },
  CLOSED_BY_USER: { label: "Resolved", color: "default" },
};

/**
 * One doubt thread: the learner's original question as the header, the full
 * conversation (engineer answers + learner follow-ups) as message bubbles,
 * a follow-up composer while the thread is still open, and the
 * "Mark as resolved" flow once an answer has arrived.
 */
export default function QuestionThread({
  question,
  viewerRole,
}: {
  question: QuestionWithContext;
  viewerRole: "learner";
}) {
  const router = useRouter();
  const [resolving, setResolving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [followUpOpen, setFollowUpOpen] = React.useState(false);

  const status = STATUS_CHIP[question.status];
  const learnerName = question.learner?.name ?? "You";
  const learnerInitial = learnerName.trim().charAt(0).toUpperCase() || "L";

  async function handleResolve() {
    setError(null);
    setResolving(true);
    try {
      const result = await markQuestionResolvedAction(question.id);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error ?? "Could not mark as resolved.");
      }
    } catch {
      setError("Could not mark as resolved.");
    } finally {
      setResolving(false);
    }
  }

  async function handleFollowUpSubmit(formData: FormData) {
    const result = await askFollowUpAction(question.id, formData);
    if (result.ok) {
      setFollowUpOpen(false);
    }
    return result;
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Original question — the thread header */}
        <Stack direction="row" spacing={{ xs: 1.25, sm: 1.5 }} alignItems="flex-start">
          <Avatar
            sx={{
              bgcolor: "primary.main",
              width: { xs: 32, sm: 40 },
              height: { xs: 32, sm: 40 },
              fontSize: { xs: "1rem", sm: "1.25rem" },
            }}
          >
            {learnerInitial}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {learnerName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDateTime(question.created_at)}
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Chip
                size="small"
                label={status.label}
                color={status.color}
                variant={question.status === "CLOSED_BY_USER" ? "outlined" : "filled"}
              />
            </Stack>
            {question.question_text && (
              <Typography
                variant="body1"
                sx={{ mt: 0.75, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
              >
                {question.question_text}
              </Typography>
            )}
            <MediaAttachmentDisplay
              imageUrl={question.image_url}
              audioUrl={question.audio_url}
            />
          </Box>
        </Stack>

        {/* Conversation (answers + follow-ups), inset under a subtle left border */}
        {question.messages.length > 0 && (
          <Box
            sx={{
              mt: 2.5,
              ml: { xs: 0.5, sm: 2.5 },
              pl: { xs: 1.5, sm: 2.5 },
              borderLeft: 2,
              borderColor: "divider",
            }}
          >
            <Stack spacing={2}>
              {question.messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </Stack>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {viewerRole === "learner" && question.status !== "CLOSED_BY_USER" && (
          <Box sx={{ mt: 2.5 }}>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              <Button
                variant="outlined"
                startIcon={<ReplyRoundedIcon />}
                onClick={() => setFollowUpOpen((open) => !open)}
                aria-expanded={followUpOpen}
              >
                Ask a follow-up
              </Button>
              {question.status === "ANSWERED" && (
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={
                    resolving ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <DoneAllRoundedIcon />
                    )
                  }
                  onClick={handleResolve}
                  disabled={resolving}
                >
                  {resolving ? "Marking…" : "Mark as resolved"}
                </Button>
              )}
            </Stack>
            <Collapse in={followUpOpen}>
              <Box sx={{ mt: 2 }}>
                <MultimediaMessageForm
                  onSubmitAction={handleFollowUpSubmit}
                  textLabel="Your follow-up"
                  textPlaceholder="Add more detail or tell us what's still unclear…"
                  submitLabel="Send follow-up"
                  successMessage="Follow-up sent — we'll get back to you!"
                />
              </Box>
            </Collapse>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1 }}
            >
              Not resolved yet? Keep the conversation going — no need to ask a
              new question.
            </Typography>
          </Box>
        )}

        {question.status === "CLOSED_BY_USER" && (
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            sx={{ mt: 2 }}
          >
            <DoneAllRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              You marked this resolved
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
