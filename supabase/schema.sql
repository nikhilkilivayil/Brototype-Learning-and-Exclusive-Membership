-- ===========================================================================
-- Brototype Learning Portal — Supabase schema
-- Run in the Supabase SQL editor (or `supabase db push`) before first deploy.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- --- Users -----------------------------------------------------------------
-- id matches auth.users.id when the row is created via phone-OTP sign-in.
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone_number text not null,
  -- Spacing-insensitive lookup key: admin-entered "+91 98470 12345" and the
  -- OTP-derived "+919847012345" must resolve to the same profile.
  phone_normalized text generated always as (
    regexp_replace(phone_number, '[^0-9+]', '', 'g')
  ) stored,
  role text not null default 'learner'
    check (role in ('learner', 'admin', 'support', 'sales')),
  created_at timestamptz not null default now()
);

create index if not exists users_phone_idx on public.users (phone_number);
create index if not exists users_phone_normalized_idx
  on public.users (phone_normalized);

-- --- System settings (single row) ------------------------------------------
create table if not exists public.system_settings (
  id uuid primary key,
  addon_discount_percentage numeric not null default 20
    check (addon_discount_percentage >= 0 and addon_discount_percentage <= 100)
);

insert into public.system_settings (id, addon_discount_percentage)
values ('00000000-0000-0000-0000-000000000001', 20)
on conflict (id) do nothing;

-- --- Tutorial series -------------------------------------------------------
create table if not exists public.tutorial_series (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  thumbnail_url text not null default '',
  base_price numeric not null check (base_price >= 0)
);

-- --- Videos ----------------------------------------------------------------
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.tutorial_series (id) on delete cascade,
  youtube_id text not null,
  title text not null,
  order_index integer not null default 1
);

create index if not exists videos_series_idx on public.videos (series_id, order_index);

-- --- Purchases (Exclusive Membership per series) ---------------------------
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  -- ON UPDATE CASCADE: a staff/learner profile pre-created by the admin is
  -- re-keyed to the Supabase auth user id on first OTP sign-in.
  learner_id uuid not null references public.users (id)
    on delete cascade on update cascade,
  series_id uuid not null references public.tutorial_series (id) on delete cascade,
  amount_paid numeric not null check (amount_paid >= 0),
  purchased_at timestamptz not null default now()
);

create index if not exists purchases_learner_idx on public.purchases (learner_id);
create unique index if not exists purchases_learner_series_uniq
  on public.purchases (learner_id, series_id);

-- --- Questions -------------------------------------------------------------
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos (id) on delete cascade,
  learner_id uuid not null references public.users (id)
    on delete cascade on update cascade,
  question_text text not null default '',
  image_url text,
  audio_url text,
  status text not null default 'OPEN'
    check (status in ('OPEN', 'ANSWERED', 'CLOSED_BY_USER')),
  created_at timestamptz not null default now()
);

create index if not exists questions_status_idx on public.questions (status, created_at);
create index if not exists questions_video_learner_idx
  on public.questions (video_id, learner_id);

-- --- Thread messages (support answers + learner follow-ups) ----------------
create table if not exists public.question_messages (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  -- Null when the authoring staff account was later deleted; the message
  -- itself survives in the learner's thread.
  author_id uuid references public.users (id)
    on delete set null on update cascade,
  message_text text not null default '',
  image_url text,
  audio_url text,
  created_at timestamptz not null default now()
);

create index if not exists question_messages_question_idx
  on public.question_messages (question_id, created_at);

-- --- Live updates: data version bumped by triggers on every write ----------
-- Clients poll /api/data-version and re-render when the number changes, so
-- new questions/replies appear everywhere without a manual refresh.
create table if not exists public.data_version (
  id integer primary key check (id = 1),
  version bigint not null default 1
);

insert into public.data_version (id, version) values (1, 1)
on conflict (id) do nothing;

create or replace function public.bump_data_version()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.data_version set version = version + 1 where id = 1;
  return null;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'users', 'system_settings', 'tutorial_series', 'videos',
    'purchases', 'questions', 'question_messages'
  ]
  loop
    execute format('drop trigger if exists %I on public.%I', 'bump_version_' || t, t);
    execute format(
      'create trigger %I after insert or update or delete on public.%I
         for each statement execute function public.bump_data_version()',
      'bump_version_' || t, t
    );
  end loop;
end;
$$;

-- --- Storage bucket for Q&A media ------------------------------------------
insert into storage.buckets (id, name, public)
values ('qa-media', 'qa-media', true)
on conflict (id) do nothing;

-- --- Row Level Security ----------------------------------------------------
-- The app's data layer runs server-side with the service-role key (which
-- bypasses RLS). Enabling RLS with no public policies locks the tables away
-- from anon/browser access entirely.
alter table public.users enable row level security;
alter table public.system_settings enable row level security;
alter table public.tutorial_series enable row level security;
alter table public.videos enable row level security;
alter table public.purchases enable row level security;
alter table public.questions enable row level security;
alter table public.question_messages enable row level security;
alter table public.data_version enable row level security;
