import { describe, it, expect } from 'vitest';
import { computeAshtakavarga, ashtakavargaTotal, AV_PLANETS } from '../src/chart/ashtakavarga.js';
import { computeChart } from '../src/chart/chart.js';
import { AstronomiaEphemeris } from '../src/astro/ephemeris.js';
import type { BirthData } from '../src/types.js';

const ephem = new AstronomiaEphemeris();
const births: BirthData[] = [
  { date: '1879-03-14', time: '11:30', unknownTime: false, place: 'Ulm', lat: 48.4, lng: 10, tzOffsetMinutes: 40 },
  { date: '1990-06-15', time: '10:30', unknownTime: false, place: 'Mumbai', lat: 19.07, lng: 72.87, tzOffsetMinutes: 330 },
  { date: '2001-03-14', time: '09:42', unknownTime: false, place: 'Jaipur', lat: 26.92, lng: 75.82, tzOffsetMinutes: 330 },
];

describe('Ashtakavarga (BPHS)', () => {
  it('per-planet contribution totals are the canonical values (table integrity)', () => {
    // These totals are invariant across all charts. Sum a planet's BAV over all signs.
    const chart = computeChart(births[0]!, ephem);
    const av = computeAshtakavarga(chart);
    const planetTotals: Record<string, number> = {
      sun: 48, moon: 49, mars: 39, mercury: 54, jupiter: 56, venus: 52, saturn: 39,
    };
    for (const p of AV_PLANETS) {
      const sum = av.bav[p].reduce((a, b) => a + b, 0);
      expect(sum).toBe(planetTotals[p]);
    }
  });

  it('SAV grand total is always 337, for every chart', () => {
    for (const b of births) {
      const av = computeAshtakavarga(computeChart(b, ephem));
      expect(ashtakavargaTotal(av)).toBe(337);
      // SAV per sign is the sum of the 7 BAVs
      for (let s = 0; s < 12; s++) {
        const summed = AV_PLANETS.reduce((acc, p) => acc + av.bav[p][s]!, 0);
        expect(av.sav[s]).toBe(summed);
      }
    }
  });

  it('every BAV cell is 0..8 and every SAV cell is 0..56', () => {
    const av = computeAshtakavarga(computeChart(births[1]!, ephem));
    for (const p of AV_PLANETS) {
      for (const v of av.bav[p]) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(8); }
    }
    for (const v of av.sav) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(56); }
  });
});
