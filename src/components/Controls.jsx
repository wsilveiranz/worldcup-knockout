import React from 'react';

function formatUpdated(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('en-NZ', {
    timeZone: 'Pacific/Auckland',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function Controls({
  loading,
  error,
  usingFallback,
  lastUpdated,
  generatedAt,
  whatIfCount,
  championTeam,
  onRefresh,
  onReset,
}) {
  return (
    <div className="controls">
      <div className="controls-row">
        <button className="btn" onClick={onRefresh} disabled={loading}>
          {loading ? 'Updating…' : 'Refresh results'}
        </button>
        <button className="btn ghost" onClick={onReset} disabled={whatIfCount === 0}>
          Reset what-if{whatIfCount ? ` (${whatIfCount})` : ''}
        </button>
      </div>

      <div className="status-line">
        <span className={`dot ${loading ? 'live' : error ? 'err' : 'ok'}`} />
        {loading
          ? 'Fetching latest results from FIFA…'
          : error
          ? `FIFA feed unavailable — showing harvested data${
              generatedAt ? ` (${formatUpdated(generatedAt)} NZT)` : ''
            }`
          : usingFallback
          ? `Showing harvested FIFA data${generatedAt ? ` (${formatUpdated(generatedAt)} NZT)` : ''}`
          : `Live FIFA results · updated ${formatUpdated(lastUpdated)} NZT`}
      </div>

      {championTeam && (
        <div className="champ-line">
          🏆 Projected champion: <strong>{championTeam.name}</strong>
        </div>
      )}
    </div>
  );
}
