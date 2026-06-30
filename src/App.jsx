import React, { useCallback, useEffect, useMemo, useState } from 'react';
import fallbackData from './data/fifa-2026.json';
import { fetchFifaMatches } from './lib/fifa.js';
import { buildModel, resolveModel } from './lib/model.js';
import { DEFAULT_TZ } from './lib/time.js';
import CircularBracket from './components/CircularBracket.jsx';
import ScheduleTable from './components/ScheduleTable.jsx';
import { Controls, StatusLine } from './components/Controls.jsx';

export default function App() {
  // Start from the bundled harvested FIFA snapshot; replace with live data on load.
  const [matches, setMatches] = useState(fallbackData.matches);
  const [whatIf, setWhatIf] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [tz, setTz] = useState(DEFAULT_TZ);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const live = await fetchFifaMatches();
      if (live && live.length) {
        setMatches(live);
        setLastUpdated(Date.now());
        setUsingFallback(false);
      } else {
        setUsingFallback(true);
      }
    } catch (e) {
      setError(e.message || 'failed');
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const model = useMemo(() => buildModel(matches), [matches]);
  const resolved = useMemo(() => resolveModel(model, whatIf), [model, whatIf]);

  // Advance a team into `matchId`. Changing a result clears downstream what-if picks.
  const advance = useCallback(
    (matchId, teamId) => {
      setWhatIf((prev) => {
        const next = { ...prev };
        if (next[matchId] === teamId) delete next[matchId];
        else next[matchId] = teamId;
        let pid = model.structure.matches[matchId]?.parentId;
        while (pid) {
          delete next[pid];
          pid = model.structure.matches[pid]?.parentId;
        }
        return next;
      });
    },
    [model]
  );

  const resetWhatIf = useCallback(() => setWhatIf({}), []);
  const whatIfCount = Object.keys(whatIf).length;
  const championTeam = resolved.championId ? model.teamsById[resolved.championId] : null;

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          World Cup 2026
          <br />
          Knockout Phase
        </h1>

        <div className="header-actions">
          <Controls
            loading={loading}
            whatIfCount={whatIfCount}
            tz={tz}
            onTzChange={setTz}
            onRefresh={refresh}
            onReset={resetWhatIf}
          />
        </div>

        <p className="subtitle">
          Interactive bracket with live FIFA results &amp; what-if scenarios. Click any team in
          an undecided match to advance it; finished matches are locked.
        </p>

        <div className="header-status">
          <StatusLine
            loading={loading}
            error={error}
            usingFallback={usingFallback}
            lastUpdated={lastUpdated}
            generatedAt={fallbackData.generatedAt}
            championTeam={championTeam}
            tz={tz}
          />
        </div>
      </header>

      <main className="app-main">
        <section className="bracket-area">
          <CircularBracket model={model} resolved={resolved} onAdvance={advance} />
        </section>
        <ScheduleTable model={model} resolved={resolved} tz={tz} />
      </main>

      <footer className="app-footer">
        Data: FIFA official API (IdCompetition 17 · season 2026). Bracket design based on the
        FWC26 circle draw concept.
      </footer>
    </div>
  );
}
