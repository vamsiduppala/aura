// Lahiri (Chitrapaksha) ayanamsa (SPEC §4.2). Sidereal longitude = tropical − ayanamsa.
//
// The sidereal zodiac is fixed to the stars, so ayanamsa grows at the precession
// rate. We anchor Lahiri's value at J2000 and accumulate IAU-2006 general precession
// in longitude. This matches Swiss Ephemeris' SE_SIDM_LAHIRI to within ~an arcsecond
// near J2000, drifting slowly outward — well inside our needs (documented in tests).
//
// If the owner later licenses Swiss Ephemeris, swap this for its exact ayanamsa.

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
