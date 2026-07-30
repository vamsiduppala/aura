// ─────────────────────────────────────────────────────────────────────────────
// Chart construction (Tier 1, SPEC §4.1–§4.3). Birth data + ephemeris → a full
// sidereal chart: Lagna, whole-sign houses, Moon nakshatra/pada, dignities,
// aspects, functional polarity. Deterministic given an ephemeris.
// ─────────────────────────────────────────────────────────────────────────────

import type { AyanamsaSystem, BirthData, Chart, Graha, House, PlanetPos } from '../types.js';
import { ENGINE_VERSION, GRAHAS } from '../constants.js';
import { norm360, norm180, signOf, degInSign, houseFrom } from '../astro/angles.js';
import { localToJdUT, jdToJde } from '../astro/julian.js';
import { DEFAULT_AYANAMSA, ayanamsaFor } from '../astro/ayanamsa.js';
import { ascendantTropical } from '../astro/ascendant.js';
import type { Ephemeris } from '../astro/ephemeris.js';
import { nakshatraOf, padaOf } from '../dasha/vimshottari.js';
import { dignityScalar, functionalPolarity } from './strength.js';
import { navamsaSign } from './varga.js';
import { planetStrength, moonIllumination } from './shadbala.js';
import { aspectedHouses } from './aspects.js';

/** Combustion thresholds (deg from Sun) by graha (SPEC §4.2, ~8–12°). */
const COMBUST_DEG: Partial<Record<Graha, number>> = {
  moon: 12, mars: 17, mercury: 14, jupiter: 11, venus: 10, saturn: 15,
};

export interface ChartOptions {
  /**
   * Which sidereal reference to use. Frozen onto the returned chart, because changing it
   * later moves every date the user has ever been shown — up to a year at the maha level.
   */
  ayanamsaSystem?: AyanamsaSystem;
}

export function computeChart(
  birth: BirthData, ephem: Ephemeris, opts: ChartOptions = {},
): Chart {
  const ayanamsaSystem = opts.ayanamsaSystem ?? DEFAULT_AYANAMSA;
  const jdUT = localToJdUT(birth.date, birth.unknownTime ? undefined : birth.time, birth.tzOffsetMinutes);
  const jde = jdToJde(jdUT);
  const ayanamsa = ayanamsaFor(ayanamsaSystem, jde);
  const precision = birth.unknownTime ? 'solar' : 'full';

  const trop = ephem.tropical(jde);

  // Sidereal longitudes for all grahas.
  const sidLong = {} as Record<Graha, number>;
  for (const g of GRAHAS) sidLong[g] = norm360(trop[g].lon - ayanamsa);

  // Lagna (sidereal). For solar charts (noon) the ascendant is not meaningful, but
  // we still compute it; downstream marks house claims low-confidence via precision.
  const lagnaLong = norm360(ascendantTropical(jdUT, jde, birth.lat, birth.lng) - ayanamsa);
  const lagnaSign = signOf(lagnaLong);

  // Moon phase for the Moon's functional nature + paksha bala.
  const elong = norm360(sidLong.moon - sidLong.sun);
  const moonWaxing = elong > 0 && elong < 180;
  const illum = moonIllumination(elong);

  const sunLong = sidLong.sun;

  const planets = {} as Record<Graha, PlanetPos>;
  for (const g of GRAHAS) {
    const long = sidLong[g];
    const sign = signOf(long);
    const deg = degInSign(long);
    const retrograde = trop[g].retrograde;
    const combust = g !== 'sun'
      && Math.abs(norm180(long - sunLong)) < (COMBUST_DEG[g] ?? 0);
    const house = houseFrom(sign, lagnaSign) as House;
    const nav = navamsaSign(long);
    const polarity = functionalPolarity(g, lagnaSign, moonWaxing);
    const strength = planetStrength({
      graha: g, sign, degInSign: deg, navamsaSign: nav, house,
      retrograde, combust, isBenefic: polarity >= 0, moonIllumination: illum,
    });

    planets[g] = {
      graha: g,
      siderealLong: long,
      sign,
      house,
      nakshatra: nakshatraOf(long),
      pada: padaOf(long),
      retrograde,
      combust,
      dignity: dignityScalar(g, sign, deg, retrograde, combust),
      navamsa: nav,
      vargottama: strength.vargottama,
      strength: strength.total,
      polarity,
      aspects: aspectedHouses(g, sign, lagnaSign),
    };
  }

  return {
    birth,
    julianDayUT: jdUT,
    ayanamsa,
    ayanamsaSystem,
    engineVersion: ENGINE_VERSION,
    lagnaSign,
    lagnaLong,
    moonNakshatra: planets.moon.nakshatra!,
    moonPada: planets.moon.pada!,
    moonSign: planets.moon.sign,
    planets,
    precision,
  };
}
