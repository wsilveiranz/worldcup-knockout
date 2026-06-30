import React, { useMemo } from 'react';
import { layout, NODE_DIAM } from '../lib/geometry.js';
import Connectors from './Connectors.jsx';
import TeamNode from './TeamNode.jsx';

const SIZE = 760;
const INNER_ROUNDS = ['R32', 'R16', 'QF', 'SF']; // F winner is the centre champion

function Trophy({ cx, cy, scale = 1 }) {
  const s = 70 * scale;
  return (
    <g className="trophy" transform={`translate(${cx - s / 2}, ${cy - s / 2}) scale(${s / 64})`}>
      <path
        d="M20 6h24v6c0 1 4 1 6 1 3 0 6 2 6 6 0 6-6 10-12 11-2 4-5 6-8 7l-1 8h6v4H23v-4h6l-1-8c-3-1-6-3-8-7C14 36 8 32 8 25c0-4 3-6 6-6 2 0 6 0 6-1V6z M14 23c0 4 3 6 6 8-1-3-1-7-1-11-3 0-5 1-5 3z M50 23c0-2-2-3-5-3 0 4 0 8-1 11 3-2 6-4 6-8z"
        fill="#cfd6e4"
        stroke="#8b93a7"
        strokeWidth="0.6"
      />
      <rect x="18" y="54" width="28" height="4" rx="1" fill="#cfd6e4" />
    </g>
  );
}

export default function CircularBracket({ model, resolved, onAdvance }) {
  const { structure, teamsOrder, teamsById } = model;
  const L = useMemo(() => layout(SIZE), []);
  const champ = resolved.matches['F-0'];
  const champTeam = champ && champ.winnerId ? teamsById[champ.winnerId] : null;

  // Reverse map: team id -> { matchId, side } for the outer Round-of-32 ring.
  const seedPos = useMemo(() => {
    const idx = {};
    for (let slot = 0; slot < 16; slot++) {
      const sm = structure.matches[`R32-${slot}`];
      if (!sm || !sm.seeds) continue;
      if (sm.seeds[0]) idx[sm.seeds[0]] = { matchId: sm.id, side: 0 };
      if (sm.seeds[1]) idx[sm.seeds[1]] = { matchId: sm.id, side: 1 };
    }
    return idx;
  }, [structure]);

  const innerNodes = [];
  for (const round of INNER_ROUNDS) {
    const count = structure.order.filter((id) => structure.matches[id].round === round).length;
    for (let slot = 0; slot < count; slot++) {
      const id = `${round}-${slot}`;
      const rm = resolved.matches[id];
      const pos = L.nodes[id];
      if (!rm || !pos) continue;
      const team = rm.winnerId ? teamsById[rm.winnerId] : null;

      const parent = rm.parentId ? resolved.matches[rm.parentId] : null;
      const eliminated = team && parent && parent.winnerId && parent.winnerId !== rm.winnerId;
      const state = !team
        ? 'idle'
        : eliminated
        ? 'eliminated'
        : rm.locked
        ? 'locked'
        : rm.whatIfPick === rm.winnerId
        ? 'whatif'
        : 'advanced';

      const canClick = Boolean(team && parent && !parent.locked && parent.bothKnown);

      innerNodes.push(
        <TeamNode
          key={id}
          x={pos.x}
          y={pos.y}
          d={NODE_DIAM[round] * SIZE}
          team={team}
          state={state}
          clickable={canClick}
          onClick={() => canClick && onAdvance(rm.parentId, rm.winnerId)}
          label={team ? `${team.name} — advance` : id}
        />
      );
    }
  }

  const teamNodes = L.teams.map((p) => {
    const k = p.outerIndex;
    const team = teamsOrder[k];
    if (!team) {
      return (
        <circle
          key={`team-${k}`}
          cx={p.x}
          cy={p.y}
          r={(NODE_DIAM.TEAM * SIZE) / 2}
          className="node-empty"
        />
      );
    }

    const sp = seedPos[team.id];
    const matchId = sp ? sp.matchId : null;
    const rm = matchId ? resolved.matches[matchId] : null;

    const eliminated = rm && rm.winnerId && rm.winnerId !== team.id;
    const state = !rm
      ? 'idle'
      : eliminated
      ? 'eliminated'
      : rm.winnerId === team.id
      ? rm.locked
        ? 'locked'
        : 'whatif'
      : 'idle';
    const canClick = Boolean(rm && !rm.locked);

    return (
      <TeamNode
        key={`team-${k}`}
        x={p.x}
        y={p.y}
        d={NODE_DIAM.TEAM * SIZE}
        team={team}
        state={state}
        clickable={canClick}
        onClick={() => canClick && onAdvance(matchId, team.id)}
        label={`${team.name} — ${rm && rm.locked ? 'result locked' : 'click to advance'}`}
      />
    );
  });

  return (
    <svg
      className="bracket-svg"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label="World Cup 2026 knockout bracket"
    >
      <Connectors structure={structure} layout={L} resolved={resolved} />

      {champTeam ? (
        <g className="champion">
          <circle
            cx={L.cx}
            cy={L.cy}
            r={NODE_DIAM.F * SIZE * 0.62 + 10}
            className="champion-glow"
          />
          <TeamNode
            x={L.cx}
            y={L.cy}
            d={NODE_DIAM.F * SIZE}
            team={champTeam}
            state="champion"
            clickable={false}
            label={`Champion: ${champTeam.name}`}
          />
        </g>
      ) : (
        <Trophy cx={L.cx} cy={L.cy} />
      )}

      {innerNodes}
      {teamNodes}
    </svg>
  );
}
