import { describe, it, expect } from 'vitest';
import { detectYogas } from '../src/chart/yogas.js';
import { computeChart } from '../src/chart/chart.js';
import { AstronomiaEphemeris } from '../src/astro/ephemeris.js';
import { ENERGIES } from '../src/constants.js';
import { checkNoDoom } from '../src/safety/guardrails.js';
import type { BirthData } from '../src/types.js';

const ephem = new AstronomiaEphemeris();
const births: BirthData[] = [
  { date: '1879-03-14', time: '11:30', unknownTime: false, place: 'Ulm', lat: 48.4, lng: 10, tzOffsetMinutes: 40 },
  { date: '1990-06-15', time: '10:30', unknownTime: false, place: 'Mumbai', lat: 19.07, lng: 72.87, tzOffsetMinutes: 330 },
  { date: '2001-03-14', time: '09:42', unknownTime: false, place: 'Jaipur', lat: 26.92, lng: 75.82, tzOffsetMinutes: 330 },
];

describe('Yoga detection', () => {
  it('returns well-formed, jargon-safe, doom-free born gifts', () => {
    for (const b of births) {
      const yogas = detectYogas(computeChart(b, ephem));
      for (const y of yogas) {
        expect(y.name.length).toBeGreaterThan(3);
        expect(y.blurb.length).toBeGreaterThan(20);
        expect(ENERGIES).toContain(y.energy);
        expect(checkNoDoom(y.blurb).ok).toBe(true);
        // no Sanskrit/jargon leaks into the user-facing name/blurb
        expect(`${y.name} ${y.blurb}`.toLowerCase()).not.toMatch(/yoga|kendra|graha|lord|jupiter|saturn|mercury|venus|mars/);
      }
      // keys are unique within a chart
      expect(new Set(yogas.map((y) => y.key)).size).toBe(yogas.length);
    }
  });

  it('Einstein has the Bright Thinker (Sun+Mercury both in Pisces)', () => {
    const yogas = detectYogas(computeChart(births[0]!, ephem));
    expect(yogas.some((y) => y.key === 'budhaditya')).toBe(true);
  });

  it('is deterministic', () => {
    const chart = computeChart(births[1]!, ephem);
    expect(JSON.stringify(detectYogas(chart))).toBe(JSON.stringify(detectYogas(chart)));
  });
});
