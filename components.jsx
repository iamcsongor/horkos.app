/* HORKOS — main app */
const { useState, useMemo, useEffect } = React;

const TWEAKS_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "amber",
  "density": "comfortable",
  "scanlines": true,
  "showHeatmap": true,
  "showStats": true
}/*EDITMODE-END*/;

function App() {
  const [tab, setTab] = useState("FEED");
  const [theme, setTheme] = useState(() => localStorage.getItem("horkos.theme") || "dark");
  const [tweaks, setTweak] = useTweaks(TWEAKS_DEFAULTS);

  const subject = window.SUBJECT;
  const activity = window.ACTIVITY;
  const topics = window.TOPICS;
  const posts = window.POSTS;
  const events = window.RECENT_EVENTS;

  const [query, setQuery] = useState("");
  const [mediaFilter, setMediaFilter] = useState("ALL");
  const [topicFilter, setTopicFilter] = useState(null);
  const [expandedId, setExpandedId] = useState(posts[0]?.id);
  const [modalPost, setModalPost] = useState(null);

  // Theme persistence + body class
  useEffect(() => {
    document.body.classList.toggle("theme-light", theme === "light");
    document.body.classList.toggle("theme-dark",  theme === "dark");
    localStorage.setItem("horkos.theme", theme);
  }, [theme]);

  // Apply tweaks to document
  useEffect(() => {
    document.body.classList.toggle("no-scanlines", !tweaks.scanlines);
    const accentMap = {
      amber:  { hue: 75,  chroma: 0.16 },
      cyan:   { hue: 210, chroma: 0.13 },
      green:  { hue: 145, chroma: 0.16 },
      violet: { hue: 300, chroma: 0.14 },
    };
    const a = accentMap[tweaks.accent] || accentMap.amber;
    document.documentElement.style.setProperty("--amber",   `oklch(0.82 ${a.chroma} ${a.hue})`);
    document.documentElement.style.setProperty("--amber-d", `oklch(0.62 ${a.chroma * 0.9} ${a.hue})`);
    document.body.classList.toggle("density-dense", tweaks.density === "dense");
    document.body.classList.toggle("density-spacious", tweaks.density === "spacious");
  }, [tweaks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter(p => {
      if (mediaFilter !== "ALL" && p.media.toUpperCase() !== mediaFilter) return false;
      if (topicFilter && !p.topics.includes(topicFilter)) return false;
      if (q && !(`${p.summary} ${p.preview} ${p.topics.join(" ")} ${p.id}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [posts, query, mediaFilter, topicFilter]);

  return (
    <>
      <div className="app">
        <TopBar tab={tab} setTab={setTab} syncTime={subject.last_sync.split(" ")[1]} theme={theme} setTheme={setTheme} />
        <SideBar subject={subject} />

        <main className="main">
          <SubjectCard subject={subject} />
          {tweaks.showStats   && <StatGrid subject={subject} />}
          {tweaks.showHeatmap && <Heatmap grid={activity} />}

          <Toolbar
            query={query} setQuery={setQuery}
            mediaFilter={mediaFilter} setMediaFilter={setMediaFilter}
            topicFilter={topicFilter} setTopicFilter={setTopicFilter}
            count={filtered.length}
            topics={topics}
          />

          <section className="panel corners" style={{padding: 0}}>
            <div className="panel-head">
              <div className="left">
                <span className="amber">▌</span> POST_LEDGER · FB · SORTED DESC
              </div>
              <div className="right">
                <span>HOVER ROW · EXPAND</span>
                <span>CLICK ICON · POP OUT</span>
                <span className="amber">{filtered.length}/{posts.length}</span>
              </div>
            </div>

            {/* Column headers */}
            <div className="row" style={{
              cursor: "default",
              background: "var(--bg-2)",
              fontSize: 9,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--fg-4)",
              padding: "5px 10px"
            }} onClick={e => e.preventDefault()}>
              <div>#</div>
              <div>UTC</div>
              <div>RECORD_ID</div>
              <div>SRC</div>
              <div>TYPE</div>
              <div>SUMMARY</div>
              <div>DISCOURSE</div>
              <div>TOPICS</div>
              <div></div>
            </div>

            <div className="feed">
              {filtered.map((p, i) => (
                <PostRow
                  key={p.id}
                  post={p}
                  index={i}
                  expanded={expandedId === p.id}
                  onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
                  onOpen={(p) => setModalPost(p)}
                />
              ))}
              {filtered.length === 0 && (
                <div style={{padding: 40, textAlign: "center", color: "var(--fg-4)"}}>
                  NO RECORDS · ADJUST FILTERS<span className="caret"></span>
                </div>
              )}
            </div>
          </section>

          <div className="footbar">
            <div style={{display:"flex", gap:18}}>
              <span><span className="amber">●</span> CONNECTED</span>
              <span className="dim">12 INDEXERS RUNNING</span>
              <span className="dim">REGION: EU-CENTRAL</span>
              <span className="dim">COLD STORAGE: 4.21 TB</span>
            </div>
            <div style={{display:"flex", gap:18}}>
              <span className="dim">{filtered.length} ROWS</span>
              <span className="dim">SHIFT+? FOR HOTKEYS</span>
              <span className="amber">HORKOS // OATH-KEEPER</span>
            </div>
          </div>
        </main>

        <RightBar events={events} topics={topics} posts={posts} />
      </div>

      {modalPost && <PostModal post={modalPost} onClose={() => setModalPost(null)} />}

      <TweaksPanel title="HORKOS · TWEAKS">
        <TweakSection label="Accent">
          <TweakRadio
            label="Channel"
            value={tweaks.accent}
            options={[
              { label: "Amber", value: "amber" },
              { label: "Cyan",  value: "cyan" },
              { label: "Green", value: "green" },
              { label: "Violet",value: "violet" },
            ]}
            onChange={v => setTweak("accent", v)}
          />
        </TweakSection>
        <TweakSection label="Display">
          <TweakToggle label="Scanlines overlay" value={tweaks.scanlines} onChange={v => setTweak("scanlines", v)} />
          <TweakToggle label="Activity heatmap"  value={tweaks.showHeatmap} onChange={v => setTweak("showHeatmap", v)} />
          <TweakToggle label="Stat grid"         value={tweaks.showStats}  onChange={v => setTweak("showStats", v)} />
        </TweakSection>
        <TweakSection label="Density">
          <TweakRadio
            label="Row density"
            value={tweaks.density}
            options={[
              { label: "Dense",       value: "dense" },
              { label: "Comfortable", value: "comfortable" },
              { label: "Spacious",    value: "spacious" },
            ]}
            onChange={v => setTweak("density", v)}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
