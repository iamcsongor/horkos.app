# HORKOS

> Radical transparency for politicians. Every public statement, indexed, searchable, archived.

**Horkos** is a public-record archive of politicians and publicly exposed figures. Anything they have said in public — Facebook posts, tweets, speeches, interviews, press releases, parliamentary remarks, video appearances, lawsuit filings — is captured, normalized, and made permanently searchable.

The name is taken from Horkos, the ancient Greek personification of oaths. The project exists because public statements should outlive the news cycle that produced them, and because accountability requires receipts.

---

## Why

Public figures speak a lot. Most of what they say disappears — buried by the next post, deleted, rewritten, or simply never indexed. When a contradiction matters, the evidence is usually gone or scattered across a dozen platforms behind a dozen UX walls.

Horkos is the counterweight. One archive. One interface. Every statement preserved verbatim, with metadata, source URL, capture timestamp, and a hash of the original payload.

---

## What it captures

For every public figure on the watchlist, Horkos indexes:

- **Social posts** — Facebook, X, Telegram, Instagram, threads. Text, images, video, reactions, comment counts.
- **Speeches & interviews** — broadcast clips, podcast appearances, parliamentary floor remarks. Auto-transcribed.
- **Press releases & open letters** — published statements from official channels.
- **Legal filings** — lawsuits filed by or against the subject, where the docket is public.
- **Cross-references** — every record is linked to prior records on the same topic, and contradictions are flagged.

Each record carries:

```
id              · stable archive identifier
captured_at     · UTC timestamp of capture
source          · channel (FB / X / YT / PR / LX / ...)
url             · canonical source URL
media_type      · text / image / video
summary         · one-line analyst summary
topics          · structured topic tags
preview         · ~10-line excerpt
full            · verbatim full text
participants    · count of discourse participants
reactions       · likes / comments / shares
sha256          · hash of the original payload
```

---

## Current scope

Horkos is in early build. The current MVP focuses on:

- **Channels:** Facebook posts (text, image, video)
- **Subjects:** initial Hungarian political watchlist (Péter Magyar et al.), expanding from there
- **Frontend:** dense, gamified terminal-style interface — itemized feed, GitHub-style activity heatmap, pop-out detail view, day/night mode

Planned channels: X / Twitter, YouTube, Telegram, press releases, court filings.

Planned subjects: extend coverage country by country, prioritized by Wikipedia notability + active office.

---

## Architecture

```
┌───────────────────────────────────┐
│  COLLECTORS                       │  per-channel adapters (FB, X, YT, ...)
└──────────────┬────────────────────┘
               │ raw payloads + media
┌──────────────▼────────────────────┐
│  NORMALIZER                       │  schema unification, hashing, dedup
└──────────────┬────────────────────┘
               │ canonical records
┌──────────────▼────────────────────┐
│  COLD STORAGE  (immutable, S3)    │  full media + original payloads
│  + INDEX       (Postgres + FTS)   │  searchable metadata + summaries
└──────────────┬────────────────────┘
               │
┌──────────────▼────────────────────┐
│  ENRICHMENT                       │  topic tagging, summarization,
│                                   │  contradiction detection
└──────────────┬────────────────────┘
               │
┌──────────────▼────────────────────┐
│  FRONTEND  (this repo)            │  dense feed + analysis HUD
└───────────────────────────────────┘
```

---

## Running the frontend locally

The frontend is a static HTML prototype — no build step required.

```bash
git clone https://github.com/<org>/horkos.git
cd horkos
python3 -m http.server 8000
# open http://localhost:8000/Horkos.html
```

Stack: HTML + React (via Babel standalone) + plain CSS. Designed at 1440px, scales down to ~980px.

Mock data lives in `data.js`. Replace with API calls once the backend is wired.

---

## Repository layout

```
Horkos.html         · entry point
styles.css          · theme tokens, panels, feed, modal, light + dark
components.jsx      · React components (topbar, sidebar, feed, modal, ...)
app.jsx             · root app + state + filters + theme persistence
tweaks-panel.jsx    · in-page design tweaks (accent, density, scanlines)
data.js             · mock subject + posts + activity dataset
```

---

## Editorial principles

1. **Verbatim or nothing.** Captured text is never paraphrased or edited. Summaries are clearly labeled.
2. **Sources are first-class.** Every record links back to the original URL. Capture metadata is shown.
3. **Immutability.** Records are not deleted when the source deletes the original. Takedown notices are logged separately and visible.
4. **Transparency about transparency.** The methodology, source list, and capture cadence are public. Bug reports welcome.
5. **No editorial spin.** Topic tags and contradiction flags are mechanical, not opinionated. Analyst notes are clearly marked as such.

---

## Contributing

Issues and PRs welcome. Areas where help is most useful right now:

- Additional channel collectors (X, YouTube, Telegram)
- Country-specific watchlist curation
- Translation of summaries
- Frontend accessibility audit
- Topic taxonomy refinement

Please open an issue before starting substantial work so we can coordinate.

---

## Acknowledgements

Built in the open. Inspired by every journalist who has ever tried to keep a screenshot of a deleted tweet.

> *"He who breaks an oath, even unwittingly, falls into ruin."* — on Horkos, son of Eris.
