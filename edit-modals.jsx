/* HORKOS — admin edit modals
 *
 * Two modals: SubjectEditModal and StatementEditModal.
 * Both follow the same visual language as the existing PostModal:
 * black-frame, amber `▌` heading, mono labels, ⌘+S save, ESC close.
 */
const { useState: _useState, useEffect: _useEffect, useRef: _useRef } = React;

// ── shared bits ───────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <label className="edit-field">
      <span className="edit-label">{label}</span>
      {children}
      {hint && <span className="edit-hint">{hint}</span>}
    </label>
  );
}

function ModalFrame({ title, code, subtitle, onClose, onSave, saving, children, leftFootInfo }) {
  _useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault(); onSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onSave]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{display:"flex", alignItems:"center", gap:12}}>
            <div className="controls"><span></span><span></span><span></span></div>
            <span className="amber">▌</span>
            <span>{title}</span>
            {code && <span className="dim">· {code}</span>}
            {subtitle && <span className="dim">· {subtitle}</span>}
          </div>
          <div style={{display:"flex", alignItems:"center", gap:14}}>
            <span className="dim">EDIT_MODE · UNSAVED</span>
            <button className="iconbtn" onClick={onClose}><Icon k="x" /></button>
          </div>
        </div>

        <div className="modal-body" style={{display:"block", padding:"22px 28px"}}>
          {children}
        </div>

        <div className="modal-foot">
          <div style={{display:"flex", gap:14}}>
            <span>{leftFootInfo}</span>
          </div>
          <div style={{display:"flex", gap:14, alignItems:"center"}}>
            <span className="dim">⌘+S SAVE</span>
            <span className="amber">ESC CLOSE</span>
            <button className="chip active" onClick={onSave} disabled={saving} style={{justifyContent:"center"}}>
              {saving ? "SAVING…" : "SAVE →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SubjectEditModal ──────────────────────────────────────────────────
function SubjectEditModal({ subject, onClose, onSaved }) {
  const isNew = !subject || !subject.id;
  const [form, setForm] = _useState(() => ({
    code:              subject?.code || "",
    name:              subject?.name || "",
    codename:          subject?.codename || "",
    role:              subject?.role || "",
    district:          subject?.district || "",
    country:           subject?.country || "HU",
    born:              subject?.born || "",
    followers:         subject?.followers ?? "",
    indexed_since:     subject?.indexed_since || new Date().toISOString().slice(0,10),
    watchlist_rank:    subject?.watchlist_rank ?? "",
    archive_integrity: subject?.archive_integrity ?? 1.0,
    total_lawsuits:    subject?.total_lawsuits ?? 0,
    portrait_path:     subject?.portrait_path || "",
    portrait_is_url:   subject?.portrait_is_url ?? false,
  }));
  const [saving, setSaving] = _useState(false);
  const [err, setErr] = _useState(null);
  const fileInput = _useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handlePortraitFile(file) {
    if (!file) return;
    if (isNew) { setErr("Save the subject first, then upload a portrait."); return; }
    try {
      const path = await window.db.uploadPortrait(subject.id, file);
      set("portrait_path", path);
      set("portrait_is_url", false);
    } catch (e) { setErr(e.message || String(e)); }
  }

  function handleUrlPortrait() {
    const url = prompt("Paste an image URL for the portrait:", form.portrait_is_url ? form.portrait_path : "");
    if (!url) return;
    set("portrait_path", url);
    set("portrait_is_url", true);
  }

  async function save() {
    setErr(null); setSaving(true);
    try {
      const payload = {
        ...subject,                        // keep id when editing
        ...form,
        followers:         form.followers === "" ? null : Number(form.followers),
        watchlist_rank:    form.watchlist_rank === "" ? null : Number(form.watchlist_rank),
        archive_integrity: Number(form.archive_integrity),
        total_lawsuits:    Number(form.total_lawsuits || 0),
        born:              form.born || null,
      };
      const saved = await window.db.upsertSubject(payload);
      onSaved && onSaved(saved);
      onClose();
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  const portraitUrl = form.portrait_is_url
    ? form.portrait_path
    : (form.portrait_path ? window.db.publicUrl("portraits", form.portrait_path) : null);

  return (
    <ModalFrame
      title={isNew ? "NEW_SUBJECT" : "EDIT_SUBJECT"}
      code={form.code || "—"}
      onClose={onClose}
      onSave={save}
      saving={saving}
      leftFootInfo={err ? <span className="red">{err}</span> : "HORKOS // SUBJECT EDITOR"}
    >
      <div className="edit-grid">
        {/* Portrait block */}
        <div className="edit-portrait">
          <div className="dim u" style={{fontSize:10, marginBottom:6}}>PORTRAIT</div>
          <div
            className="photo edit-portrait-zone"
            onClick={() => fileInput.current && fileInput.current.click()}
            title="Click to upload a file"
          >
            {portraitUrl
              ? <img src={portraitUrl} alt="portrait" />
              : <span>[ DROP / CLICK TO UPLOAD ]</span>}
          </div>
          <div style={{display:"flex", gap:6, marginTop:8}}>
            <button className="chip" onClick={() => fileInput.current && fileInput.current.click()}>
              UPLOAD FILE
            </button>
            <button className="chip" onClick={handleUrlPortrait}>
              USE URL
            </button>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            style={{display:"none"}}
            onChange={(e) => handlePortraitFile(e.target.files[0])}
          />
          <div className="edit-hint" style={{marginTop:8}}>
            {form.portrait_is_url ? "External URL." : "Stored in `portraits` bucket."}
          </div>
        </div>

        {/* Identity */}
        <div className="edit-col">
          <Field label="CODE"     hint="Short ID. e.g. PM-001">
            <input value={form.code}     onChange={e => set("code", e.target.value)} />
          </Field>
          <Field label="NAME"     hint="Display name">
            <input value={form.name}     onChange={e => set("name", e.target.value)} />
          </Field>
          <Field label="CODENAME" hint="Dossier header // PETER_M">
            <input value={form.codename} onChange={e => set("codename", e.target.value)} />
          </Field>
          <Field label="ROLE">
            <input value={form.role}     onChange={e => set("role", e.target.value)} />
          </Field>
          <Field label="DISTRICT">
            <input value={form.district} onChange={e => set("district", e.target.value)} />
          </Field>
          <Field label="COUNTRY" hint="ISO-3166 alpha-2">
            <input value={form.country}  onChange={e => set("country", e.target.value.toUpperCase().slice(0,2))} />
          </Field>
        </div>

        {/* Numbers */}
        <div className="edit-col">
          <Field label="BORN" hint="YYYY-MM-DD">
            <input type="date" value={form.born || ""} onChange={e => set("born", e.target.value)} />
          </Field>
          <Field label="FOLLOWERS">
            <input type="number" value={form.followers} onChange={e => set("followers", e.target.value)} />
          </Field>
          <Field label="INDEXED SINCE">
            <input type="date" value={form.indexed_since || ""} onChange={e => set("indexed_since", e.target.value)} />
          </Field>
          <Field label="WATCHLIST RANK" hint="Top 8 shown in sidebar">
            <input type="number" value={form.watchlist_rank} onChange={e => set("watchlist_rank", e.target.value)} />
          </Field>
          <Field label="ARCHIVE INTEGRITY" hint="0.0–1.0">
            <input type="number" step="0.001" min="0" max="1"
                   value={form.archive_integrity}
                   onChange={e => set("archive_integrity", e.target.value)} />
          </Field>
          <Field label="LAWSUITS" hint="Manual counter">
            <input type="number" value={form.total_lawsuits} onChange={e => set("total_lawsuits", e.target.value)} />
          </Field>
        </div>
      </div>
    </ModalFrame>
  );
}

// ── StatementEditModal ────────────────────────────────────────────────
function StatementEditModal({ statement, subjects, defaultSubjectId, onClose, onSaved, onDeleted }) {
  const isNew = !statement || !statement._uuid;
  const [form, setForm] = _useState(() => ({
    subject_id:    statement?.subject_id || defaultSubjectId || "",
    source_code:   statement?.source_code || statement?.source || "FB",
    captured_at:   statement?.captured_at
                     ? new Date(statement.captured_at).toISOString().slice(0,16)
                     : new Date().toISOString().slice(0,16),
    media_kind:    statement?.media_kind || statement?.media || "text",
    summary:       statement?.summary || "",
    preview:       statement?.preview || "",
    full_text:     statement?.full_text || statement?.full || "",
    source_url:    statement?.source_url || statement?.url || "",
    participants:  statement?.participants ?? 0,
    topics:        (statement?.topics || []).join(", "),
    likes:         statement?.reactions?.likes ?? 0,
    comments:      statement?.reactions?.comments ?? 0,
    shares:        statement?.reactions?.shares ?? 0,
  }));
  const [saving, setSaving]   = _useState(false);
  const [err, setErr]         = _useState(null);
  const [media, setMedia]     = _useState(() => statement?.media || statement?.statement_media || []);
  const [uploading, setUploading] = _useState(false);
  const mediaInput = _useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleMediaFile(file) {
    if (!file) return;
    if (isNew || !statement?._uuid) {
      setErr("Save the post first, then attach media.");
      return;
    }
    setUploading(true); setErr(null);
    try {
      const kind = (file.type || "").startsWith("video") ? "video" : "image";
      const row = await window.db.uploadMedia(statement._uuid, file, kind);
      setMedia(m => [...m, row]);
      // If this is the first attached image/video, switch media_kind to match.
      if (form.media_kind === "text") set("media_kind", kind);
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setUploading(false);
      if (mediaInput.current) mediaInput.current.value = "";
    }
  }

  async function handleMediaDelete(m) {
    if (!confirm("Remove this media file?")) return;
    try {
      await window.db.deleteMedia(m);
      setMedia(arr => arr.filter(x => x.id !== m.id));
    } catch (e) {
      setErr(e.message || String(e));
    }
  }

  async function save() {
    setErr(null); setSaving(true);
    try {
      const payload = {
        _uuid:        statement?._uuid,
        subject_id:   form.subject_id,
        source_code:  form.source_code,
        captured_at:  new Date(form.captured_at).toISOString(),
        media_kind:   form.media_kind,
        summary:      form.summary || null,
        preview:      form.preview || null,
        full_text:    form.full_text || null,
        source_url:   form.source_url || null,
        participants: Number(form.participants || 0),
        topics:       form.topics
                        .split(",").map(s => s.trim().toUpperCase()).filter(Boolean),
        reactions: {
          likes:    Number(form.likes || 0),
          comments: Number(form.comments || 0),
          shares:   Number(form.shares || 0),
        },
      };
      const saved = await window.db.upsertStatement(payload);
      onSaved && onSaved(saved);
      onClose();
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  async function destroy() {
    if (!statement?._uuid) return;
    if (!confirm("Delete this statement permanently?")) return;
    setSaving(true);
    try {
      await window.db.deleteStatement(statement._uuid);
      onDeleted && onDeleted(statement._uuid);
      onClose();
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalFrame
      title={isNew ? "NEW_STATEMENT" : "EDIT_STATEMENT"}
      code={statement?.code || "—"}
      onClose={onClose}
      onSave={save}
      saving={saving}
      leftFootInfo={err ? <span className="red">{err}</span> : (isNew ? "NEW RECORD" : "EDITING")}
    >
      <div className="edit-grid">
        <div className="edit-col">
          <Field label="SUBJECT">
            <select value={form.subject_id} onChange={e => set("subject_id", e.target.value)}>
              <option value="">— select —</option>
              {(subjects || []).map(s => (
                <option key={s.id} value={s.id}>{s.code} · {s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="SOURCE">
            <select value={form.source_code} onChange={e => set("source_code", e.target.value)}>
              <option value="FB">FB · FACEBOOK</option>
              <option value="X">X · X / TWITTER</option>
              <option value="YT">YT · YOUTUBE</option>
              <option value="TG">TG · TELEGRAM</option>
              <option value="PR">PR · PRESS</option>
              <option value="LX">LX · LAWSUITS</option>
            </select>
          </Field>
          <Field label="CAPTURED AT" hint="UTC">
            <input type="datetime-local" value={form.captured_at} onChange={e => set("captured_at", e.target.value)} />
          </Field>
          <Field label="MEDIA TYPE">
            <select value={form.media_kind} onChange={e => set("media_kind", e.target.value)}>
              <option value="text">TEXT</option>
              <option value="image">IMAGE</option>
              <option value="video">VIDEO</option>
            </select>
          </Field>
          <Field label="SOURCE URL">
            <input value={form.source_url} onChange={e => set("source_url", e.target.value)} />
          </Field>
          <Field label="PARTICIPANTS" hint="Distinct commenters">
            <input type="number" value={form.participants} onChange={e => set("participants", e.target.value)} />
          </Field>
        </div>

        <div className="edit-col">
          <Field label="SUMMARY" hint="One-line analyst summary">
            <input value={form.summary} onChange={e => set("summary", e.target.value)} />
          </Field>
          <Field label="PREVIEW" hint="~10-line excerpt for the feed row">
            <textarea rows="4" value={form.preview} onChange={e => set("preview", e.target.value)} />
          </Field>
          <Field label="FULL TEXT" hint="Verbatim full text — write-once">
            <textarea rows="8" value={form.full_text} onChange={e => set("full_text", e.target.value)} />
          </Field>
          <Field label="TOPICS" hint="Comma-separated. e.g. CORRUPTION, EU_POLICY">
            <input value={form.topics} onChange={e => set("topics", e.target.value)} />
          </Field>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10}}>
            <Field label="LIKES">
              <input type="number" value={form.likes}    onChange={e => set("likes", e.target.value)} />
            </Field>
            <Field label="REPLIES">
              <input type="number" value={form.comments} onChange={e => set("comments", e.target.value)} />
            </Field>
            <Field label="SHARES">
              <input type="number" value={form.shares}   onChange={e => set("shares", e.target.value)} />
            </Field>
          </div>
          {/* MEDIA section: list attached files + upload more */}
          <div className="edit-field" style={{marginTop:6}}>
            <span className="edit-label">
              MEDIA · {media.length} ATTACHED
              {isNew && <span className="edit-hint" style={{marginLeft:8, textTransform:"none"}}>(save first to attach)</span>}
            </span>
            {media.length > 0 && (
              <div className="edit-media-grid">
                {media.map(m => (
                  <div key={m.id} className="edit-media-item">
                    {m.kind === "image" && m.url
                      ? <img src={m.url} alt="" />
                      : <div className="edit-media-placeholder">
                          [{m.kind.toUpperCase()}]
                        </div>}
                    <button
                      className="edit-media-x"
                      title="Remove"
                      onClick={() => handleMediaDelete(m)}
                    >×</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{display:"flex", gap:6, marginTop:6}}>
              <button
                className="chip"
                disabled={isNew || uploading}
                onClick={() => mediaInput.current && mediaInput.current.click()}
                style={{opacity: isNew ? 0.5 : 1}}
              >
                {uploading ? "UPLOADING…" : "+ UPLOAD MEDIA"}
              </button>
              <span className="edit-hint" style={{alignSelf:"center"}}>
                Image or video. Stored in `media` bucket.
              </span>
            </div>
            <input
              ref={mediaInput}
              type="file"
              accept="image/*,video/*"
              style={{display:"none"}}
              onChange={(e) => handleMediaFile(e.target.files[0])}
            />
          </div>

          {!isNew && (
            <button className="chip" style={{marginTop:8, color:"var(--red)", borderColor:"var(--red)"}} onClick={destroy}>
              DELETE POST
            </button>
          )}
        </div>
      </div>
    </ModalFrame>
  );
}

Object.assign(window, { SubjectEditModal, StatementEditModal });
