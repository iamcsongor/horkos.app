-- =====================================================================
-- HORKOS · 002 · per-subject channel links
-- Applied to project uatztvwrsngpgobfjdey on 2026-05-19.
-- =====================================================================

-- Per-subject channel links (Facebook, YouTube, Telegram, press, lawsuits).
-- Stored as a flexible JSONB object so new channels can be added without DDL.
-- Keys used by the frontend: facebook, youtube, telegram, press, lawsuits.
alter table public.subjects
  add column if not exists socials jsonb not null default '{}'::jsonb;
