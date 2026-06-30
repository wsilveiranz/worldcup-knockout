// Harvest the real World Cup 2026 knockout data from FIFA's official API and write a
// bundled fallback snapshot (src/data/fifa-2026.json). Re-run to refresh:
//   node src/data/harvest.mjs
import { writeFileSync } from 'node:fs';
import { fetchFifaMatches } from '../lib/fifa.js';

const matches = await fetchFifaMatches();
const knockout = matches.filter((m) => m.round !== '3P' || true); // keep all incl. 3P

const payload = {
  source: 'FIFA api.fifa.com (IdCompetition 17, IdSeason 285023)',
  generatedAt: new Date().toISOString(),
  matches: knockout,
};

writeFileSync(new URL('./fifa-2026.json', import.meta.url), JSON.stringify(payload, null, 2));
console.log(`Wrote fifa-2026.json with ${knockout.length} knockout matches.`);
