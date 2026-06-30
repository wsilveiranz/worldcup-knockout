import React from 'react';
import { TIMEZONES, formatTime, tzAbbrev } from '../lib/time.js';

// Top-right action cluster: timezone picker + refresh / reset buttons.
export function Controls({ loading, whatIfCount, tz, onTzChange, onRefresh, onReset }) {
  return (
    <div className="controls">
      <label className="tz-select" title="Show kickoff times in this timezone">
        <span className="tz-select-label">Timezone</span>
        <select value={tz} onChange={(e) => onTzChange(e.target.value)}>
          {TIMEZONES.map((z) => (
            <option key={z.id} value={z.id}>
              {z.label} ({tzAbbrev(z.id)})
            </option>
          ))}
        </select>
      </label>
      <button className="btn" onClick={onRefresh} disabled={loading}>
        {loading ? 'Updating…' : 'Refresh results'}
      </button>
      <button className="btn ghost" onClick={onReset} disabled={whatIfCount === 0}>
        Reset what-if{whatIfCount ? ` (${whatIfCount})` : ''}
      </button>
    </div>
  );
}

// Bottom-right status: live/fallback indicator + projected champion.
export function StatusLine({ loading, error, usingFallback, lastUpdated, generatedAt, championTeam, tz }) {
  const stamp = (v) => `${formatTime(v, tz)} ${tzAbbrev(tz, v)}`;
  return (
    <div className="status-block">
      <div className="status-line">
        <span className={`dot ${loading ? 'live' : error ? 'err' : 'ok'}`} />
        {loading
          ? 'Fetching latest results from FIFA…'
          : error
          ? `FIFA feed unavailable — showing harvested data${
              generatedAt ? ` (${stamp(generatedAt)})` : ''
            }`
          : usingFallback
          ? `Showing harvested FIFA data${generatedAt ? ` (${stamp(generatedAt)})` : ''}`
          : `Live FIFA results · updated ${stamp(lastUpdated)}`}
      </div>
      {championTeam && (
        <div className="champ-line">
          🏆 Projected champion: <strong>{championTeam.name}</strong>
        </div>
      )}
    </div>
  );
}

export default Controls;
