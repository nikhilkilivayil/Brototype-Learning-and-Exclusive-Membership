import type {
  Purchase,
  Question,
  QuestionStatus,
  QuestionWithContext,
  Role,
  SystemSettings,
  ThreadMessage,
  ThreadMessageWithAuthor,
  TutorialSeries,
  User,
  Video,
} from "@/lib/types";

/**
 * Data-access contract used by every server action / page in the app.
 * Two implementations exist:
 *  - `mock.ts`     — in-memory store with seeded demo data (demo mode)
 *  - `supabase-db.ts` — real Supabase Postgres + Storage implementation
 */
export interface Db {
  // --- Users ---------------------------------------------------------------
  getUserById(id: string): Promise<User | null>;
  /** Phone lookup ignores spacing/formatting differences. */
  getUserByPhone(phone: string): Promise<User | null>;
  createUser(input: {
    id?: string;
    name: string;
    phone_number: string;
    role?: Role;
  }): Promise<User>;
  listUsers(): Promise<User[]>;
  listUsersByRole(role: Role): Promise<User[]>;
  updateUser(
    id: string,
    patch: Partial<{ name: string; phone_number: string; role: Role }>
  ): Promise<User>;
  /**
   * Removes a user. A learner's questions/messages/purchases cascade away;
   * a deleted staff member's authored thread messages survive with a null
   * author.
   */
  deleteUser(id: string): Promise<void>;
  /**
   * Re-keys a user row (and every reference to it) to a new id — used when a
   * staff profile pre-created by the admin is claimed by its owner's first
   * phone-OTP sign-in (profile ids must match the Supabase auth user id).
   */
  relinkUserId(oldId: string, newId: string): Promise<User>;

  // --- System settings -----------------------------------------------------
  getSettings(): Promise<SystemSettings>;
  updateSettings(patch: {
    addon_discount_percentage: number;
  }): Promise<SystemSettings>;

  // --- Tutorial series -----------------------------------------------------
  listSeries(): Promise<TutorialSeries[]>;
  getSeries(id: string): Promise<TutorialSeries | null>;
  createSeries(input: Omit<TutorialSeries, "id">): Promise<TutorialSeries>;
  updateSeries(
    id: string,
    patch: Partial<Omit<TutorialSeries, "id">>
  ): Promise<TutorialSeries>;
  deleteSeries(id: string): Promise<void>;

  // --- Videos --------------------------------------------------------------
  /** Videos of a series ordered by order_index ascending. */
  listVideos(seriesId: string): Promise<Video[]>;
  getVideo(id: string): Promise<Video | null>;
  createVideo(input: Omit<Video, "id">): Promise<Video>;
  updateVideo(id: string, patch: Partial<Omit<Video, "id">>): Promise<Video>;
  deleteVideo(id: string): Promise<void>;

  // --- Purchases -----------------------------------------------------------
  listPurchases(): Promise<Purchase[]>;
  listPurchasesByLearner(learnerId: string): Promise<Purchase[]>;
  hasPurchased(learnerId: string, seriesId: string): Promise<boolean>;
  createPurchase(input: {
    learner_id: string;
    series_id: string;
    amount_paid: number;
  }): Promise<Purchase>;

  // --- Questions -----------------------------------------------------------
  createQuestion(input: {
    video_id: string;
    learner_id: string;
    question_text: string;
    image_url: string | null;
    audio_url: string | null;
  }): Promise<Question>;
  getQuestion(id: string): Promise<Question | null>;
  /** Question + learner + video + series + answers (each with author). */
  getQuestionWithContext(id: string): Promise<QuestionWithContext | null>;
  /** A learner's own questions on one video, newest first, with answers. */
  listQuestionsForVideoByLearner(
    videoId: string,
    learnerId: string
  ): Promise<QuestionWithContext[]>;
  /** All of a learner's questions across videos, newest first. */
  listQuestionsByLearner(learnerId: string): Promise<QuestionWithContext[]>;
  /**
   * Helpdesk listing. Pass a status to filter (OPEN queries sorted
   * oldest-first so executives clear the backlog in order); omit for all
   * questions newest-first.
   */
  listQuestions(status?: QuestionStatus): Promise<QuestionWithContext[]>;
  setQuestionStatus(id: string, status: QuestionStatus): Promise<Question>;
  /** learner_id → number of questions asked (for usage/activity filters). */
  countQuestionsByLearner(): Promise<Record<string, number>>;

  // --- Thread messages (answers + learner follow-ups) ----------------------
  /**
   * Appends one message to a question's conversation. Status transitions are
   * the caller's responsibility (support reply → ANSWERED, learner follow-up
   * → back to OPEN).
   */
  createThreadMessage(input: {
    question_id: string;
    author_id: string;
    message_text: string;
    image_url: string | null;
    audio_url: string | null;
  }): Promise<ThreadMessage>;
  /** A question's conversation, oldest first, authors attached. */
  listThreadMessages(questionId: string): Promise<ThreadMessageWithAuthor[]>;

  // --- Live updates --------------------------------------------------------
  /**
   * Monotonically increasing counter bumped by every write. Clients poll it
   * (via /api/data-version) and re-render server data when it changes, so
   * new questions/replies appear without a manual refresh.
   */
  getDataVersion(): Promise<number>;

  // --- Media storage -------------------------------------------------------
  /** Persists an uploaded image / recorded audio blob; returns a servable URL. */
  saveMedia(
    bytes: Uint8Array,
    mime: string,
    kind: "image" | "audio"
  ): Promise<string>;
}
