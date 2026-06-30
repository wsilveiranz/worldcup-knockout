// Format kickoff timestamps into New Zealand Time (NZT).
// Uses the IANA zone 'Pacific/Auckland' so NZST/NZDT is handled automatically.

const NZ_ZONE = 'Pacific/Auckland';

const dateFmt = new Intl.DateTimeFormat('en-NZ', {
  timeZone: NZ_ZONE,
  day: '2-digit',
  month: 'short',
});

const timeFmt = new Intl.DateTimeFormat('en-NZ', {
  timeZone: NZ_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatNztDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return dateFmt.format(d);
}

export function formatNztTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${timeFmt.format(d)} NZT`;
}

export function kickoffSortKey(iso) {
  const t = iso ? new Date(iso).getTime() : NaN;
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}
