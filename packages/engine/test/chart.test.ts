import { describe, it, expect } from 'vitest';
import { computeChart } from '../src/chart/chart.js';
import { AstronomiaEphemeris, FixedEphemeris } from '../src/astro/ephemeris.js';
import { houseFrom, signOf } from '../src/astro/angles.js';
import { startingMahaLord } from '../src/dasha/vimshottari.js';
import { NAKSHATRAS, GRAHAS, SIGN_NAMES } from '../src/constants.js';
import type { BirthData } from '../src/types.js';

const ephem = new AstronomiaEphemeris();

describe('whole-sign house rule (SPEC §4.3)', () => {
  it('house = ((sign − lagnaSign) mod 12) + 1', () => {
    expect(houseFrom(0, 0)).toBe(1);   // planet in lagna sign → 1st
    expect(houseFrom(6, 0)).toBe(7);   // opposite → 7th
    expect(houseFrom(0, 6)).toBe(7);   // symmetric
    expect(houseFrom(2, 11)).toBe(4);  // wraps: Gemini from Pisces
  });
});

describe('external calendar anchor: Makara Sankranti (validates ayanamsa+Sun+time)', () => {
  it('Sun is at ~0° sidereal Capricorn (270°) around 14 Jan (Lahiri)', () => {
    const birth: BirthData = {
      date: '2000-01-14', time: '12:00', unknownTime: false,
      place: 'Greenwich', lat: 51.48, lng: 0, tzOffsetMinutes: 0,
    };
    const chart = computeChart(birth, ephem);
    const sunLong = chart.planets.sun.siderealLong;
    // Makara Sankranti (Sun → sidereal Capricorn) falls ~14–15 Jan; Sun long ≈ 270°.
    expect(sunLong).toBeGreaterThan(268);
    expect(sunLong).toBeLessThan(272);
  });
});

describe('real chart pipeline (AstronomiaEphemeris)', () => {
  // Albert Einstein — 14 Mar 1879, 11:30 LMT, Ulm (48.40°N, 10.00°E).
  const einstein: BirthData = {
    date: '1879-03-14', time: '11:30', unknownTime: false,
    place: 'Ulm, DE', lat: 48.4, lng: 10.0, tzOffsetMinutes: 40,
  };

  it('produces a coherent, self-consistent sidereal chart', () => {
    const chart = computeChart(einstein, ephem);

    // Lagna + Moon fundamentals valid.
    expect(chart.lagnaSign).toBeGreaterThanOrEqual(0);
    expect(chart.lagnaSign).toBeLessThan(12);
    expect(chart.moonNakshatra).toBeGreaterThanOrEqual(0);
    expect(chart.moonNakshatra).toBeLessThan(27);
    expect(chart.moonPada).toBeGreaterThanOrEqual(1);
    expect(chart.moonPada).toBeLessThanOrEqual(4);
    expect(chart.precision).toBe('full');

    for (const g of GRAHAS) {
      const p = chart.planets[g];
      // whole-sign invariant holds for every planet
      expect(p.house).toBe(houseFrom(p.sign, chart.lagnaSign));
      // sign derives from longitude
      expect(p.sign).toBe(signOf(p.siderealLong));
      // dignity/polarity in range
      expect(p.dignity).toBeGreaterThanOrEqual(-1);
      expect(p.dignity).toBeLessThanOrEqual(1);
      expect(p.polarity).toBeGreaterThanOrEqual(-1);
      expect(p.polarity).toBeLessThanOrEqual(1);
      expect(p.aspects.length).toBeGreaterThanOrEqual(1);
    }

    // Ketu is exactly opposite Rahu.
    const diff = Math.abs(((chart.planets.rahu.siderealLong - chart.planets.ketu.siderealLong) % 360 + 360) % 360);
    expect(diff).toBeCloseTo(180, 3);

    // Starting maha lord equals the Moon's nakshatra lord.
    expect(startingMahaLord(chart.planets.moon.siderealLong)).toBe(
      NAKSHATRAS[chart.moonNakshatra]!.lord,
    );
  });

  it('regression lock — key placements are stable across builds', () => {
    // If these change, the astronomy pipeline changed; review before updating.
    const chart = computeChart(einstein, ephem);
    // Snapshot the sidereal sign of each luminary/planet (0..11).
    const signs = Object.fromEntries(GRAHAS.map((g) => [g, chart.planets[g].sign]));
    // Locked from first correct build (Lahiri sidereal). Human-readable in comments.
    expect(signs).toMatchInlineSnapshot(`
      {
        "jupiter": 10,
        "ketu": 3,
        "mars": 9,
        "mercury": 11,
        "moon": 7,
        "rahu": 9,
        "saturn": 11,
        "sun": 11,
        "venus": 11,
      }
    `);
    // Report for eyeballing against a trusted source (does not assert):
    // eslint-disable-next-line no-console
    if (process.env.AURA_PRINT) {
      for (const g of GRAHAS) {
        const p = chart.planets[g];
        console.log(g.padEnd(8), SIGN_NAMES[p.sign], p.siderealLong.toFixed(2), 'H' + p.house,
          'dig', p.dignity.toFixed(2), p.retrograde ? 'R' : '');
      }
      console.log('Lagna', SIGN_NAMES[chart.lagnaSign], 'Moon nak', NAKSHATRAS[chart.moonNakshatra]!.name, 'pada', chart.moonPada);
    }
  });
});

describe('external validation vs published Vedic sources (Einstein)', () => {
  // Cross-checked against multiple established Jyotish sources (astrosage, astro-seek,
  // vedicmarga, ganeshaspeaks). All discrete, convention-robust facts match our engine.
  const einstein: BirthData = {
    date: '1879-03-14', time: '11:30', unknownTime: false,
    place: 'Ulm, DE', lat: 48.4, lng: 10.0, tzOffsetMinutes: 40,
  };
  const chart = computeChart(einstein, ephem);
  const SIGN = { Gemini: 2, Scorpio: 7, Capricorn: 9, Aquarius: 10, Pisces: 11 };
  const JYESHTHA = 17;

  it('Moon sign = Scorpio, nakshatra = Jyeshtha', () => {
    expect(chart.moonSign).toBe(SIGN.Scorpio);
    expect(chart.moonNakshatra).toBe(JYESHTHA);
    expect(NAKSHATRAS[chart.moonNakshatra]!.name).toBe('Jyeshtha');
  });
  it('Sun sign = Pisces; Ascendant = Gemini', () => {
    expect(chart.planets.sun.sign).toBe(SIGN.Pisces);
    expect(chart.lagnaSign).toBe(SIGN.Gemini);
  });
  it('Mars is exalted (Capricorn) in the 8th house', () => {
    expect(chart.planets.mars.sign).toBe(SIGN.Capricorn);
    expect(chart.planets.mars.dignity).toBeGreaterThan(0.5);
    expect(chart.planets.mars.house).toBe(8);
  });
  it('reproduces the Jupiter↔Saturn 9th/10th lord exchange (for Gemini lagna)', () => {
    // Gemini lagna: 9th = Aquarius (Saturn), 10th = Pisces (Jupiter).
    // The sources note Jupiter & Saturn exchange the 9th and 10th.
    expect(chart.planets.jupiter.house).toBe(9); // 10th lord sits in the 9th
    expect(chart.planets.saturn.house).toBe(10); // 9th lord sits in the 10th
    expect(startingMahaLord(chart.planets.moon.siderealLong)).toBe('mercury'); // Jyeshtha → Mercury
  });
});

describe('unknown birth time → solar chart (SPEC §4.1)', () => {
  it('computes a solar-precision chart at noon without a birth time', () => {
    const birth: BirthData = {
      date: '1993-09-30', unknownTime: true,
      place: 'Chennai', lat: 13.08, lng: 80.27, tzOffsetMinutes: 330,
    };
    const chart = computeChart(birth, ephem);
    expect(chart.precision).toBe('solar');
    // Moon nakshatra + starting dasha lord are still well-defined from the noon Moon.
    expect(chart.moonNakshatra).toBeGreaterThanOrEqual(0);
    expect(chart.moonNakshatra).toBeLessThan(27);
    expect(startingMahaLord(chart.planets.moon.siderealLong)).toBe(
      NAKSHATRAS[chart.moonNakshatra]!.lord,
    );
    // whole-sign invariant still holds
    for (const g of GRAHAS) {
      expect(chart.planets[g].house).toBe(houseFrom(chart.planets[g].sign, chart.lagnaSign));
    }
  });
});

describe('deterministic chart with FixedEphemeris', () => {
  it('assigns houses by the whole-sign rule and detects combustion', () => {
    // Put Sun and Mercury at the same tropical longitude → Mercury combust.
    const lons = Object.fromEntries(GRAHAS.map((g) => [g, g === 'mercury' ? 40 : g === 'sun' ? 42 : (GRAHAS.indexOf(g) * 30)])) as Record<(typeof GRAHAS)[number], number>;
    const fixed = new FixedEphemeris(lons);
    const birth: BirthData = {
      date: '1990-05-20', time: '06:00', unknownTime: false,
      place: 'Test', lat: 28.6, lng: 77.2, tzOffsetMinutes: 330,
    };
    const chart = computeChart(birth, fixed);
    expect(chart.planets.mercury.combust).toBe(true);
    expect(chart.planets.sun.combust).toBe(false);
    for (const g of GRAHAS) {
      expect(chart.planets[g].house).toBe(houseFrom(chart.planets[g].sign, chart.lagnaSign));
    }
  });
});
