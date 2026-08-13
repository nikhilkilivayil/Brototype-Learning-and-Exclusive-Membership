import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import { db } from "@/lib/db";
import { getPriceQuote } from "@/lib/pricing";
import type { User, Video } from "@/lib/types";
import AskQuestionForm from "./AskQuestionForm";
import LockedQACard from "./LockedQACard";
import QuestionThread from "./QuestionThread";

/**
 * The "Doubt Support" section shown under a video on the watch page.
 * Members get the multimedia composer + their own threads for this video;
 * everyone else gets the LockedQACard conversion moment.
 */
export default async function QASection({
  video,
  user,
  hasPurchased,
}: {
  video: Video;
  user: User | null;
  hasPurchased: boolean;
}) {
  const isMember = Boolean(hasPurchased && user);

  const heading = (
    <Stack direction="row" spacing={1.25} alignItems="center">
      <Typography variant="h5" component="h2">
        Doubt Support
      </Typography>
      <Chip
        size="small"
        color="warning"
        icon={<BoltRoundedIcon />}
        label="Exclusive"
      />
    </Stack>
  );

  if (!isMember || !user) {
    const [quote, series] = await Promise.all([
      getPriceQuote(user?.id ?? null, video.series_id),
      db.getSeries(video.series_id),
    ]);
    return (
      <Stack spacing={2.5}>
        {heading}
        <LockedQACard
          quote={quote}
          user={user}
          seriesTitle={series?.title ?? "this series"}
        />
      </Stack>
    );
  }

  const questions = await db.listQuestionsForVideoByLearner(video.id, user.id);

  return (
    <Stack spacing={2.5}>
      {heading}
      <AskQuestionForm videoId={video.id} />

      {questions.length === 0 ? (
        <Box
          sx={{
            py: 5,
            px: 3,
            textAlign: "center",
            borderRadius: 4,
            border: "1px dashed",
            borderColor: "divider",
          }}
        >
          <ForumRoundedIcon
            sx={{ fontSize: 44, color: "text.secondary", opacity: 0.6 }}
          />
          <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 600 }}>
            No doubts yet on this video — ask away!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Your questions and our engineers&apos; answers will appear here.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          <Typography variant="subtitle2" color="text.secondary">
            Your doubts on this video ({questions.length})
          </Typography>
          {questions.map((question) => (
            <QuestionThread
              key={question.id}
              question={question}
              viewerRole="learner"
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
