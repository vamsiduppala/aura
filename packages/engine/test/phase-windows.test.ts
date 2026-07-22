import { describe, it, expect } from 'vitest';
import { Aura, AstronomiaEphemeris } from '../src/index.js';
import type { BirthData } from '../src/types.js';

// phaseWindows() feeds the tiny from/to dates under the Today energies. It must (a) name
// exactly the energies the reading shows, and (b) return windows that actually bracket `now`.
const aura = new Aura(new AstronomiaEphemeris());
const now = new Date('2026-07-21T00:00:00Z');
const kai: BirthData = {
  date: '2001-03-14', time: '09:42', unknownTime: false,
  place: 'Jaipur', lat: 26.92, lng: 75.82, tzOffsetMinutes: 330,
};

describe('phaseWindows (Today phase dates)', () => {
  const chart = aura.chart(kai);
  const input = aura.daily(chart, now, { goalArea: 'career' }).input;
  const pw = aura.phaseWindows(input, chart, now)!;

  it('maps major → mahadasha and passing → antardasha', () => {
    expect(pw).not.toBeNull();
    expect(pw.major.lord).toBe(input.stack.maha);
    expect(pw.passing.lord).toBe(input.stack.antar);
    expect(pw.major.energy).toBe(input.majorEnergy); // maha energy == displayed major
  });

  it('the major (maha) window brackets today', () => {
    expect(pw.major.start.getTime()).toBeLessThanOrEqual(now.getTime());
    expect(pw.major.end.getTime()).toBeGreaterThan(now.getTime());
  });

  it('the passing window brackets today and is shorter than the major window', () => {
    expect(pw.passing.start.getTime()).toBeLessThanOrEqual(now.getTime());
    expect(pw.passing.end.getTime()).toBeGreaterThan(now.getTime());
    const majorLen = pw.major.end.getTime() - pw.major.start.getTime();
    const passingLen = pw.passing.end.getTime() - pw.passing.start.getTime();
    expect(passingLen).toBeLessThan(majorLen);
  });
});
