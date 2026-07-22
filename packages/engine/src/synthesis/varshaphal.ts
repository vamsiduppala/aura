// ─────────────────────────────────────────────────────────────────────────────
// Varshaphal (Tajaka annual chart). The chart cast for the moment the Sun returns to
// its exact natal sidereal longitude in a given year, plus the muntha (natal lagna
// progressed one rasi per year). This is the entry chart for the year's Tajaka analysis.
// ─────────────────────────────────────────────────────────────────────────────

import type { Chart } from '../types.js';
import type { Ephemeris } from '../astro/ephemeris.js';
import { computeChart } from '../chart/chart.js';
import { jdToJde } from '../astro/julian.js';
import { lahiriAyanamsa } from '../astro/ayanamsa.js';
import { norm360, norm180 } from '../astro/angles.js';

const JD_UNIX_EPOCH = 2440587.5;
const SUN_DEG_PER_DAY = 0.98563; // mean sidereal solar motion

/** Sidereal Sun longitude (deg) at a JD(UT). */
function siderealSun(jdUT: number, ephem: Ephemeris): number {
  const jde = jdToJde(jdUT);
  return norm360(ephem.tropical(jde).sun.lon - lahiriAyanamsa(jde));
}

export interface AnnualChart {
  /** Calendar year of the solar return (the year being entered). */
  year: number;
  /** The full sidereal chart for the solar-return moment. */
  chart: Chart;
  /** Muntha sign (0..11) — natal lagna progressed one rasi per year of life. */
  muntha: number;
  /** Muntha's whole-sign house (1..12) in the annual chart. */
  munthaHouse: number;
}

/**
 * The Tajaka annual chart for the solar return in `targetYear`. Roots the Sun back onto
 * its natal sidereal longitude (Newton on ~0.9856°/day), then casts the chart at that
 * moment for the birthplace.
 */
export function computeAnnualChart(natal: Chart, targetYear: number, ephem: Ephemeris): AnnualChart {
  const natalSun = natal.planets.sun.siderealLong;
  const [birthYear, bmo, bd] = natal.birth.date.split('-').map(Number) as [number, number, number];
  const [hh, mm] = (natal.birth.time ?? '12:00').split(':').map(Number) as [number, number];

  // Initial guess: the birthday in the target year at the birth wall-clock.
  let jdUT = (Date.UTC(targetYear, bmo - 1, bd, hh, mm) - natal.birth.tzOffsetMinutes * 60_000) / 86_400_000 + JD_UNIX_EPOCH;
  for (let i = 0; i < 8; i++) {
    const diff = norm180(siderealSun(jdUT, ephem) - natalSun);
    if (Math.abs(diff) < 1e-6) break;
    jdUT -= diff / SUN_DEG_PER_DAY;
  }

  // Convert the return moment back to local wall-clock at the birthplace and cast the chart.
  const w = new Date((jdUT - JD_UNIX_EPOCH) * 86_400_000 + natal.birth.tzOffsetMinutes * 60_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${w.getUTCFullYear()}-${pad(w.getUTCMonth() + 1)}-${pad(w.getUTCDate())}`;
  const time = `${pad(w.getUTCHours())}:${pad(w.getUTCMinutes())}`;
  const chart = computeChart({ ...natal.birth, date, time, unknownTime: false }, ephem);

  const yearOfLife = targetYear - birthYear + 1;
  const muntha = (((natal.lagnaSign + yearOfLife - 1) % 12) + 12) % 12;
  const munthaHouse = ((muntha - chart.lagnaSign + 12) % 12) + 1;
  return { year: targetYear, chart, muntha, munthaHouse };
}

/** The year of the solar return currently in effect for `now` (most recent birthday). */
export function currentVarshaYear(natal: Chart, now: Date): number {
  const [, bmo, bd] = natal.birth.date.split('-').map(Number) as [number, number, number];
  const y = now.getUTCFullYear();
  const birthdayThisYear = Date.UTC(y, bmo - 1, bd);
  return now.getTime() >= birthdayThisYear ? y : y - 1;
}
