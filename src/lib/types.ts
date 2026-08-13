// Shared domain types for the Brototype Learning Portal.
// These mirror the database schema in supabase/schema.sql.

export type Role = "learner" | "admin" | "support" | "sales";

export interface User {
  id: string;
  name: string;
  phone_number: string;
  role: Role;
  created_at: string; // ISO timestamp
}

export interface SystemSettings {
  id: string;
  /** Percentage (0–100) discount applied to every purchase after the first. */
  addon_discount_percentage: number;
}

export interface TutorialSeries {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  /** Price in INR (whole rupees) for the Exclusive Membership of this series. */
  base_price: number;
}

export interface Video {
  id: string;
  series_id: string;
  youtube_id: string;
  title: string;
  order_index: number;
}

export interface Purchase {
  id: string;
  learner_id: string;
  series_id: string;
  amount_paid: number;
  purchased_at: string; // ISO timestamp
}

export type QuestionStatus = "OPEN" | "ANSWERED" | "CLOSED_BY_USER";

export interface Question {
  id: string;
  video_id: string;
  learner_id: string;
  question_text: string;
  image_url: string | null;
  audio_url: string | null;
  status: QuestionStatus;
  created_at: string; // ISO timestamp
}

/**
 * One message in a question's conversation thread. Authored either by a
 * support executive/admin (an answer) or by the learner (a follow-up).
 * `author_id` is null when the authoring staff account was later deleted.
 */
export interface ThreadMessage {
  id: string;
  question_id: string;
  author_id: string | null;
  message_text: string;
  image_url: string | null;
  audio_url: string | null;
  created_at: string; // ISO timestamp
}

// ---------------------------------------------------------------------------
// Composed/enriched shapes used by UI pages
// ---------------------------------------------------------------------------

export interface ThreadMessageWithAuthor extends ThreadMessage {
  author: User | null;
}

export interface QuestionWithContext extends Question {
  learner: User | null;
  video: Video | null;
  series: TutorialSeries | null;
  /** Full conversation, oldest first (answers + learner follow-ups). */
  messages: ThreadMessageWithAuthor[];
}

/** Result of the dynamic-pricing computation for a learner + series. */
export interface PriceQuote {
  series_id: string;
  base_price: number;
  /** Discount percentage actually applied (0 when no discount). */
  discount_percentage: number;
  /** Final payable amount in INR after discount. */
  final_price: number;
  /** True when the returning-learner add-on discount was applied. */
  discount_applied: boolean;
  /** True when the learner already owns this series. */
  already_purchased: boolean;
}
