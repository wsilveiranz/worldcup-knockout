import React, { useMemo } from 'react';
import { layout, NODE_DIAM } from '../lib/geometry.js';
import Connectors from './Connectors.jsx';
import TeamNode from './TeamNode.jsx';
import trophyImg from '../assets/fifa_worldcup.png';

const SIZE = 760;
const INNER_ROUNDS = ['R32', 'R16', 'QF', 'SF']; // F winner is the centre champion

function Trophy({ cx, cy, scale = 1 }) {
  const s = 80 * scale;
  return (
    <image
      className="trophy"
      href={trophyImg}
      x={cx - s / 2}
      y={cy - s / 2}
      width={s}
      height={s}
      preserveAspectRatio="xMidYMid meet"
    />
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
