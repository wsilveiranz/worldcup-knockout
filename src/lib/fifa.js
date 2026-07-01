// Fetch + normalize the real World Cup 2026 knockout data from FIFA's official API.
// Works in both the browser (live updates) and Node (harvest script).
//
// Endpoint: https://api.fifa.com/api/v3/calendar/matches?idCompetition=17&idSeason=285023
// CORS is open (Access-Control-Allow-Origin: *).

export const FIFA_COMPETITION = '17'; // FIFA World Cup
export const FIFA_SEASON = '285023'; // 2026
const MATCHES_URL = `https://api.fifa.com/api/v3/calendar/matches?idCompetition=${FIFA_COMPETITION}&idSeason=${FIFA_SEASON}&count=250&language=en`;

const STAGE_TO_ROUND = {
  'Round of 32': 'R32',
  'Round of 16': 'R16',
  'Quarter-final': 'QF',
  'Semi-final': 'SF',
  Final: 'F',
  'Play-off for third place': '3P',
};

export function flagUrl(code3) {
  return `https://api.fifa.com/api/v3/picture/flags-sq-4/${code3}`;
}

function loc(arr) {
  return Array.isArray(arr) && arr.length ? arr[0].Description : null;
}

function team(side) {
  if (!side || !side.IdCountry) return null;
  const code = side.IdCountry;
  return {
    id: code,
    code,
    name: loc(side.TeamName) || (side.ShortClubName ?? code),
    flag: flagUrl(code),
  };
}

function num(v) {
  return v == null || v === '' ? null : Number(v);
}

// FIFA MatchStatus: 0 = finished, 3 = live (in play), 1/12 = not started.
function deriveStatus(raw) {
  const s = Number(raw.MatchStatus);
  if (s === 0) return 'finished';
  if (s === 3) return 'live';
  return 'scheduled';
}

function winnerId(home, away, hs, as, ph, pa) {
  if (!home || !away || hs == null || as == null) return null;
  if (hs > as) return home.id;
  if (as > hs) return away.id;
  if (ph != null && pa != null && ph !== pa) return ph > pa ? home.id : away.id;
  return null;
}

// Normalize the raw FIFA `Results` array into canonical knockout matches.
export function normalizeFifa(results) {
  const out = [];
  for (const r of results || []) {
    const round = STAGE_TO_ROUND[loc(r.StageName)];
    if (!round) continue; // skip group stage
    const home = team(r.Home);
    const away = team(r.Away);
    const hs = num(r.HomeTeamScore);
    const as = num(r.AwayTeamScore);
    const ph = num(r.HomeTeamPenaltyScore);
    const pa = num(r.AwayTeamPenaltyScore);
    out.push({
      number: Number(r.MatchNumber),
      round,
      kickoffUtc: r.Date || null,
      status: deriveStatus(r),
      home,
      away,
      placeHolderA: r.PlaceHolderA || null,
      placeHolderB: r.PlaceHolderB || null,
      homeScore: hs,
      awayScore: as,
      penHome: ph,
      penAway: pa,
      winnerId: winnerId(home, away, hs, as, ph, pa),
      stadium: loc(r.Stadium && r.Stadium.Name),
      city: loc(r.Stadium && r.Stadium.CityName),
    });
  }
  out.sort((a, b) => a.number - b.number);
  return out;
}

// Browser/Node live fetch. Throws on network failure so callers can fall back.
export async function fetchFifaMatches() {
  // Cache-bust so refreshes always get the latest data (e.g. a delayed kickoff
  // or updated score) instead of a stale browser/CDN-cached response.
  const url = `${MATCHES_URL}&_=${Date.now()}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`FIFA API HTTP ${res.status}`);
  const data = await res.json();
  return normalizeFifa(data.Results);
}
