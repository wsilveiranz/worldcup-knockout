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

  // The most recently completed match as of now — we highlight it and scroll
  // the list to it on load, so the user lands on the latest finished result.
  // "Completed" = kickoff + ~2h (full match incl. stoppage) is in the past.
  const targetId = useMemo(() => {
    const now = Date.now();
    const MATCH_MS = 2 * 60 * 60 * 1000;
    let pick = null;
    for (const m of rows) {
      const t = m.kickoffUtc ? new Date(m.kickoffUtc).getTime() : NaN;
      if (!Number.isNaN(t) && t + MATCH_MS <= now) pick = m.id; // rows sorted ascending → keep last
    }
    return pick;
  }, [rows]);

  const scrollRef = useRef(null);
  const didScroll = useRef(false);

  useEffect(() => {
    if (didScroll.current || !targetId) return;
    const cont = scrollRef.current;
    const el = cont?.querySelector(`tr[data-id="${CSS.escape(targetId)}"]`);
    if (!cont || !el) return;
    const headH = cont.querySelector('thead')?.offsetHeight ?? 0;
    const top =
      el.getBoundingClientRect().top - cont.getBoundingClientRect().top + cont.scrollTop - headH;
    cont.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
    didScroll.current = true;
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
