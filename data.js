/* HORKOS — hardcoded UI data for panels that are not yet live.
 *
 * Live data (subjects, posts, activity, totals) comes from supabase.js
 * (`window.db`). The values below feed the panels you asked to keep
 * hardcoded in v1: stat tiles (engagement/discourse/etc.), the LIVE LOG,
 * the TOPIC DIST. panel, the CONTRADICTION LOG, and the right-rail
 * POSTING RHYTHM bars. They are intentionally checked into source so
 * the page renders something coherent before — and even without —
 * any DB call returning.
 */

window.HARDCODED = {
  // Right-rail TOPIC DIST. panel (still hardcoded; counts are illustrative).
  TOPICS: [
    { id: "corruption", label: "CORRUPTION", count: 287, color: "amber" },
    { id: "eu",         label: "EU_POLICY",  count: 154, color: "cyan"  },
    { id: "media",      label: "MEDIA_FREE", count: 121, color: "amber" },
    { id: "economy",    label: "ECONOMY",    count: 98,  color: ""      },
    { id: "rule",       label: "RULE_OF_LAW",count: 76,  color: "red"   },
    { id: "ukraine",    label: "UKRAINE",    count: 54,  color: "red"   },
    { id: "protest",    label: "PROTEST",    count: 41,  color: "amber" },
    { id: "personal",   label: "PERSONAL",   count: 22,  color: ""      },
  ],

  // Right-rail LIVE LOG.
  RECENT_EVENTS: [
    { t: "06:42", e: "Sync complete",              c: 1247 },
    { t: "06:41", e: "New FB post indexed",        c: 1    },
    { t: "03:18", e: "Comment thread snapshot",    c: 4812 },
    { t: "01:04", e: "Image archived (full-res)",  c: 1    },
    { t: "22:51", e: "Mention burst detected",     c: 18   },
    { t: "19:42", e: "Live broadcast captured",    c: 1    },
  ],

  // Stat tiles other than 30D POSTS (which is live).
  STAT_TILES: [
    { k: "AVG ENGAGEMENT", v: "28.4k", d: "likes/post"       },
    { k: "AVG DISCOURSE",  v: "4,812", d: "comments/post"    },
    { k: "MEDIA RATIO",    v: "68%",   d: "with image/vid"   },
    { k: "SENTIMENT",      v: "+0.31", d: "neutral-positive" },
  ],

  // Right-rail CONTRADICTION LOG (hardcoded).
  CONTRADICTIONS: [
    {
      span: "2026-05-04 ↔ 2025-11-12",
      text: "Statement on foreign property — current denial conflicts with prior land registry note.",
    },
    {
      span: "2026-04-26 ↔ 2025-09-08",
      text: "Methodology critique reverses earlier endorsement of same statistical revision.",
    },
  ],

  // Left-sidebar SOURCES list (hardcoded; the actual sources table in
  // Supabase is only used for the FK on statements).
  SOURCES_PANEL: [
    { k: "FB", label: "FACEBOOK",   n: null, active: true  },
    { k: "X",  label: "X / TWITTER",n: 0,    active: false },
    { k: "YT", label: "YOUTUBE",    n: 0,    active: false },
    { k: "TG", label: "TELEGRAM",   n: 0,    active: false },
    { k: "PR", label: "PRESS",      n: 0,    active: false },
    { k: "LX", label: "LAWSUITS",   n: 0,    active: false },
  ],

  // Saved queries on the left sidebar — still hardcoded for v1.
  SAVED_QUERIES: [
    "∴ corruption · last 30d",
    "∴ rallies · 10k+ attendees",
    "∴ media mentions",
    "∴ contradictions log",
  ],

  // Per-subject channel links shown in the dossier and editable in the
  // subject modal. `key` is the property under subjects.socials (jsonb).
  SUBJECT_CHANNELS: [
    { key: "facebook", label: "FACEBOOK", badge: "FB" },
    { key: "youtube",  label: "YOUTUBE",  badge: "YT" },
    { key: "telegram", label: "TELEGRAM", badge: "TG" },
    { key: "press",    label: "PRESS",    badge: "PR" },
    { key: "lawsuits", label: "LAWSUITS", badge: "LX" },
  ],
};
