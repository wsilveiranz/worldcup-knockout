import React from 'react';
import { legPath, stemPath, straightPath } from '../lib/geometry.js';
import { ROUND_ORDER } from '../lib/model.js';

// Draws the radial bracket connectors. For each match the two participants run
// inward and join at a tangential arc; a single stem then continues inward to
// the winner node (which becomes a child of the next round). The legs/stem of
// the side that has advanced (real result or what-if) are highlighted.
export default function Connectors({ structure, layout, resolved }) {
  const paths = [];
  const { cx, cy, maxR } = layout;

  for (const id of structure.order) {
    const m = structure.matches[id];
    const parentPos = layout.nodes[id];
    if (!parentPos) continue;

    let childAPos;
    let childBPos;
    let childATeam;
    let childBTeam;

    if (m.round === 'R32') {
      childAPos = layout.teams[m.slot * 2];
      childBPos = layout.teams[m.slot * 2 + 1];
      childATeam = m.seeds ? m.seeds[0] : null;
      childBTeam = m.seeds ? m.seeds[1] : null;
    } else {
      const ci = ROUND_ORDER.indexOf(m.round) - 1;
      const childRound = ROUND_ORDER[ci];
      childAPos = layout.nodes[`${childRound}-${m.slot * 2}`];
      childBPos = layout.nodes[`${childRound}-${m.slot * 2 + 1}`];
      const ca = resolved.matches[`${childRound}-${m.slot * 2}`];
      const cb = resolved.matches[`${childRound}-${m.slot * 2 + 1}`];
      childATeam = ca ? ca.winnerId : null;
      childBTeam = cb ? cb.winnerId : null;
    }

    const rm = resolved.matches[id];
    const winner = rm ? rm.winnerId : null;
    const locked = Boolean(rm && rm.locked);

    // The Final's winner sits at the centre (no angle) — draw straight spokes.
    if (m.round === 'F') {
      if (childAPos) {
        paths.push({
          key: `${id}-a`,
          d: straightPath(childAPos, parentPos),
          active: winner && winner === childATeam,
          locked: locked && winner === childATeam,
        });
      }
      if (childBPos) {
        paths.push({
          key: `${id}-b`,
          d: straightPath(childBPos, parentPos),
          active: winner && winner === childBTeam,
          locked: locked && winner === childBTeam,
        });
      }
      continue;
    }

    const midAngle = parentPos.angle;

    paths.push({
      key: `${id}-stem`,
      d: stemPath(midAngle, m.round, parentPos, cx, cy, maxR),
      active: Boolean(winner),
      locked,
    });

    if (childAPos) {
      paths.push({
        key: `${id}-a`,
        d: legPath(childAPos, childAPos.angle, midAngle, m.round, cx, cy, maxR),
        active: winner && winner === childATeam,
        locked: locked && winner === childATeam,
      });
    }
    if (childBPos) {
      paths.push({
        key: `${id}-b`,
        d: legPath(childBPos, childBPos.angle, midAngle, m.round, cx, cy, maxR),
        active: winner && winner === childBTeam,
        locked: locked && winner === childBTeam,
      });
    }
  }

  return (
    <g className="connectors">
      {paths.map((p) => (
        <path
          key={p.key}
          d={p.d}
          className={`connector${p.active ? ' active' : ''}${p.locked ? ' locked' : ''}`}
        />
      ))}
    </g>
  );
}
