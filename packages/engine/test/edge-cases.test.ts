import { describe, it, expect } from 'vitest';
import { Aura, AstronomiaEphemeris } from '../src/index.js';
import { GRAHAS } from '../src/constants.js';
import type { BirthData } from '../src/types.js';

// Real-world birth data is diverse: high latitudes, hemispheres, extreme timezones,
// far-past/future dates, unknown times. The engine must never produce NaN or crash.
const aura = new Aura(new AstronomiaEphemeris());

const cases: [string, BirthData][] = [
  ['high north (Tromsø 69.6N)', { date: '1994-12-21', time: '03:30', unknownTime: false, place: 'Tromsø', lat: 69.65, lng: 18.96, tzOffsetMinutes: 60 }],
  ['very high north (Longyearbyen 78N)', { date: '2000-06-21', time: '23:59', unknownTime: false, place: 'Svalbard', lat: 78.22, lng: 15.65, tzOffsetMinutes: 60 }],
  ['deep south (Ushuaia 54.8S)', { date: '1987-07-04', time: '12:00', unknownTime: false, place: 'Ushuaia', lat: -54.8, lng: -68.3, tzOffsetMinutes: -180 }],
  ['equator (Quito)', { date: '2010-03-20', time: '18:15', unknownTime: false, place: 'Quito', lat: -0.18, lng: -78.47, tzOffsetMinutes: -300 }],
  ['extreme + tz (Kiritimati +14h)', { date: '1999-01-01', time: '00:30', unknownTime: false, place: 'Kiritimati', lat: 1.87, lng: -157.4, tzOffsetMinutes: 840 }],
  ['far past (1901)', { date: '1901-02-15', time: '06:45', unknownTime: false, place: 'London', lat: 51.5, lng: -0.13, tzOffsetMinutes: 0 }],
  ['unknown time / solar', { date: '1996-08-08', unknownTime: true, place: 'Cairo', lat: 30.04, lng: 31.24, tzOffsetMinutes: 120 }],
  ['leap day', { date: '2004-02-29', time: '00:00', unknownTime: false, place: 'Tokyo', lat: 35.68, lng: 139.65, tzOffsetMinutes: 540 }],
];

describe('engine robustness across diverse real-world births', () => {
  for (const [name, birth] of cases) {
    it(`${name}: chart + reading + forecast + retro + mentor are all finite/valid`, () => {
      const chart = aura.chart(birth);

      // No NaN anywhere in the chart.
      expect(Number.isFinite(chart.lagnaLong)).toBe(true);
      expect(chart.lagnaSign).toBeGreaterThanOrEqual(0);
      expect(chart.lagnaSign).toBeLessThan(12);
      for (const g of GRAHAS) {
        const p = chart.planets[g];
        expect(Number.isFinite(p.siderealLong)).toBe(true);
        expect(p.sign).toBeGreaterThanOrEqual(0);
        expect(p.sign).toBeLessThan(12);
        expect(p.house).toBeGreaterThanOrEqual(1);
        expect(p.house).toBeLessThanOrEqual(12);
        expect(Number.isFinite(p.strength)).toBe(true);
        expect(Number.isFinite(p.dignity)).toBe(true);
      }

      // Downstream products don't throw and are well-formed.
      const now = new Date('2026-07-21T00:00:00Z');
      const daily = aura.daily(chart, now, { goalArea: 'self' });
      expect(daily.reading.gift.length).toBeGreaterThan(5);
      expect(daily.todayLine.length).toBeGreaterThan(3);

      const fc = aura.forecast(chart, now);
      expect(fc.monthly.length).toBeGreaterThan(0);

      const retro = aura.retrospective(chart, now, { focusArea: 'career' });
      expect(retro.length).toBeGreaterThan(0);

      const mentor = aura.mentorAnswer(chart, { focus: 'partnership', timeframe: 'now' }, now);
      expect(mentor.strength.note.length).toBeGreaterThan(5);

      // yogas + blueprint never crash
      expect(Array.isArray(aura.yogas(chart))).toBe(true);
      expect(aura.blueprint(chart)).toHaveLength(4);
    });
  }

  it('a far-future date within the 240y dasha cycle still resolves a stack', () => {
    const chart = aura.chart(cases[5]![1]); // born 1901
    // 1901 + up to ~240y; 2100 is well within.
    const daily = aura.daily(chart, new Date('2100-01-01T00:00:00Z'), {});
    expect(daily.input.majorEnergy).toBeDefined();
  });
});
