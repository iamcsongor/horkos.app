/* HORKOS — in-page tweaks panel
 *
 * Minimal floating panel for the display tweaks (accent, density,
 * scanlines, heatmap/stats visibility). Persisted in localStorage.
 */
const { useState: _tpUseState, useEffect: _tpUseEffect } = React;

const TWEAKS_STORAGE_KEY = "horkos.tweaks";

function useTweaks(defaults) {
  const [tweaks, setTweaks] = _tpUseState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(TWEAKS_STORAGE_KEY) || "null");
      return { ...defaults, ...(stored || {}) };
    } catch (e) {
      return { ...defaults };
    }
  });
  _tpUseEffect(() => {
    try { localStorage.setItem(TWEAKS_STORAGE_KEY, JSON.stringify(tweaks)); } catch (e) {}
  }, [tweaks]);
  const setOne = (k, v) => setTweaks(t => ({ ...t, [k]: v }));
  return [tweaks, setOne];
}

function TweaksPanel({ title = "TWEAKS", children }) {
  const [open, setOpen] = _tpUseState(false);
  return (
    <>
      <button
        className="tweaks-toggle"
        onClick={() => setOpen(o => !o)}
        title="Toggle design tweaks"
      >
        ⚙ TWEAKS
      </button>
      {open && (
        <aside className="tweaks-panel panel corners" onClick={e => e.stopPropagation()}>
          <div className="panel-head">
            <div className="left"><span className="amber">▌</span> {title}</div>
            <div className="right">
              <button className="iconbtn" onClick={() => setOpen(false)}>×</button>
            </div>
          </div>
          <div className="panel-body" style={{display:"flex", flexDirection:"column", gap:14}}>
            {children}
          </div>
        </aside>
      )}
    </>
  );
}

function TweakSection({ label, children }) {
  return (
    <section className="tweak-section">
      <div className="dim u" style={{fontSize:10, marginBottom:6}}>{label}</div>
      <div style={{display:"flex", flexDirection:"column", gap:6}}>
        {children}
      </div>
    </section>
  );
}

function TweakRadio({ label, value, options, onChange }) {
  return (
    <div className="tweak-row">
      {label && <span className="tweak-row-label">{label}</span>}
      <div style={{display:"flex", gap:4, flexWrap:"wrap"}}>
        {options.map(o => (
          <button
            key={o.value}
            className={"chip" + (value === o.value ? " active" : "")}
            onClick={() => onChange(o.value)}
          >{o.label}</button>
        ))}
      </div>
    </div>
  );
}

function TweakToggle({ label, value, onChange }) {
  return (
    <label className="tweak-row" style={{cursor:"pointer"}}>
      <span className="tweak-row-label">{label}</span>
      <button
        className={"chip" + (value ? " active" : "")}
        onClick={() => onChange(!value)}
      >{value ? "ON" : "OFF"}</button>
    </label>
  );
}

Object.assign(window, { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakToggle });
