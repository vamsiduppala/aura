// Ascendant (Lagna) — the rising ecliptic degree (SPEC §4.3). Pure trig, split from
// the astronomia calls so the formula is directly unit-testable against anchors.

import { sidereal, nutation } from 'astronomia';
import { norm360, DEG, RAD } from './angles.js';

/**
 * Tropical ecliptic longitude of the ascendant from angles (all degrees).
 * @param ramcDeg RAMC = local apparent sidereal time expressed as an angle
 * @param latDeg  geographic latitude (north +)
 * @param epsDeg  obliquity of the ecliptic
 *
 * Standard rising-point formula; returns the ASCENDING intersection (verified to
 * increase with sidereal time), normalized to [0,360).
 */
export function ascendantFromAngles(ramcDeg: number, latDeg: number, epsDeg: number): number {
  const ramc = ramcDeg * DEG;
  const eps = epsDeg * DEG;
  const phi = latDeg * DEG;
  const y = Math.cos(ramc);
  const x = -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps));
  return norm360(Math.atan2(y, x) * RAD);
}

/** Local apparent sidereal time as an angle (degrees). lng east positive. */
export function localSiderealTimeDeg(jdUT: number, lngEastDeg: number): number {
  const gmstDeg = sidereal.apparent(jdUT) / 240; // seconds of time → degrees (÷240)
  return norm360(gmstDeg + lngEastDeg);
}

/** True obliquity of date (degrees). */
export function trueObliquityDeg(jde: number): number {
  return (nutation.meanObliquity(jde) + nutation.nutation(jde)[1]) * RAD;
}

/** Tropical ascendant longitude (deg) for a moment + place. */
export function ascendantTropical(
  jdUT: number, jde: number, latDeg: number, lngEastDeg: number,
): number {
  const ramc = localSiderealTimeDeg(jdUT, lngEastDeg);
  return ascendantFromAngles(ramc, latDeg, trueObliquityDeg(jde));
}
