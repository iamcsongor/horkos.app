# HORKOS — Integration & Operations Guide

This document covers the current state of the Horkos backend and is the canonical reference for any automation that writes into the archive — including the planned Facebook ingestion pipeline. Read sections 1–4 to understand what exists; sections 5–9 are what you need to write a working ingestor.

---

## Table of contents

1. Project status
2. Repository layout
3. Supabase project — URLs, keys, dashboard
4. Database schema
5. Storage buckets
6. Row-Level Security & authentication for automation
7. Writing to Horkos
8. Facebook → Horkos field mapping
9. Idempotency, dedup, and recommended schema additions
10. Topic taxonomy
11. Time handling
12. Editorial principles your ingestor must respect
13. Verifying that the frontend sees what you wrote
14. Common gotchas
15. Worked example: insert a single FB post end-to-end

---

## 1. Project status

| Surface | State |
|---|---|
| Frontend repo | `iamcsongor/horkos.app` on GitHub |
| Active branch | `supabase-v1` (PR #1 against `main`) |
| Deployment | Vercel project `horkos-app` in team `iamcsongors-projects` |
| Preview URL (branch) | `https://horkos-app-git-supabase-v1-iamcsongors-projects.vercel.app/` |
| Production URL (after merge) | `https://horkos-app-iamcsongors-projects.vercel.app/` |
| Backend | Supabase project `uatztvwrsngpgobfjdey` (Postgres + Storage) |

The frontend is a static HTML + React (Babel-in-browser) site — no build step. Vercel serves the files as-is and rewrites `/` → `/Horkos.html` and `/mobile` → `/Horkos%20Mobile.html`.

The HOME tab and several right-rail panels (LIVE LOG, TOPIC DIST., POSTING RHYTHM, CONTRADICTION LOG) and stat tiles (engagement / discourse / media-ratio / sentiment) are still hardcoded. Everything in the FEED tab (subjects, posts, activity heatmap, post counters, 30D delta) is live and reads from Supabase.

Admin mode (create / edit / delete UI) is **on by default**. Add `?admin=0` to the URL once or run `horkosAdmin.off()` in DevTools to opt out; the choice persists in localStorage. The auth scaffolding (`created_by uuid references auth.users` on relevant tables) is in place for when we wire real authentication; for now there is no login.

---

## 2. Repository layout

```
Horkos.html               · desktop entry (rewritten from /)
Horkos Mobile.html        · iOS-frame design preview (served at /mobile)
styles.css                · single stylesheet, includes mobile media queries
components.jsx            · React components (topbar, sidebar, dossier, feed, modal…)
app.jsx                   · root App + admin gate + tab/hash routing
home.jsx                  · HomePage component
edit-modals.jsx           · SubjectEditModal + StatementEditModal
tweaks-panel.jsx          · in-page design tweaks
data.js                   · hardcoded UI data for non-live panels
supabase.js               · live data layer — exposes `window.db`
config.js                 · Supabase URL + publishable key (safe to commit)
mobile-app.jsx            · mobile preview app
ios-frame.jsx             · iOS device frame component
mobile-styles.css         · stylesheet for the mobile preview only
vercel.json               · Vercel rewrites
assets/                   · static images (mock-day.png, mock-night.png)
supabase/migrations/      · SQL migrations
  └ 001_init.sql          · v1 schema + seeds (already applied)
docs/INTEGRATION.md       · this file
```

---

## 3. Supabase project

### 3.1 Identifiers

| Field | Value |
|---|---|
| Project ref | `uatztvwrsngpgobfjdey` |
| API URL | `https://uatztvwrsngpgobfjdey.supabase.co` |
| REST endpoint | `https://uatztvwrsngpgobfjdey.supabase.co/rest/v1/` |
| Storage endpoint | `https://uatztvwrsngpgobfjdey.supabase.co/storage/v1/` |
| Postgres host | `db.uatztvwrsngpgobfjdey.supabase.co:5432` |

### 3.2 Keys

| Key | Where to use | Where to find |
|---|---|---|
| Publishable (anon) | Browser, read-only operations. Already committed in `config.js`. Safe to publish. | `sb_publishable_l6UKvvwmIRmS9vSRK9bs4g_lDQPjZFG` |
| **Service role** | **Server-side automation only.** Bypasses RLS. Never commit. Never put in client code. | Supabase Dashboard → Project Settings → API → `service_role` key |
| Postgres password | Direct DB connections (psql, migration tools). | Set when you created the project. Reset under Project Settings → Database. |

The Facebook ingestor will use the **service role key**. It can read and write any table and any storage bucket — the publishable key cannot insert media uploads or write to `statement_media` while RLS evolves toward stricter policies.

### 3.3 Dashboard access

Project dashboard: `https://supabase.com/dashboard/project/uatztvwrsngpgobfjdey`

Useful tabs:
- **SQL Editor** — paste-and-run any SQL, including future migrations.
- **Table Editor** — UI inspection of rows.
- **Storage** — `portraits` and `media` buckets.
- **Authentication** — currently no users; auth will be added later.
- **Project Settings → API** — fetch the service role key.
- **Project Settings → Database** — pooled connection string for tools like `psql`.

---

## 4. Database schema

All tables live in the `public` schema. The full schema is defined in `supabase/migrations/001_init.sql`; this section is the human-readable reference.

### 4.1 `subjects`

The watchlist. Three rows are seeded: Péter Magyar (`PM-001`), Maja (`MJ-002`), Viktor Orbán (`VO-003`).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK, `default gen_random_uuid()` | Internal foreign key target. |
| `code` | `text` UNIQUE | Human ID, e.g. `PM-001`. Required. |
| `name` | `text` NOT NULL | "Péter Magyar". |
| `codename` | `text` | Display codename in the dossier header. |
| `role` | `text` | "Opposition leader". |
| `district` | `text` | "Budapest". |
| `country` | `text` `default 'HU'` | ISO-3166 alpha-2. |
| `born` | `date` | |
| `followers` | `integer` | Latest known follower count (manual for v1). |
| `indexed_since` | `date` | First-ever capture date. |
| `last_sync_at` | `timestamptz` `default now()` | Updated by ingestors. **Touch this on every successful capture.** |
| `watchlist_rank` | `integer` | Sidebar shows top 8 ASC. |
| `archive_integrity` | `numeric(5,4)` `default 1.0` | 0.0000–1.0000. Manual for v1. |
| `portrait_path` | `text` | Storage key in `portraits` bucket, OR external `https://` URL. |
| `portrait_is_url` | `boolean` `default false` | If true, `portrait_path` is treated as an external URL. |
| `total_lawsuits` | `integer` `default 0` | Manual counter. |
| `created_by` | `uuid` FK → `auth.users` | Nullable scaffolding for future auth. |
| `created_at` | `timestamptz` `default now()` | |
| `updated_at` | `timestamptz` `default now()` | Auto-touched on UPDATE by `subjects_touch` trigger. |

### 4.2 `statements`

The core record. Each row is one indexed public statement.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Internal. |
| `code` | `text` UNIQUE | **Auto-generated by the `statements_set_code` trigger if you don't supply one.** Format: `P-YYYY-MM-DD-NNNN` where NNNN is the 1-based counter for that day. |
| `subject_id` | `uuid` NOT NULL FK → `subjects.id` | `ON DELETE RESTRICT`. |
| `source_code` | `text` NOT NULL FK → `sources.code` | One of: `FB`, `X`, `YT`, `TG`, `PR`, `LX`. For the FB ingestor, always `FB`. |
| `captured_at` | `timestamptz` NOT NULL `default now()` | **When the ingestor fetched it.** The frontend displays this as the post date. |
| `media_kind` | `text` NOT NULL `default 'text'` | CHECK `in ('text','image','video')`. |
| `summary` | `text` | One-line analyst summary. Not required, but the feed row is sparse without it. |
| `preview` | `text` | ~10-line excerpt the feed expands to on click. |
| `full_text` | `text` | Verbatim full text of the post. **Write-once philosophy — never rewrite this.** |
| `source_url` | `text` | Canonical link back to the original. |
| `participants` | `integer` `default 0` | Distinct commenters. |
| `topics` | `text[]` `default '{}'` | UPPERCASE_WITH_UNDERSCORES tags. See section 10. |
| `reactions` | `jsonb` `default '{"likes":0,"comments":0,"shares":0}'` | Object with `likes`, `comments`, `shares`. |
| `sha256` | `text` | Hash of the canonical raw payload. Optional in v1, recommended for the FB ingestor. |
| `created_by` | `uuid` FK → `auth.users` | Nullable. |
| `created_at` | `timestamptz` `default now()` | |
| `updated_at` | `timestamptz` `default now()` | Auto-touched. |

**Indexes:**
- `(subject_id, captured_at DESC)` — primary feed query.
- GIN on `topics` — chip filter.
- GIN tsvector over `summary || preview || full_text` — search box.

**Triggers:**
- `statements_set_code` (BEFORE INSERT) — generates `code` if absent.
- `statements_touch` (BEFORE UPDATE) — refreshes `updated_at`.

### 4.3 `statement_media`

Attached files. Multiple per statement; ordered by `position`.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `statement_id` | `uuid` NOT NULL FK → `statements.id` | `ON DELETE CASCADE` — deleting a statement removes its media rows (but not the files in storage; see section 7.4). |
| `kind` | `text` NOT NULL | CHECK `in ('image','video')`. |
| `storage_path` | `text` NOT NULL | Key within the `media` bucket. |
| `mime` | `text` | e.g. `image/jpeg`. |
| `width` | `integer` | Pixels. |
| `height` | `integer` | Pixels. |
| `duration_sec` | `integer` | For videos. |
| `position` | `integer` `default 0` | Display order within a statement. |
| `created_at` | `timestamptz` `default now()` | |

Note: `bytes` is **not** in the v1 schema. If you need it, see the recommended migration in section 9.

### 4.4 `sources`

Static lookup. Edit only via migrations.

| Column | Type | Notes |
|---|---|---|
| `code` | `text` PK | `FB`, `X`, `YT`, `TG`, `PR`, `LX`. |
| `label` | `text` | Display name. |
| `is_active` | `boolean` | Only `FB` is true today. |

### 4.5 `app_settings`

Generic key-value store. Currently unused; reserved for future server-side toggles.

| Column | Type |
|---|---|
| `key` | `text` PK |
| `value` | `jsonb` |
| `updated_at` | `timestamptz` |

### 4.6 Views (read-only; what the frontend consumes)

| View | Returns | Used by |
|---|---|---|
| `subject_totals` | `subject_id`, `total_posts`, `total_videos`, `total_images` | Dossier big-number tiles. |
| `subject_30d_delta` | `subject_id`, `posts_30d`, `posts_prev_30d`, `delta_pct` | The "30D POSTS · ↑ 12% vs prev" tile. |
| `subject_activity_daily` | `subject_id`, `day` (date), `posts` (count) | Activity heatmap. |

Views are derived live from `statements`. Insert into `statements` and these views update automatically — no need for the ingestor to touch them.

---

## 5. Storage buckets

Two buckets, both public-readable.

| Bucket | Use | Naming convention |
|---|---|---|
| `portraits` | Subject portraits | `{subject_id}/portrait-{epoch_ms}.{ext}` |
| `media` | Statement attachments | `{statement_id}/{epoch_ms}-{kind}.{ext}` |

Storage REST endpoint:
```
POST  https://uatztvwrsngpgobfjdey.supabase.co/storage/v1/object/{bucket}/{path}
```

Public URL pattern:
```
https://uatztvwrsngpgobfjdey.supabase.co/storage/v1/object/public/{bucket}/{path}
```

The frontend constructs these via `supabase-js` `getPublicUrl()`; the ingestor can construct them the same way.

---

## 6. Row-Level Security & authentication for automation

### 6.1 Current posture

RLS is **enabled** on every public table. The policies are:

| Table | SELECT | INSERT / UPDATE / DELETE |
|---|---|---|
| `subjects` | public | permissive (`using (true)`) |
| `statements` | public | permissive |
| `statement_media` | public | permissive |
| `sources` | public | n/a (no write policy) |
| `app_settings` | public | permissive |

The migrations mark the permissive policies with `-- TODO(auth)` comments. Once we add auth, the policies tighten to `auth.uid() = created_by`.

### 6.2 Which key to use

| Caller | Key | Why |
|---|---|---|
| Browser (Horkos frontend reading) | Publishable | RLS allows SELECT for anon. |
| Browser (Horkos frontend writing via admin mode) | Publishable | Works today because writes are permissive. Won't work once we tighten RLS. |
| **Facebook ingestor (server side)** | **Service role** | Bypasses RLS. Survives any future tightening. |

The ingestor should set both headers on every Supabase REST call:

```
apikey:        <SERVICE_ROLE_KEY>
Authorization: Bearer <SERVICE_ROLE_KEY>
```

Or, with the JS client:

```js
import { createClient } from "@supabase/supabase-js";
const sb = createClient(
  "https://uatztvwrsngpgobfjdey.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
```

**Never put the service role key in a browser bundle, a public repo, a GitHub Action that logs env, or anywhere that may surface in error messages. Treat it like a password.**

---

## 7. Writing to Horkos

### 7.1 Required fields per `statements` insert

The bare minimum is:

```
subject_id       (uuid; look it up from subjects.code first)
source_code      'FB'
captured_at      timestamptz, default now() — pass an explicit value if you scrape historical posts
media_kind       'text' | 'image' | 'video'
```

Everything else is optional but you should populate as much as you have. The `code` column is auto-generated; do not set it.

### 7.2 Canonical insert (Node.js + supabase-js)

```js
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://uatztvwrsngpgobfjdey.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// 1) Resolve the subject by its human code.
const { data: subject, error: e1 } = await sb
  .from("subjects").select("id").eq("code", "PM-001").single();
if (e1) throw e1;

// 2) Insert the statement.
const payload = {
  subject_id:   subject.id,
  source_code:  "FB",
  source_url:   "https://www.facebook.com/peter.magyar/posts/12345",
  captured_at:  new Date().toISOString(),          // UTC ISO 8601
  media_kind:   "image",                            // text | image | video
  summary:      "Press conference outside parliament — calls for snap election.",
  preview:      "First 10 lines or so of the post text…",
  full_text:    "VERBATIM full text of the FB post.",
  participants: 3812,
  topics:       ["CORRUPTION", "EU_POLICY"],        // see section 10
  reactions:    { likes: 12480, comments: 3812, shares: 901 },
  sha256:       "4a82f9c3d1ef...", // hash of the raw payload, see 7.5
};

const { data: stmt, error: e2 } = await sb
  .from("statements").insert(payload).select().single();
if (e2) throw e2;

console.log("inserted", stmt.code);   // e.g. P-2026-05-19-0001
```

### 7.3 Canonical insert (Python + httpx)

```python
import os, httpx, datetime as dt

SB = "https://uatztvwrsngpgobfjdey.supabase.co"
KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}",
     "Content-Type": "application/json", "Prefer": "return=representation"}

# 1) Subject lookup
r = httpx.get(f"{SB}/rest/v1/subjects",
              params={"select": "id", "code": "eq.PM-001"}, headers=H)
subject_id = r.json()[0]["id"]

# 2) Insert
payload = {
  "subject_id":   subject_id,
  "source_code":  "FB",
  "source_url":   "https://www.facebook.com/peter.magyar/posts/12345",
  "captured_at":  dt.datetime.utcnow().isoformat() + "Z",
  "media_kind":   "image",
  "summary":      "Press conference outside parliament — calls for snap election.",
  "preview":      "First 10 lines or so of the post text…",
  "full_text":    "VERBATIM full text of the FB post.",
  "participants": 3812,
  "topics":       ["CORRUPTION", "EU_POLICY"],
  "reactions":    {"likes": 12480, "comments": 3812, "shares": 901},
  "sha256":       "4a82f9c3d1ef...",
}
r = httpx.post(f"{SB}/rest/v1/statements", json=payload, headers=H)
print(r.json()[0]["code"])
```

### 7.4 Attaching media

If the post has images or videos, do this **after** the statement insert (you need the statement ID).

```js
// Upload file bytes to the `media` bucket.
const path = `${stmt.id}/${Date.now()}-image.jpg`;
await sb.storage.from("media").upload(path, fileBytes, {
  contentType: "image/jpeg", upsert: false,
});

// Record the link in statement_media.
await sb.from("statement_media").insert({
  statement_id: stmt.id,
  kind:         "image",
  storage_path: path,
  mime:         "image/jpeg",
  width:        1920,
  height:       1280,
  position:     0,
});
```

Public URL of the uploaded file:
```
https://uatztvwrsngpgobfjdey.supabase.co/storage/v1/object/public/media/{path}
```

When you delete a statement, the row in `statement_media` is auto-removed by the ON DELETE CASCADE, but **the file in storage is not**. If you re-ingest the same post, your dedup logic will either need to clean orphan files or re-use them. Easiest pattern: include a sweeper job that deletes storage objects whose path prefixes don't match any `statement_media.storage_path`.

### 7.5 What to hash for `sha256`

The intent is that anyone can re-verify the captured payload later. Hash the **canonical raw payload** the ingestor received — typically the JSON returned by the FB Graph API for that post, after normalizing whitespace. Recommended:

```js
const canon = JSON.stringify(rawPayload, Object.keys(rawPayload).sort());
const hash  = crypto.createHash("sha256").update(canon).digest("hex");
```

Store both the hash on `statements.sha256` and the original payload as a private object in a separate bucket. The current schema doesn't have a `payloads` bucket — see section 9 if you want one.

### 7.6 Touching `subjects.last_sync_at`

After successfully ingesting one or more posts for a subject, update its `last_sync_at`:

```js
await sb.from("subjects")
  .update({ last_sync_at: new Date().toISOString() })
  .eq("id", subject.id);
```

The dossier card displays this in the "LAST SYNC" line.

### 7.7 Adding a new subject

Rare from automation. When a new public figure is added to the watchlist:

```js
await sb.from("subjects").insert({
  code:           "NEXT-007",
  name:           "Name Surname",
  codename:       "NAME_S",            // display token, e.g. PETER_M
  role:           "Opposition MP",
  district:       "Budapest",
  country:        "HU",
  born:           "1980-01-01",
  indexed_since:  new Date().toISOString().slice(0,10),
  watchlist_rank: 8,
  archive_integrity: 1.0,
});
```

`code` must be unique. The sidebar only shows the top 8 by `watchlist_rank`; rank 9+ are reachable via the modal selector but not listed.

---

## 8. Facebook → Horkos field mapping

Assuming the FB Graph API `/posts` endpoint (or a scraped equivalent). Field names are illustrative — adapt to whatever your collector actually returns.

| Facebook field | Horkos column | Notes |
|---|---|---|
| `id` (post ID) | (none yet — see section 9) | Recommend adding `source_native_id` for dedup. |
| `permalink_url` | `statements.source_url` | Use the canonical URL Facebook returns. |
| `created_time` | (none — recommend adding `published_at`) | When FB says the post was published. |
| ingestor wall-clock time | `statements.captured_at` | When you fetched it. |
| `message` | `statements.full_text` | Verbatim. Do not trim. |
| your one-line summary | `statements.summary` | Optional. The ingestor can leave blank and an enrichment job can fill it later, or you can call an LLM at ingest time. |
| `message` truncated to ~10 lines | `statements.preview` | The feed row expand area. |
| `attachments[].type` | `statements.media_kind` | `photo` → `image`, `video` → `video`, none → `text`. If multiple types, use `image` or `video`. |
| `attachments[].media.image.src` etc. | `statement_media.storage_path` after upload | See 7.4. |
| `reactions.summary.total_count` (Like) | `statements.reactions.likes` | |
| `comments.summary.total_count` | `statements.reactions.comments` | |
| `shares.count` | `statements.reactions.shares` | |
| number of distinct commenters | `statements.participants` | If you have it; otherwise leave 0. |
| your topic classifier output | `statements.topics` | UPPERCASE_WITH_UNDERSCORES. See section 10. |
| SHA-256 of canonical payload | `statements.sha256` | See 7.5. |
| (the page itself) | `statements.subject_id` | Look up by `subjects.code` or by FB Page ID once you've stored the mapping somewhere. The Page-ID → subject-code mapping is **your** problem to maintain; the schema does not store it. Recommended: keep a small `subjects_facebook` lookup table or an `external_ids` JSONB column on `subjects`. |

---

## 9. Idempotency, dedup, and recommended schema additions

### 9.1 The current dedup gap

There is no native unique constraint that prevents inserting the same FB post twice. If your scheduler runs every 5 minutes and posts haven't changed, you'll create duplicates.

For v1, your ingestor must dedup itself — e.g., before inserting, query:

```sql
select 1 from statements
 where subject_id = $1
   and source_code = 'FB'
   and source_url = $2
 limit 1;
```

If a row exists, skip the insert (or, if reactions changed and you want to track that, UPDATE the existing row instead). `source_url` is unique-enough for FB posts because permalinks don't change.

### 9.2 Recommended migration to add before launching automation

Apply this in the Supabase SQL Editor before turning the ingestor on. It adds a stable native ID, the FB-published timestamp, a payload pointer, and a hard unique constraint:

```sql
-- supabase/migrations/002_ingest_columns.sql
alter table public.statements
  add column if not exists source_native_id text,
  add column if not exists published_at     timestamptz,
  add column if not exists raw_payload_path text,
  add column if not exists bytes            integer;

create unique index if not exists statements_source_native_id_uq
  on public.statements (source_code, source_native_id)
  where source_native_id is not null;

alter table public.statement_media
  add column if not exists bytes integer;

-- Optional: a private bucket for raw scraped payloads (forensic archive).
insert into storage.buckets (id, name, public)
  values ('payloads', 'payloads', false)
  on conflict (id) do nothing;
```

With this in place, your ingestor becomes one upsert:

```js
await sb.from("statements").upsert(
  { ...payload, source_code: "FB", source_native_id: fbPostId },
  { onConflict: "source_code,source_native_id" }
);
```

PostgREST will UPDATE if the (source_code, source_native_id) pair already exists, INSERT if not.

### 9.3 What to update on a re-fetch

When a post you've seen before re-appears, update only mutable fields:

| Field | Re-fetch behavior |
|---|---|
| `reactions` | Update — counts change. |
| `participants` | Update. |
| `last_sync_at` on the subject | Update. |
| `full_text`, `preview`, `summary` | **Do not overwrite.** If FB edited the post, that's a different event; insert a *new* row and (eventually) flag a contradiction in the contradictions table. |
| `media` | Do not touch — assume files are immutable in cold storage. |

This preserves the "verbatim or nothing" principle from the README.

### 9.4 What to do when FB deletes a post

Per the editorial principle of immutability: **never delete the Horkos row.** Instead, write to a `takedowns` table. The v1 schema doesn't have one yet; here's the recommended migration:

```sql
-- supabase/migrations/003_takedowns.sql
create table if not exists public.takedowns (
  id            uuid primary key default gen_random_uuid(),
  statement_id  uuid not null references public.statements(id) on delete restrict,
  kind          text not null check (kind in
                  ('source_deleted','source_edited','legal_request','platform_removed')),
  observed_at   timestamptz not null default now(),
  notes         text,
  evidence_path text,                                  -- payloads bucket key
  created_at    timestamptz default now()
);
alter table public.takedowns enable row level security;
create policy "read takedowns" on public.takedowns for select using (true);
create policy "write takedowns" on public.takedowns for all using (true) with check (true);
```

The ingestor's job: on every re-fetch, if the post 404s or its text has materially changed, insert a row here.

---

## 10. Topic taxonomy

Rules for `statements.topics`:

- Always `UPPERCASE_WITH_UNDERSCORES`.
- Short — one or two words joined by underscore.
- Mechanical — descriptive, not opinionated. "CORRUPTION" is a topic; "CORRUPT" or "SCANDAL" are not.
- Up to ~5 per post.

Currently surfaced in the UI (these are the chips users can click to filter):

```
CORRUPTION
EU_POLICY
MEDIA_FREE
ECONOMY
RULE_OF_LAW
UKRAINE
PROTEST
PERSONAL
```

You may introduce new ones; they will appear in the topics array but won't auto-add to the filter chips until someone updates `data.js` → `HARDCODED.TOPICS`. For automation, just be consistent.

If your classifier returns confidence scores, store them in `topics` as bare strings (drop the scores) — but consider proposing a normalized `statement_topics` join table later for richer metadata. The full original plan in `SUPABASE_PLAN.md` describes this; we deliberately simplified for v1.

---

## 11. Time handling

- Every `timestamptz` is stored in UTC. **Always pass `Z`-suffixed ISO strings.**
- `statements.captured_at` = when the ingestor fetched the post. The frontend displays this in the feed.
- `statements.published_at` (after the recommended migration) = when FB says the post was created. Used for the eventual TIMELINE tab.
- `subjects.last_sync_at` = when the ingestor most recently processed any post for that subject.

Two reasonable defaults for `captured_at`:
- If you trust FB's `created_time`, set `captured_at = created_time`. The heatmap shows when the post happened, not when you happened to scrape it. Better UX.
- If you don't trust FB or want pure scrape-time semantics, set `captured_at = now()`. Then put FB's time on `published_at`.

Pick one and stick to it. The frontend right now uses `captured_at` for the heatmap and feed sort order.

---

## 12. Editorial principles your ingestor must respect

These are the project's stated rules; the schema enforces them where it can, the rest is on the ingestor.

1. **Verbatim or nothing.** `full_text` is the raw post text, never paraphrased. Strip nothing except platform-injected boilerplate. Mark all derived fields (`summary`) as analyst-generated.
2. **Sources are first-class.** Every row must have `source_url`. No exceptions.
3. **Immutability.** Never `DELETE` from `statements`. On source-side deletion or edit, write to `takedowns` (recommended migration) and keep the original row.
4. **Transparency about transparency.** Every fetch is auditable — store `captured_at`, `sha256`, and (once the migration is applied) `raw_payload_path` pointing into the private payloads bucket.
5. **No editorial spin.** Topic tags are mechanical. Sentiment scores, if produced, go in their own column and never replace the text.

---

## 13. Verifying that the frontend sees what you wrote

After an ingestion run, hit these endpoints with the publishable key to confirm the user-facing surfaces have updated:

```bash
SB=https://uatztvwrsngpgobfjdey.supabase.co
PK=sb_publishable_l6UKvvwmIRmS9vSRK9bs4g_lDQPjZFG
HDR='-H "apikey: '$PK'" -H "Authorization: Bearer '$PK'"'

# Was the statement written?
curl -s $HDR "$SB/rest/v1/statements?source_code=eq.FB&order=captured_at.desc&limit=3"

# Do the derived counters reflect it?
curl -s $HDR "$SB/rest/v1/subject_totals?subject_id=eq.<SUBJECT_UUID>"

# Heatmap data:
curl -s $HDR "$SB/rest/v1/subject_activity_daily?subject_id=eq.<SUBJECT_UUID>&order=day.desc&limit=10"
```

In the browser, the preview URL plus `#feed` should show the new row at the top of the post ledger once the active subject matches.

---

## 14. Common gotchas

- **Don't set `statements.code` manually.** The trigger auto-generates it; setting it can clash with the daily counter.
- **Don't put the service role key in `config.js`.** That file is committed and served to every browser.
- **`captured_at` is `timestamptz` not `text`.** Use ISO 8601 with `Z` (`2026-05-19T18:42:00Z`), or supabase-js will help you with `new Date().toISOString()`.
- **`topics` is a Postgres array, not a JSON array.** Send as `["CORRUPTION", "EU_POLICY"]` from supabase-js (the client handles it) or as `{"CORRUPTION","EU_POLICY"}` in raw PostgREST.
- **`reactions` is JSONB.** The frontend expects exactly the three keys `likes`, `comments`, `shares`. If you have richer reaction data (sad, angry, etc.), nest them under a sub-object or extend the schema first.
- **Storage uploads are not transactional with DB writes.** Upload the file first, then insert into `statement_media`. If the DB insert fails, you have an orphan file — log it and run a sweeper.
- **The `media_kind` enum is only three values.** If you have a mixed post (image + video), pick one (`image` by convention). The new `statement_media` rows still capture both.
- **Don't UPSERT subjects by `code` blind.** It's safe (UNIQUE constraint), but you'd overwrite manually-edited fields like `watchlist_rank` and `portrait_path`. Use INSERT with `on conflict do nothing` instead, or be deliberate about which fields you set.
- **Vercel deploys on every push to `supabase-v1`.** If you push schema migrations as files in `supabase/migrations/`, they don't auto-apply — you still have to paste them into the Supabase SQL Editor. The commit is documentation, not a deploy step.

---

## 15. Worked example: insert a single FB post end-to-end

Self-contained Node script. Run with `SUPABASE_SERVICE_ROLE_KEY=... node ingest_one.js` after `npm i @supabase/supabase-js`.

```js
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import { readFile } from "node:fs/promises";

const sb = createClient(
  "https://uatztvwrsngpgobfjdey.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// ── A fictional FB post your scraper returned ────────────────────────
const fb = {
  id:           "1234567890",
  permalink_url:"https://www.facebook.com/peter.magyar/posts/1234567890",
  created_time: "2026-05-19T18:42:00+0000",
  from:         { id: "100000000000001" },              // FB Page ID
  message:      "Twelve minutes in Strasbourg this morning. The committee listened.…",
  attachments: { data: [{ type: "photo", media: { image: { src: "https://…/img.jpg" } } }] },
  reactions:   { summary: { total_count: 12480 } },
  comments:    { summary: { total_count: 3812 } },
  shares:      { count: 901 },
};
const imagePath = "/tmp/post-1234567890.jpg";        // already downloaded

// ── 1) Resolve subject (assume a mapping table or hard-coded lookup) ──
const { data: subject } = await sb.from("subjects")
  .select("id").eq("code", "PM-001").single();

// ── 2) Hash the canonical payload ─────────────────────────────────────
const canonical = JSON.stringify(fb, Object.keys(fb).sort());
const sha = crypto.createHash("sha256").update(canonical).digest("hex");

// ── 3) Map FB → Horkos fields ─────────────────────────────────────────
const attType = fb.attachments?.data?.[0]?.type;
const mediaKind = attType === "photo" ? "image"
                : attType === "video" ? "video" : "text";

const statement = {
  subject_id:   subject.id,
  source_code:  "FB",
  source_url:   fb.permalink_url,
  // Pick one of these two — see section 11:
  captured_at:  new Date(fb.created_time).toISOString(),
  media_kind:   mediaKind,
  summary:      fb.message.split("\n")[0].slice(0, 140),
  preview:      fb.message.split("\n").slice(0, 10).join("\n"),
  full_text:    fb.message,
  participants: fb.comments.summary.total_count,
  topics:       ["EU_POLICY"],                          // your classifier output
  reactions: {
    likes:    fb.reactions.summary.total_count,
    comments: fb.comments.summary.total_count,
    shares:   fb.shares.count,
  },
  sha256: sha,
};

// ── 4) Insert (idempotent if you've applied the 002 migration) ────────
const { data: row, error } = await sb.from("statements")
  // .upsert(statement, { onConflict: "source_code,source_native_id" })  // post-002
  .insert(statement)
  .select().single();
if (error) throw error;
console.log("statement", row.code);

// ── 5) Upload the image ───────────────────────────────────────────────
if (mediaKind === "image") {
  const buf  = await readFile(imagePath);
  const path = `${row.id}/${Date.now()}-image.jpg`;
  const up   = await sb.storage.from("media").upload(path, buf, {
    contentType: "image/jpeg", upsert: false,
  });
  if (up.error) throw up.error;

  await sb.from("statement_media").insert({
    statement_id: row.id,
    kind:         "image",
    storage_path: path,
    mime:         "image/jpeg",
    position:     0,
  });
}

// ── 6) Touch the subject's last_sync_at ──────────────────────────────
await sb.from("subjects")
  .update({ last_sync_at: new Date().toISOString() })
  .eq("id", subject.id);

console.log("done");
```

After this runs, opening the deployed Horkos preview (with Péter Magyar selected) should show the new row at the top of the post ledger, the dossier counter incremented, the activity heatmap with a new cell, and the 30D POSTS tile updated.

---

## Change log

- **v1 (2026-05-19)** — initial document. Schema as of `001_init.sql`. Recommended `002_ingest_columns.sql` and `003_takedowns.sql` are described but not yet applied.
