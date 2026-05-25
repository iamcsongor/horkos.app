/* HORKOS — UI components */
const { useState, useMemo, useEffect, useRef } = React;

// ── Tiny SVG icon helpers ─────────────────────────────────────────────
const Icon = ({ k, size = 12 }) => {
  const s = size;
  const stroke = "currentColor";
  const common = { width: s, height: s, viewBox: "0 0 16 16", fill: "none", stroke, strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (k) {
    case "search":  return <svg {...common}><circle cx="7" cy="7" r="4.5"/><path d="M11 11l3.5 3.5"/></svg>;
    case "user":    return <svg {...common}><circle cx="8" cy="6" r="2.5"/><path d="M3 14c0-2.5 2.3-4 5-4s5 1.5 5 4"/></svg>;
    case "users":   return <svg {...common}><circle cx="6" cy="6" r="2.2"/><circle cx="11.5" cy="6" r="2"/><path d="M2 13c0-2 1.8-3.4 4-3.4s4 1.4 4 3.4"/><path d="M9.5 13c.2-1.8 1.7-3 3.5-3s3 1.2 3 3"/></svg>;
    case "image":   return <svg {...common}><rect x="2" y="3" width="12" height="10"/><circle cx="6" cy="7" r="1"/><path d="M2 11l3-3 4 4 2-2 3 3"/></svg>;
    case "video":   return <svg {...common}><rect x="2" y="4" width="9" height="8"/><path d="M11 7l3-2v6l-3-2z"/></svg>;
    case "text":    return <svg {...common}><path d="M3 4h10M5 8h6M3 12h10"/></svg>;
    case "expand":  return <svg {...common}><path d="M9 3h4v4M7 13H3V9M13 3l-5 5M3 13l5-5"/></svg>;
    case "popout":  return <svg {...common}><path d="M9 3h4v4M13 3l-6 6"/><path d="M12 9v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3"/></svg>;
    case "x":       return <svg {...common}><path d="M3 3l10 10M13 3L3 13"/></svg>;
    case "link":    return <svg {...common}><path d="M7 9a2.5 2.5 0 0 0 3.5 0l2-2a2.5 2.5 0 0 0-3.5-3.5L8 4.5"/><path d="M9 7a2.5 2.5 0 0 0-3.5 0l-2 2A2.5 2.5 0 0 0 7 12.5L8 11.5"/></svg>;
    case "play":    return <svg {...common}><path d="M5 3l8 5-8 5z" fill="currentColor"/></svg>;
    case "down":    return <svg {...common}><path d="M3 6l5 5 5-5"/></svg>;
    case "filter":  return <svg {...common}><path d="M2 4h12M4 8h8M6 12h4"/></svg>;
    case "fire":    return <svg {...common}><path d="M8 14c-2.8 0-5-2-5-4.5C3 7 5 5.5 5.5 3c1.5 2 4.5 3 4.5 6 0-1 .8-2 2-2 0 3-1.5 7-4 7z"/></svg>;
    case "spark":   return <svg {...common}><path d="M2 11l3-4 3 3 3-6 3 8" stroke="currentColor" fill="none"/></svg>;
    case "plus":    return <svg {...common}><path d="M8 3v10M3 8h10"/></svg>;
    case "edit":    return <svg {...common}><path d="M10 3l3 3-7 7H3v-3z"/><path d="M9 4l3 3"/></svg>;
    case "upload":  return <svg {...common}><path d="M8 11V3M4 7l4-4 4 4"/><path d="M3 12v1h10v-1"/></svg>;
    case "bars":    return <svg {...common}><rect x="3"  y="9"  width="2" height="4"/><rect x="6"  y="6"  width="2" height="7"/><rect x="9"  y="3"  width="2" height="10"/><rect x="12" y="7"  width="2" height="6"/></svg>;
    case "grid":    return <svg {...common}><rect x="3" y="3" width="3" height="3"/><rect x="7" y="3" width="3" height="3"/><rect x="11" y="3" width="2" height="3"/><rect x="3" y="7" width="3" height="3"/><rect x="7" y="7" width="3" height="3"/><rect x="11" y="7" width="2" height="3"/><rect x="3" y="11" width="3" height="2"/><rect x="7" y="11" width="3" height="2"/><rect x="11" y="11" width="2" height="2"/></svg>;
    case "heart":   return <svg {...common}><path d="M8 13.5s-5-3.2-5-7a2.8 2.8 0 0 1 5-1.8 2.8 2.8 0 0 1 5 1.8c0 3.8-5 7-5 7z"/></svg>;
    case "comment": return <svg {...common}><path d="M2.5 4h11v6.5H8L5 13v-2.5H2.5z"/></svg>;
    case "share":   return <svg {...common}><path d="M3 11V8.5a3 3 0 0 1 3-3h6"/><path d="M10 3l3 2.5-3 2.5"/></svg>;
    default: return null;
  }
};

// ── Top bar ───────────────────────────────────────────────────────────
const TopBar = ({ tab, setTab, syncTime, theme, setTheme, adminMode }) => (
  <header className="topbar">
    <div className="brand">
      <div className="mark">H</div>
      <div>
        <div className="word">HORKOS</div>
        <div className="ver">v0.7.3 · ARCHIVE</div>
      </div>
    </div>
    <nav>
      {["HOME", "FEED", "TIMELINE", "ANALYSIS", "NETWORK", "WATCHLIST"].map(t => (
        <a
          key={t}
          className={tab === t ? "active" : ""}
          onClick={(e) => {
            e.preventDefault();
            setTab(t);
            // Sync hash so deep-linking + back-button behave.
            location.hash = t === "FEED" ? "feed" : t === "HOME" ? "home" : t.toLowerCase();
          }}
          href="#"
        >{t}</a>
      ))}
    </nav>
    <div className="spacer"></div>
    <div className="status">
      <span><span className="led"></span>&nbsp;&nbsp;LIVE</span>
      <span className="dim">SYNC {syncTime}</span>
      <span className="dim">42°N · 19°E</span>
      <span className="amber">OP: {adminMode ? "ANALYST_03 · EDIT" : "ANALYST_03"}</span>
      <div className="theme-switch" role="group" aria-label="Theme">
        <button className={theme === "light" ? "on" : ""} onClick={() => setTheme("light")} aria-pressed={theme === "light"} title="Day mode">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <circle cx="8" cy="8" r="3"/>
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3"/>
          </svg>
          DAY
        </button>
        <button className={theme === "dark" ? "on" : ""} onClick={() => setTheme("dark")} aria-pressed={theme === "dark"} title="Night mode">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 9.5A5 5 0 1 1 6.5 3a4 4 0 0 0 6.5 6.5z"/>
          </svg>
          NIGHT
        </button>
      </div>
    </div>
  </header>
);

// ── Sidebar (live subject list / hardcoded sources / hardcoded saved queries)
const SideBar = ({
  subjects, activeSubjectId, onPickSubject,
  subject,
  adminMode, onNewSubject, onEditSubject,
}) => {
  const visible = (subjects || []).slice(0, 8);
  const sources       = window.HARDCODED.SOURCES_PANEL;
  const savedQueries  = window.HARDCODED.SAVED_QUERIES;
  return (
    <aside className="sidebar">
      <div>
        <div className="side-h">
          <span>SUBJECTS · {visible.length}{(subjects || []).length > 8 ? `/${subjects.length}` : ""}</span>
          {adminMode
            ? <span className="amber" style={{cursor:"pointer"}} onClick={onNewSubject}>+ NEW</span>
            : <span className="dim2">+ NEW</span>}
        </div>
        <div className="side-list">
          {visible.map(s => (
            <div
              key={s.id}
              className={"side-item" + (s.id === activeSubjectId ? " active" : "")}
              onClick={() => onPickSubject && onPickSubject(s.id)}
              style={{cursor: "pointer"}}
            >
              <div style={{display:"flex", flexDirection:"column"}}>
                <span>{s.name}</span>
                <span className="dim2" style={{fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase"}}>{s.role || "—"}</span>
              </div>
              <span className="ct" style={{display:"flex", alignItems:"center", gap:6}}>
                {s.id === activeSubjectId && adminMode && (
                  <button
                    className="iconbtn"
                    onClick={(e) => { e.stopPropagation(); onEditSubject && onEditSubject(s); }}
                    title="Edit subject"
                  ><Icon k="edit" /></button>
                )}
                <span>{s.total_posts ?? "—"}</span>
              </span>
            </div>
          ))}
          {visible.length === 0 && (
            <div className="side-item dim2">NO SUBJECTS · ADD ONE</div>
          )}
        </div>
      </div>

      <div>
        <div className="side-h">
          <span>SOURCES</span>
          <span className="amber">FB ONLY</span>
        </div>
        <div className="side-list">
          {sources.map(s => (
            <div key={s.k} className={"side-item" + (s.active ? " active" : "")}>
              <div style={{display:"flex", alignItems:"center", gap:8}}>
                <span className="src-mark">{s.k}</span>
                <span>{s.label}</span>
              </div>
              <span className="ct">{s.n == null ? "—" : s.n.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="side-h"><span>SAVED QUERIES</span></div>
        <div className="side-list">
          {savedQueries.map(q => <div key={q} className="side-item">{q}</div>)}
        </div>
      </div>

      <div style={{marginTop:"auto", color:"var(--fg-4)", fontSize:9, letterSpacing:"0.12em"}}>
        ARCHIVE INTEGRITY · {(((subject?.archive_integrity) ?? 1) * 100).toFixed(1)}% · SHA-256 VERIFIED
      </div>
    </aside>
  );
};

// ── Subject card ──────────────────────────────────────────────────────
const SubjectCard = ({ subject, totals, adminMode, onEdit, onPortraitUpload }) => {
  const fileInput = useRef(null);
  if (!subject) {
    return (
      <section className="panel corners">
        <div className="panel-head"><div className="left"><span className="amber">▌</span> SUBJECT_DOSSIER</div></div>
        <div className="panel-body" style={{padding:30, color:"var(--fg-4)"}}>NO SUBJECT SELECTED</div>
      </section>
    );
  }
  const portraitUrl = subject.portrait_url;
  const handleFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f && onPortraitUpload) onPortraitUpload(f);
    if (e.target) e.target.value = "";
  };
  return (
    <section className="panel corners">
      <div className="panel-head">
        <div className="left">
          <span className="amber">▌</span> SUBJECT_DOSSIER · {subject.codename || subject.code}
        </div>
        <div className="right">
          <span>ID {subject.code}</span>
          {subject.indexed_since && <span>INDEXED SINCE {subject.indexed_since}</span>}
          {subject.watchlist_rank != null && <span>WATCHLIST #{subject.watchlist_rank}</span>}
          {adminMode && (
            <button className="iconbtn" onClick={onEdit} title="Edit subject"><Icon k="edit" /></button>
          )}
        </div>
      </div>
      <div className="panel-body subject">
        <div
          className={"photo subject-portrait" + (adminMode ? " editable" : "")}
          onClick={() => adminMode && fileInput.current && fileInput.current.click()}
          title={adminMode ? "Click to upload a portrait" : ""}
        >
          {portraitUrl
            ? <img src={portraitUrl} alt="portrait" />
            : <span>{adminMode ? "[ HOVER · CLICK TO UPLOAD ]" : "[ PORTRAIT ]"}</span>}
          {adminMode && portraitUrl && (
            <div className="portrait-overlay"><Icon k="upload" /> REPLACE</div>
          )}
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            style={{display:"none"}}
            onChange={handleFile}
          />
        </div>
        <div className="info">
          <div className="codename">SUBJECT // {subject.codename || subject.code}</div>
          <div className="name">{subject.name}<span className="caret"></span></div>
          <div className="role">{subject.role || "—"}{subject.district ? ` · ${subject.district}` : ""}</div>
          <div className="meta">
            <div><span className="k">BORN</span><span className="v">{subject.born || "—"}</span></div>
            <div><span className="k">LAST SYNC</span><span className="v">{subject.last_sync_at ? new Date(subject.last_sync_at).toISOString().slice(0,16).replace("T"," ") : "—"}</span></div>
            <div><span className="k">FOLLOWERS</span><span className="v">{subject.followers != null ? Number(subject.followers).toLocaleString() : "—"}</span></div>
          </div>
        </div>
        <div className="stack">
          <div className="lbl">POSTS INDEXED</div>
          <div className="big">{(totals?.total_posts ?? 0).toLocaleString()}</div>
          <div style={{display:"flex", gap:10, marginTop:6}}>
            <div style={{display:"flex", flexDirection:"column", alignItems:"flex-end"}}>
              <div className="lbl">VIDEOS</div>
              <div className="mono" style={{fontSize:14}}>{totals?.total_videos ?? 0}</div>
            </div>
            <div style={{display:"flex", flexDirection:"column", alignItems:"flex-end"}}>
              <div className="lbl">IMAGES</div>
              <div className="mono" style={{fontSize:14}}>{totals?.total_images ?? 0}</div>
            </div>
            <div style={{display:"flex", flexDirection:"column", alignItems:"flex-end"}}>
              <div className="lbl">LAWSUITS</div>
              <div className="mono red" style={{fontSize:14}}>{subject.total_lawsuits ?? 0}</div>
            </div>
          </div>
        </div>

        <div className="socials">
          <div className="lbl">CHANNELS</div>
          {window.HARDCODED.SUBJECT_CHANNELS.map(c => {
            const url = (subject.socials || {})[c.key];
            const linked = !!(url && String(url).trim());
            return linked ? (
              <a
                key={c.key}
                className="social-row"
                href={url}
                target="_blank"
                rel="noreferrer"
                title={url}
              >
                <span className="src-mark">{c.badge}</span>
                <span className="social-label">{c.label}</span>
                <Icon k="link" />
              </a>
            ) : (
              <div key={c.key} className="social-row empty" title="Not linked">
                <span className="src-mark">{c.badge}</span>
                <span className="social-label">{c.label}</span>
                <span className="social-dash">—</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ── Activity heatmap (interactive · stacked-by-source) ────────────────
// Cells are colored by the day's dominant source. Hover reveals a popover
// with the per-source breakdown — clicking a source row filters the feed
// to that day + source; clicking the cell body filters by day only. Legend
// chips above the grid double as the color key and as a one-click source
// filter. Filter state is owned by the parent — this component is a
// controlled view of `dateFilter` + `sourceFilter`.
const SOURCE_META = {
  FB: { label: "FACEBOOK",    hue: 230, chroma: 0.13 },
  X:  { label: "X / TWITTER", hue: 250, chroma: 0.02 },
  YT: { label: "YOUTUBE",     hue: 25,  chroma: 0.19 },
  IG: { label: "INSTAGRAM",   hue: 340, chroma: 0.17 },
  TG: { label: "TELEGRAM",    hue: 215, chroma: 0.11 },
  PR: { label: "PRESS",       hue: 95,  chroma: 0.12 },
  LX: { label: "LEGAL",       hue: 60,  chroma: 0.13 },
};
const SOURCE_CODES = ["FB", "X", "YT", "IG", "TG", "PR", "LX"];

const sourceColor = (code, alpha = 1, light = 0.72) => {
  const m = SOURCE_META[code];
  if (!m) return `oklch(${light} 0.10 75 / ${alpha})`;
  return `oklch(${light} ${m.chroma} ${m.hue} / ${alpha})`;
};

const Heatmap = ({ daily, dateFilter, sourceFilter, onFilterChange }) => {
  const [view, setView] = useState(() => localStorage.getItem("horkos.heatmapView") || "heat");
  useEffect(() => { localStorage.setItem("horkos.heatmapView", view); }, [view]);

  // Hover popover state. We use a timeout so the cursor can travel from
  // the cell into the popover without the popover dismissing en route.
  const [hover, setHover] = useState(null);  // { key, entry, anchor:{left,top} }
  const hoverTimeoutRef = useRef(null);
  const cancelHoverDismiss = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };
  const scheduleHoverDismiss = () => {
    cancelHoverDismiss();
    hoverTimeoutRef.current = setTimeout(() => setHover(null), 150);
  };
  useEffect(() => () => cancelHoverDismiss(), []);

  // Roll the per-source rows up to per-day { total, bySource }.
  const dayMap = useMemo(() => {
    const m = new Map();
    (daily || []).forEach(r => {
      const key = String(r.day).slice(0, 10);
      const src = r.source_code || "??";
      const n   = Number(r.posts) || 0;
      const entry = m.get(key) || { total: 0, bySource: {} };
      entry.bySource[src] = (entry.bySource[src] || 0) + n;
      entry.total += n;
      m.set(key, entry);
    });
    return m;
  }, [daily]);

  // Build the 52w × 7d grid ending today, scoped by active source filter.
  const { grid, total, heaviest, weekTotals, sourcesInData } = useMemo(() => {
    const today = new Date();
    today.setUTCHours(0,0,0,0);
    const daysBack = 52 * 7;
    const cells = [];
    for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const entry = dayMap.get(key) || { total: 0, bySource: {} };
      // If a source filter is set, intensity comes from that source only;
      // otherwise it's the total and the dominant source picks the hue.
      const effective = sourceFilter
        ? (entry.bySource[sourceFilter] || 0)
        : entry.total;
      let dominant = sourceFilter || null;
      if (!dominant) {
        let bestN = 0;
        for (const [s, n] of Object.entries(entry.bySource)) {
          if (n > bestN) { bestN = n; dominant = s; }
        }
      }
      cells.push({ key, effective, dominant, entry });
    }
    const max = Math.max(1, ...cells.map(c => c.effective));
    const bucket = (n) => {
      if (n <= 0) return 0;
      const r = n / max;
      if (r > 0.85) return 4;
      if (r > 0.65) return 3;
      if (r > 0.40) return 2;
      return 1;
    };
    const grid = [];
    let acc = [];
    cells.forEach(c => {
      acc.push({ ...c, v: bucket(c.effective) });
      if (acc.length === 7) { grid.push(acc); acc = []; }
    });
    if (acc.length) grid.push(acc);
    const total    = cells.filter(c => c.effective > 0).length;
    const heaviest = Math.max(0, ...cells.map(c => c.effective));
    const weekTotals = grid.map(week => week.reduce((s, c) => s + c.effective, 0));
    const sourcesInData = new Set();
    cells.forEach(c => Object.keys(c.entry.bySource).forEach(s => sourcesInData.add(s)));
    return { grid, total, heaviest, weekTotals, sourcesInData };
  }, [dayMap, sourceFilter]);

  // Stable order for the legend.
  const legendCodes = SOURCE_CODES.filter(c => sourcesInData.has(c));

  // 30 most-recent days for the BAR view — daily granularity reads
  // much better than weekly for sparse archives (1–3 fat bars instead
  // of one solitary pixel at the right edge of 52 weeks). The 52-week
  // at-a-glance view is what the HEAT toggle is for.
  const BAR_DAYS = 30;
  const dailyData = useMemo(() => {
    const today = new Date();
    today.setUTCHours(0,0,0,0);
    const out = [];
    for (let i = BAR_DAYS - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const entry = dayMap.get(key) || { total: 0, bySource: {} };
      out.push({ key, entry, date: d });
    }
    return out;
  }, [dayMap]);
  const maxDayTotal = useMemo(
    () => Math.max(1, ...dailyData.map(d => d.entry.total)),
    [dailyData]
  );

  // Hover handlers — we anchor the popover to the hovered element in
  // viewport coords and render it position:fixed so the parent panel's
  // overflow doesn't clip it. Both cells (day-mode) and bars (week-mode)
  // feed into the same `hover` state shape.
  const onCellEnter = (e, cell) => {
    cancelHoverDismiss();
    const r = e.currentTarget.getBoundingClientRect();
    const dayLabel = new Date(cell.key + "T00:00:00Z").toUTCString().slice(0, 16);
    setHover({
      key: cell.key,
      entry: cell.entry,
      anchor: { left: r.left + r.width / 2, top: r.top },
      label: dayLabel,
      isWeek: false,
    });
  };

  const onBarEnter = (e, day) => {
    cancelHoverDismiss();
    const r = e.currentTarget.getBoundingClientRect();
    // Same label format as the heatmap cell hover so the two views
    // feel like one component.
    const label = day.date.toUTCString().slice(0, 16);
    setHover({
      key: day.key,
      entry: day.entry,
      anchor: { left: r.left + r.width / 2, top: r.top },
      label,
      isWeek: false,
    });
  };

  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

  // Pre-compute popover position + content (only when hovered). Same
  // popover shell renders both day-level (heatmap) and week-level (bar
  // chart) breakdowns — `hover.label` and `hover.isWeek` flip the copy
  // and the row click behaviour.
  let popover = null;
  if (hover) {
    const e = hover.entry || { total: 0, bySource: {} };
    const breakdown = Object.entries(e.bySource).sort((a, b) => b[1] - a[1]);
    const maxN = Math.max(1, ...breakdown.map(x => x[1]));
    const popW = 240;
    let left = hover.anchor.left;
    const minLeft = popW / 2 + 8;
    const maxLeft = (typeof window !== "undefined" ? window.innerWidth : 1440) - popW / 2 - 8;
    if (left < minLeft) left = minLeft;
    if (left > maxLeft) left = maxLeft;
    const top = hover.anchor.top - 6;
    popover = (
      <div
        className="hm-popover"
        style={{ left, top, width: popW }}
        onMouseEnter={cancelHoverDismiss}
        onMouseLeave={scheduleHoverDismiss}
      >
        <div className="hm-popover-head">
          <span className="amber">{hover.label}</span>
          <span className="dim">{e.total} POST{e.total === 1 ? "" : "S"}</span>
        </div>
        {breakdown.length === 0 ? (
          <div className="hm-popover-empty dim">NO ACTIVITY</div>
        ) : breakdown.map(([code, n]) => {
          const meta = SOURCE_META[code] || { label: code };
          const pct = (n / maxN) * 100;
          const filterTitle = hover.isWeek
            ? `Filter feed by source: ${meta.label}`
            : `Filter feed: ${hover.label} · ${meta.label}`;
          return (
            <button
              key={code}
              type="button"
              className="hm-popover-row"
              onClick={() => {
                if (hover.isWeek) {
                  onFilterChange && onFilterChange({ source: code });
                } else {
                  onFilterChange && onFilterChange({ day: hover.key, source: code });
                }
                setHover(null);
              }}
              title={filterTitle}
            >
              <span className="hm-popover-code" style={{ color: sourceColor(code, 1, 0.78) }}>{code}</span>
              <span className="hm-popover-bar-wrap">
                <span
                  className="hm-popover-bar"
                  style={{ width: `${pct}%`, background: sourceColor(code, 0.85, 0.72) }}
                />
              </span>
              <span className="hm-popover-n">{n}</span>
            </button>
          );
        })}
        <div className="hm-popover-foot dim">
          {hover.isWeek
            ? "ROW · ISOLATE SOURCE"
            : "ROW · DAY + SOURCE   ·   CELL · DAY ONLY"}
        </div>
      </div>
    );
  }

  return (
    <section className="panel corners">
      <div className="panel-head">
        <div className="left"><span className="amber">▌</span> ACTIVITY_HEATMAP · 52W</div>
        <div className="right">
          <span>{total} ACTIVE DAYS</span>
          <span className="amber">PEAK {heaviest}/D</span>
          <div className="theme-switch" role="group" aria-label="View" style={{marginLeft:8}}>
            <button className={view === "heat" ? "on" : ""} onClick={() => setView("heat")} title="Heatmap">
              <Icon k="grid" /> HEAT
            </button>
            <button className={view === "bar" ? "on" : ""} onClick={() => setView("bar")} title="Bar chart">
              <Icon k="bars" /> BAR
            </button>
          </div>
        </div>
      </div>
      <div className="panel-body">
        {view === "heat" ? (
          <div className="heatmap heatmap-lg">
            {/* Source legend chips · doubles as filter */}
            {legendCodes.length > 0 && (
              <div className="hm-legend">
                <span className="hm-legend-label dim">SOURCES</span>
                {legendCodes.map(code => {
                  const active = sourceFilter === code;
                  const meta = SOURCE_META[code];
                  return (
                    <button
                      key={code}
                      type="button"
                      className={`hm-src-chip ${active ? "on" : ""} ${sourceFilter && !active ? "muted" : ""}`}
                      style={{ "--src-color": sourceColor(code, 1, 0.72) }}
                      onClick={() => onFilterChange && onFilterChange({ source: active ? null : code })}
                      title={active ? "Clear source filter" : `Filter to ${meta?.label || code}`}
                    >
                      <span className="hm-src-swatch" />
                      {code}
                    </button>
                  );
                })}
                {sourceFilter && (
                  <button
                    type="button"
                    className="hm-src-clear"
                    onClick={() => onFilterChange && onFilterChange({ source: null })}
                    title="Show all sources"
                  >
                    × ALL
                  </button>
                )}
              </div>
            )}

            <div style={{display:"grid", gridTemplateColumns:"16px 1fr", gap:4}}>
              <div></div>
              <div style={{display:"grid", gridTemplateColumns:"repeat(12, 1fr)", fontSize:9, letterSpacing:"0.12em", color:"var(--fg-4)"}}>
                {months.map(m => <div key={m}>{m}</div>)}
              </div>
            </div>
            <div className="grid">
              <div className="days">
                <span></span><span>MON</span><span></span><span>WED</span><span></span><span>FRI</span><span></span>
              </div>
              <div className="cells">
                {grid.map((week, wi) =>
                  week.map((c, di) => {
                    const isActiveDay = dateFilter === c.key;
                    const inlineStyle = c.v === 0 ? undefined : {
                      background:   sourceColor(c.dominant, 0.25 + 0.18 * c.v, 0.72),
                      borderColor:  sourceColor(c.dominant, 0.45 + 0.13 * c.v, 0.72),
                    };
                    return (
                      <div
                        key={`${wi}-${di}`}
                        className={`cell hm-cell v${c.v}${isActiveDay ? " is-active" : ""}${c.v === 0 ? " is-empty" : ""}`}
                        style={inlineStyle}
                        onMouseEnter={(e) => onCellEnter(e, c)}
                        onMouseLeave={scheduleHoverDismiss}
                        onClick={() => {
                          if (isActiveDay) onFilterChange && onFilterChange({ day: null });
                          else onFilterChange && onFilterChange({ day: c.key });
                        }}
                      />
                    );
                  })
                )}
              </div>
            </div>
            <div className="legend" style={{justifyContent:"space-between"}}>
              <span>HOVER · BREAKDOWN   ·   CLICK CELL · DAY   ·   CLICK CHIP · SOURCE</span>
              <span style={{display:"flex", alignItems:"center", gap:6}}>
                LESS
                <span className="swatches">
                  <span className="cell v0"></span>
                  <span className="cell v1"></span>
                  <span className="cell v2"></span>
                  <span className="cell v3"></span>
                  <span className="cell v4"></span>
                </span>
                MORE
              </span>
            </div>
            {popover}
          </div>
        ) : (
          // ── Stacked daily bar chart · last 30 days ────────────────────
          // One bar per day. Segments inside the bar are per-source
          // (FB / X / YT / …) sized by that source's share of the day's
          // posts. Bar height = posts that day, normalised against the
          // busiest day in the window. Hover shares the heatmap's
          // popover; click a colored segment to filter to day + source,
          // click the bar body to filter to that day only. Same as the
          // heatmap cells, just zoomed in to the recent window where
          // sparse activity is still legible.
          <div className="hm-bars-wrap">
            {/* Source legend — same component as in the heatmap view so
                the user has a single mental model for coloring + filter. */}
            {legendCodes.length > 0 && (
              <div className="hm-legend">
                <span className="hm-legend-label dim">SOURCES</span>
                {legendCodes.map(code => {
                  const active = sourceFilter === code;
                  const meta = SOURCE_META[code];
                  return (
                    <button
                      key={code}
                      type="button"
                      className={`hm-src-chip ${active ? "on" : ""} ${sourceFilter && !active ? "muted" : ""}`}
                      style={{ "--src-color": sourceColor(code, 1, 0.72) }}
                      onClick={() => onFilterChange && onFilterChange({ source: active ? null : code })}
                      title={active ? "Clear source filter" : `Filter to ${meta?.label || code}`}
                    >
                      <span className="hm-src-swatch" />
                      {code}
                    </button>
                  );
                })}
                {sourceFilter && (
                  <button
                    type="button"
                    className="hm-src-clear"
                    onClick={() => onFilterChange && onFilterChange({ source: null })}
                    title="Show all sources"
                  >
                    × ALL
                  </button>
                )}
              </div>
            )}

            <div className="hm-bars-chart">
              {/* Y axis · peak / half / 0 */}
              <div className="hm-bars-yaxis">
                <span className="hm-bars-y-top">{maxDayTotal}</span>
                <span className="hm-bars-y-mid dim">{Math.round(maxDayTotal / 2)}</span>
                <span className="hm-bars-y-bot">0</span>
              </div>

              {/* The bars themselves · one per day, full panel width */}
              <div className="hm-bars">
                <div className="hm-bars-grid">
                  <div /><div /><div /><div />
                </div>
                {dailyData.map((d, di) => {
                  const codes = SOURCE_CODES.filter(c => (d.entry.bySource[c] || 0) > 0);
                  // When a source filter is active, only that source's
                  // contribution drives bar height (matches the heatmap's
                  // "isolate" behaviour).
                  const effectiveTotal = sourceFilter
                    ? (d.entry.bySource[sourceFilter] || 0)
                    : d.entry.total;
                  const stackH = (effectiveTotal / maxDayTotal) * 100;
                  const renderCodes = sourceFilter ? [sourceFilter] : codes;
                  const isActiveDay = dateFilter === d.key;
                  return (
                    <button
                      key={d.key}
                      type="button"
                      className={`hm-bar ${effectiveTotal === 0 ? "is-empty" : ""}${isActiveDay ? " is-active" : ""}`}
                      onMouseEnter={(e) => onBarEnter(e, d)}
                      onMouseLeave={scheduleHoverDismiss}
                      onClick={() => {
                        // Bar body click = filter feed to that day,
                        // toggling off if it's already the active day.
                        if (isActiveDay) onFilterChange && onFilterChange({ day: null });
                        else onFilterChange && onFilterChange({ day: d.key });
                        setHover(null);
                      }}
                      aria-label={`${d.key}: ${effectiveTotal} posts`}
                    >
                      <div className="hm-bar-stack" style={{ height: `${stackH}%` }}>
                        {renderCodes.map((code) => {
                          const n = d.entry.bySource[code] || 0;
                          if (n === 0) return null;
                          const segPct = sourceFilter ? 100 : (n / effectiveTotal) * 100;
                          return (
                            <span
                              key={code}
                              className="hm-bar-seg"
                              style={{
                                height: `${segPct}%`,
                                background: sourceColor(code, 0.92, 0.70),
                                borderTopColor: sourceColor(code, 1, 0.80),
                              }}
                              onClick={(ev) => {
                                ev.stopPropagation();
                                onFilterChange && onFilterChange({ day: d.key, source: code });
                                setHover(null);
                              }}
                              title={`Filter feed: ${d.key} · ${SOURCE_META[code]?.label || code}`}
                            />
                          );
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* X axis · date markers every 5 days, anchored to today so
                the latest day always gets a label. */}
            <div className="hm-bars-x-axis">
              <div /> {/* spacer matching the y-axis column */}
              <div className="hm-bars-x-ticks">
                {dailyData.map((d, di) => {
                  const fromEnd = dailyData.length - 1 - di;
                  const show = fromEnd % 5 === 0;
                  if (!show) return <span key={d.key} />;
                  const label = `${months[d.date.getUTCMonth()]} ${d.date.getUTCDate()}`;
                  return <span key={d.key}>{label}</span>;
                })}
              </div>
            </div>

            <div className="legend" style={{justifyContent:"space-between"}}>
              <span>DAILY TOTALS · LAST {BAR_DAYS} DAYS · STACKED BY SOURCE</span>
              <span className="dim">HOVER · BREAKDOWN   ·   CLICK BAR · DAY   ·   CLICK SEGMENT · DAY + SOURCE</span>
            </div>
            {popover}
          </div>
        )}
      </div>
    </section>
  );
};

// ── Stat grid ─────────────────────────────────────────────────────────
const StatGrid = ({ delta }) => {
  const live30d = (() => {
    const d = delta?.delta_pct;
    if (d == null) return "—";
    const arrow = d >= 0 ? "↑" : "↓";
    return `${arrow} ${Math.abs(d)}% vs prev`;
  })();
  const stats = [
    { k: "30D POSTS", v: String(delta?.posts_30d ?? 0), d: live30d },
    ...window.HARDCODED.STAT_TILES,
  ];
  return (
    <section className="statgrid">
      {stats.map(s => (
        <div key={s.k} className="stat">
          <div className="k">{s.k}</div>
          <div className="v">{s.v}</div>
          <div className="d">{s.d}</div>
        </div>
      ))}
    </section>
  );
};

// ── Toolbar ───────────────────────────────────────────────────────────
const Toolbar = ({ query, setQuery, mediaFilter, setMediaFilter, topicFilter, setTopicFilter, count, topics }) => (
  <div className="toolbar">
    <div className="search">
      <Icon k="search" />
      <input
        placeholder="QUERY > grep posts where text ~ ..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <span className="dim">/</span>
    </div>
    <div style={{display:"flex", gap:6}}>
      {["ALL","TEXT","IMAGE","VIDEO"].map(m => (
        <button key={m} className={"chip" + (mediaFilter === m ? " active" : "")} onClick={() => setMediaFilter(m)}>
          {m === "TEXT" && <Icon k="text" />}
          {m === "IMAGE" && <Icon k="image" />}
          {m === "VIDEO" && <Icon k="video" />}
          {m}
        </button>
      ))}
    </div>
    <div style={{width:1, alignSelf:"stretch", background:"var(--line)"}}></div>
    <div style={{display:"flex", gap:6, overflowX:"auto", maxWidth:"32%"}}>
      {topics.slice(0,5).map(t => (
        <button key={t.id} className={"chip" + (topicFilter === t.label ? " active" : "")}
                onClick={() => setTopicFilter(topicFilter === t.label ? null : t.label)}>
          {t.label}<span className="dim2" style={{marginLeft:4}}>{t.count}</span>
        </button>
      ))}
    </div>
    <div className="spacer-h"></div>
    <div className="dim" style={{fontSize:10, letterSpacing:"0.12em"}}>{count} HITS</div>
  </div>
);

// ── Post row ──────────────────────────────────────────────────────────
// Compact number formatter for engagement counts (1234 → "1.2k").
const fmtN = (n) => {
  if (n == null) return "0";
  const v = Number(n) || 0;
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (v >= 1_000)     return (v / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(v);
};

const PostRow = ({ post, index, expanded, onToggle, onOpen, onEdit, adminMode }) => {
  const mtype = post.media_kind || post.media || "text";
  const r = post.reactions || {};
  // Show the date the post was *published*, falling back to capture time
  // for older rows that pre-date the ingestion-time publish_at column.
  const postedRaw = post.published_at || post.captured_at;
  const postedShort = postedRaw ? new Date(postedRaw).toISOString().slice(0, 10) : "";
  return (
    <div className={"row" + (expanded ? " expanded active" : "")} onClick={() => onToggle(post._uuid)}>
      <div className="date" title={postedRaw ? `Published ${postedRaw}` : ""}>{postedShort}</div>
      <div className="src">
        <span className="src-mark">{post.source}</span>
        <span>{post.source}</span>
      </div>
      <div className={`mtype ${mtype}`}>
        <Icon k={mtype} />
      </div>
      <div className="sum">{post.summary}</div>
      <div className="engage">
        <span className="e-item" title={`${(r.likes || 0).toLocaleString()} likes`}>
          <Icon k="heart" /> {fmtN(r.likes)}
        </span>
        <span className="e-item" title={`${(r.comments || 0).toLocaleString()} comments`}>
          <Icon k="comment" /> {fmtN(r.comments)}
        </span>
        <span className="e-item" title={`${(r.shares || 0).toLocaleString()} shares`}>
          <Icon k="share" /> {fmtN(r.shares)}
        </span>
      </div>
      <div className="topics">
        {(post.topics || []).slice(0,2).map(t => {
          const color = t === "CORRUPTION" || t === "MEDIA_FREE" || t === "PROTEST" ? "amber"
                       : t === "RULE_OF_LAW" || t === "UKRAINE" ? "red" : "cyan";
          return <span key={t} className={`tag ${color}`}>{t}</span>;
        })}
        {/* No fallback tag — an empty topics list is fine; "PERSONAL"
            was meaningless and was visually colliding with the engage
            column on narrow viewports. */}
      </div>
      <div className="act" style={{display:"flex", gap:4}}>
        {adminMode && (
          <button className="iconbtn" onClick={(e) => { e.stopPropagation(); onEdit(post); }} title="Edit">
            <Icon k="edit" />
          </button>
        )}
        <button className="iconbtn" onClick={(e) => { e.stopPropagation(); onOpen(post); }} title="Pop out">
          <Icon k="popout" />
        </button>
      </div>

      {expanded && (
        <div className="expand-area" onClick={(e) => e.stopPropagation()}>
          <div className={`media-thumb ${mtype}`} onClick={() => onOpen(post)}>
            {mtype === "image" && (post.media && post.media[0] && post.media[0].url
              ? <img src={post.media[0].url} alt="" style={{maxHeight:140, maxWidth:"100%"}} />
              : <span>[ IMAGE ]</span>)}
            {mtype === "video" && <><Icon k="play" size={20} /><span style={{marginLeft:8}}>[ VIDEO ]</span></>}
            {mtype === "text"  && <span>[ TEXT ONLY ]</span>}
          </div>
          <div className="body">
            <div className="label">PREVIEW · 10-LINE CAP · CLICK TO POP OUT</div>
            {post.preview}
          </div>
          <div className="meta">
            <div className="kv"><span className="k">URL</span><span className="v"><Icon k="link" /> {post.url}</span></div>
            <div className="kv"><span className="k">CAPTURED</span><span className="v">{post.date} UTC</span></div>
            <div className="kv"><span className="k">DISCOURSE</span><span className="v">{(post.participants || 0).toLocaleString()} commenters</span></div>
            <div className="reactions">
              <div className="r"><span className="k">LIKES</span><span className="v">{(post.reactions.likes || 0).toLocaleString()}</span></div>
              <div className="r"><span className="k">REPLIES</span><span className="v">{(post.reactions.comments || 0).toLocaleString()}</span></div>
              <div className="r"><span className="k">SHARES</span><span className="v">{(post.reactions.shares || 0).toLocaleString()}</span></div>
            </div>
            <button className="chip active" style={{justifyContent:"center"}} onClick={() => onOpen(post)}>
              OPEN FULL RECORD →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Modal (read-only post pop-out) ────────────────────────────────────
const PostModal = ({ post, onClose, onEdit, adminMode }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (!post) return null;
  const mtype = post.media_kind || post.media || "text";
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{display:"flex", alignItems:"center", gap:12}}>
            <div className="controls"><span></span><span></span><span></span></div>
            <span className="amber">▌</span>
            <span>RECORD · {post.code || post.id}</span>
            <span className="dim">· {post.source} · {post.date}</span>
          </div>
          <div style={{display:"flex", alignItems:"center", gap:14}}>
            <span className="dim">SHA · {(post.sha256 || "—").slice(0, 12)}</span>
            {adminMode && (
              <button className="iconbtn" onClick={() => onEdit(post)} title="Edit"><Icon k="edit" /></button>
            )}
            <button className="iconbtn" onClick={onClose}><Icon k="x" /></button>
          </div>
        </div>

        <div className="modal-body">
          <div className="left-pane">
            <div>
              <div className="dim u" style={{fontSize:10, marginBottom:6}}>HEADLINE / SUMMARY</div>
              <div className="disp" style={{fontSize:24, fontWeight:600, lineHeight:1.15}}>{post.summary}</div>
            </div>

            <div className={`hero ${mtype}`}>
              {mtype === "image" && (post.media && post.media[0] && post.media[0].url
                ? <img src={post.media[0].url} alt="" style={{maxWidth:"100%", maxHeight:380}}/>
                : <span>[ FULL-RES IMAGE ]</span>)}
              {mtype === "video" && <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:10}}>
                <div className="playicon"><Icon k="play" size={22} /></div>
                <span>[ VIDEO ]</span>
              </div>}
              {mtype === "text" && <span>[ TEXT-ONLY POST · NO ATTACHED MEDIA ]</span>}
            </div>

            <div>
              <div className="dim u" style={{fontSize:10, marginBottom:8}}>FULL TEXT // CAPTURED VERBATIM</div>
              <div className="full-text">{post.full}</div>
            </div>
          </div>

          <div className="right-pane">
            <div>
              <div className="dim u" style={{fontSize:10, marginBottom:6}}>SOURCE</div>
              <div style={{display:"flex", alignItems:"center", gap:8}}>
                <span className="src-mark">{post.source}</span>
                <a className="cyan" style={{fontSize:11}} href={post.url} target="_blank" rel="noreferrer">{post.url}</a>
              </div>
            </div>

            <div>
              <div className="dim u" style={{fontSize:10, marginBottom:6}}>TOPICS</div>
              <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
                {(post.topics || []).length ? post.topics.map(t => (
                  <span key={t} className={`tag ${t === "RULE_OF_LAW" || t === "UKRAINE" ? "red" : "amber"}`}>{t}</span>
                )) : <span className="tag dim">PERSONAL</span>}
              </div>
            </div>

            <div>
              <div className="dim u" style={{fontSize:10, marginBottom:6}}>DISCOURSE</div>
              <div className="bar"><span className="barlabel">LIKES</span><div className="track"><div className="fill" style={{width:`${Math.min(100, (post.reactions.likes||0)/1000)}%`}}></div></div><span className="val">{((post.reactions.likes||0)/1000).toFixed(1)}k</span></div>
              <div className="bar"><span className="barlabel">REPLIES</span><div className="track"><div className="fill cyan" style={{width:`${Math.min(100, (post.reactions.comments||0)/200)}%`}}></div></div><span className="val">{((post.reactions.comments||0)/1000).toFixed(1)}k</span></div>
              <div className="bar"><span className="barlabel">SHARES</span><div className="track"><div className="fill red" style={{width:`${Math.min(100, (post.reactions.shares||0)/400)}%`}}></div></div><span className="val">{((post.reactions.shares||0)/1000).toFixed(1)}k</span></div>
            </div>

            <div>
              <div className="dim u" style={{fontSize:10, marginBottom:6}}>CROSS-REFERENCES</div>
              <div style={{display:"flex", flexDirection:"column", gap:4, fontSize:11}}>
                <div className="dim">↳ archived to cold-storage</div>
                <div className="dim">↳ verbatim hash on file</div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <div style={{display:"flex", gap:14}}>
            <span>⌘ + C COPY</span>
            <span>⌘ + S SAVE</span>
            <span className="amber">ESC CLOSE</span>
          </div>
          <div className="dim">HORKOS // IMMUTABLE RECORD // {post.code || post.id}</div>
        </div>
      </div>
    </div>
  );
};

// ── Right rail ────────────────────────────────────────────────────────
const RightBar = () => {
  const topics = window.HARDCODED.TOPICS;
  const events = window.HARDCODED.RECENT_EVENTS;
  const contradictions = window.HARDCODED.CONTRADICTIONS;
  const total = topics.reduce((a, t) => a + t.count, 0);
  return (
    <aside className="rightbar">
      <section className="panel">
        <div className="panel-head"><div className="left"><span className="amber">▌</span> LIVE LOG</div><div className="right dim">06:42</div></div>
        <div className="panel-body" style={{padding: "8px 12px"}}>
          {events.map((e, i) => (
            <div key={i} className="event-row">
              <div className="t">{e.t}</div>
              <div className="e">{e.e}</div>
              <div className="c">{e.c}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><div className="left"><span className="amber">▌</span> TOPIC DIST.</div><div className="right dim">365D</div></div>
        <div className="panel-body" style={{display:"flex", flexDirection:"column", gap:6}}>
          {topics.map(t => {
            const pct = (t.count / total) * 100;
            const cls = t.color === "red" ? "red" : t.color === "cyan" ? "cyan" : "";
            return (
              <div key={t.id} className="bar">
                <span className="barlabel">{t.label}</span>
                <div className="track"><div className={`fill ${cls}`} style={{width: `${pct*3}%`}}></div></div>
                <span className="val">{t.count}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><div className="left"><span className="amber">▌</span> POSTING RHYTHM</div><div className="right dim">UTC</div></div>
        <div className="panel-body">
          <svg viewBox="0 0 240 80" width="100%" height="80" style={{display:"block"}}>
            {Array.from({length: 24}).map((_, h) => {
              const v = (Math.sin(h/3.5) + 1) * 30 + Math.cos(h/1.7) * 8 + 18;
              const x = h * 10 + 5;
              return <rect key={h} x={x} y={70-v} width="6" height={v} fill={h>=17 && h<=22 ? "var(--amber)" : "var(--bg-3)"} stroke="var(--line)" />;
            })}
            <line x1="0" y1="70" x2="240" y2="70" stroke="var(--line-2)" />
            {[0,6,12,18,23].map(h => (
              <text key={h} x={h*10 + 8} y="79" fontSize="6" fill="var(--fg-4)" fontFamily="var(--mono)" textAnchor="middle">{String(h).padStart(2,"0")}</text>
            ))}
          </svg>
          <div className="dim" style={{fontSize:10, marginTop:4}}>PEAK WINDOW <span className="amber">17:00 – 22:00</span> · 64% OF POSTS</div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><div className="left"><span className="amber">▌</span> CONTRADICTION LOG</div><div className="right red">{String(contradictions.length).padStart(2,"0")} OPEN</div></div>
        <div className="panel-body" style={{fontSize:11, display:"flex", flexDirection:"column", gap:8}}>
          {contradictions.map((c, i) => (
            <div key={i} style={{borderLeft:"2px solid var(--red)", paddingLeft:8}}>
              <div className="dim u" style={{fontSize:9}}>{c.span}</div>
              <div>{c.text}</div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
};

// expose
Object.assign(window, {
  TopBar, SideBar, SubjectCard, Heatmap, StatGrid, Toolbar, PostRow, PostModal, RightBar, Icon
});
