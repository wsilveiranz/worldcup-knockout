// Polar geometry for the radial bracket.
// Each round is a concentric ring; matches/teams are placed by angle.
//
// The 32 Round-of-32 teams sit on the outer ring. Each inner round has half
// as many nodes, positioned at the angular midpoint of their two children,
// on a smaller radius — producing the circular bracket of the reference design.

import { ROUND_ORDER } from '../lib/model.js';

// The 32 Round-of-32 participants sit on the OUTER team ring.
export const TEAM_RING = 0.92;

// Radius (as a fraction of half the viewBox) for each match's WINNER slot.
// The winner of a round sits one ring inward (R32 winners -> 16-flag ring, etc.).
const NODE_RADIUS = {
  R32: 0.72, // 16 winners
  R16: 0.55, // 8 winners
  QF: 0.39, // 4 winners
  SF: 0.25, // 2 winners
  F: 0.0, // champion at centre
};

// Flag diameter (fraction of viewBox) per ring, so inner rings read larger.
export const NODE_DIAM = {
  TEAM: 0.066,
  R32: 0.058,
  R16: 0.07,
  QF: 0.082,
  SF: 0.092,
  F: 0.12,
};

// Number of matches per round (used to compute angular spacing).
const ROUND_MATCHES = { R32: 16, R16: 8, QF: 4, SF: 2, F: 1 };

const TWO_PI = Math.PI * 2;
const START = -Math.PI / 2; // 12 o'clock

// Angle (radians) for a Round-of-32 TEAM at outer index 0..31.
export function teamAngle(outerIndex) {
  return START + (outerIndex / 32) * TWO_PI;
}

// Angle for a MATCH node: the exact angular midpoint of its two children, so
// every parent sits centred between the pair it joins (needed for symmetric
// bracket elbows). A match in `round` at `slot` covers a contiguous arc of the
// 32 outer slots; teams sit at integer indices, so the centre is offset by
// (span-1)/2 from the first covered index.
export function matchAngle(round, slot) {
  const matches = ROUND_MATCHES[round];
  const span = 32 / matches; // outer slots covered by one match in this round
  const centerOuter = slot * span + (span - 1) / 2;
  return START + (centerOuter / 32) * TWO_PI;
}

export function polar(cx, cy, radius, angle) {
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

// Compute pixel positions for every node, given canvas size.
export function layout(size) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2;

  const teams = []; // outer team flag positions (32)
  for (let i = 0; i < 32; i++) {
    const a = teamAngle(i);
    const p = polar(cx, cy, maxR * TEAM_RING, a);
    teams.push({ outerIndex: i, angle: a, ...p });
  }

  const nodes = {}; // match id -> winner-slot position
  for (const round of ROUND_ORDER) {
    const count = ROUND_MATCHES[round];
    for (let slot = 0; slot < count; slot++) {
      const a = matchAngle(round, slot);
      const r = maxR * (NODE_RADIUS[round] ?? 0.1);
      nodes[`${round}-${slot}`] = { angle: a, round, slot, ...polar(cx, cy, r, a) };
    }
  }

  return { cx, cy, maxR, teams, nodes };
}

// Radius (fraction) at which each round's CHILDREN sit — i.e. the ring of the
// previous round's winner nodes (or the outer team ring for R32).
const CHILD_RADIUS = {
  R32: TEAM_RING,
  R16: NODE_RADIUS.R32,
  QF: NODE_RADIUS.R16,
  SF: NODE_RADIUS.QF,
  F: NODE_RADIUS.SF,
};

// How far (0..1) from the child ring toward the winner ring the tangential
// "bracket" arc sits. Smaller = arc hugs the children with a long inward stem.
const BRACKET_T = 0.4;

// Radius of the tangential bracket arc for a match in `round`.
function bracketRadius(round) {
  const rc = CHILD_RADIUS[round];
  const rp = NODE_RADIUS[round] ?? 0;
  return rc + (rp - rc) * BRACKET_T;
}

// One child's bracket leg: a radial line inward from the child to the bracket
// arc radius, then an arc along that radius to the match's mid angle (where the
// two legs of the pair meet). This is the rotated equivalent of a traditional
// bracket's "│" connector; the arcs across all matches in a round read as a
// concentric circle.
export function legPath(child, childAngle, midAngle, round, cx, cy, maxR) {
  const rb = maxR * bracketRadius(round);
  const foot = polar(cx, cy, rb, childAngle); // foot of the child's radial line
  const meet = polar(cx, cy, rb, midAngle); // arc end at the pair's mid angle
  const sweep = midAngle > childAngle ? 1 : 0; // SVG y-down: increasing angle = clockwise
  return (
    `M ${child.x.toFixed(1)} ${child.y.toFixed(1)} ` +
    `L ${foot.x.toFixed(1)} ${foot.y.toFixed(1)} ` +
    `A ${rb.toFixed(1)} ${rb.toFixed(1)} 0 0 ${sweep} ${meet.x.toFixed(1)} ${meet.y.toFixed(1)}`
  );
}

// The match's stem: a radial line from the bracket arc's mid point inward to the
// winner node (which becomes a child of the next round).
export function stemPath(midAngle, round, parent, cx, cy, maxR) {
  const rb = maxR * bracketRadius(round);
  const start = polar(cx, cy, rb, midAngle);
  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} L ${parent.x.toFixed(1)} ${parent.y.toFixed(1)}`;
}

// Straight radial line — used for the Final, whose winner sits at the centre.
export function straightPath(child, parent) {
  return `M ${child.x.toFixed(1)} ${child.y.toFixed(1)} L ${parent.x.toFixed(1)} ${parent.y.toFixed(1)}`;
}
