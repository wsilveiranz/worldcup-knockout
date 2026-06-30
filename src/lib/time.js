// Format kickoff timestamps into a chosen IANA timezone.
// Defaults to New Zealand ('Pacific/Auckland'); the user can pick another zone
// so kickoff times show in their local time. DST is handled automatically.

export const DEFAULT_TZ = 'Pacific/Auckland';

// The browser's local IANA timezone (e.g. 'Europe/London'), or NZ as fallback.
export function localZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TZ;
  } catch {
    return DEFAULT_TZ;
  }
}

// Curated list for the timezone selector (label + IANA zone id).
export const TIMEZONES = [
  { id: 'Pacific/Auckland', label: 'New Zealand' },
  { id: 'Australia/Sydney', label: 'Sydney' },
  { id: 'Asia/Tokyo', label: 'Tokyo / Seoul' },
  { id: 'Asia/Shanghai', label: 'China / Singapore' },
  { id: 'Asia/Kolkata', label: 'India' },
  { id: 'Asia/Dubai', label: 'Dubai' },
  { id: 'Europe/London', label: 'UK / Ireland' },
  { id: 'Europe/Paris', label: 'Central Europe' },
  { id: 'Africa/Johannesburg', label: 'South Africa' },
  { id: 'America/Sao_Paulo', label: 'Brazil (São Paulo)' },
  { id: 'America/New_York', label: 'US Eastern' },
  { id: 'America/Chicago', label: 'US Central' },
  { id: 'America/Denver', label: 'US Mountain' },
  { id: 'America/Los_Angeles', label: 'US Pacific' },
  { id: 'UTC', label: 'UTC' },
];

function dtf(zone, opts) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: zone, ...opts });
}

function toDate(value) {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value, zone = DEFAULT_TZ) {
  const d = toDate(value);
  if (!d) return '—';
  return dtf(zone, { day: '2-digit', month: 'short' }).format(d);
}

export function formatTime(value, zone = DEFAULT_TZ) {
  const d = toDate(value);
  if (!d) return '—';
  return dtf(zone, { hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
}

// Short timezone abbreviation for `zone` (e.g. "NZST", "GMT+12", "EDT").
export function tzAbbrev(zone = DEFAULT_TZ, value) {
  const d = toDate(value) ?? new Date();
  try {
    const parts = dtf(zone, { hour: '2-digit', timeZoneName: 'short' }).formatToParts(d);
    const tn = parts.find((p) => p.type === 'timeZoneName');
    return tn ? tn.value : '';
  } catch {
    return '';
  }
}

export function kickoffSortKey(iso) {
  const t = iso ? new Date(iso).getTime() : NaN;
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}
