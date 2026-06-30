import React, { useEffect, useMemo, useRef } from 'react';
import { ROUND_NAME } from '../lib/model.js';
import { formatDate, formatTime, tzAbbrev, kickoffSortKey, DEFAULT_TZ } from '../lib/time.js';

const ROUND_SHORT = { R32: 'R32', R16: 'R16', QF: 'QF', SF: 'SF', F: 'Final', '3P': '3rd' };

function TeamCell({ team }) {
  if (!team) return <span className="sched-team tbd">TBD</span>;
  return (
    <span className="sched-team">
      <img className="sched-flag" src={team.flag} alt="" loading="lazy" />
      <span className="sched-name">{team.name}</span>
    </span>
  );
}

function ResultCell({ m }) {
  const hasScore = m.homeScore != null && m.awayScore != null;
  if (m.status === 'live') {
    return (
      <span className="sched-result live">
        {hasScore ? `${m.homeScore}–${m.awayScore}` : '0–0'} <em>LIVE</em>
      </span>
    );
  }
  if (m.finished && hasScore) {
    const hasPens = m.penHome != null && m.penAway != null;
    return (
      <span className="sched-result final">
        {m.homeScore}–{m.awayScore}
        {hasPens && (
          <small className="pens">
            {m.penHome}–{m.penAway} pen
          </small>
        )}
      </span>
    );
  }
  return <span className="sched-result scheduled">—</span>;
}

export default function ScheduleTable({ resolved, model, tz = DEFAULT_TZ }) {
  const { teamsById, thirdPlace } = model;

  const rows = useMemo(() => {
    const list = Object.values(resolved.matches).map((m) => ({
      ...m,
      homeTeam: m.participants[0] ? teamsById[m.participants[0]] : null,
      awayTeam: m.participants[1] ? teamsById[m.participants[1]] : null,
    }));
    // Append the third-place playoff (not part of the main tree).
    if (thirdPlace) {
      list.push({
        id: '3P',
        round: '3P',
        kickoffUtc: thirdPlace.kickoffUtc,
        status: thirdPlace.status,
        homeScore: thirdPlace.homeScore,
        awayScore: thirdPlace.awayScore,
        penHome: thirdPlace.penHome,
        penAway: thirdPlace.penAway,
        finished: thirdPlace.status === 'finished',
        homeTeam: thirdPlace.home,
        awayTeam: thirdPlace.away,
      });
    }
    return list.sort((a, b) => kickoffSortKey(a.kickoffUtc) - kickoffSortKey(b.kickoffUtc));
  }, [resolved, teamsById, thirdPlace]);

  // The match to highlight and scroll to on load. We prefer a match that is
  // currently in progress (live) so the user lands on the action; otherwise we
  // fall back to the most recently finished match, which keeps the last score in
  // view with the next upcoming match (and its date) directly below it.
  const targetId = useMemo(() => {
    let live = null;
    let finished = null;
    for (const m of rows) {
      // rows are sorted ascending by kickoff → keep the last match of each kind.
      if (m.status === 'live') live = m.id;
      if (m.status === 'finished') finished = m.id;
    }
    return live ?? finished;
  }, [rows]);

  const scrollRef = useRef(null);
  const scrolledTo = useRef(null);

  useEffect(() => {
    // Scroll on first load and again whenever the target changes (e.g. a new
    // game kicks off on a page left open), but not on every periodic refresh.
    if (!targetId || scrolledTo.current === targetId) return;
    const cont = scrollRef.current;
    const el = cont?.querySelector(`tr[data-id="${CSS.escape(targetId)}"]`);
    if (!cont || !el) return;
    const headH = cont.querySelector('thead')?.offsetHeight ?? 0;
    const top =
      el.getBoundingClientRect().top - cont.getBoundingClientRect().top + cont.scrollTop - headH;
    cont.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
    scrolledTo.current = targetId;
  }, [targetId]);

  return (
    <aside className="schedule">
      <div className="schedule-head">
        <h2>Match Schedule</h2>
        <span className="tz-note">
          All times in {tzAbbrev(tz)} · {ROUND_NAME.R32}→{ROUND_NAME.F}
        </span>
      </div>
      <div className="schedule-scroll" ref={scrollRef}>
        <table className="schedule-table">
          <colgroup>
            <col className="col-date" />
            <col className="col-time" />
            <col className="col-match" />
            <col className="col-result" />
          </colgroup>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Match</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr
                key={m.id}
                data-id={m.id}
                className={`row-${m.status}${m.id === targetId ? ' row-latest' : ''}`}
              >
                <td className="c-date">
                  <span className={`round-badge rb-${m.round}`}>{ROUND_SHORT[m.round]}</span>
                  {formatDate(m.kickoffUtc, tz)}
                </td>
                <td className="c-time">{formatTime(m.kickoffUtc, tz)}</td>
                <td className="c-match">
                  <TeamCell team={m.homeTeam} />
                  <span className="vs">v</span>
                  <TeamCell team={m.awayTeam} />
                </td>
                <td className="c-result">
                  <ResultCell m={m} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </aside>
  );
}
