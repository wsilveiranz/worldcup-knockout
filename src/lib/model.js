// Build the knockout bracket model from normalized FIFA matches and resolve winners.
//
// - Tree linkage comes from FIFA `PlaceHolderA/B` ("W##" = winner of match ##).
// - Structural slot order per round is derived by left-to-right level expansion from the
//   Final, so paired teams are adjacent and consecutive pairing is correct.
// - Finished matches are LOCKED (real winner auto-advances); what-if picks only apply to
//   undecided matches. Effective winner = real result if finished, else what-if, else none.

export const ROUND_ORDER = ['R32', 'R16', 'QF', 'SF', 'F'];
export const ROUND_NAME = {
  R32: 'Round of 32',
  R16: 'Round of 16',
  QF: 'Quarter-finals',
  SF: 'Semi-finals',
  F: 'Final',
  '3P': 'Third place',
};

function parseW(placeholder) {
  const m = /^W(\d+)$/.exec(placeholder || '');
  return m ? Number(m[1]) : null;
}

// Construct the bracket structure + team order from the canonical match list.
export function buildModel(matches) {
  const byNumber = new Map(matches.map((m) => [m.number, m]));

  // Children of a knockout match, by FIFA number (null for R32 leaves).
  const childrenOf = (n) => {
    const m = byNumber.get(n);
    if (!m) return null;
    const a = parseW(m.placeHolderA);
    const b = parseW(m.placeHolderB);
    return a && b ? [a, b] : null;
  };

  // Find the Final (round F). Fall back to the highest match number.
  const finalMatch =
    matches.find((m) => m.round === 'F') ||
    matches.reduce((acc, m) => (!acc || m.number > acc.number ? m : acc), null);

  // Left-to-right level expansion from the Final down to R32.
  const levels = {}; // round -> [fifaNumber,...] in slot order
  let current = finalMatch ? [finalMatch.number] : [];
  for (const round of ['F', 'SF', 'QF', 'R16', 'R32']) {
    levels[round] = current;
    const next = [];
    for (const n of current) {
      const ch = childrenOf(n);
      if (ch) next.push(ch[0], ch[1]);
    }
    current = next;
  }

  // Build structural matches keyed by `${round}-${slot}`.
  const structure = { matches: {}, order: [], fifaToId: {} };
  const teamsOrder = [];
  const teamsById = {};

  const addTeam = (t) => {
    if (t && !teamsById[t.id]) teamsById[t.id] = t;
  };

  for (const round of ROUND_ORDER) {
    const list = levels[round] || [];
    list.forEach((fifaNumber, slot) => {
      const id = `${round}-${slot}`;
      const fm = byNumber.get(fifaNumber);
      const parentRound = ROUND_ORDER[ROUND_ORDER.indexOf(round) + 1];
      const parentSlot = Math.floor(slot / 2);
      structure.matches[id] = {
        id,
        round,
        slot,
        fifaNumber,
        parentId: parentRound ? `${parentRound}-${parentSlot}` : null,
        childIds:
          round === 'R32'
            ? null
            : [`${ROUND_ORDER[ROUND_ORDER.indexOf(round) - 1]}-${slot * 2}`,
               `${ROUND_ORDER[ROUND_ORDER.indexOf(round) - 1]}-${slot * 2 + 1}`],
        seeds: round === 'R32' && fm ? [fm.home ? fm.home.id : null, fm.away ? fm.away.id : null] : null,
      };
      structure.order.push(id);
      structure.fifaToId[fifaNumber] = id;

      if (round === 'R32' && fm) {
        addTeam(fm.home);
        addTeam(fm.away);
        teamsOrder.push(fm.home, fm.away);
      }
    });
  }

  // Per-structural-id metadata (kickoff / status / scores) for every knockout match.
  const meta = {};
  for (const m of matches) {
    const id = structure.fifaToId[m.number];
    if (!id) continue;
    meta[id] = m;
  }

  // Third-place playoff (not part of the main tree) kept for the schedule.
  const thirdPlace = matches.find((m) => m.round === '3P') || null;

  return { structure, teamsOrder, teamsById, meta, thirdPlace, matches };
}

function winnerFromScores(a, b, scoreA, scoreB, penA, penB) {
  if (scoreA == null || scoreB == null) return null;
  if (scoreA > scoreB) return a;
  if (scoreB > scoreA) return b;
  if (penA != null && penB != null && penA !== penB) return penA > penB ? a : b;
  return null;
}

// Resolve participants and winners across the bracket, applying real results then what-if.
export function resolveModel(model, whatIf) {
  const { structure, meta } = model;
  const resolved = {};

  for (const round of ROUND_ORDER) {
    for (const id of structure.order) {
      const sm = structure.matches[id];
      if (sm.round !== round) continue;

      let a = null;
      let b = null;
      if (round === 'R32') {
        [a, b] = sm.seeds || [null, null];
      } else {
        const c0 = resolved[sm.childIds[0]];
        const c1 = resolved[sm.childIds[1]];
        a = c0 ? c0.winnerId : null;
        b = c1 ? c1.winnerId : null;
      }

      const fm = meta[id] || {};
      // Align FIFA home/away to participant order [a, b].
      let homeScore = null;
      let awayScore = null;
      let penHome = null;
      let penAway = null;
      if (fm.home && fm.away) {
        if (fm.home.id === a) {
          homeScore = fm.homeScore;
          awayScore = fm.awayScore;
          penHome = fm.penHome;
          penAway = fm.penAway;
        } else if (fm.home.id === b) {
          homeScore = fm.awayScore;
          awayScore = fm.homeScore;
          penHome = fm.penAway;
          penAway = fm.penHome;
        } else {
          homeScore = fm.homeScore;
          awayScore = fm.awayScore;
          penHome = fm.penHome;
          penAway = fm.penAway;
        }
      }

      const status = fm.status || 'scheduled';
      const bothKnown = Boolean(a && b);
      const finished = bothKnown && status === 'finished';
      const resultWinnerId = finished
        ? winnerFromScores(a, b, homeScore, awayScore, penHome, penAway)
        : null;
      const locked = Boolean(resultWinnerId);

      let winnerId = null;
      if (locked) winnerId = resultWinnerId;
      else if (bothKnown && whatIf && (whatIf[id] === a || whatIf[id] === b)) winnerId = whatIf[id];

      resolved[id] = {
        id,
        round,
        slot: sm.slot,
        fifaNumber: sm.fifaNumber,
        parentId: sm.parentId,
        childIds: sm.childIds,
        participants: [a, b],
        homeScore,
        awayScore,
        penHome,
        penAway,
        status,
        kickoffUtc: fm.kickoffUtc || null,
        stadium: fm.stadium || null,
        city: fm.city || null,
        bothKnown,
        finished,
        locked,
        resultWinnerId,
        winnerId,
        whatIfPick: whatIf && whatIf[id] ? whatIf[id] : null,
      };
    }
  }

  const championId = resolved['F-0'] ? resolved['F-0'].winnerId : null;
  return { matches: resolved, order: structure.order, championId };
}
