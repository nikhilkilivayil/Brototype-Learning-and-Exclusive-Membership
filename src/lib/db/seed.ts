import type {
  Purchase,
  Question,
  SystemSettings,
  ThreadMessage,
  TutorialSeries,
  User,
  Video,
} from "@/lib/types";

/**
 * Deterministic demo data used by the in-memory store (demo mode) so the app
 * is fully explorable without a Supabase project. Mirrors supabase/seed.sql.
 */

export const seedUsers: User[] = [
  {
    id: "u_learner_anjali",
    name: "Anjali Menon",
    phone_number: "+91 98470 12345",
    role: "learner",
    created_at: "2026-06-02T09:15:00.000Z",
  },
  {
    id: "u_learner_rahul",
    name: "Rahul Krishnan",
    phone_number: "+91 98460 54321",
    role: "learner",
    created_at: "2026-07-18T14:40:00.000Z",
  },
  {
    id: "u_admin_nikhil",
    name: "Nikhil (Admin)",
    phone_number: "+91 90000 00001",
    role: "admin",
    created_at: "2026-01-05T08:00:00.000Z",
  },
  {
    id: "u_support_sneha",
    name: "Sneha (Support Executive)",
    phone_number: "+91 90000 00002",
    role: "support",
    created_at: "2026-01-05T08:05:00.000Z",
  },
  {
    id: "u_sales_arun",
    name: "Arun (Sales)",
    phone_number: "+91 90000 00003",
    role: "sales",
    created_at: "2026-01-05T08:10:00.000Z",
  },
];

export const seedSettings: SystemSettings = {
  id: "settings",
  addon_discount_percentage: 20,
};

export const seedSeries: TutorialSeries[] = [
  {
    id: "s_python",
    title: "Python Programming — Malayalam",
    description:
      "Zero-to-hero Python in Malayalam: syntax, data types, loops, functions, OOP and real mini projects. The perfect first language for absolute beginners.",
    thumbnail_url: "https://i.ytimg.com/vi/rfscVS0vtbw/hqdefault.jpg",
    base_price: 999,
  },
  {
    id: "s_js",
    title: "JavaScript Mastery — Malayalam",
    description:
      "Modern JavaScript from the ground up — variables to closures, DOM, async/await and ES2023 features — explained the Brototype way.",
    thumbnail_url: "https://i.ytimg.com/vi/PkZNo7MFNFg/hqdefault.jpg",
    base_price: 1299,
  },
  {
    id: "s_c",
    title: "C Programming & Problem Solving",
    description:
      "Build a rock-solid programming foundation with C: pointers, memory, arrays and classic problem-solving patterns asked in interviews.",
    thumbnail_url: "https://i.ytimg.com/vi/KJgsSFOSQv0/hqdefault.jpg",
    base_price: 799,
  },
  {
    id: "s_react",
    title: "React & Next.js Bootcamp",
    description:
      "Component thinking, hooks, state management and full-stack apps with Next.js — everything you need to build production UIs.",
    thumbnail_url: "https://i.ytimg.com/vi/bMknfKXIFA8/hqdefault.jpg",
    base_price: 1499,
  },
  {
    id: "s_dsa",
    title: "Data Structures & Algorithms",
    description:
      "Crack product-company interviews: arrays, linked lists, trees, graphs and dynamic programming with Malayalam explanations.",
    thumbnail_url: "https://i.ytimg.com/vi/8hly31xKli0/hqdefault.jpg",
    base_price: 1799,
  },
];

export const seedVideos: Video[] = [
  // Python
  { id: "v_py_1", series_id: "s_python", youtube_id: "rfscVS0vtbw", title: "Python Full Course for Beginners", order_index: 1 },
  { id: "v_py_2", series_id: "s_python", youtube_id: "HGOBQPFzWKo", title: "Intermediate Python: OOP & Modules", order_index: 2 },
  { id: "v_py_3", series_id: "s_python", youtube_id: "8DvywoWv6fI", title: "Python Projects: Build Real Apps", order_index: 3 },
  // JavaScript
  { id: "v_js_1", series_id: "s_js", youtube_id: "PkZNo7MFNFg", title: "JavaScript Fundamentals", order_index: 1 },
  { id: "v_js_2", series_id: "s_js", youtube_id: "W6NZfCO5SIk", title: "Functions, Scope & Closures", order_index: 2 },
  { id: "v_js_3", series_id: "s_js", youtube_id: "jS4aFq5-91M", title: "Async JavaScript: Promises & await", order_index: 3 },
  // C
  { id: "v_c_1", series_id: "s_c", youtube_id: "KJgsSFOSQv0", title: "C Programming Full Course", order_index: 1 },
  { id: "v_c_2", series_id: "s_c", youtube_id: "87SH2Cn0s9A", title: "Pointers & Memory Deep Dive", order_index: 2 },
  // React
  { id: "v_react_1", series_id: "s_react", youtube_id: "bMknfKXIFA8", title: "React Full Course", order_index: 1 },
  { id: "v_react_2", series_id: "s_react", youtube_id: "w7ejDZ8SWv8", title: "Hooks & State Management", order_index: 2 },
  { id: "v_react_3", series_id: "s_react", youtube_id: "Oe421EPjeBE", title: "Full-Stack with Node & Next.js", order_index: 3 },
  // DSA
  { id: "v_dsa_1", series_id: "s_dsa", youtube_id: "8hly31xKli0", title: "Data Structures Full Course", order_index: 1 },
  { id: "v_dsa_2", series_id: "s_dsa", youtube_id: "B31LgI4Y4DQ", title: "Algorithms & Problem Patterns", order_index: 2 },
];

export const seedPurchases: Purchase[] = [
  {
    id: "p_1",
    learner_id: "u_learner_anjali",
    series_id: "s_python",
    amount_paid: 999,
    purchased_at: "2026-07-10T10:30:00.000Z",
  },
];

export const seedQuestions: Question[] = [
  {
    id: "q_1",
    video_id: "v_py_1",
    learner_id: "u_learner_anjali",
    question_text:
      "At 1:12:30 my for loop prints one extra blank line compared to the video. I typed the same code — why does this happen?",
    image_url: null,
    audio_url: null,
    status: "ANSWERED",
    created_at: "2026-08-01T16:20:00.000Z",
  },
  {
    id: "q_2",
    video_id: "v_py_2",
    learner_id: "u_learner_anjali",
    question_text:
      "When should I use a dictionary instead of a list of tuples? In the OOP section both seem to work for storing student records.",
    image_url: null,
    audio_url: null,
    status: "OPEN",
    created_at: "2026-08-12T09:05:00.000Z",
  },
];

export const seedMessages: ThreadMessage[] = [
  {
    id: "m_1",
    question_id: "q_1",
    author_id: "u_support_sneha",
    message_text:
      "Great catch! Your print() inside the loop has an extra \\n because you used print(line) on a string that already ends with a newline. Use print(line, end='') or strip the string first — line.rstrip(). Try it and reply here if it still misbehaves. 👍",
    image_url: null,
    audio_url: null,
    created_at: "2026-08-01T18:45:00.000Z",
  },
];
