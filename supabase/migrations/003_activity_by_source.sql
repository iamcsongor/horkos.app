-- 003 · activity heatmap, broken down by source
--
-- The existing view `subject_activity_daily` collapses across sources and
-- powers the home-page hero heatmap. This new view feeds the interactive,
-- per-subject Heatmap on the FEED tab: one row per (subject, day, source)
-- so the UI can render dominant-source coloring and a hover popover with
-- the full breakdown.
--
-- We keep the old view untouched for backward compatibility.

create or replace view public.subject_activity_daily_by_source as
  select
    subject_id,
    source_code,
    (captured_at at time zone 'UTC')::date as day,
    count(*) as posts
  from public.statements
  where captured_at >= now() - interval '365 days'
  group by subject_id, source_code, (captured_at at time zone 'UTC')::date;

-- Match the existing view's exposure (RLS on the underlying table is what
-- governs row visibility; the view itself just needs to be readable).
grant select on public.subject_activity_daily_by_source to anon, authenticated;
