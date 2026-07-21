// Time → Julian Day helpers. All ephemeris math runs on JDE (TT-based); house/
// sidereal-time math runs on JD(UT). We keep both explicit.

import { deltat } from 'astronomia';

const JD_UNIX_EPOCH = 2440587.5; // JD at 1970-01-01T00:00:00Z

/** JD (UT) from a UTC-instant Date. */
export function jdFromDate(date: Date): number {
  return date.getTime() / 86400_000 + JD_UNIX_EPOCH;
}

/** UTC Date from a JD (UT). */
export function dateFromJd(jd: number): Date {
  return new Date((jd - JD_UNIX_EPOCH) * 86400_000);
}

/** Approx decimal year from a JD (good enough for ΔT lookup). */
export function decimalYear(jd: number): number {
  return 2000 + (jd - 2451545.0) / 365.25;
}

/** ΔT (seconds) at the given JD. */
export function deltaTSeconds(jd: number): number {
  return deltat.deltaT(decimalYear(jd));
}

/** JDE (TT) from JD (UT): JDE = JD + ΔT/86400. */
export function jdToJde(jdUT: number): number {
  return jdUT + deltaTSeconds(jdUT) / 86400;
}

/**
 * JD (UT) from local civil date/time + timezone offset.
 * @param dateISO  local calendar date `YYYY-MM-DD`
 * @param timeHHMM local clock time `HH:mm` (defaults to 12:00 for solar charts)
 * @param tzOffsetMinutes minutes east of UTC in effect at the place/date (incl. DST)
 */
export function localToJdUT(
  dateISO: string,
  timeHHMM: string | undefined,
  tzOffsetMinutes: number,
): number {
  const [y, mo, d] = dateISO.split('-').map(Number) as [number, number, number];
  const [hh, mm] = (timeHHMM ?? '12:00').split(':').map(Number) as [number, number];
  // Treat the local wall-clock as UTC, then shift by the offset to reach true UTC.
  const asUtcMs = Date.UTC(y, mo - 1, d, hh, mm) - tzOffsetMinutes * 60_000;
  return asUtcMs / 86400_000 + JD_UNIX_EPOCH;
}
