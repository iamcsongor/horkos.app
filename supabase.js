/* HORKOS — Supabase data layer
 *
 * Thin wrapper around supabase-js. Loaded via UMD on the page so
 * `window.supabase.createClient` is available. Exposes `window.db`
 * with the small surface the UI actually needs.
 */
(function () {
  const cfg = window.HORKOS_CONFIG;
  if (!cfg || !cfg.SUPABASE_URL || !cfg.SUPABASE_KEY) {
    console.error("HORKOS: window.HORKOS_CONFIG is missing. Check config.js.");
    return;
  }
  if (!window.supabase || !window.supabase.createClient) {
    console.error("HORKOS: supabase-js UMD not loaded.");
    return;
  }

  const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY, {
    auth: { persistSession: false },
  });

  // ── helpers ──────────────────────────────────────────────────────────
  const ok = (r) => { if (r.error) throw r.error; return r.data; };
  const PORTRAITS_BUCKET = "portraits";
  const MEDIA_BUCKET = "media";

  function publicUrl(bucket, path) {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;       // external URL
    return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  // ── subjects ─────────────────────────────────────────────────────────
  async function listSubjects() {
    const data = ok(await sb
      .from("subjects")
      .select("*")
      .order("watchlist_rank", { ascending: true, nullsFirst: false })
      .limit(50));
    return data.map(decorateSubject);
  }

  async function getSubject(id) {
    const data = ok(await sb.from("subjects").select("*").eq("id", id).single());
    return decorateSubject(data);
  }

  function decorateSubject(s) {
    return {
      ...s,
      portrait_url: s.portrait_is_url
        ? s.portrait_path
        : publicUrl(PORTRAITS_BUCKET, s.portrait_path),
    };
  }

  // Only these are real columns on `subjects`. Everything else on the
  // in-memory object (portrait_url, total_posts/videos/images from the
  // subject_totals view, etc.) must NOT be sent to PostgREST.
  const SUBJECT_COLUMNS = [
    "id", "code", "name", "codename", "role", "district", "country",
    "born", "followers", "indexed_since", "last_sync_at", "watchlist_rank",
    "archive_integrity", "portrait_path", "portrait_is_url", "total_lawsuits",
    "socials", "created_by",
  ];

  async function upsertSubject(payload) {
    const row = {};
    for (const k of SUBJECT_COLUMNS) {
      if (payload[k] !== undefined) row[k] = payload[k];
    }
    const data = ok(await sb.from("subjects").upsert(row).select().single());
    return decorateSubject(data);
  }

  async function uploadPortrait(subjectId, file) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${subjectId}/portrait-${Date.now()}.${ext}`;
    ok(await sb.storage.from(PORTRAITS_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || undefined,
    }));
    return path; // store this in subjects.portrait_path
  }

  // ── statements (posts) ───────────────────────────────────────────────
  async function listStatements({ subjectId, query, mediaFilter, topic, limit = 200 }) {
    let q = sb
      .from("statements")
      .select("*, statement_media(*)")
      .order("captured_at", { ascending: false })
      .limit(limit);
    if (subjectId) q = q.eq("subject_id", subjectId);
    if (mediaFilter && mediaFilter !== "ALL") q = q.eq("media_kind", mediaFilter.toLowerCase());
    if (topic) q = q.contains("topics", [topic]);
    if (query && query.trim()) {
      // simple ilike OR over the three text fields
      const v = `%${query.trim()}%`;
      q = q.or(`summary.ilike.${v},preview.ilike.${v},full_text.ilike.${v},code.ilike.${v}`);
    }
    const data = ok(await q);
    return data.map(decorateStatement);
  }

  function decorateStatement(s) {
    const media = (s.statement_media || []).map(m => ({
      ...m,
      url: publicUrl(MEDIA_BUCKET, m.storage_path),
    }));
    return {
      ...s,
      media,
      // UI-shape aliases for components that expect the old field names:
      id: s.code || s.id,
      _uuid: s.id,
      date: s.captured_at ? formatStamp(s.captured_at) : "",
      source: s.source_code,
      media_kind: s.media_kind,
      url: s.source_url,
      reactions: s.reactions || { likes: 0, comments: 0, shares: 0 },
      topics: s.topics || [],
      participants: s.participants || 0,
      summary: s.summary || "",
      preview: s.preview || "",
      full: s.full_text || "",
    };
  }

  function formatStamp(iso) {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  }

  async function upsertStatement(payload) {
    // Accept the UI's shape; map back to DB columns.
    const row = {
      id: payload._uuid || undefined,
      subject_id: payload.subject_id,
      source_code: payload.source_code || payload.source,
      captured_at: payload.captured_at,
      media_kind: payload.media_kind || payload.media || "text",
      summary: payload.summary || null,
      preview: payload.preview || null,
      full_text: payload.full_text || payload.full || null,
      source_url: payload.source_url || payload.url || null,
      participants: payload.participants ?? 0,
      topics: payload.topics || [],
      reactions: payload.reactions || { likes: 0, comments: 0, shares: 0 },
    };
    Object.keys(row).forEach(k => row[k] === undefined && delete row[k]);
    const data = ok(await sb.from("statements").upsert(row).select("*, statement_media(*)").single());
    return decorateStatement(data);
  }

  async function deleteStatement(uuid) {
    ok(await sb.from("statements").delete().eq("id", uuid));
  }

  async function uploadMedia(statementId, file, kind /* 'image'|'video' */) {
    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const path = `${statementId}/${Date.now()}-${kind}.${ext}`;
    ok(await sb.storage.from(MEDIA_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    }));
    const data = ok(await sb.from("statement_media").insert({
      statement_id: statementId,
      kind,
      storage_path: path,
      mime: file.type || null,
      bytes: file.size,
    }).select().single());
    return { ...data, url: publicUrl(MEDIA_BUCKET, data.storage_path) };
  }

  async function deleteMedia(media /* row from statement_media */) {
    // Best-effort: remove the file from storage (ignore failure — row delete
    // is the source of truth).
    try {
      if (media.storage_path) {
        await sb.storage.from(MEDIA_BUCKET).remove([media.storage_path]);
      }
    } catch (e) { /* ignore */ }
    ok(await sb.from("statement_media").delete().eq("id", media.id));
  }

  async function listMedia(statementId) {
    const data = ok(await sb.from("statement_media")
      .select("*").eq("statement_id", statementId).order("position", { ascending: true }));
    return data.map(m => ({ ...m, url: publicUrl(MEDIA_BUCKET, m.storage_path) }));
  }

  // ── derived views ────────────────────────────────────────────────────
  async function getSubjectTotals(subjectId) {
    const data = ok(await sb.from("subject_totals").select("*").eq("subject_id", subjectId).maybeSingle());
    return data || { total_posts: 0, total_videos: 0, total_images: 0 };
  }

  async function get30dDelta(subjectId) {
    const data = ok(await sb.from("subject_30d_delta").select("*").eq("subject_id", subjectId).maybeSingle());
    return data || { posts_30d: 0, posts_prev_30d: 0, delta_pct: null };
  }

  async function getActivityDaily(subjectId) {
    // Per-source breakdown drives the interactive heatmap on the FEED tab
    // (dominant-source coloring + hover popover with per-channel bars).
    // The Heatmap component aggregates these rows by day for totals.
    const data = ok(await sb.from("subject_activity_daily_by_source").select("*").eq("subject_id", subjectId));
    // returns [{subject_id, source_code, day, posts}]
    return data;
  }

  // ── sources ──────────────────────────────────────────────────────────
  async function listSources() {
    return ok(await sb.from("sources").select("*").order("code"));
  }

  window.db = {
    sb,
    listSubjects,
    getSubject,
    upsertSubject,
    uploadPortrait,
    listStatements,
    upsertStatement,
    deleteStatement,
    uploadMedia,
    deleteMedia,
    listMedia,
    getSubjectTotals,
    get30dDelta,
    getActivityDaily,
    listSources,
    publicUrl,
  };
})();
