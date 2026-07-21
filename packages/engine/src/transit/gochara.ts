// ─────────────────────────────────────────────────────────────────────────────
// Transit / Gochara engine (Tier 2, SPEC §4.5). Daily sidereal positions + the
// flags that add "today" texture: Sade Sati phase, Jupiter's house from the Moon,
// and the transiting Moon's sign. Cheap to recompute each day.
// ─────────────────────────────────────────────────────────────────────────────

import type { Chart, Graha, SadeSatiPhase, TransitState } from '../types.js';
import { GRAHAS } from '../constants.js';
import { norm360, signOf, houseFrom } from '../astro/angles.js';
import { jdFromDate, jdToJde } from '../astro/julian.js';
import { lahiriAyanamsa } from '../astro/ayanamsa.js';
import type { Ephemeris } from '../astro/ephemeris.js';

/** Sade Sati phase from Saturn's house relative to the natal Moon sign. */
export function sadeSatiPhase(saturnHouseFromMoon: number): SadeSatiPhase {
  switch (saturnHouseFromMoon) {
    case 12: return 'rising'; // Saturn approaching the Moon
    case 1:  return 'peak';   // Saturn over the Moon
    case 2:  return 'setting';// Saturn leaving
    default: return null;
  }
}

export function computeTransit(chart: Chart, date: Date, ephem: Ephemeris): TransitState {
  const jde = jdToJde(jdFromDate(date));
  const ayanamsa = lahiriAyanamsa(jde);
  const trop = ephem.tropical(jde);

  const positions = {} as Record<Graha, number>;
  const signs = {} as Record<Graha, number>;
  const houseFromMoon = {} as Record<Graha, number>;
  const houseFromLagna = {} as Record<Graha, number>;

  for (const g of GRAHAS) {
    const long = norm360(trop[g].lon - ayanamsa);
    const sign = signOf(long);
    positions[g] = long;
    signs[g] = sign;
    houseFromMoon[g] = houseFrom(sign, chart.moonSign);
    houseFromLagna[g] = houseFrom(sign, chart.lagnaSign);
  }

  return {
    date: date.toISOString(),
    positions,
    signs,
    sadeSati: sadeSatiPhase(houseFromMoon.saturn),
    jupiterHouseFromMoon: houseFromMoon.jupiter,
    transitMoonSign: signs.moon,
    houseFromMoon,
    houseFromLagna,
  };
}
