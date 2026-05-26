-- =====================================================================
-- HORKOS · v1 initial schema
-- Run once in Supabase → SQL Editor. Idempotent: safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0 · Extensions
-- ---------------------------------------------------------------------
create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists pg_trgm;    -- fuzzy search on summary

-- ---------------------------------------------------------------------
-- 1 · sources (seed-only lookup; sidebar is hardcoded for v1)
-- ---------------------------------------------------------------------
create table if not exists public.sources (
  code      text primary key,
  label     text not null,
  is_active boolean not null default false
);

insert into public.sources (code, label, is_active) values
  ('FB', 'FACEBOOK',    true),
  ('X',  'X / TWITTER', false),
  ('YT', 'YOUTUBE',     false),
  ('TG', 'TELEGRAM',    false),
  ('PR', 'PRESS',       false),
  ('LX', 'LAWSUITS',    false)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------
-- 2 · subjects
-- ---------------------------------------------------------------------
create table if not exists public.subjects (
  id                uuid primary key default gen_random_uuid(),
  code              text unique not null,                 -- "PM-001"
  name              text not null,                        -- "Péter Magyar"
  codename          text,                                 -- "PETER_M"
  role              text,
  district          text,
  country           text default 'HU',
  born              date,
  followers         integer,
  indexed_since     date,
  last_sync_at      timestamptz default now(),
  watchlist_rank    integer,
  archive_integrity numeric(5,4) default 1.0,
  portrait_path     text,                                 -- storage key or external URL
  portrait_is_url   boolean default false,
  total_lawsuits    integer default 0,                    -- hardcoded counter (v1)
  created_by        uuid references auth.users,           -- scaffolding; nullable
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists subjects_rank_idx
  on public.subjects (watchlist_rank asc nulls last);

-- ---------------------------------------------------------------------
-- 3 · statements (the "posts")
-- ---------------------------------------------------------------------
create table if not exists public.statements (
  id            uuid primary key default gen_random_uuid(),
  code          text unique,                              -- "P-2026-05-17-0001"
  subject_id    uuid not null references public.subjects(id) on delete restrict,
  source_code   text not null references public.sources(code),
  captured_at   timestamptz not null default now(),
  media_kind    text not null default 'text'
                check (media_kind in ('text','image','video')),
  summary       text,
  preview       text,
  full_text     text,
  source_url    text,
  participants  integer default 0,
  topics        text[] default '{}',
  reactions     jsonb default '{"likes":0,"comments":0,"shares":0}'::jsonb,
  sha256        text,
  created_by    uuid references auth.users,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists statements_subject_captured_idx
  on public.statements (subject_id, captured_at desc);

create index if not exists statements_topics_idx
  on public.statements using gin (topics);

create index if not exists statements_fts_idx
  on public.statements using gin (
    to_tsvector('simple',
      coalesce(summary,'') || ' ' ||
      coalesce(preview,'') || ' ' ||
      coalesce(full_text,'')
    )
  );

-- Auto-generate a human-readable `code` if not supplied.
-- Format: P-YYYY-MM-DD-NNNN where NNNN is the 1-based counter for that day.
create or replace function public.statements_set_code()
returns trigger language plpgsql as $$
declare
  d date := (new.captured_at at time zone 'UTC')::date;
  n int;
begin
  if new.code is null or new.code = '' then
    select count(*) + 1 into n
      from public.statements
      where (captured_at at time zone 'UTC')::date = d;
    new.code := 'P-' || to_char(d, 'YYYY-MM-DD') || '-' ||
                lpad(n::text, 4, '0');
  end if;
  return new;
end $$;

drop trigger if exists statements_set_code on public.statements;
create trigger statements_set_code
  before insert on public.statements
  for each row execute function public.statements_set_code();

-- Touch updated_at on any UPDATE.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists statements_touch on public.statements;
create trigger statements_touch
  before update on public.statements
  for each row execute function public.touch_updated_at();

drop trigger if exists subjects_touch on public.subjects;
create trigger subjects_touch
  before update on public.subjects
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 4 · statement_media
-- ---------------------------------------------------------------------
create table if not exists public.statement_media (
  id            uuid primary key default gen_random_uuid(),
  statement_id  uuid not null references public.statements(id) on delete cascade,
  kind          text not null check (kind in ('image','video')),
  storage_path  text not null,            -- key in `media` bucket
  mime          text,
  width         integer,
  height        integer,
  duration_sec  integer,
  position      integer default 0,
  created_at    timestamptz default now()
);

create index if not exists statement_media_statement_idx
  on public.statement_media (statement_id, position);

-- ---------------------------------------------------------------------
-- 5 · app_settings (scaffolding for future server-side toggles)
-- ---------------------------------------------------------------------
create table if not exists public.app_settings (
  key    text primary key,
  value  jsonb not null,
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- 6 · subject_totals view (drives the dossier big-number tiles)
-- ---------------------------------------------------------------------
create or replace view public.subject_totals as
  select
    s.id as subject_id,
    coalesce(t.total_posts, 0)  as total_posts,
    coalesce(t.total_videos, 0) as total_videos,
    coalesce(t.total_images, 0) as total_images
  from public.subjects s
  left join (
    select
      subject_id,
      count(*)                                  as total_posts,
      count(*) filter (where media_kind='video') as total_videos,
      count(*) filter (where media_kind='image') as total_images
    from public.statements
    group by subject_id
  ) t on t.subject_id = s.id;

-- 30D vs prev 30D delta — feeds the "30D POSTS · ↑ 12% vs prev" tile.
create or replace view public.subject_30d_delta as
  select
    s.id as subject_id,
    coalesce(c30.n,  0) as posts_30d,
    coalesce(c60.n,  0) as posts_prev_30d,
    case
      when coalesce(c60.n, 0) = 0 then null
      else round(((c30.n - c60.n)::numeric / c60.n) * 100, 1)
    end as delta_pct
  from public.subjects s
  left join (
    select subject_id, count(*) as n
      from public.statements
      where captured_at >= now() - interval '30 days'
      group by subject_id
  ) c30 on c30.subject_id = s.id
  left join (
    select subject_id, count(*) as n
      from public.statements
      where captured_at >= now() - interval '60 days'
        and captured_at <  now() - interval '30 days'
      group by subject_id
  ) c60 on c60.subject_id = s.id;

-- Activity heatmap data (last 365 days, one row per active day).
create or replace view public.subject_activity_daily as
  select
    subject_id,
    (captured_at at time zone 'UTC')::date as day,
    count(*) as posts
  from public.statements
  where captured_at >= now() - interval '365 days'
  group by subject_id, (captured_at at time zone 'UTC')::date;

-- ---------------------------------------------------------------------
-- 7 · RLS — public read, permissive write (v1; TODO(auth) to tighten)
-- ---------------------------------------------------------------------
alter table public.subjects        enable row level security;
alter table public.statements      enable row level security;
alter table public.statement_media enable row level security;
alter table public.sources         enable row level security;
alter table public.app_settings    enable row level security;

-- read everything (anon + authenticated)
drop policy if exists "read subjects"        on public.subjects;
create policy "read subjects" on public.subjects        for select using (true);

drop policy if exists "read statements"      on public.statements;
create policy "read statements" on public.statements    for select using (true);

drop policy if exists "read statement_media" on public.statement_media;
create policy "read statement_media" on public.statement_media for select using (true);

drop policy if exists "read sources"         on public.sources;
create policy "read sources" on public.sources          for select using (true);

drop policy if exists "read app_settings"    on public.app_settings;
create policy "read app_settings" on public.app_settings for select using (true);

-- v1: permissive writes for `anon` (UI gates this; will tighten when auth is added)
drop policy if exists "write subjects"        on public.subjects;
create policy "write subjects" on public.subjects        for all using (true) with check (true);

drop policy if exists "write statements"      on public.statements;
create policy "write statements" on public.statements    for all using (true) with check (true);

drop policy if exists "write statement_media" on public.statement_media;
create policy "write statement_media" on public.statement_media for all using (true) with check (true);

drop policy if exists "write app_settings"    on public.app_settings;
create policy "write app_settings" on public.app_settings for all using (true) with check (true);

-- TODO(auth): replace the `using (true)` write policies above with
--   `using (auth.uid() is not null)` once Supabase auth is wired into the UI,
-- and then with `using (auth.uid() = created_by)` once we have multiple editors.

-- ---------------------------------------------------------------------
-- 8 · Storage buckets (portraits, media)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('portraits', 'portraits', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('media', 'media', true)
  on conflict (id) do nothing;

-- Public-read storage policies. Permissive write for v1 (same TODO as above).
drop policy if exists "portraits public read"  on storage.objects;
create policy "portraits public read" on storage.objects
  for select using (bucket_id = 'portraits');

drop policy if exists "portraits write"        on storage.objects;
create policy "portraits write" on storage.objects
  for all using (bucket_id = 'portraits') with check (bucket_id = 'portraits');

drop policy if exists "media public read"      on storage.objects;
create policy "media public read" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "media write"            on storage.objects;
create policy "media write" on storage.objects
  for all using (bucket_id = 'media') with check (bucket_id = 'media');

-- ---------------------------------------------------------------------
-- 9 · Seed subjects (Péter Magyar, Maja, Viktor Orbán)
-- ---------------------------------------------------------------------
insert into public.subjects
  (code, name, codename, role, district, country, born, followers,
   indexed_since, watchlist_rank, archive_integrity, total_lawsuits)
values
  ('PM-001', 'Péter Magyar',   'PETER_M',  'Opposition leader',  'Budapest',  'HU',
   '1981-01-01', null, current_date, 1, 1.0, 0),
  ('MJ-002', 'Maja',           'MAJA',     'TBD',                 null,        'HU',
   null,         null, current_date, 2, 1.0, 0),
  ('VO-003', 'Viktor Orbán',   'ORBAN_V',  'Prime Minister',     'Fejér',     'HU',
   '1963-05-31', null, current_date, 3, 1.0, 0)
on conflict (code) do nothing;

-- =====================================================================
-- Done.
-- =====================================================================
