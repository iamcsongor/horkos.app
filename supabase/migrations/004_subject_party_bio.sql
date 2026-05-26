-- 004 · party + bio for subjects
--
-- The original schema modelled "role" and "district" but had nowhere
-- to capture the subject's political affiliation or a short
-- description. Both are needed once the watchlist grows past a few
-- seed rows: party drives potential filters/groupings, bio is the
-- one-line summary the dossier and the ticker show under the name.

alter table public.subjects
  add column if not exists party text,
  add column if not exists bio   text;

comment on column public.subjects.party is
  'Political party affiliation (e.g. TISZA, Fidesz, Mi Hazánk, Independent).';
comment on column public.subjects.bio is
  'One-line summary used in the dossier card and the ticker subject mini-card.';
