# World Cup 2026 — Knockout Phase

An interactive single-page app visualizing the FIFA World Cup 2026 knockout phase
(Round of 32 → Round of 16 → Quarter-finals → Semi-finals → Final) as a circular/radial
bracket, based on the [FWC26 circle draw](https://fwc2026-knockout.vercel.app/) concept.

## Features

- **Circular bracket** — 32 teams on the outer ring, winners advancing inward toward the
  trophy at the centre, with radial connector lines.
- **What-if scenarios** — click any team in an *undecided* match to advance it; winners
  propagate inward to the Final. Finished matches are **locked** (their real result is
  fixed and auto-advances). Use **Reset what-if** to clear your picks.
- **Live updates** — on load (and via **Refresh results**) the app pulls the latest actual
  results directly from the **official FIFA API**. If the live feed is unavailable, it
  falls back to a bundled harvested snapshot, indicated in the status line.
- **Schedule sidebar** — every knockout match with date, kickoff time (in **New Zealand
  Time**), and result/status (including penalty shoot-out scores), sorted by kickoff.

## Running

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## Data source

The bracket and results come from FIFA's official public calendar API:

```
https://api.fifa.com/api/v3/calendar/matches?idCompetition=17&idSeason=285023
```

- `idCompetition=17` (FIFA World Cup), `idSeason=285023` (2026). The endpoint sends
  `Access-Control-Allow-Origin: *`, so the browser fetches it live for "updates as it
  happens".
- It returns all 104 matches. The knockout matches carry a `MatchNumber` (73–104) and
  `PlaceHolderA`/`PlaceHolderB` fields (e.g. `W77` = winner of match 77), which encode the
  exact bracket tree — this is how the pairings are derived (no manual seeding).
- Real teams, scores, penalty scores, UTC kickoff dates, and match status are read straight
  from the feed. Country flags use `https://api.fifa.com/api/v3/picture/flags-sq-4/{code}`.

## How it works

- `src/lib/fifa.js` — fetches and normalizes matches from the FIFA API (shared by the app
  and the harvest script).
- `src/lib/model.js` — builds the bracket tree from the `W##` placeholder links, derives the
  outer team order, then resolves winners: finished matches are locked and auto-advanced,
  what-if picks apply only to undecided matches, and winners propagate inward.
- `src/data/fifa-2026.json` — a harvested snapshot bundled as an offline fallback.
  Regenerate with `node src/data/harvest.mjs`.
- `src/lib/geometry.js` — polar layout for the concentric rings and connector paths.
- `src/lib/time.js` — formats kickoff times to NZT (`Pacific/Auckland`).

## Notes

- Pairings are derived from the FIFA bracket tree rather than hand-seeded, so the radial
  layout always reflects the real draw.
- The bundled snapshot guarantees the bracket and schedule render even if the live feed is
  briefly unreachable; the status line shows whether live or fallback data is in use.
