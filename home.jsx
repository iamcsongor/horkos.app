/* HORKOS — Home page */
const { useState: useStateH, useEffect: useEffectH } = React;

// Live counters with subtle ticking animation
function useTicker(initial, step = 1, intervalMs = 4200) {
  const [n, setN] = useStateH(initial);
  useEffectH(() => {
    const id = setInterval(() => setN(x => x + step + Math.floor(Math.random() * 2)), intervalMs);
    return () => clearInterval(id);
  }, []);
  return n;
}

function fmtN(n) { return n.toLocaleString(); }

const COUNTRIES = [
  { code: "HU", name: "Hungary",        subjects: 7,   posts: 5_812, status: "active" },
  { code: "PL", name: "Poland",         subjects: 4,   posts: 2_104, status: "active" },
  { code: "DE", name: "Germany",        subjects: 0,   posts: 0,     status: "queued" },
  { code: "FR", name: "France",         subjects: 0,   posts: 0,     status: "queued" },
  { code: "IT", name: "Italy",          subjects: 0,   posts: 0,     status: "queued" },
  { code: "AT", name: "Austria",        subjects: 0,   posts: 0,     status: "queued" },
  { code: "RO", name: "Romania",        subjects: 0,   posts: 0,     status: "scout" },
  { code: "SK", name: "Slovakia",       subjects: 0,   posts: 0,     status: "scout" },
  { code: "CZ", name: "Czechia",        subjects: 0,   posts: 0,     status: "scout" },
  { code: "RS", name: "Serbia",         subjects: 0,   posts: 0,     status: "scout" },
];

const CHANNELS = [
  { k: "FB", label: "Facebook",      n: 7_916,  status: "live",     color: "cyan" },
  { k: "X",  label: "X / Twitter",   n: 0,      status: "beta",     color: "dim" },
  { k: "YT", label: "YouTube",       n: 0,      status: "queued",   color: "dim" },
  { k: "TG", label: "Telegram",      n: 0,      status: "queued",   color: "dim" },
  { k: "IG", label: "Instagram",     n: 0,      status: "queued",   color: "dim" },
  { k: "PR", label: "Press release", n: 0,      status: "queued",   color: "dim" },
  { k: "LX", label: "Court filings", n: 0,      status: "research", color: "dim" },
  { k: "BR", label: "Broadcast TV",  n: 0,      status: "research", color: "dim" },
];

// Sources the archive draws from — the animated marquee in the hero.
const HERO_SOURCES = [
  { k: "FB", label: "Facebook",             status: "live"     },
  { k: "X",  label: "X / Twitter",          status: "beta"     },
  { k: "YT", label: "YouTube",              status: "queued"   },
  { k: "TG", label: "Telegram",             status: "queued"   },
  { k: "IG", label: "Instagram",            status: "queued"   },
  { k: "TT", label: "TikTok",               status: "queued"   },
  { k: "PR", label: "Press releases",       status: "queued"   },
  { k: "IV", label: "Interviews",           status: "research" },
  { k: "SP", label: "Speeches",             status: "research" },
  { k: "PA", label: "Parliamentary record", status: "research" },
  { k: "LX", label: "Court filings",        status: "research" },
  { k: "TV", label: "Broadcast TV",         status: "research" },
  { k: "PC", label: "Podcasts",             status: "research" },
  { k: "OL", label: "Open letters",         status: "research" },
  { k: "LS", label: "Live streams",         status: "research" },
  { k: "RD", label: "Radio",                status: "research" },
  { k: "NL", label: "Newsletters",          status: "research" },
  { k: "WB", label: "Party websites",       status: "research" },
];

const RECENT_LOG = [
  { t: "06:42:11", e: "Sync complete", s: "PM-001", c: "+12" },
  { t: "06:41:38", e: "New post indexed", s: "PM-001", c: "FB" },
  { t: "06:40:02", e: "Subject queued", s: "GK-003", c: "scout" },
  { t: "06:38:54", e: "Comment thread snapshot", s: "VO-002", c: "4.8k" },
  { t: "06:35:19", e: "Lawsuit filing captured", s: "PM-001", c: "LX-014" },
  { t: "06:33:01", e: "Contradiction flagged", s: "VO-002", c: "↔ 2024-11" },
  { t: "06:30:48", e: "Cold-storage write", s: "—",      c: "412 MB" },
  { t: "06:28:12", e: "Image archived (full-res)", s: "PM-001", c: "1.4 MB" },
  { t: "06:24:55", e: "Mention burst detected", s: "FG-004", c: "18× / 10m" },
  { t: "06:20:00", e: "Hourly hash anchor", s: "—",      c: "0x4a82…" },
];

const PRINCIPLES = [
  { k: "01", t: "Verbatim or nothing", d: "Captured text is never paraphrased or edited. Analyst summaries are clearly marked and sit next to — never on top of — the original." },
  { k: "02", t: "Sources are first-class", d: "Every record links back to the original URL with capture timestamp, file hash, and provenance chain." },
  { k: "03", t: "Immutability", d: "Records are not deleted when the source deletes the original. Takedown notices are logged separately and remain visible." },
  { k: "04", t: "No editorial spin", d: "Topic tags and contradiction flags are mechanical. The interface shows you the evidence; it does not tell you what to conclude." },
  { k: "05", t: "Transparency about transparency", d: "Source list, methodology, capture cadence, and known gaps are all public. Bug reports are part of the workflow." },
  { k: "06", t: "Built for the long haul", d: "Hash-anchored archive, hot index + cold storage, open formats. Designed to outlast any single platform, government, or maintainer." },
];

function HomeStat({ k, v, sub, accent }) {
  return (
    <div className="hm-stat">
      <div className="hm-stat-k">{k}</div>
      <div className={"hm-stat-v" + (accent ? " amber" : "")}>{v}</div>
      {sub && <div className="hm-stat-d">{sub}</div>}
    </div>
  );
}

// GitHub-style interactive heatmap for the hero. Synthetic data — hovering a
// day shows a randomised archived-count (uncapped) for that date.
function HomeHeatmap() {
  const WEEKS = 52, DAYS = 7;
  const grid = React.useMemo(() => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const out = [];
    for (let w = 0; w < WEEKS; w++) {
      const col = [];
      for (let d = 0; d < DAYS; d++) {
        const daysBack = (WEEKS - 1 - w) * 7 + (DAYS - 1 - d);
        const date = new Date(today.getTime() - daysBack * 86400000);
        const recency = w / WEEKS;                 // recent weeks busier
        const base = Math.random() * (0.4 + recency * 0.9);
        const count = Math.round(base * 80);       // uncapped synthetic count
        col.push({ date, count });
      }
      out.push(col);
    }
    return out;
  }, []);

  const [hover, setHover] = useStateH(null);
  const bucket = (n) => (n <= 0 ? 0 : n < 8 ? 1 : n < 22 ? 2 : n < 45 ? 3 : 4);
  const fmtDate = (d) =>
    d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="hm-heatmap">
      <div className="hm-heatmap-cells">
        {grid.map((col, w) =>
          col.map((cell, d) => (
            <div
              key={`${w}-${d}`}
              className={`hm-hcell v${bucket(cell.count)}`}
              onMouseEnter={() => setHover(cell)}
              onMouseLeave={() => setHover(null)}
            />
          ))
        )}
      </div>
      <div className="hm-heatmap-cap">
        {hover ? (
          <span><span className="amber">{hover.count.toLocaleString()}</span> archived · {fmtDate(hover.date)}</span>
        ) : (
          <span className="dim">52 WEEKS · HOVER A DAY</span>
        )}
      </div>
    </div>
  );
}

// Custom line-art icons for each source. Stroke-based, currentColor, matching
// the page's geometric icon style (viewBox 0 0 24 24). No brand logos.
const _ic = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
const SRC_ICON = {
  FB: <svg {..._ic}><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M14.2 8h-1.4c-1 0-1.6.7-1.6 1.7V11H9.2v2.3H11V21h2.4v-7.7h1.9l.4-2.3h-2.3V9.9c0-.4.2-.6.7-.6h1.1z"/></svg>,
  X:  <svg {..._ic}><path d="M4 4l16 16M20 4L4 20"/></svg>,
  YT: <svg {..._ic}><rect x="3" y="6" width="18" height="12" rx="3"/><path d="M11 9.5l4 2.5-4 2.5z" fill="currentColor"/></svg>,
  TG: <svg {..._ic}><path d="M21 4L3 11l5.5 1.8L11 19l2.8-3.6L18 18z"/><path d="M8.5 12.8L17 7"/></svg>,
  IG: <svg {..._ic}><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1" fill="currentColor" stroke="none"/></svg>,
  TT: <svg {..._ic}><path d="M9.5 16.5a3 3 0 1 0 3 3V8.2c1 1.4 2.6 2 4.2 2V7.3c-1.5 0-3-1.3-3-3.3h-3.1z"/></svg>,
  PR: <svg {..._ic}><rect x="3" y="5" width="13" height="14" rx="1"/><path d="M16 8h4v9a2 2 0 0 1-2 2H6"/><path d="M6 9h7M6 12h7M6 15h5"/></svg>,
  IV: <svg {..._ic}><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M12 17v4M9 21h6"/></svg>,
  SP: <svg {..._ic}><path d="M3 11v2l11 5V6z"/><path d="M14 8.5a3.5 3.5 0 0 1 0 7"/><path d="M6 13.2V17l3 1v-3.8"/></svg>,
  PA: <svg {..._ic}><path d="M3 9l9-5 9 5"/><path d="M5 9v8M9.5 9v8M14.5 9v8M19 9v8"/><path d="M3 20.5h18"/></svg>,
  LX: <svg {..._ic}><path d="M14 4l6 6-2.5 2.5-6-6z"/><path d="M11.5 6.5L4 14l3 3 7.5-7.5"/><path d="M3 21h9"/></svg>,
  TV: <svg {..._ic}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 4l4 3 4-3"/></svg>,
  PC: <svg {..._ic}><path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/></svg>,
  OL: <svg {..._ic}><path d="M3 9l9-5 9 5v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 9l9 6 9-6"/></svg>,
  LS: <svg {..._ic}><circle cx="12" cy="12" r="2.4"/><path d="M7.5 7.5a6.5 6.5 0 0 0 0 9M16.5 7.5a6.5 6.5 0 0 1 0 9"/><path d="M4.5 4.5a11 11 0 0 0 0 15M19.5 4.5a11 11 0 0 1 0 15"/></svg>,
  RD: <svg {..._ic}><rect x="3" y="9" width="18" height="11" rx="2"/><path d="M7 9l11-4.5"/><circle cx="8" cy="14.5" r="2"/><path d="M14 13h4M14 16.5h4"/></svg>,
  NL: <svg {..._ic}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>,
  WB: <svg {..._ic}><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.4 4 5.6 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.6-4-9s1.4-6.6 4-9z"/></svg>,
};

// Auto-scrolling horizontal SOURCES marquee. The track holds the list twice so
// the translateX(-50%) loop is seamless; pauses on hover.
function HomeSources() {
  const tiles = (tag) => HERO_SOURCES.map((s, i) => (
    <div className="hm-source-tile" key={tag + i} title={s.label}>
      <span className="hm-source-ico">{SRC_ICON[s.k]}</span>
      <span className="hm-source-lbl">{s.label}</span>
      <span className={"hm-pill " + s.status}>{s.status}</span>
    </div>
  ));
  return (
    <div className="hm-sources">
      <div className="hm-sources-head">
        <span><span className="amber">▌</span> SOURCES · {HERO_SOURCES.length} TRACKED</span>
        <span className="dim">● INGESTING</span>
      </div>
      <div className="hm-sources-viewport">
        <div className="hm-sources-track">
          {tiles("a")}
          {tiles("b")}
        </div>
      </div>
    </div>
  );
}

function HomePage({ theme, setTheme }) {
  const subjects   = useTicker(11,    0, 9000);
  const statements = useTicker(7_916, 3, 3800);
  const channels   = 1;
  const countries  = 2;
  const lawsuits   = useTicker(38,    0, 7000);
  const contradictions = useTicker(14, 0, 6000);
  const coldStorage = "4.21 TB";

  return (
    <main className="main home">
      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section className="hm-hero panel corners">
        <div className="hm-hero-grid">
          <div className="hm-hero-left">
            <div className="hm-eyebrow">
              <span className="amber">▌</span> HORKOS · PUBLIC RECORD ARCHIVE
              <span className="dim2">// v0.7.3</span>
            </div>
            <h1 className="hm-hero-h">
              Every public<br/>statement.<br/>
              <span className="amber">Archived.</span>
              <span className="caret"></span>
            </h1>
            <p className="hm-hero-p">
              Horkos is a permanent, searchable record of what politicians and publicly exposed
              figures actually said. Posts, speeches, interviews, replies, lawsuits, broadcasts —
              captured verbatim, hashed, cross-referenced, and kept long after the original is
              edited or deleted.
            </p>
            <div className="hm-hero-cta">
              <button className="hm-btn primary" onClick={() => location.hash = "feed"}>
                ENTER ARCHIVE <span style={{marginLeft:8}}>→</span>
              </button>
              <button className="hm-btn ghost">READ MANIFESTO</button>
              <button className="hm-btn ghost">METHODOLOGY</button>
            </div>
            <div className="hm-hero-meta">
              <div><span className="hm-k">CAPTURED TODAY</span><span className="hm-v">412</span></div>
              <div><span className="hm-k">CAPTURED THIS YEAR</span><span className="hm-v">{fmtN(statements)}</span></div>
              <div><span className="hm-k">LAST INGEST</span><span className="hm-v">06:42:11 UTC</span></div>
              <div><span className="hm-k">ARCHIVE INTEGRITY</span><span className="hm-v amber">99.8%</span></div>
            </div>
          </div>

          <div className="hm-hero-right">
            <div className="hm-counter">
              <div className="hm-counter-k">STATEMENTS INDEXED</div>
              <div className="hm-counter-v">{fmtN(statements)}</div>
              <div className="hm-counter-d">↑ +47 / hour · live ingest</div>
              <HomeHeatmap />
            </div>

            <div className="hm-counter-grid">
              <HomeStat k="SUBJECTS"      v={subjects}        sub="on watchlist" />
              <HomeStat k="CHANNELS"      v={channels}        sub={`of ${CHANNELS.length} planned`} />
              <HomeStat k="COUNTRIES"     v={countries}       sub={`of ${COUNTRIES.length} mapped`} />
              <HomeStat k="LAWSUITS"      v={lawsuits}        sub="active filings" accent />
              <HomeStat k="CONTRADICTIONS" v={contradictions} sub="open flags" />
              <HomeStat k="COLD STORAGE"  v={coldStorage}     sub="immutable, hashed" />
            </div>

            <HomeSources />
          </div>
        </div>

        {/* sub-strip */}
        <div className="hm-strip">
          <span>NAME · HORKOS</span>
          <span className="dim">ETYM · ὅρκος / oath</span>
          <span className="dim">FOUNDED · 2024-02</span>
          <span className="dim">REGION · EU-CENTRAL</span>
          <span className="dim">LICENSE · CODE MIT · DATA CC-BY-4.0</span>
          <span className="dim">UPTIME · 99.96%</span>
          <span className="amber">● LIVE</span>
        </div>
      </section>

      {/* ─── MOCKUP PREVIEW ──────────────────────────────────────────── */}
      <section className="hm-row hm-row-mock">
        <div className="hm-side">
          <div className="hm-eyebrow"><span className="amber">▌</span> THE INTERFACE</div>
          <h2 className="hm-h2">A dossier per subject.<br/>A ledger per channel.</h2>
          <p className="hm-p">
            Horkos is built for analysts, journalists, and the public — not for engagement. Every
            subject opens to the same dense layout: a verified dossier, a 52-week activity heatmap,
            sentiment + discourse stats, a topic-tagged post ledger, and a contradiction log that
            never forgets.
          </p>
          <ul className="hm-feature-list">
            <li><span className="hm-num">01</span><div><b>Verified dossier.</b> Identity, role, born, indexed-since, follower count, lawsuit count — auto-refreshed.</div></li>
            <li><span className="hm-num">02</span><div><b>Activity heatmap.</b> 52 weeks of posting cadence at a glance. Click any day to filter the ledger.</div></li>
            <li><span className="hm-num">03</span><div><b>Post ledger.</b> Every statement as a row. Expand for preview; pop out for the verbatim full text.</div></li>
            <li><span className="hm-num">04</span><div><b>Live log.</b> What changed since you last looked, down to the second.</div></li>
            <li><span className="hm-num">05</span><div><b>Topic distribution.</b> Mechanical tagging — corruption, EU policy, rule of law, ukraine — never opinion.</div></li>
            <li><span className="hm-num">06</span><div><b>Contradiction log.</b> When today's statement disagrees with last year's, the receipts surface themselves.</div></li>
          </ul>
          <button className="hm-btn primary" onClick={() => location.hash = "feed"} style={{marginTop:14}}>
            OPEN A LIVE DOSSIER →
          </button>
        </div>

        <div className="hm-mock">
          <div className="hm-window">
            <div className="hm-window-head">
              <div className="hm-window-traffic"><span/><span/><span/></div>
              <span className="dim">HORKOS · /subject/peter_magyar</span>
              <span className="dim2 mono">https://horkos.archive/PM-001</span>
            </div>
            <div className="hm-window-body">
              <img className="hm-mock-img"
                   src={theme === "light" ? "assets/mock-day.png" : "assets/mock-night.png"}
                   alt="Horkos archive interface preview" />
              <div className="hm-mock-overlay">
                <span className="hm-pin a">DOSSIER</span>
                <span className="hm-pin b">HEATMAP · 52W</span>
                <span className="hm-pin c">TOPIC DISTRIBUTION</span>
                <span className="hm-pin d">SUBJECT SWITCHER</span>
              </div>
            </div>
            <div className="hm-window-foot">
              <span>VIEW · {theme === "light" ? "DAY" : "NIGHT"}</span>
              <span className="dim">LAST RENDER 06:42:11</span>
              <span className="dim">1247 RECORDS</span>
              <span className="amber">● LIVE</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PIPELINE / HOW IT WORKS ─────────────────────────────────── */}
      <section className="panel corners">
        <div className="panel-head">
          <div className="left"><span className="amber">▌</span> PIPELINE · COLLECT → NORMALIZE → STORE → ENRICH → SERVE</div>
          <div className="right"><span className="dim">06:42:11 UTC</span></div>
        </div>
        <div className="panel-body hm-pipeline">
          {[
            { n: "01", t: "COLLECT",    d: "Per-channel adapters watch the public surface of each platform. Adapters are dumb on purpose: they capture, they don't interpret.", k: "12 adapters" },
            { n: "02", t: "NORMALIZE",  d: "Raw payloads pass through schema normalization. Every record gets a stable id, a SHA-256 of the original, and a canonical source URL.", k: "schema v3" },
            { n: "03", t: "STORE",      d: "Full media + original payloads go to immutable cold storage. The hot index keeps just enough metadata to search at speed.", k: "4.21 TB cold" },
            { n: "04", t: "ENRICH",     d: "Mechanical tagging, automatic transcription, contradiction detection against the subject's prior record. No editorial layer.", k: "8 enrichers" },
            { n: "05", t: "SERVE",      d: "A read-only API plus the interface you're looking at. Every record carries its provenance chain back to the source.", k: "this site" },
          ].map(s => (
            <div key={s.n} className="hm-stage">
              <div className="hm-stage-n">{s.n}</div>
              <div className="hm-stage-t">{s.t}</div>
              <div className="hm-stage-d">{s.d}</div>
              <div className="hm-stage-k">{s.k}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PRINCIPLES ──────────────────────────────────────────────── */}
      <section className="panel corners">
        <div className="panel-head">
          <div className="left"><span className="amber">▌</span> EDITORIAL PRINCIPLES</div>
          <div className="right"><span className="dim">SIX RULES · NON-NEGOTIABLE</span></div>
        </div>
        <div className="panel-body hm-principles">
          {PRINCIPLES.map(p => (
            <div key={p.k} className="hm-principle">
              <div className="hm-principle-k">{p.k}</div>
              <div className="hm-principle-t">{p.t}</div>
              <div className="hm-principle-d">{p.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── ACTIVITY / MANIFESTO ─────────────────────────────────────── */}
      <section className="hm-row hm-row-2col">
        <section className="panel corners">
          <div className="panel-head">
            <div className="left"><span className="amber">▌</span> LIVE INGEST · LAST 30 MIN</div>
            <div className="right"><span className="amber">● LIVE</span></div>
          </div>
          <div className="panel-body hm-log">
            {RECENT_LOG.map((r, i) => (
              <div key={i} className="hm-log-row">
                <div className="dim mono">{r.t}</div>
                <div>{r.e}</div>
                <div className="dim mono">{r.s}</div>
                <div className="amber mono">{r.c}</div>
              </div>
            ))}
            <div className="dim" style={{marginTop:8, fontSize:10, letterSpacing:"0.16em"}}>
              ↳ THIS LOG IS PUBLIC. EVERY INGESTION IS HASH-ANCHORED.
            </div>
          </div>
        </section>

        <section className="panel corners hm-manifesto">
          <div className="panel-head">
            <div className="left"><span className="amber">▌</span> MANIFESTO</div>
            <div className="right"><span className="dim">2024-02-11</span></div>
          </div>
          <div className="panel-body">
            <p className="hm-quote">
              "Public figures speak a lot.<br/>
              Most of what they say disappears —<br/>
              buried by the next post, deleted, rewritten,<br/>
              or simply never indexed."
            </p>
            <p className="hm-p">
              When a contradiction matters, the evidence is usually gone, scattered across a dozen
              platforms behind a dozen UX walls. The platforms have no incentive to remember; their
              business is the next post.
            </p>
            <p className="hm-p">
              Horkos is the counterweight. One archive, one interface, every statement preserved
              verbatim with metadata, source URL, capture timestamp, and a hash of the original
              payload. Not editorial. Not for engagement. Just receipts.
            </p>
            <p className="hm-p hm-sign">
              <span className="amber">— THE OATH-KEEPERS</span>, in perpetuity.
            </p>
          </div>
        </section>
      </section>

      {/* ─── CHANNELS + COVERAGE ─────────────────────────────────────── */}
      <section className="hm-row hm-row-2col">
        <section className="panel corners">
          <div className="panel-head">
            <div className="left"><span className="amber">▌</span> CAPTURE CHANNELS</div>
            <div className="right"><span>1 LIVE</span><span className="dim">7 QUEUED</span></div>
          </div>
          <div className="panel-body hm-channel-grid">
            {CHANNELS.map(c => (
              <div key={c.k} className={"hm-channel " + (c.status === "live" ? "active" : "")}>
                <div className="hm-channel-head">
                  <span className="src-mark">{c.k}</span>
                  <span className="hm-channel-lbl">{c.label}</span>
                  <span className={"hm-pill " + c.status}>{c.status.toUpperCase()}</span>
                </div>
                <div className="hm-channel-n">{c.n ? fmtN(c.n) : "—"}</div>
                <div className="hm-channel-d dim">{c.n ? "records" : "not yet captured"}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel corners">
          <div className="panel-head">
            <div className="left"><span className="amber">▌</span> COUNTRY COVERAGE</div>
            <div className="right"><span>{countries} ACTIVE</span><span className="dim">10 MAPPED</span></div>
          </div>
          <div className="panel-body hm-country-list">
            {COUNTRIES.map(c => (
              <div key={c.code} className="hm-country">
                <div className="hm-country-code">{c.code}</div>
                <div className="hm-country-name">{c.name}</div>
                <div className="hm-country-bar">
                  <div className="track">
                    <div className={"fill " + (c.status === "active" ? "" : c.status === "queued" ? "cyan" : "red")}
                         style={{width: `${Math.min(100, c.posts / 60)}%`}}></div>
                  </div>
                </div>
                <div className="hm-country-n mono">{c.subjects || "—"}</div>
                <div className={"hm-pill " + c.status}>{c.status}</div>
              </div>
            ))}
            <div className="hm-country hm-country-add">
              <div className="hm-country-code dim2">+</div>
              <div className="hm-country-name dim">Nominate a country</div>
              <div className="dim" style={{gridColumn:"3 / -1", textAlign:"right"}}>Open an issue →</div>
            </div>
          </div>
        </section>
      </section>

      {/* ─── FINAL CTA ──────────────────────────────────────────────── */}
      <section className="hm-cta panel corners">
        <div className="hm-cta-l">
          <div className="hm-eyebrow"><span className="amber">▌</span> READY?</div>
          <h2 className="hm-h2">The archive is open.<br/>Pick a subject.</h2>
          <p className="hm-p">
            No login. No paywall. No tracking. The interface is dense by design — give it five
            minutes and you'll never want a regular feed again.
          </p>
        </div>
        <div className="hm-cta-r">
          <button className="hm-btn primary big" onClick={() => location.hash = "feed"}>
            ENTER ARCHIVE →
          </button>
          <div className="hm-cta-meta">
            <div><span className="hm-k">SHORTCUT</span><span className="hm-v mono">G &nbsp;then&nbsp; F</span></div>
            <div><span className="hm-k">VIEW MODE</span>
              <span className="hm-v mono">
                <button className="hm-link" onClick={() => setTheme("light")}>DAY</button>
                <span className="dim2"> / </span>
                <button className="hm-link" onClick={() => setTheme("dark")}>NIGHT</button>
              </span>
            </div>
            <div><span className="hm-k">CONTACT</span><span className="hm-v mono">tips@horkos.archive</span></div>
            <div><span className="hm-k">PGP</span><span className="hm-v mono">0x4A82 F9C3 D1EF …</span></div>
          </div>
        </div>
      </section>

      <div className="footbar">
        <div style={{display:"flex", gap:18}}>
          <span><span className="amber">●</span> CONNECTED</span>
          <span className="dim">12 INDEXERS RUNNING</span>
          <span className="dim">REGION: EU-CENTRAL</span>
          <span className="dim">COLD STORAGE: {coldStorage}</span>
        </div>
        <div style={{display:"flex", gap:18}}>
          <span className="dim">HOME · v0.7.3</span>
          <span className="dim">SHIFT+? FOR HOTKEYS</span>
          <span className="amber">HORKOS // OATH-KEEPER</span>
        </div>
      </div>
    </main>
  );
}

window.HomePage = HomePage;
