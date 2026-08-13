"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveUploadedAudio, saveUploadedImage } from "@/lib/media";

export type ActionResult = { ok: boolean; error?: string };

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/**
 * Learner submits a multimedia doubt (text + optional image + optional audio)
 * on a video. Requires an active Exclusive Membership for the video's series.
 * FormData keys: text, image, audio (from MultimediaMessageForm).
 */
export async function askQuestionAction(
  videoId: string,
  formData: FormData
): Promise<ActionResult> {
  // Outside try/catch so requireUser's redirect() can propagate normally.
  const user = await requireUser();
  try {
    if (user.role !== "learner" && user.role !== "admin") {
      return { ok: false, error: "Only learners can ask doubts." };
    }

    const video = await db.getVideo(videoId);
    if (!video) {
      return { ok: false, error: "This video no longer exists." };
    }

    const purchased = await db.hasPurchased(user.id, video.series_id);
    if (!purchased) {
      return {
        ok: false,
        error: "Exclusive Membership required to ask doubts on this series.",
      };
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
          "Type your doubt, record a voice note, or attach a screenshot before submitting.",
      };
    }

    let imageUrl: string | null = null;
    let audioUrl: string | null = null;
    try {
      imageUrl = await saveUploadedImage(hasImage ? imageEntry : null);
      audioUrl = await saveUploadedAudio(hasAudio ? audioEntry : null);
    } catch (err) {
      return {
        ok: false,
        error: errorMessage(err, "Could not save your attachment."),
      };
    }

    await db.createQuestion({
      video_id: video.id,
      learner_id: user.id,
      question_text: text,
      image_url: imageUrl,
      audio_url: audioUrl,
    });

    revalidatePath("/watch/" + videoId);
    revalidatePath("/my-learning");
    revalidatePath("/support");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: errorMessage(err, "Something went wrong. Please try again."),
    };
  }
}

/**
 * Learner sends a follow-up message on their own question thread.
 * If the question was ANSWERED, it reopens (back to OPEN) so the support
 * backlog picks it up again. CLOSED_BY_USER threads are terminal.
 * FormData keys: text, image, audio (from MultimediaMessageForm).
 */
export async function askFollowUpAction(
  questionId: string,
  formData: FormData
): Promise<ActionResult> {
  // Outside try/catch so requireUser's redirect() can propagate normally.
  const user = await requireUser();
  try {
    const question = await db.getQuestion(questionId);
    if (!question) {
      return { ok: false, error: "Question not found." };
    }
    if (question.learner_id !== user.id) {
      return {
        ok: false,
        error: "You can only follow up on your own questions.",
      };
    }
    if (question.status === "CLOSED_BY_USER") {
      return {
        ok: false,
        error: "You already marked this resolved — ask a new question instead.",
      };
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
          "Type your follow-up, record a voice note, or attach a screenshot before sending.",
      };
    }

    let imageUrl: string | null = null;
    let audioUrl: string | null = null;
    try {
      imageUrl = await saveUploadedImage(hasImage ? imageEntry : null);
      audioUrl = await saveUploadedAudio(hasAudio ? audioEntry : null);
    } catch (err) {
      return {
        ok: false,
        error: errorMessage(err, "Could not save your attachment."),
      };
    }

    await db.createThreadMessage({
      question_id: question.id,
      author_id: user.id,
      message_text: text,
      image_url: imageUrl,
      audio_url: audioUrl,
    });

    // A learner follow-up on an answered thread reopens the backlog.
    if (question.status === "ANSWERED") {
      await db.setQuestionStatus(questionId, "OPEN");
    }

    revalidatePath("/watch/" + question.video_id);
    revalidatePath("/my-learning");
    revalidatePath("/support");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: errorMessage(err, "Something went wrong. Please try again."),
    };
  }
}

/**
 * Learner marks their own ANSWERED question as resolved (CLOSED_BY_USER).
 */
export async function markQuestionResolvedAction(
  questionId: string
): Promise<ActionResult> {
  // Outside try/catch so requireUser's redirect() can propagate normally.
  const user = await requireUser();
  try {
    const question = await db.getQuestion(questionId);
    if (!question) {
      return { ok: false, error: "Question not found." };
    }
    if (question.learner_id !== user.id) {
      return { ok: false, error: "You can only resolve your own questions." };
    }
    if (question.status !== "ANSWERED") {
      return {
        ok: false,
        error: "Only answered questions can be marked as resolved.",
      };
    }

    await db.setQuestionStatus(questionId, "CLOSED_BY_USER");
    revalidatePath("/watch/" + question.video_id);
    revalidatePath("/my-learning");
    revalidatePath("/support");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: errorMessage(err, "Something went wrong. Please try again."),
    };
  }
}
