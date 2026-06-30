import React, { useMemo } from 'react';
import { ROUND_NAME } from '../lib/model.js';
import { formatNztDate, formatNztTime, kickoffSortKey } from '../lib/time.js';

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

export default function ScheduleTable({ resolved, model }) {
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

  return (
    <aside className="schedule">
      <div className="schedule-head">
        <h2>Match Schedule</h2>
        <span className="tz-note">All times in NZT · {ROUND_NAME.R32}→{ROUND_NAME.F}</span>
      </div>
      <div className="schedule-scroll">
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
              <tr key={m.id} className={`row-${m.status}`}>
                <td className="c-date">
                  <span className={`round-badge rb-${m.round}`}>{ROUND_SHORT[m.round]}</span>
                  {formatNztDate(m.kickoffUtc)}
                </td>
                <td className="c-time">{formatNztTime(m.kickoffUtc).replace(' NZT', '')}</td>
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
