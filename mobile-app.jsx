/* HORKOS — Mobile app */
const { useState, useMemo, useEffect } = React;

const I = {
  search: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="7" cy="7" r="4.5"/><path d="M11 11l3.5 3.5"/></svg>,
  filter: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M2 4h12M4 8h8M6 12h4"/></svg>,
  bell:   <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11V7a4 4 0 0 1 8 0v4l1 1H3z"/><path d="M6.5 13a1.5 1.5 0 0 0 3 0"/></svg>,
  sun:    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3"/></svg>,
  moon:   <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M13 9.5A5 5 0 1 1 6.5 3a4 4 0 0 0 6.5 6.5z"/></svg>,
  chev:   <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M6 3l5 5-5 5"/></svg>,
  chevD:  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M3 6l5 5 5-5"/></svg>,
  x:      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M3 3l10 10M13 3L3 13"/></svg>,
  image:  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="12" height="10"/><circle cx="6" cy="7" r="1"/><path d="M2 11l3-3 4 4 2-2 3 3"/></svg>,
  video:  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="9" height="8"/><path d="M11 7l3-2v6l-3-2z"/></svg>,
  text:   <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M3 4h10M5 8h6M3 12h10"/></svg>,
  play:   <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3l8 5-8 5z"/></svg>,
  users:  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="2.2"/><circle cx="11.5" cy="6" r="2"/><path d="M2 13c0-2 1.8-3.4 4-3.4s4 1.4 4 3.4"/><path d="M9.5 13c.2-1.8 1.7-3 3.5-3s3 1.2 3 3"/></svg>,
  link:   <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M7 9a2.5 2.5 0 0 0 3.5 0l2-2a2.5 2.5 0 0 0-3.5-3.5L8 4.5"/><path d="M9 7a2.5 2.5 0 0 0-3.5 0l-2 2A2.5 2.5 0 0 0 7 12.5L8 11.5"/></svg>,
};

const topicColor = (t) => (
  t === "RULE_OF_LAW" || t === "UKRAINE" ? "red"
  : t === "EU_POLICY" || t === "ELECTION" || t === "ECONOMY" ? "cyan"
  : "amber"
);

// ── Top bar ───────────────────────────────────────────────────────────
function MobileTop({ theme, setTheme, onSearch }) {
  return (
    <>
      <div className="mtop">
        <div className="brand">
          <div className="mark">H</div>
          <div className="word">HORKOS</div>
        </div>
        <div className="actions">
          <button className="iconbtn" onClick={onSearch} aria-label="Search">{I.search}</button>
          <button className="iconbtn" aria-label="Notifications">{I.bell}</button>
          <button className="iconbtn on" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Theme">
            {theme === "dark" ? I.sun : I.moon}
          </button>
        </div>
      </div>
      <div className="mstrip">
        <span><span className="led"></span>LIVE · SYNC 06:42</span>
        <span style={{color:"var(--amber)"}}>OP · ANALYST_03</span>
      </div>
    </>
  );
}

// ── Subject hero ──────────────────────────────────────────────────────
function MobileHero({ subject }) {
  return (
    <div className="mhero">
      <div className="photo">[ PORTRAIT ]</div>
      <div className="info">
        <div className="codename">SUBJECT // {subject.codename}</div>
        <div className="name">{subject.name}</div>
        <div className="role">{subject.role}</div>
        <div className="counters">
          <span><b>{subject.total_posts.toLocaleString()}</b> POSTS</span>
          <span className="v"><b style={{color:"inherit"}}>{subject.total_videos}</b> VID</span>
          <span><b>{subject.total_images}</b> IMG</span>
          <span className="r"><b style={{color:"inherit"}}>{subject.total_lawsuits}</b> LX</span>
        </div>
      </div>
      <div className="switch">SWITCH {I.chev}</div>
    </div>
  );
}

// ── Heatmap ──────────────────────────────────────────────────────────
function MobileHeatmap({ grid }) {
  const total = grid.flat().reduce((a,b)=>a+(b>0?1:0), 0);
  return (
    <div className="mheatmap">
      <h3>
        <span>ACTIVITY · 52W</span>
        <span><span className="amber">{total} ACTIVE DAYS</span></span>
      </h3>
      <div className="cells-wrap">
        <div className="cells">
          {grid.map((week, wi) =>
            week.map((v, di) => (
              <div key={`${wi}-${di}`} className={`mcell v${v}`} title={`W${wi+1} D${di+1}: ${v}`}></div>
            ))
          )}
        </div>
      </div>
      <div className="legend">
        <span>MAY 25 → MAY 26</span>
        <span className="swatches">
          LESS
          <span className="mcell v1"></span>
          <span className="mcell v2"></span>
          <span className="mcell v3"></span>
          <span className="mcell v4"></span>
          MORE
        </span>
      </div>
    </div>
  );
}

// ── Filter chips ─────────────────────────────────────────────────────
function MobileFilters({ mediaFilter, setMediaFilter, topicFilter, setTopicFilter, topics }) {
  const mediaOpts = [
    { v: "ALL",   l: "ALL",   icon: null },
    { v: "TEXT",  l: "TEXT",  icon: I.text },
    { v: "IMAGE", l: "IMAGE", icon: I.image },
    { v: "VIDEO", l: "VIDEO", icon: I.video },
  ];
  return (
    <div className="mfilters">
      {mediaOpts.map(o => (
        <button key={o.v} className={"mchip" + (mediaFilter === o.v ? " active" : "")} onClick={() => setMediaFilter(o.v)}>
          {o.icon}{o.l}
        </button>
      ))}
      <div style={{width: 1, alignSelf: "stretch", background: "var(--line)", flexShrink:0}}></div>
      {topics.map(t => (
        <button key={t.id} className={"mchip" + (topicFilter === t.label ? " active" : "")}
                onClick={() => setTopicFilter(topicFilter === t.label ? null : t.label)}>
          {t.label}<span className="ct">{t.count}</span>
        </button>
      ))}
    </div>
  );
}

// ── Feed card ────────────────────────────────────────────────────────
function MobileCard({ post, expanded, onToggle, onOpen }) {
  const m = post.media;
  return (
    <article className={`mcard ${m}`} onClick={() => onToggle(post.id)}>
      <div className="head">
        <div className="left">
          <span className="src-mark">{post.source}</span>
          <span>{post.date}</span>
          <span className="mtype">{I[m]}</span>
        </div>
        <span>{post.id}</span>
      </div>

      <div className="summary">{post.summary}</div>

      {m === "image" && (
        <div className="thumb" onClick={(e) => { e.stopPropagation(); onOpen(post); }}>
          [ IMAGE · 1920 × 1280 ]
        </div>
      )}
      {m === "video" && (
        <div className="thumb" onClick={(e) => { e.stopPropagation(); onOpen(post); }}>
          <div className="play">{I.play}</div>
          <div className="duration">02:14</div>
        </div>
      )}

      <div className="meta">
        <div className="topics">
          {post.topics.length
            ? post.topics.slice(0,3).map(t => <span key={t} className={`mtag ${topicColor(t)}`}>{t}</span>)
            : <span className="mtag">PERSONAL</span>}
        </div>
        <div className="ppl">{I.users}<span>{post.participants.toLocaleString()}</span></div>
      </div>

      {expanded && (
        <>
          <div className="preview" onClick={(e) => e.stopPropagation()}>
            <div className="label">PREVIEW · 10-LINE CAP</div>
            {post.preview}
          </div>
          <button className="expand-link" onClick={(e) => { e.stopPropagation(); onOpen(post); }}>
            OPEN FULL RECORD {I.chev}
          </button>
        </>
      )}
    </article>
  );
}

// ── Detail sheet ─────────────────────────────────────────────────────
function MobileSheet({ post, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (!post) return null;
  const m = post.media;
  return (
    <div className="msheet-backdrop" onClick={onClose}>
      <div className="msheet" onClick={e => e.stopPropagation()}>
        <div className="handle"><span></span></div>
        <div className="shead">
          <div className="id">{post.source} · {post.id}</div>
          <button className="close" onClick={onClose} aria-label="Close">{I.x}</button>
        </div>

        <div className="sbody">
          <div>
            <div style={{fontSize:9, letterSpacing:"0.18em", color:"var(--fg-4)", textTransform:"uppercase", marginBottom:6}}>HEADLINE / SUMMARY</div>
            <div className="stitle">{post.summary}</div>
          </div>

          {m !== "text" && (
            <div className={`hero ${m}`}>
              {m === "image" && <span>[ FULL-RES IMAGE — PINCH TO ZOOM ]</span>}
              {m === "video" && <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:8}}>
                <div className="playicon">{I.play}</div>
                <span>[ VIDEO · 02:14 · CAPTIONS ]</span>
              </div>}
            </div>
          )}

          <div>
            <div style={{fontSize:9, letterSpacing:"0.18em", color:"var(--fg-4)", textTransform:"uppercase", marginBottom:8}}>FULL TEXT // CAPTURED VERBATIM</div>
            <div className="ftext">{post.full}</div>
          </div>

          <div>
            <div style={{fontSize:9, letterSpacing:"0.18em", color:"var(--fg-4)", textTransform:"uppercase", marginBottom:6}}>TOPICS</div>
            <div className="stopics">
              {post.topics.length
                ? post.topics.map(t => <span key={t} className={`mtag ${topicColor(t)}`}>{t}</span>)
                : <span className="mtag">PERSONAL</span>}
            </div>
          </div>

          <div>
            <div style={{fontSize:9, letterSpacing:"0.18em", color:"var(--fg-4)", textTransform:"uppercase", marginBottom:6}}>DISCOURSE</div>
            <div className="metarow">
              <div className="kv"><span className="k">LIKES</span><span className="v">{post.reactions.likes.toLocaleString()}</span></div>
              <div className="kv"><span className="k">REPLIES</span><span className="v">{post.reactions.comments.toLocaleString()}</span></div>
              <div className="kv"><span className="k">SHARES</span><span className="v">{post.reactions.shares.toLocaleString()}</span></div>
              <div className="kv"><span className="k">CAPTURED</span><span className="v" style={{fontSize:11, fontFamily:"var(--mono)"}}>{post.date}</span></div>
            </div>
          </div>

          <div>
            <div style={{fontSize:9, letterSpacing:"0.18em", color:"var(--fg-4)", textTransform:"uppercase", marginBottom:6}}>CROSS-REFERENCES</div>
            <div style={{fontSize:11, lineHeight:1.6, color:"var(--fg-3)", display:"flex", flexDirection:"column", gap:3}}>
              <div>↳ 03 prior posts on same topic</div>
              <div>↳ 11 press mentions in 7d</div>
              <div>↳ 02 contradictions flagged</div>
              <div>↳ archived to cold-storage 06:42</div>
            </div>
          </div>

          <div>
            <div style={{fontSize:9, letterSpacing:"0.18em", color:"var(--fg-4)", textTransform:"uppercase", marginBottom:6}}>ANALYST NOTES</div>
            <div style={{fontSize:11, color:"var(--fg-2)", fontStyle:"italic", borderLeft:"2px solid var(--amber)", paddingLeft:8, lineHeight:1.55}}>
              Cross-reference with M100 procurement dossier (filed 2026-05-19). Image EXIF intact. Crowd estimate independently verified by drone footage at 06:50 UTC.
            </div>
          </div>
        </div>

        <div className="sfoot">
          <a className="url">{post.url}{I.link}</a>
          <span>SHA · 4a82f9c3</span>
        </div>
      </div>
    </div>
  );
}

// ── Bottom tabs ──────────────────────────────────────────────────────
function MobileTabs({ tab, setTab }) {
  const tabs = [
    { id: "FEED",  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h18M3 12h18M3 19h12"/></svg> },
    { id: "PULSE", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h4l3-8 4 16 3-8h4"/></svg> },
    { id: "DOSSIER", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.5 3.5-6 7-6s7 2.5 7 6"/></svg> },
    { id: "WATCH", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg> },
    { id: "MORE", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg> },
  ];
  return (
    <nav className="mtabs">
      {tabs.map(t => (
        <button key={t.id} className={"mtab" + (tab === t.id ? " active" : "")} onClick={() => setTab(t.id)}>
          {t.icon}<span>{t.id}</span><span className="dot"></span>
        </button>
      ))}
    </nav>
  );
}

// ── App ──────────────────────────────────────────────────────────────
function MobileApp() {
  const subject = window.SUBJECT;
  const activity = window.ACTIVITY;
  const topics = window.TOPICS;
  const posts = window.POSTS;

  const [theme, setTheme] = useState(() => localStorage.getItem("horkos.theme") || "dark");
  const [mediaFilter, setMediaFilter] = useState("ALL");
  const [topicFilter, setTopicFilter] = useState(null);
  const [expandedId, setExpandedId] = useState(posts[0]?.id);
  const [openPost, setOpenPost] = useState(null);
  const [tab, setTab] = useState("FEED");

  useEffect(() => { localStorage.setItem("horkos.theme", theme); }, [theme]);

  const filtered = useMemo(() => posts.filter(p => {
    if (mediaFilter !== "ALL" && p.media.toUpperCase() !== mediaFilter) return false;
    if (topicFilter && !p.topics.includes(topicFilter)) return false;
    return true;
  }), [posts, mediaFilter, topicFilter]);

  return (
    <IOSDevice width={402} height={874} dark={theme === "dark"}>
      <div className={"phone " + (theme === "light" ? "theme-light" : "theme-dark")}>
        <MobileTop theme={theme} setTheme={setTheme} onSearch={() => {}} />
        <div className="mfeed">
          <MobileHero subject={subject} />
          <MobileHeatmap grid={activity} />
          <MobileFilters
            mediaFilter={mediaFilter} setMediaFilter={setMediaFilter}
            topicFilter={topicFilter}  setTopicFilter={setTopicFilter}
            topics={topics}
          />
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 0 2px", fontSize:9, letterSpacing:"0.18em", color:"var(--fg-4)", textTransform:"uppercase"}}>
            <span>POST_LEDGER · {filtered.length}/{posts.length}</span>
            <span>SORTED · NEWEST</span>
          </div>
          {filtered.map(p => (
            <MobileCard
              key={p.id}
              post={p}
              expanded={expandedId === p.id}
              onToggle={id => setExpandedId(expandedId === id ? null : id)}
              onOpen={p => setOpenPost(p)}
            />
          ))}
          {filtered.length === 0 && (
            <div style={{padding:40, textAlign:"center", color:"var(--fg-4)", fontSize:11, letterSpacing:"0.16em"}}>NO RECORDS · ADJUST FILTERS</div>
          )}
        </div>
        <MobileTabs tab={tab} setTab={setTab} />
        {openPost && <MobileSheet post={openPost} onClose={() => setOpenPost(null)} />}
      </div>
    </IOSDevice>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<MobileApp />);
