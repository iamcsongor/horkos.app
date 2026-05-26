/* HORKOS — main app */
const { useState: appUseState, useEffect: appUseEffect, useMemo: appUseMemo, useCallback: appUseCallback } = React;

const TWEAKS_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "amber",
  "density": "comfortable",
  "scanlines": true,
  "showHeatmap": true,
  "showStats": true
}/*EDITMODE-END*/;

// ── Admin gate ─────────────────────────────────────────────────────────
// Defaults to ON. To opt out: add ?admin=0 to the URL once, or run
// horkosAdmin.off() in DevTools. The opt-out is sticky in localStorage.
function useAdminMode() {
  const [admin, setAdmin] = appUseState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("admin") === "1") {
        localStorage.setItem("horkos.admin", "1");
        return true;
      }
      if (params.get("admin") === "0") {
        localStorage.setItem("horkos.admin", "0");
        return false;
      }
      // Default: admin on, unless explicitly turned off.
      return localStorage.getItem("horkos.admin") !== "0";
    } catch (e) { return true; }
  });
  appUseEffect(() => {
    window.horkosAdmin = {
      on:  () => { localStorage.setItem("horkos.admin", "1"); setAdmin(true);  },
      off: () => { localStorage.setItem("horkos.admin", "0"); setAdmin(false); },
    };
  }, []);
  return admin;
}

function App() {
  // HOME by default. `#feed` (or any other tab name) in the URL hash takes
  // precedence — supports HomePage CTAs that do `location.hash = "feed"`.
  const tabFromHash = (h) => {
    const v = (h || "").replace(/^#/, "").toUpperCase();
    if (!v || v === "HOME") return "HOME";
    if (["FEED","TICKER","ANALYSIS","NETWORK","WATCHLIST"].includes(v)) return v;
    // Legacy hash redirect: old #timeline links should land on the ticker.
    if (v === "TIMELINE") return "TICKER";
    return "HOME";
  };
  const [tab, setTab] = appUseState(() => tabFromHash(location.hash));

  // Keep tab in sync with the URL hash (back-button + deep links).
  appUseEffect(() => {
    const onHash = () => setTab(tabFromHash(location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const [theme, setTheme] = appUseState(() => localStorage.getItem("horkos.theme") || "dark");
  const [tweaks, setTweak] = useTweaks(TWEAKS_DEFAULTS);
  const adminMode = useAdminMode();

  // Live state
  const [subjects, setSubjects]               = appUseState([]);
  const [activeSubjectId, setActiveSubjectId] = appUseState(null);
  const [posts, setPosts]                     = appUseState([]);
  const [totals, setTotals]                   = appUseState(null);
  const [delta, setDelta]                     = appUseState(null);
  const [activityDaily, setActivityDaily]     = appUseState([]);
  const [loading, setLoading]                 = appUseState(true);
  const [error, setError]                     = appUseState(null);

  // UI state
  const [query, setQuery]             = appUseState("");
  const [mediaFilter, setMediaFilter] = appUseState("ALL");
  const [topicFilter, setTopicFilter] = appUseState(null);
  const [dateFilter, setDateFilter]   = appUseState(null);   // YYYY-MM-DD from heatmap
  const [sourceFilter, setSourceFilter] = appUseState(null); // 'FB' | 'X' | … from heatmap legend / popover
  const [expandedId, setExpandedId]   = appUseState(null);
  const [modalPost, setModalPost]     = appUseState(null);

  // Edit modals
  const [editingSubject, setEditingSubject]     = appUseState(null);  // {} for new, subject for edit
  const [editingStatement, setEditingStatement] = appUseState(null);

  const activeSubject = appUseMemo(
    () => subjects.find(s => s.id === activeSubjectId) || null,
    [subjects, activeSubjectId]
  );

  // Theme persistence
  appUseEffect(() => {
    document.body.classList.toggle("theme-light", theme === "light");
    document.body.classList.toggle("theme-dark",  theme === "dark");
    localStorage.setItem("horkos.theme", theme);
  }, [theme]);

  // Tweaks → document
  appUseEffect(() => {
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

  // Admin body class
  appUseEffect(() => {
    document.body.classList.toggle("admin-mode", adminMode);
  }, [adminMode]);

  // Initial load: subjects
  appUseEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const subs = await window.db.listSubjects();
        if (cancelled) return;
        // Decorate with their totals so the sidebar count is accurate.
        const withTotals = await Promise.all(subs.map(async (s) => {
          const t = await window.db.getSubjectTotals(s.id);
          return { ...s, total_posts: t.total_posts };
        }));
        if (cancelled) return;
        setSubjects(withTotals);
        if (!activeSubjectId && withTotals.length) setActiveSubjectId(withTotals[0].id);
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line

  // When active subject changes: fetch its derived data + feed
  appUseEffect(() => {
    if (!activeSubjectId) return;
    let cancelled = false;
    (async () => {
      try {
        const [t, d, dly, ps] = await Promise.all([
          window.db.getSubjectTotals(activeSubjectId),
          window.db.get30dDelta(activeSubjectId),
          window.db.getActivityDaily(activeSubjectId),
          window.db.listStatements({ subjectId: activeSubjectId }),
        ]);
        if (cancelled) return;
        setTotals(t); setDelta(d); setActivityDaily(dly); setPosts(ps);
        setExpandedId(ps[0]?._uuid || null);
      } catch (e) {
        setError(e.message || String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [activeSubjectId]);

  // Refresh helpers used by save handlers
  const reloadSubjects = appUseCallback(async () => {
    const subs = await window.db.listSubjects();
    const withTotals = await Promise.all(subs.map(async (s) => {
      const t = await window.db.getSubjectTotals(s.id);
      return { ...s, total_posts: t.total_posts };
    }));
    setSubjects(withTotals);
  }, []);

  const reloadFeed = appUseCallback(async () => {
    if (!activeSubjectId) return;
    const [t, d, dly, ps] = await Promise.all([
      window.db.getSubjectTotals(activeSubjectId),
      window.db.get30dDelta(activeSubjectId),
      window.db.getActivityDaily(activeSubjectId),
      window.db.listStatements({ subjectId: activeSubjectId }),
    ]);
    setTotals(t); setDelta(d); setActivityDaily(dly); setPosts(ps);
  }, [activeSubjectId]);

  // Filtered feed
  const filtered = appUseMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter(p => {
      const m = (p.media_kind || p.media || "").toUpperCase();
      if (mediaFilter !== "ALL" && m !== mediaFilter) return false;
      if (topicFilter && !(p.topics || []).includes(topicFilter)) return false;
      if (sourceFilter && (p.source_code || p.source) !== sourceFilter) return false;
      if (dateFilter) {
        // captured_at is ISO; the heatmap view buckets in UTC, so compare
        // the YYYY-MM-DD slice of the UTC ISO string.
        const day = p.captured_at ? new Date(p.captured_at).toISOString().slice(0, 10) : "";
        if (day !== dateFilter) return false;
      }
      if (q && !(`${p.summary} ${p.preview} ${(p.topics||[]).join(" ")} ${p.code} ${p.id}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [posts, query, mediaFilter, topicFilter, dateFilter, sourceFilter]);

  // Reset heatmap filters when switching subjects — a day/source from one
  // subject's archive shouldn't bleed into another's feed view.
  appUseEffect(() => {
    setDateFilter(null);
    setSourceFilter(null);
  }, [activeSubjectId]);

  // Single entry point the Heatmap uses to patch filter state. Accepting a
  // partial { day?, source? } lets us combine "click cell" (day only) and
  // "click source row in popover" (day + source) without two callbacks.
  const onHeatmapFilter = appUseCallback((patch) => {
    if ("day" in patch) setDateFilter(patch.day);
    if ("source" in patch) setSourceFilter(patch.source);
  }, []);

  // Pretty label for the dateFilter chip.
  const dateFilterLabel = dateFilter
    ? new Date(dateFilter + "T00:00:00Z").toUTCString().slice(0, 16)
    : null;

  // Portrait upload from the dossier card
  const handlePortraitUpload = appUseCallback(async (file) => {
    if (!activeSubject) return;
    try {
      const path = await window.db.uploadPortrait(activeSubject.id, file);
      await window.db.upsertSubject({ ...activeSubject, portrait_path: path, portrait_is_url: false });
      await reloadSubjects();
    } catch (e) {
      alert("Portrait upload failed: " + (e.message || e));
    }
  }, [activeSubject, reloadSubjects]);

  // Empty / loading / error states
  if (error) {
    return (
      <div className="boot-state">
        <div className="amber">▌ HORKOS · BOOT ERROR</div>
        <pre style={{whiteSpace:"pre-wrap"}}>{error}</pre>
        <div className="dim">Check config.js and the Supabase project URL/key.</div>
      </div>
    );
  }

  const syncTime = activeSubject?.last_sync_at
    ? new Date(activeSubject.last_sync_at).toISOString().slice(11, 19)
    : "—";

  // HOME page renders without needing live data — show it even while
  // subjects are still bootstrapping.
  if (tab === "HOME") {
    return (
      <>
        <div className="app app-home">
          <TopBar tab={tab} setTab={setTab} syncTime={syncTime} theme={theme} setTheme={setTheme} adminMode={adminMode} />
          <HomePage theme={theme} setTheme={setTheme} />
        </div>
      </>
    );
  }

  // TICKER page is cross-subject — it self-manages its own fetch loop
  // and doesn't need the sidebar or the right-hand analysis column.
  // Pop-outs still go through the shared PostModal we already render
  // at the bottom of the tree.
  if (tab === "TICKER") {
    return (
      <>
        <div className="app app-ticker">
          <TopBar tab={tab} setTab={setTab} syncTime={syncTime} theme={theme} setTheme={setTheme} adminMode={adminMode} />
          <TickerView onOpen={(p) => setModalPost(p)} />
        </div>
        {modalPost && (
          <PostModal
            post={modalPost}
            onClose={() => setModalPost(null)}
            onEdit={(p) => { setModalPost(null); setEditingStatement(p); }}
            adminMode={adminMode}
          />
        )}
      </>
    );
  }

  if (loading && !subjects.length) {
    return (
      <div className="boot-state">
        <div className="amber">▌ HORKOS · BOOTSTRAPPING…</div>
        <div className="dim">Loading subjects from archive.</div>
      </div>
    );
  }

  return (
    <>
      <div className="app">
        <TopBar tab={tab} setTab={setTab} syncTime={syncTime} theme={theme} setTheme={setTheme} adminMode={adminMode} />
        <SideBar
          subjects={subjects}
          activeSubjectId={activeSubjectId}
          onPickSubject={setActiveSubjectId}
          subject={activeSubject}
          adminMode={adminMode}
          onNewSubject={() => setEditingSubject({})}
          onEditSubject={(s) => setEditingSubject(s)}
        />

        <main className="main">
          <SubjectCard
            subject={activeSubject}
            totals={totals}
            adminMode={adminMode}
            onEdit={() => setEditingSubject(activeSubject)}
            onPortraitUpload={handlePortraitUpload}
          />
          {tweaks.showStats   && <StatGrid delta={delta} />}
          {tweaks.showHeatmap && (
            <Heatmap
              daily={activityDaily}
              dateFilter={dateFilter}
              sourceFilter={sourceFilter}
              onFilterChange={onHeatmapFilter}
            />
          )}

          <Toolbar
            query={query} setQuery={setQuery}
            mediaFilter={mediaFilter} setMediaFilter={setMediaFilter}
            topicFilter={topicFilter} setTopicFilter={setTopicFilter}
            count={filtered.length}
            topics={window.HARDCODED.TOPICS}
          />

          {/* Active heatmap filters — visible chips with dismiss buttons.
              Sits between the toolbar and the ledger so it reads as part
              of the active filter set. */}
          {(dateFilter || sourceFilter) && (
            <div className="hm-active-filters">
              <span className="dim">FILTERED BY HEATMAP →</span>
              {dateFilter && (
                <button
                  type="button"
                  className="hm-filter-chip"
                  onClick={() => setDateFilter(null)}
                  title="Clear day filter"
                >
                  DAY · {dateFilterLabel} <span className="x">×</span>
                </button>
              )}
              {sourceFilter && (
                <button
                  type="button"
                  className="hm-filter-chip"
                  onClick={() => setSourceFilter(null)}
                  title="Clear source filter"
                >
                  SOURCE · {sourceFilter} <span className="x">×</span>
                </button>
              )}
              <button
                type="button"
                className="hm-filter-chip clear-all"
                onClick={() => { setDateFilter(null); setSourceFilter(null); }}
                title="Clear all heatmap filters"
              >
                CLEAR ALL
              </button>
            </div>
          )}

          <section className="panel corners" style={{padding: 0}}>
            <div className="panel-head">
              <div className="left">
                <span className="amber">▌</span> POST_LEDGER · {activeSubject?.code || "—"} · SORTED DESC
              </div>
              <div className="right">
                <span>HOVER ROW · EXPAND</span>
                <span>CLICK ICON · POP OUT</span>
                <span className="amber">{filtered.length}/{posts.length}</span>
                {adminMode && (
                  <button
                    className="chip active"
                    style={{marginLeft: 4}}
                    onClick={() => setEditingStatement({ subject_id: activeSubjectId })}
                  >
                    + NEW POST
                  </button>
                )}
              </div>
            </div>

            <div className="row row-header" style={{
              cursor: "default",
              background: "var(--bg-2)",
              fontSize: 9,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--fg-4)",
              padding: "5px 10px"
            }} onClick={e => e.preventDefault()}>
              <div>POSTED</div>
              <div>SRC</div>
              <div>TYPE</div>
              <div>SUMMARY</div>
              <div>ENGAGEMENT</div>
              <div>TOPICS</div>
              <div></div>
            </div>

            <div className="feed">
              {filtered.map((p, i) => (
                <PostRow
                  key={p._uuid}
                  post={p}
                  index={i}
                  expanded={expandedId === p._uuid}
                  onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
                  onOpen={(p) => setModalPost(p)}
                  onEdit={(p) => setEditingStatement(p)}
                  adminMode={adminMode}
                />
              ))}
              {filtered.length === 0 && (
                <div style={{padding: 40, textAlign: "center", color: "var(--fg-4)"}}>
                  NO RECORDS · {posts.length === 0 ? "ADD ONE WITH + ADD POST" : "ADJUST FILTERS"}<span className="caret"></span>
                </div>
              )}
            </div>
          </section>

          <div className="footbar">
            <div style={{display:"flex", gap:18}}>
              <span><span className="amber">●</span> CONNECTED · SUPABASE</span>
              <span className="dim">REGION: EU-CENTRAL</span>
              {adminMode && <span className="amber">EDIT MODE · LOCAL</span>}
            </div>
            <div style={{display:"flex", gap:18}}>
              <span className="dim">{filtered.length} ROWS</span>
              <span className="dim">SHIFT+? FOR HOTKEYS</span>
              <span className="amber">HORKOS // OATH-KEEPER</span>
            </div>
          </div>
        </main>

        <RightBar />
      </div>

      {modalPost && (
        <PostModal
          post={modalPost}
          onClose={() => setModalPost(null)}
          onEdit={(p) => { setModalPost(null); setEditingStatement(p); }}
          adminMode={adminMode}
        />
      )}

      {editingSubject && (
        <SubjectEditModal
          subject={editingSubject}
          onClose={() => setEditingSubject(null)}
          onSaved={async (saved) => {
            await reloadSubjects();
            if (saved?.id) setActiveSubjectId(saved.id);
          }}
        />
      )}

      {editingStatement && (
        <StatementEditModal
          statement={editingStatement}
          subjects={subjects}
          defaultSubjectId={activeSubjectId}
          onClose={() => setEditingStatement(null)}
          onSaved={reloadFeed}
          onDeleted={reloadFeed}
        />
      )}

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
