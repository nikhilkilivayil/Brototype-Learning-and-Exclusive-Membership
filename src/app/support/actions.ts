"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveUploadedAudio, saveUploadedImage } from "@/lib/media";

/**
 * Support-executive reply to a learner's question. Accepts the FormData
 * produced by MultimediaMessageForm (keys: text, image, audio). Appends a
 * thread message and, when the question was OPEN, transitions it to ANSWERED
 * (status changes are the caller's responsibility, not the db layer's).
 */
export async function replyToQuestionAction(
  questionId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  // Outside try/catch so the redirect for unauthenticated users propagates.
  const user = await requireRole(["support", "admin"]);

  try {
    const question = await db.getQuestion(questionId);
    if (!question) {
      return { ok: false, error: "This question no longer exists." };
    }
    if (question.status === "CLOSED_BY_USER") {
      return { ok: false, error: "Learner already marked this resolved." };
    }

    const text = String(formData.get("text") ?? "").trim();
    const imageEntry = formData.get("image");
    const audioEntry = formData.get("audio");
    const hasImage = imageEntry instanceof File && imageEntry.size > 0;
    const hasAudio = audioEntry instanceof File && audioEntry.size > 0;

    if (!text && !hasAudio && !hasImage) {
      return {
        ok: false,
        error:
          "Write an answer, record a voice reply, or attach a screenshot first.",
      };
    }

    const image_url = await saveUploadedImage(hasImage ? imageEntry : null);
    const audio_url = await saveUploadedAudio(hasAudio ? audioEntry : null);

    await db.createThreadMessage({
      question_id: questionId,
      author_id: user.id,
      message_text: text,
      image_url,
      audio_url,
    });

    if (question.status === "OPEN") {
      await db.setQuestionStatus(questionId, "ANSWERED");
    }

    revalidatePath("/support");
    revalidatePath(`/support/questions/${questionId}`);
    revalidatePath(`/watch/${question.video_id}`);

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Something went wrong while sending your answer.",
    };
  }
}
