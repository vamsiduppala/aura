// Duration rendering. "Time left" always renders in the user's *current* timezone —
// the underlying UTC boundaries never move, so flying to another country changes how
// a date reads but never when the handover happens.

/** Calendar-ish constants for humanising a span. Months are the mean Gregorian month. */
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const MONTH = 30.436875 * DAY;
const YEAR = 365.2425 * DAY;

/**
 * "4y 2m", "22d", "3d 4h", "41m" — at most two units, the largest that fit.
 * Deliberately coarse: a King term shown to the minute is false precision, and a
 * Messenger term shown in years is useless.
 */
export function humanRemaining(ms: number): string {
  if (ms <= 0) return 'ending now';
  if (ms >= YEAR) {
    const y = Math.floor(ms / YEAR);
    const m = Math.floor((ms - y * YEAR) / MONTH);
    return m > 0 ? `${y}y ${m}m` : `${y}y`;
  }
  if (ms >= MONTH) {
    const m = Math.floor(ms / MONTH);
    const d = Math.floor((ms - m * MONTH) / DAY);
    return d > 0 ? `${m}m ${d}d` : `${m}m`;
  }
  if (ms >= DAY) {
    const d = Math.floor(ms / DAY);
    const h = Math.floor((ms - d * DAY) / HOUR);
    return h > 0 ? `${d}d ${h}h` : `${d}d`;
  }
  if (ms >= HOUR) {
    const h = Math.floor(ms / HOUR);
    const mi = Math.floor((ms - h * HOUR) / MIN);
    return mi > 0 ? `${h}h ${mi}m` : `${h}h`;
  }
  const mi = Math.floor(ms / MIN);
  return mi >= 1 ? `${mi}m` : `${Math.max(1, Math.floor(ms / 1000))}s`;
}

/** The same span with "left" attached, as it appears in the brass pill. */
export const timeLeft = (ms: number): string =>
  ms <= 0 ? 'handing over' : `${humanRemaining(ms)} left`;

/** How long a whole term runs, spelled out: "1 year, 7 months, 30 days". */
export function humanTotal(ms: number): string {
  const parts: string[] = [];
  let rest = ms;
  const y = Math.floor(rest / YEAR);
  if (y) { parts.push(`${y} ${y === 1 ? 'year' : 'years'}`); rest -= y * YEAR; }
  const m = Math.floor(rest / MONTH);
  if (m) { parts.push(`${m} ${m === 1 ? 'month' : 'months'}`); rest -= m * MONTH; }
  const d = Math.floor(rest / DAY);
  if (d) { parts.push(`${d} ${d === 1 ? 'day' : 'days'}`); rest -= d * DAY; }
  if (parts.length === 0) {
    const h = Math.floor(rest / HOUR);
    if (h) parts.push(`${h} ${h === 1 ? 'hour' : 'hours'}`);
    const mi = Math.floor((rest - h * HOUR) / MIN);
    if (mi) parts.push(`${mi} ${mi === 1 ? 'minute' : 'minutes'}`);
  }
  return parts.length ? parts.join(', ') : 'less than a minute';
}

export interface CountdownParts {
  days: number;
  hours: number;
  mins: number;
  secs: number;
  /** Under 24h the DAYS block is dropped and the other three grow. */
  showDays: boolean;
  /** Under 1h the blocks turn red and the line above reads "Handover today." */
  urgent: boolean;
}

/** The segmented clock in "Biggest change ahead". Recomputed every second. */
export function countdownParts(ms: number): CountdownParts {
  const clamped = Math.max(0, ms);
  const days = Math.floor(clamped / DAY);
  const hours = Math.floor((clamped % DAY) / HOUR);
  const mins = Math.floor((clamped % HOUR) / MIN);
  const secs = Math.floor((clamped % MIN) / 1000);
  return { days, hours, mins, secs, showDays: clamped >= DAY, urgent: clamped < HOUR };
}

/** "12 Mar 2026" — in the reader's own locale and current zone. */
export function shortDate(d: Date): string {
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

/** "12 Mar" — for ranges inside one year. */
export function shortDayMonth(d: Date): string {
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

/** "12 Mar 2026 → 11 Nov 2027", collapsing the year when both ends share one. */
export function dateRange(start: Date, end: Date): string {
  return start.getFullYear() === end.getFullYear()
    ? `${shortDayMonth(start)} → ${shortDate(end)}`
    : `${shortDate(start)} → ${shortDate(end)}`;
}

export const pad2 = (n: number): string => String(n).padStart(2, '0');
