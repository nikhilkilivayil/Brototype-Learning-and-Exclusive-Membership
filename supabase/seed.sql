-- ===========================================================================
-- Optional demo seed for a fresh Supabase project (mirrors src/lib/db/seed.ts)
-- Staff accounts must exist in auth.users to sign in via OTP; after their
-- first sign-in, update their role here, e.g.:
--   update public.users set role = 'admin' where phone_number = '+919000000001';
-- ===========================================================================

with s_python as (
  insert into public.tutorial_series (title, description, thumbnail_url, base_price)
  values (
    'Python Programming — Malayalam',
    'Zero-to-hero Python in Malayalam: syntax, data types, loops, functions, OOP and real mini projects.',
    'https://i.ytimg.com/vi/rfscVS0vtbw/hqdefault.jpg',
    999
  ) returning id
), s_js as (
  insert into public.tutorial_series (title, description, thumbnail_url, base_price)
  values (
    'JavaScript Mastery — Malayalam',
    'Modern JavaScript from the ground up — variables to closures, DOM, async/await.',
    'https://i.ytimg.com/vi/PkZNo7MFNFg/hqdefault.jpg',
    1299
  ) returning id
), s_c as (
  insert into public.tutorial_series (title, description, thumbnail_url, base_price)
  values (
    'C Programming & Problem Solving',
    'Build a rock-solid programming foundation with C: pointers, memory, arrays.',
    'https://i.ytimg.com/vi/KJgsSFOSQv0/hqdefault.jpg',
    799
  ) returning id
)
insert into public.videos (series_id, youtube_id, title, order_index)
select id, 'rfscVS0vtbw', 'Python Full Course for Beginners', 1 from s_python
union all
select id, 'HGOBQPFzWKo', 'Intermediate Python: OOP & Modules', 2 from s_python
union all
select id, 'PkZNo7MFNFg', 'JavaScript Fundamentals', 1 from s_js
union all
select id, 'W6NZfCO5SIk', 'Functions, Scope & Closures', 2 from s_js
union all
select id, 'KJgsSFOSQv0', 'C Programming Full Course', 1 from s_c;
