import { describe, it, expect } from 'vitest';
import { computeChart } from '../src/chart/chart.js';
import { computeTransit, sadeSatiPhase } from '../src/transit/gochara.js';
import { AstronomiaEphemeris } from '../src/astro/ephemeris.js';
import { houseFrom } from '../src/astro/angles.js';
import { GRAHAS } from '../src/constants.js';
import type { BirthData } from '../src/types.js';

const ephem = new AstronomiaEphemeris();

describe('Sade Sati phase mapping (SPEC §4.5)', () => {
  it('maps Saturn 12th/1st/2nd from Moon to rising/peak/setting', () => {
    expect(sadeSatiPhase(12)).toBe('rising');
    expect(sadeSatiPhase(1)).toBe('peak');
    expect(sadeSatiPhase(2)).toBe('setting');
    expect(sadeSatiPhase(6)).toBeNull();
  });
});

describe('computeTransit', () => {
  const birth: BirthData = {
    date: '1990-06-15', time: '10:30', unknownTime: false,
    place: 'Mumbai', lat: 19.07, lng: 72.87, tzOffsetMinutes: 330,
  };
  const chart = computeChart(birth, ephem);

  it('produces valid houses-from-Moon/Lagna and consistent Sade Sati', () => {
    const t = computeTransit(chart, new Date('2026-07-21T00:00:00Z'), ephem);
    for (const g of GRAHAS) {
      expect(t.houseFromMoon[g]).toBe(houseFrom(t.signs[g], chart.moonSign));
      expect(t.houseFromLagna[g]).toBe(houseFrom(t.signs[g], chart.lagnaSign));
      expect(t.signs[g]).toBeGreaterThanOrEqual(0);
      expect(t.signs[g]).toBeLessThan(12);
    }
    expect(t.sadeSati).toBe(sadeSatiPhase(t.houseFromMoon.saturn));
    expect(t.jupiterHouseFromMoon).toBe(t.houseFromMoon.jupiter);
  });

  it('the transiting Moon changes sign over ~2.25-day cadence', () => {
    const a = computeTransit(chart, new Date('2026-07-21T00:00:00Z'), ephem);
    const b = computeTransit(chart, new Date('2026-07-28T00:00:00Z'), ephem);
    // a week apart → Moon should have moved multiple signs
    expect(a.transitMoonSign).not.toBe(b.transitMoonSign);
  });

  it('gives different daily texture on consecutive days (freshness layer)', () => {
    const d1 = computeTransit(chart, new Date('2026-07-21T00:00:00Z'), ephem);
    const d2 = computeTransit(chart, new Date('2026-07-22T00:00:00Z'), ephem);
    expect(d1.positions.moon).not.toBe(d2.positions.moon);
  });
});
