import { randomUUID } from "crypto";
import type {
  Purchase,
  Question,
  QuestionStatus,
  QuestionWithContext,
  SystemSettings,
  ThreadMessage,
  ThreadMessageWithAuthor,
  TutorialSeries,
  User,
  Video,
} from "@/lib/types";
import type { Db } from "./interface";
import {
  seedMessages,
  seedPurchases,
  seedQuestions,
  seedSeries,
  seedSettings,
  seedUsers,
  seedVideos,
} from "./seed";

interface MockMedia {
  data: Uint8Array;
  mime: string;
}

interface MockStore {
  users: User[];
  settings: SystemSettings;
  series: TutorialSeries[];
  videos: Video[];
  purchases: Purchase[];
  questions: Question[];
  messages: ThreadMessage[];
  media: Map<string, MockMedia>;
  /** Bumped on every write; polled by clients for live updates. */
  version: number;
}

// Survive Next.js dev-server hot reloads by pinning the store on globalThis.
const globalRef = globalThis as unknown as { __portalMockStore?: MockStore };

function createStore(): MockStore {
  return {
    users: structuredClone(seedUsers),
    settings: structuredClone(seedSettings),
    series: structuredClone(seedSeries),
    videos: structuredClone(seedVideos),
    purchases: structuredClone(seedPurchases),
    questions: structuredClone(seedQuestions),
    messages: structuredClone(seedMessages),
    media: new Map(),
    version: 1,
  };
}

function store(): MockStore {
  if (!globalRef.__portalMockStore) {
    globalRef.__portalMockStore = createStore();
  }
  const s = globalRef.__portalMockStore;
  // Self-heal stores created by an older code version during the same dev
  // session (the store deliberately survives hot reloads; new fields don't).
  if (!Number.isFinite(s.version)) {
    s.version = 1;
  }
  return s;
}

/** Used by /api/media/[id] to serve demo-mode uploads. */
export function getMockMedia(id: string): MockMedia | null {
  return store().media.get(id) ?? null;
}

// --- Change notifications (demo-mode push) ---------------------------------
// The SSE endpoint (/api/live) subscribes here so browsers get an instant
// push the moment any write happens, instead of waiting for a poll tick.
type VersionListener = (version: number) => void;

const listenersRef = globalThis as unknown as {
  __portalVersionListeners?: Set<VersionListener>;
};

function versionListeners(): Set<VersionListener> {
  if (!listenersRef.__portalVersionListeners) {
    listenersRef.__portalVersionListeners = new Set();
  }
  return listenersRef.__portalVersionListeners;
}

/** Subscribe to data-version bumps; returns an unsubscribe function. */
export function subscribeMockChanges(listener: VersionListener): () => void {
  versionListeners().add(listener);
  return () => versionListeners().delete(listener);
}

function byNewest(a: { created_at: string }, b: { created_at: string }) {
  return b.created_at.localeCompare(a.created_at);
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

function messagesWithAuthor(questionId: string): ThreadMessageWithAuthor[] {
  const s = store();
  return s.messages
    .filter((m) => m.question_id === questionId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((m) => ({
      ...m,
      author: m.author_id
        ? s.users.find((u) => u.id === m.author_id) ?? null
        : null,
    }));
}

function withContext(q: Question): QuestionWithContext {
  const s = store();
  const video = s.videos.find((v) => v.id === q.video_id) ?? null;
  const series = video
    ? s.series.find((se) => se.id === video.series_id) ?? null
    : null;
  return {
    ...q,
    learner: s.users.find((u) => u.id === q.learner_id) ?? null,
    video,
    series,
    messages: messagesWithAuthor(q.id),
  };
}

const rawMockDb: Db = {
  // --- Users ---------------------------------------------------------------
  async getUserById(id) {
    return store().users.find((u) => u.id === id) ?? null;
  },
  async getUserByPhone(phone) {
    const normalized = normalizePhone(phone);
    return (
      store().users.find(
        (u) => normalizePhone(u.phone_number) === normalized
      ) ?? null
    );
  },
  async createUser(input) {
    const user: User = {
      id: input.id ?? `u_${randomUUID()}`,
      name: input.name,
      phone_number: input.phone_number,
      role: input.role ?? "learner",
      created_at: new Date().toISOString(),
    };
    store().users.push(user);
    return user;
  },
  async listUsers() {
    return [...store().users].sort((a, b) =>
      a.created_at.localeCompare(b.created_at)
    );
  },
  async listUsersByRole(role) {
    return store()
      .users.filter((u) => u.role === role)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  },
  async updateUser(id, patch) {
    const user = store().users.find((u) => u.id === id);
    if (!user) throw new Error("User not found");
    Object.assign(user, patch);
    return { ...user };
  },
  async deleteUser(id) {
    const s = store();
    // Cascade the user's own questions (and their conversations) + purchases;
    // keep messages they authored on other people's questions, authorless.
    const questionIds = new Set(
      s.questions.filter((q) => q.learner_id === id).map((q) => q.id)
    );
    s.messages = s.messages.filter((m) => !questionIds.has(m.question_id));
    for (const m of s.messages) {
      if (m.author_id === id) m.author_id = null;
    }
    s.questions = s.questions.filter((q) => q.learner_id !== id);
    s.purchases = s.purchases.filter((p) => p.learner_id !== id);
    s.users = s.users.filter((u) => u.id !== id);
  },
  async relinkUserId(oldId, newId) {
    const s = store();
    const user = s.users.find((u) => u.id === oldId);
    if (!user) throw new Error("User not found");
    user.id = newId;
    for (const p of s.purchases) {
      if (p.learner_id === oldId) p.learner_id = newId;
    }
    for (const q of s.questions) {
      if (q.learner_id === oldId) q.learner_id = newId;
    }
    for (const m of s.messages) {
      if (m.author_id === oldId) m.author_id = newId;
    }
    return { ...user };
  },

  // --- Settings ------------------------------------------------------------
  async getSettings() {
    return { ...store().settings };
  },
  async updateSettings(patch) {
    const s = store();
    s.settings.addon_discount_percentage = patch.addon_discount_percentage;
    return { ...s.settings };
  },

  // --- Series --------------------------------------------------------------
  async listSeries() {
    // Title order, matching the Supabase implementation, so demo QA reflects
    // production behavior.
    return [...store().series].sort((a, b) => a.title.localeCompare(b.title));
  },
  async getSeries(id) {
    return store().series.find((s) => s.id === id) ?? null;
  },
  async createSeries(input) {
    const series: TutorialSeries = { id: `s_${randomUUID()}`, ...input };
    store().series.push(series);
    return series;
  },
  async updateSeries(id, patch) {
    const series = store().series.find((s) => s.id === id);
    if (!series) throw new Error("Series not found");
    Object.assign(series, patch);
    return { ...series };
  },
  async deleteSeries(id) {
    const s = store();
    const videoIds = new Set(
      s.videos.filter((v) => v.series_id === id).map((v) => v.id)
    );
    const questionIds = new Set(
      s.questions.filter((q) => videoIds.has(q.video_id)).map((q) => q.id)
    );
    s.messages = s.messages.filter((m) => !questionIds.has(m.question_id));
    s.questions = s.questions.filter((q) => !videoIds.has(q.video_id));
    s.videos = s.videos.filter((v) => v.series_id !== id);
    s.purchases = s.purchases.filter((p) => p.series_id !== id);
    s.series = s.series.filter((se) => se.id !== id);
  },

  // --- Videos --------------------------------------------------------------
  async listVideos(seriesId) {
    return store()
      .videos.filter((v) => v.series_id === seriesId)
      .sort((a, b) => a.order_index - b.order_index);
  },
  async getVideo(id) {
    return store().videos.find((v) => v.id === id) ?? null;
  },
  async createVideo(input) {
    const video: Video = { id: `v_${randomUUID()}`, ...input };
    store().videos.push(video);
    return video;
  },
  async updateVideo(id, patch) {
    const video = store().videos.find((v) => v.id === id);
    if (!video) throw new Error("Video not found");
    Object.assign(video, patch);
    return { ...video };
  },
  async deleteVideo(id) {
    const s = store();
    const questionIds = new Set(
      s.questions.filter((q) => q.video_id === id).map((q) => q.id)
    );
    s.messages = s.messages.filter((m) => !questionIds.has(m.question_id));
    s.questions = s.questions.filter((q) => q.video_id !== id);
    s.videos = s.videos.filter((v) => v.id !== id);
  },

  // --- Purchases -----------------------------------------------------------
  async listPurchases() {
    return [...store().purchases].sort((a, b) =>
      b.purchased_at.localeCompare(a.purchased_at)
    );
  },
  async listPurchasesByLearner(learnerId) {
    return store()
      .purchases.filter((p) => p.learner_id === learnerId)
      .sort((a, b) => b.purchased_at.localeCompare(a.purchased_at));
  },
  async hasPurchased(learnerId, seriesId) {
    return store().purchases.some(
      (p) => p.learner_id === learnerId && p.series_id === seriesId
    );
  },
  async createPurchase(input) {
    // Idempotent per (learner, series) — mirrors the unique index in the
    // Supabase schema so concurrent double-submits can't duplicate rows.
    const existing = store().purchases.find(
      (p) =>
        p.learner_id === input.learner_id && p.series_id === input.series_id
    );
    if (existing) return { ...existing };
    const purchase: Purchase = {
      id: `p_${randomUUID()}`,
      ...input,
      purchased_at: new Date().toISOString(),
    };
    store().purchases.push(purchase);
    return purchase;
  },

  // --- Questions -----------------------------------------------------------
  async createQuestion(input) {
    const question: Question = {
      id: `q_${randomUUID()}`,
      ...input,
      status: "OPEN",
      created_at: new Date().toISOString(),
    };
    store().questions.push(question);
    return question;
  },
  async getQuestion(id) {
    return store().questions.find((q) => q.id === id) ?? null;
  },
  async getQuestionWithContext(id) {
    const q = store().questions.find((qq) => qq.id === id);
    return q ? withContext(q) : null;
  },
  async listQuestionsForVideoByLearner(videoId, learnerId) {
    return store()
      .questions.filter(
        (q) => q.video_id === videoId && q.learner_id === learnerId
      )
      .sort(byNewest)
      .map(withContext);
  },
  async listQuestionsByLearner(learnerId) {
    return store()
      .questions.filter((q) => q.learner_id === learnerId)
      .sort(byNewest)
      .map(withContext);
  },
  async listQuestions(status?: QuestionStatus) {
    let list = [...store().questions];
    if (status) {
      list = list.filter((q) => q.status === status);
      // Oldest first for the OPEN backlog so executives clear it in order.
      if (status === "OPEN") {
        list.sort((a, b) => a.created_at.localeCompare(b.created_at));
      } else {
        list.sort(byNewest);
      }
    } else {
      list.sort(byNewest);
    }
    return list.map(withContext);
  },
  async setQuestionStatus(id, status) {
    const question = store().questions.find((q) => q.id === id);
    if (!question) throw new Error("Question not found");
    question.status = status;
    return { ...question };
  },
  async countQuestionsByLearner() {
    const counts: Record<string, number> = {};
    for (const q of store().questions) {
      counts[q.learner_id] = (counts[q.learner_id] ?? 0) + 1;
    }
    return counts;
  },

  // --- Thread messages -----------------------------------------------------
  async createThreadMessage(input) {
    const message: ThreadMessage = {
      id: `m_${randomUUID()}`,
      ...input,
      created_at: new Date().toISOString(),
    };
    store().messages.push(message);
    return message;
  },
  async listThreadMessages(questionId) {
    return messagesWithAuthor(questionId);
  },

  // --- Live updates --------------------------------------------------------
  async getDataVersion() {
    return store().version;
  },

  // --- Media ---------------------------------------------------------------
  async saveMedia(bytes, mime, kind) {
    const id = `${kind}_${randomUUID()}`;
    store().media.set(id, { data: bytes, mime });
    return `/api/media/${id}`;
  },
};

// Method-name prefixes that never change data — everything else bumps the
// data version so polling clients know to re-render (live updates).
const READ_PREFIXES = ["get", "list", "has", "count"];

/**
 * The exported mock db bumps `version` after every mutating call, mirroring
 * the statement-level triggers that maintain public.data_version in the
 * Supabase schema.
 */
export const mockDb: Db = new Proxy(rawMockDb, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver);
    if (typeof value !== "function") return value;
    const name = String(prop);
    if (READ_PREFIXES.some((p) => name.startsWith(p))) return value;
    return async (...args: unknown[]) => {
      const result = await (value as (...a: unknown[]) => Promise<unknown>).apply(
        target,
        args
      );
      const s = store();
      s.version += 1;
      for (const listener of versionListeners()) {
        try {
          listener(s.version);
        } catch {
          // A dead SSE subscriber must never break a write.
        }
      }
      return result;
    };
  },
});
