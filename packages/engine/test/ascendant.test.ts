import { describe, it, expect } from 'vitest';
import { ascendantFromAngles } from '../src/astro/ascendant.js';

const EPS = 23.4392911; // obliquity near J2000

describe('ascendant formula (pure trig anchors)', () => {
  it('equator, RAMC=0 → 90° (0° Cancer tropical)', () => {
    expect(ascendantFromAngles(0, 0, EPS)).toBeCloseTo(90, 6);
  });

  it('equator, RAMC=90 → 180° (0° Libra tropical)', () => {
    expect(ascendantFromAngles(90, 0, EPS)).toBeCloseTo(180, 6);
  });

  it('equator, RAMC=180 → 270°; RAMC=270 → 0/360', () => {
    expect(ascendantFromAngles(180, 0, EPS)).toBeCloseTo(270, 6);
    const a = ascendantFromAngles(270, 0, EPS);
    expect(Math.min(a, 360 - a)).toBeCloseTo(0, 6);
  });

  it('ascendant increases with sidereal time (it is the RISING point, not setting)', () => {
    let prev = ascendantFromAngles(0, 40, EPS);
    for (let ramc = 5; ramc <= 355; ramc += 5) {
      const cur = ascendantFromAngles(ramc, 40, EPS);
      // unwrap
      let d = cur - prev;
      if (d < -180) d += 360;
      expect(d).toBeGreaterThan(0);
      prev = cur;
    }
  });

  it('mid-northern latitude at RAMC=0 rises in Cancer (90..120°)', () => {
    const a = ascendantFromAngles(0, 51.5, EPS);
    expect(a).toBeGreaterThan(90);
    expect(a).toBeLessThan(120);
  });
});
