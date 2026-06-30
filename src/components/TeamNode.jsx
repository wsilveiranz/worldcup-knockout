import React from 'react';

// A circular flag chip rendered in SVG. Used for both outer team nodes and
// inner winner slots. Empty slots render a faint placeholder ring.
// `team` carries a `.flag` image URL (from the FIFA feed).
export default function TeamNode({ x, y, d, team, state = 'idle', clickable, onClick, label }) {
  const r = d / 2;
  const clipId = `clip-${Math.round(x)}-${Math.round(y)}-${Math.round(d)}`;

  if (!team) {
    // Idle junction: a small dot marker (reference "lines + dots" look).
    return <circle cx={x} cy={y} r={4.5} className="node-dot" />;
  }

  const cls = ['flag-node', `state-${state}`, clickable ? 'clickable' : 'locked-node'].join(' ');

  return (
    <g
      className={cls}
      onClick={clickable ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick && onClick(e);
              }
            }
          : undefined
      }
    >
      <title>{label || team.name}</title>
      <defs>
        <clipPath id={clipId}>
          <circle cx={x} cy={y} r={r} />
        </clipPath>
      </defs>
      <circle cx={x} cy={y} r={r + 1.5} className="flag-bg" />
      <image
        href={team.flag}
        x={x - r}
        y={y - r}
        width={d}
        height={d}
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${clipId})`}
      />
      <circle cx={x} cy={y} r={r} className="flag-ring" fill="none" />
    </g>
  );
}
