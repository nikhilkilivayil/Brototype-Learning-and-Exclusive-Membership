"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ReplyRounded from "@mui/icons-material/ReplyRounded";
import MultimediaMessageForm from "@/components/media/MultimediaMessageForm";
import { replyToQuestionAction } from "./actions";

/**
 * Support-executive reply composer — wraps the shared multimedia form and
 * binds it to the reply server action for one question.
 */
export default function ReplyForm({
  questionId,
  learnerFirstName,
}: {
  questionId: string;
  learnerFirstName: string;
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <ReplyRounded color="primary" />
          <Typography variant="h6" component="h2">
            Reply to {learnerFirstName}
          </Typography>
        </Stack>
        <MultimediaMessageForm
          onSubmitAction={(formData) =>
            replyToQuestionAction(questionId, formData)
          }
          textLabel="Your answer"
          textPlaceholder="Explain the fix step by step…"
          submitLabel="Send answer"
          successMessage="Answer sent!"
        />
      </CardContent>
    </Card>
  );
}
