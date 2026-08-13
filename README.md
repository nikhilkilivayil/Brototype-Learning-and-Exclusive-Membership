# Brototype Learning Portal — Exclusive Membership

A freemium learning platform for the Brototype Malayalam channel, built with
**Next.js 15 (App Router) + TypeScript + Google Material UI (MUI v7, Material 3
theme)**, **Supabase** (Postgres + phone-OTP auth + storage) and **Razorpay**.

- 📺 **Free structured tutorials** — YouTube-embedded series, open to everyone.
- ⚡ **Exclusive Membership (per series)** — unlocks a 1-on-1 multimedia Q&A
  support system: text, image uploads, and **in-browser audio recording**
  (Web MediaRecorder API).
- 💬 **Conversation threads** — if an answer doesn't resolve the doubt, the
  learner sends follow-ups on the same question; each follow-up reopens the
  query in the support backlog.
- 💸 **Dynamic pricing** — a configurable add-on discount is applied
  automatically to every purchase after a learner's first series.
- 🎯 A persistent, high-visibility **"Unlock Exclusive Support"** CTA lives in
  the global app bar on every page.
- 👥 **Managed staff accounts** — support & sales users are created by the
  admin (separate management pages); only learners can self-register. Sales
  sees learner data only — never other staff or admin accounts.
- 📊 **Filterable sales exports** — registration-date, purchase-date,
  paying/free, per-series and doubt-activity filters on the learner list,
  applied to both the table and the CSV download.
- 🔄 **Live everywhere, no manual refresh** — every write bumps a global
  data version; an SSE stream (`/api/live`) pushes it to all open pages,
  which re-render in place (typed text / open dialogs / recordings are
  preserved). Falls back to lightweight polling automatically where
  long-lived connections aren't possible.
- 📱 **Fully responsive + installable PWA** — phone/tablet/laptop layouts
  throughout (mobile drawer nav, 2-up stat cards, horizontally scrollable
  tables, full-screen dialogs on phones). Ships a web app manifest, icons,
  and a conservative service worker with an offline fallback: install as a
  desktop app from Chrome/Edge (⊕ *Install* in the address bar) or on
  phones via *Add to Home Screen*. The SW never intercepts `/api/*`, so
  live updates and payments always hit the network.

## Quick start (demo mode — zero setup)

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no Supabase env vars configured the app runs
in **demo mode**: an in-memory store seeded with series, videos, users,
purchases and Q&A threads. Payments are simulated (no money moves) and
Sign in shows a profile picker for each role:

| Role | Demo profile | What to try |
| --- | --- | --- |
| Learner | Anjali Menon | Owns *Python* series → ask doubts (text/image/voice) on its videos, gets the returning-member discount elsewhere |
| Learner | Rahul Krishnan | No purchases → sees the membership CTA + full-price checkout |
| Admin | Nikhil | `/admin` — series & video CRUD, discount settings, user management (`/admin/users`) |
| Support | Sneha | `/support` — answer OPEN queries with text/image/voice |
| Sales | Arun | `/sales` — learner dashboard with filters + CSV export |

## Install as a desktop / mobile app (PWA)

```bash
npm run app
```

This builds and serves the production app at the **stable** address
http://localhost:3100 — always install from here, never from the dev
server (`npm run dev` uses a random port, and an installed app is pinned
to the exact address it was installed from).

- **Mac/Windows:** open http://localhost:3100 in Chrome or Edge → click the
  ⊕ **Install** icon in the address bar. The app gets its own window, Dock
  icon, and appears in Spotlight/Launchpad.
- **Android:** Chrome → ⋮ → *Add to Home screen*. **iPhone/iPad:** Safari →
  Share → *Add to Home Screen*.
- The installed icon works whenever the server is running (`npm start`).
  If you installed earlier from a random-port address and the icon shows an
  error, uninstall that copy (in the app window: ⋮ → Uninstall) and
  reinstall from http://localhost:3100.
- For your real users, deploy to a public **HTTPS** domain and have them
  install from there — then the app works for everyone, always, with no
  local server.

## Production setup

1. **Supabase** — create a project, then run [`supabase/schema.sql`](supabase/schema.sql)
   in the SQL editor (creates tables, the `qa-media` storage bucket, RLS).
   Optionally run [`supabase/seed.sql`](supabase/seed.sql) for sample content.
   Enable **Phone auth** (Twilio/MessageBird) in Authentication → Providers.
2. **Razorpay** — create API keys (test or live).
3. Copy `.env.example` → `.env.local` and fill in:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`,
   `RAZORPAY_KEY_SECRET`, and remove/set `NEXT_PUBLIC_DEMO_MODE=false`.
4. `npm run build && npm start`.

Staff accounts: the admin creates support/sales users (name + phone) at
`/admin/users`; when that person first signs in with phone OTP, the
pre-created profile is claimed automatically and keeps its role. Only the
initial admin needs SQL:
`update public.users set role = 'admin' where phone_number = '+91…';`

## Architecture

```
src/
  app/                    # App Router pages
    page.tsx              # Catalog + hero
    series/[seriesId]/    # Series detail
    watch/[videoId]/      # Two-column watch page (player + Q&A | suggestions)
    my-learning/          # Learner dashboard
    login/                # Phone OTP (prod) / profile picker (demo)
    pricing/              # Membership marketing + checkout
    admin/                # Series & video CRUD, discount settings
    admin/users/          # Staff (support/sales) management + learner directory
    support/              # Helpdesk queue + threaded multimedia replies
    sales/                # Filterable learner dashboard + CSV export + detail
    api/razorpay/         # Order creation + signature verification
    api/media/[id]/       # Serves demo-mode uploads
  components/
    shell/                # AppBar, persistent Unlock Exclusive Support CTA
    media/                # AudioRecorder, MultimediaMessageForm, attachments
    qa/                   # Q&A threads, locked-state conversion card
    checkout/             # CheckoutButton (Razorpay / demo dialog)
    learner/              # Series cards, suggestions sidebar, player
  lib/
    db/                   # Db interface + mock (demo) + Supabase impls
    auth.ts               # Session helpers + role guards
    pricing.ts            # Dynamic discount quote logic
    media.ts              # Upload validation + storage
  middleware.ts           # Role-based route guarding
  theme.ts                # Material 3 theme (light + dark)
supabase/                 # schema.sql + seed.sql
```

**Query lifecycle:** learner asks (`OPEN`) → support executive replies
(`ANSWERED`) → either the learner clicks *Mark as resolved*
(`CLOSED_BY_USER`, terminal) or sends a **follow-up**, which puts the
question back to `OPEN` and returns it to the backlog (flagged "Follow-up").
The OPEN backlog is served oldest-first. All replies and follow-ups live in
one `question_messages` conversation per question.

**Dynamic pricing:** `getPriceQuote()` charges `base_price` on a learner's
first-ever purchase and applies `system_settings.addon_discount_percentage`
to every later series, recomputed server-side at checkout and verified again
in the Razorpay signature callback.
