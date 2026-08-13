"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LiveHelpRoundedIcon from "@mui/icons-material/LiveHelpRounded";
import MultimediaMessageForm from "@/components/media/MultimediaMessageForm";
import { askQuestionAction } from "./actions";

/**
 * Members-only composer for asking a new doubt on a video.
 * Wraps the shared multimedia composer (text + image + voice note).
 */
export default function AskQuestionForm({ videoId }: { videoId: string }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
          <LiveHelpRoundedIcon color="primary" />
          <Typography variant="h6" component="h3">
            Ask a doubt
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          A Brototype engineer will get back to you personally.
        </Typography>
        <MultimediaMessageForm
          onSubmitAction={(formData) => askQuestionAction(videoId, formData)}
          textLabel="Your doubt"
          textPlaceholder="Describe where you got stuck — mentioning the video timestamp (e.g. 12:45) helps us answer faster…"
          submitLabel="Submit question"
          successMessage="Question submitted — our engineers will reply soon!"
        />
      </CardContent>
    </Card>
  );
}
