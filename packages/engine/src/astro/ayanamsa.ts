// Lahiri (Chitrapaksha) ayanamsa (SPEC §4.2). Sidereal longitude = tropical − ayanamsa.
//
// The sidereal zodiac is fixed to the stars, so ayanamsa grows at the precession
// rate. We anchor Lahiri's value at J2000 and accumulate IAU-2006 general precession
// in longitude. This matches Swiss Ephemeris' SE_SIDM_LAHIRI to within ~an arcsecond
// near J2000, drifting slowly outward — well inside our needs (documented in tests).
//
// If the owner later licenses Swiss Ephemeris, swap this for its exact ayanamsa.

import type { AyanamsaSystem } from '../types.js';

/** Ayanamsa value at J2000.0 in degrees (23°51'10.8" ≈ Lahiri). Tunable anchor. */
export const LAHIRI_J2000 = 23.853;

/**
 * Lahiri ayanamsa (degrees) at a given Julian Ephemeris Day.
 * IAU-2006 general precession in longitude: pA = 5028.796195"·T + 1.1054348"·T² (+ …),
 * with T in Julian centuries from J2000.
 */
export function lahiriAyanamsa(jde: number): number {
  const T = (jde - 2451545.0) / 36525;
  const precessionArcsec = 5028.796195 * T + 1.1054348 * T * T;
  return LAHIRI_J2000 + precessionArcsec / 3600;
}

/** The system used when a chart does not name one. Indian government standard. */
export const DEFAULT_AYANAMSA: AyanamsaSystem = 'lahiri';

/**
 * Ayanamsa by system. A parameter, never a constant — the value used is written onto the
 * chart so a future system can be added without silently re-timing existing charts.
 *
 * Only Lahiri is implemented. Raman and KP are deliberately absent rather than
 * approximated: each is a different anchor epoch and rate, and a wrong one here is
 * indistinguishable from a right one at a glance while being years out at the maha level.
 */
export function ayanamsaFor(system: AyanamsaSystem, jde: number): number {
  switch (system) {
    case 'lahiri':
      return lahiriAyanamsa(jde);
  }
}
