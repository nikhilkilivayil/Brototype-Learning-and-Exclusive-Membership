import { randomUUID } from "crypto";
import type {
  Purchase,
  Question,
  QuestionStatus,
  QuestionWithContext,
  ThreadMessage,
  ThreadMessageWithAuthor,
  TutorialSeries,
  User,
  Video,
} from "@/lib/types";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Db } from "./interface";

const MEDIA_BUCKET = "qa-media";
const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

function sb() {
  return createSupabaseAdminClient();
}

function fail(context: string, error: { message: string } | null): never {
  throw new Error(`${context}: ${error?.message ?? "unknown error"}`);
}

async function attachAuthors(
  messages: ThreadMessage[]
): Promise<ThreadMessageWithAuthor[]> {
  const authorIds = [
    ...new Set(
      messages.map((m) => m.author_id).filter((id): id is string => id !== null)
    ),
  ];
  const authors = new Map<string, User>();
  if (authorIds.length > 0) {
    const { data } = await sb().from("users").select("*").in("id", authorIds);
    for (const u of (data as User[] | null) ?? []) authors.set(u.id, u);
  }
  return messages.map((m) => ({
    ...m,
    author: m.author_id ? authors.get(m.author_id) ?? null : null,
  }));
}

async function composeQuestion(q: Question): Promise<QuestionWithContext> {
  const client = sb();
  const [learnerRes, videoRes, messagesRes] = await Promise.all([
    client.from("users").select("*").eq("id", q.learner_id).maybeSingle(),
    client.from("videos").select("*").eq("id", q.video_id).maybeSingle(),
    client
      .from("question_messages")
      .select("*")
      .eq("question_id", q.id)
      .order("created_at", { ascending: true }),
  ]);

  const video = (videoRes.data as Video | null) ?? null;
  let series: TutorialSeries | null = null;
  if (video) {
    const seriesRes = await client
      .from("tutorial_series")
      .select("*")
      .eq("id", video.series_id)
      .maybeSingle();
    series = (seriesRes.data as TutorialSeries | null) ?? null;
  }

  const messages = await attachAuthors(
    (messagesRes.data as ThreadMessage[] | null) ?? []
  );

  return {
    ...q,
    learner: (learnerRes.data as User | null) ?? null,
    video,
    series,
    messages,
  };
}

async function composeQuestions(
  questions: Question[]
): Promise<QuestionWithContext[]> {
  return Promise.all(questions.map(composeQuestion));
}

export const supabaseDb: Db = {
  // --- Users ---------------------------------------------------------------
  async getUserById(id) {
    const { data, error } = await sb()
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) fail("getUserById", error);
    return (data as User | null) ?? null;
  },
  async getUserByPhone(phone) {
    // phone_normalized is a generated column (digits and + only) so lookups
    // ignore spacing differences between admin-entered and OTP-derived phones.
    const normalized = phone.replace(/[^\d+]/g, "");
    const { data, error } = await sb()
      .from("users")
      .select("*")
      .eq("phone_normalized", normalized)
      .maybeSingle();
    if (error) fail("getUserByPhone", error);
    return (data as User | null) ?? null;
  },
  async createUser(input) {
    const { data, error } = await sb()
      .from("users")
      .insert({
        ...(input.id ? { id: input.id } : {}),
        name: input.name,
        phone_number: input.phone_number,
        role: input.role ?? "learner",
      })
      .select()
      .single();
    if (error) fail("createUser", error);
    return data as User;
  },
  async listUsers() {
    const { data, error } = await sb()
      .from("users")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) fail("listUsers", error);
    return (data as User[] | null) ?? [];
  },
  async listUsersByRole(role) {
    const { data, error } = await sb()
      .from("users")
      .select("*")
      .eq("role", role)
      .order("created_at", { ascending: true });
    if (error) fail("listUsersByRole", error);
    return (data as User[] | null) ?? [];
  },
  async updateUser(id, patch) {
    const { data, error } = await sb()
      .from("users")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) fail("updateUser", error);
    return data as User;
  },
  async deleteUser(id) {
    // question_messages.author_id is ON DELETE SET NULL; the user's own
    // questions/purchases cascade via their FKs.
    const { error } = await sb().from("users").delete().eq("id", id);
    if (error) fail("deleteUser", error);
  },
  async relinkUserId(oldId, newId) {
    // FKs on users.id are ON UPDATE CASCADE, so references follow the re-key.
    const { data, error } = await sb()
      .from("users")
      .update({ id: newId })
      .eq("id", oldId)
      .select()
      .single();
    if (error) fail("relinkUserId", error);
    return data as User;
  },

  // --- Settings ------------------------------------------------------------
  async getSettings() {
    const { data, error } = await sb()
      .from("system_settings")
      .select("*")
      .eq("id", SETTINGS_ID)
      .maybeSingle();
    if (error) fail("getSettings", error);
    if (data) return data as { id: string; addon_discount_percentage: number };
    const { data: created, error: insertError } = await sb()
      .from("system_settings")
      .insert({ id: SETTINGS_ID, addon_discount_percentage: 20 })
      .select()
      .single();
    if (insertError) fail("getSettings:init", insertError);
    return created as { id: string; addon_discount_percentage: number };
  },
  async updateSettings(patch) {
    await this.getSettings(); // ensure the row exists
    const { data, error } = await sb()
      .from("system_settings")
      .update({ addon_discount_percentage: patch.addon_discount_percentage })
      .eq("id", SETTINGS_ID)
      .select()
      .single();
    if (error) fail("updateSettings", error);
    return data as { id: string; addon_discount_percentage: number };
  },

  // --- Series --------------------------------------------------------------
  async listSeries() {
    const { data, error } = await sb()
      .from("tutorial_series")
      .select("*")
      .order("title", { ascending: true });
    if (error) fail("listSeries", error);
    return (data as TutorialSeries[] | null) ?? [];
  },
  async getSeries(id) {
    const { data, error } = await sb()
      .from("tutorial_series")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) fail("getSeries", error);
    return (data as TutorialSeries | null) ?? null;
  },
  async createSeries(input) {
    const { data, error } = await sb()
      .from("tutorial_series")
      .insert(input)
      .select()
      .single();
    if (error) fail("createSeries", error);
    return data as TutorialSeries;
  },
  async updateSeries(id, patch) {
    const { data, error } = await sb()
      .from("tutorial_series")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) fail("updateSeries", error);
    return data as TutorialSeries;
  },
  async deleteSeries(id) {
    const { error } = await sb().from("tutorial_series").delete().eq("id", id);
    if (error) fail("deleteSeries", error);
  },

  // --- Videos --------------------------------------------------------------
  async listVideos(seriesId) {
    const { data, error } = await sb()
      .from("videos")
      .select("*")
      .eq("series_id", seriesId)
      .order("order_index", { ascending: true });
    if (error) fail("listVideos", error);
    return (data as Video[] | null) ?? [];
  },
  async getVideo(id) {
    const { data, error } = await sb()
      .from("videos")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) fail("getVideo", error);
    return (data as Video | null) ?? null;
  },
  async createVideo(input) {
    const { data, error } = await sb()
      .from("videos")
      .insert(input)
      .select()
      .single();
    if (error) fail("createVideo", error);
    return data as Video;
  },
  async updateVideo(id, patch) {
    const { data, error } = await sb()
      .from("videos")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) fail("updateVideo", error);
    return data as Video;
  },
  async deleteVideo(id) {
    const { error } = await sb().from("videos").delete().eq("id", id);
    if (error) fail("deleteVideo", error);
  },

  // --- Purchases -----------------------------------------------------------
  async listPurchases() {
    const { data, error } = await sb()
      .from("purchases")
      .select("*")
      .order("purchased_at", { ascending: false });
    if (error) fail("listPurchases", error);
    return (data as Purchase[] | null) ?? [];
  },
  async listPurchasesByLearner(learnerId) {
    const { data, error } = await sb()
      .from("purchases")
      .select("*")
      .eq("learner_id", learnerId)
      .order("purchased_at", { ascending: false });
    if (error) fail("listPurchasesByLearner", error);
    return (data as Purchase[] | null) ?? [];
  },
  async hasPurchased(learnerId, seriesId) {
    const { count, error } = await sb()
      .from("purchases")
      .select("id", { count: "exact", head: true })
      .eq("learner_id", learnerId)
      .eq("series_id", seriesId);
    if (error) fail("hasPurchased", error);
    return (count ?? 0) > 0;
  },
  async createPurchase(input) {
    const { data, error } = await sb()
      .from("purchases")
      .insert(input)
      .select()
      .single();
    if (error) {
      // Unique (learner_id, series_id) violation → a concurrent request won
      // the race; treat as idempotent success and return the existing row.
      if (error.code === "23505") {
        const { data: existing } = await sb()
          .from("purchases")
          .select("*")
          .eq("learner_id", input.learner_id)
          .eq("series_id", input.series_id)
          .maybeSingle();
        if (existing) return existing as Purchase;
      }
      fail("createPurchase", error);
    }
    return data as Purchase;
  },

  // --- Questions -----------------------------------------------------------
  async createQuestion(input) {
    const { data, error } = await sb()
      .from("questions")
      .insert({ ...input, status: "OPEN" })
      .select()
      .single();
    if (error) fail("createQuestion", error);
    return data as Question;
  },
  async getQuestion(id) {
    const { data, error } = await sb()
      .from("questions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) fail("getQuestion", error);
    return (data as Question | null) ?? null;
  },
  async getQuestionWithContext(id) {
    const question = await this.getQuestion(id);
    return question ? composeQuestion(question) : null;
  },
  async listQuestionsForVideoByLearner(videoId, learnerId) {
    const { data, error } = await sb()
      .from("questions")
      .select("*")
      .eq("video_id", videoId)
      .eq("learner_id", learnerId)
      .order("created_at", { ascending: false });
    if (error) fail("listQuestionsForVideoByLearner", error);
    return composeQuestions((data as Question[] | null) ?? []);
  },
  async listQuestionsByLearner(learnerId) {
    const { data, error } = await sb()
      .from("questions")
      .select("*")
      .eq("learner_id", learnerId)
      .order("created_at", { ascending: false });
    if (error) fail("listQuestionsByLearner", error);
    return composeQuestions((data as Question[] | null) ?? []);
  },
  async listQuestions(status?: QuestionStatus) {
    let query = sb().from("questions").select("*");
    if (status) {
      query = query.eq("status", status);
      // OPEN backlog oldest-first; everything else newest-first.
      query = query.order("created_at", { ascending: status === "OPEN" });
    } else {
      query = query.order("created_at", { ascending: false });
    }
    const { data, error } = await query;
    if (error) fail("listQuestions", error);
    return composeQuestions((data as Question[] | null) ?? []);
  },
  async setQuestionStatus(id, status) {
    const { data, error } = await sb()
      .from("questions")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error) fail("setQuestionStatus", error);
    return data as Question;
  },

  async countQuestionsByLearner() {
    const { data, error } = await sb().from("questions").select("learner_id");
    if (error) fail("countQuestionsByLearner", error);
    const counts: Record<string, number> = {};
    for (const row of (data as Array<{ learner_id: string }> | null) ?? []) {
      counts[row.learner_id] = (counts[row.learner_id] ?? 0) + 1;
    }
    return counts;
  },

  // --- Thread messages -----------------------------------------------------
  async createThreadMessage(input) {
    const { data, error } = await sb()
      .from("question_messages")
      .insert(input)
      .select()
      .single();
    if (error) fail("createThreadMessage", error);
    return data as ThreadMessage;
  },
  async listThreadMessages(questionId) {
    const { data, error } = await sb()
      .from("question_messages")
      .select("*")
      .eq("question_id", questionId)
      .order("created_at", { ascending: true });
    if (error) fail("listThreadMessages", error);
    return attachAuthors((data as ThreadMessage[] | null) ?? []);
  },

  // --- Live updates --------------------------------------------------------
  async getDataVersion() {
    const { data, error } = await sb()
      .from("data_version")
      .select("version")
      .eq("id", 1)
      .maybeSingle();
    if (error) fail("getDataVersion", error);
    return Number((data as { version: number | string } | null)?.version ?? 1);
  },

  // --- Media ---------------------------------------------------------------
  async saveMedia(bytes, mime, kind) {
    const ext = mime.split("/")[1]?.split(";")[0] || "bin";
    const path = `${kind}/${randomUUID()}.${ext}`;
    const { error } = await sb()
      .storage.from(MEDIA_BUCKET)
      .upload(path, bytes, { contentType: mime });
    if (error) fail("saveMedia", error);
    const { data } = sb().storage.from(MEDIA_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  },
};
