// Boundary uncertainty (SPEC §3) and engine drift (M19).
//
// The first suite asserts the formula against the drift table published in the
// architecture plan §1.1 — every row, both columns. That table is the justification for
// the entire birth-time confidence gate, so if the formula and the table ever disagree,
// one of them is wrong and the product is built on the wrong one.

import { describe, expect, it } from 'vitest';
import {
  ACCURACY_MINUTES, boundaryConfidence, boundaryDrift, boundaryUncertaintyDays,
  boundaryUncertaintyMs, formatUncertainty,
} from '../src/dasha/uncertainty.js';
import { getCourtAt } from '../src/dasha/vimshottari.js';
import { NAKSHATRA_ARC, NAKSHATRA_CROSSING_DAYS, NAKSHATRAS } from '../src/constants.js';
import type { BirthTimeAccuracy } from '../src/types.js';

/** A longitude whose nakshatra lord is the one named. Bharani → Venus, Krittika → Sun. */
const longitudeFor = (lord: string): number => {
  const nak = NAKSHATRAS.find((n) => n.lord === lord)!;
  return NAKSHATRA_ARC * (nak.index + 0.5);
};
const VENUS_START = longitudeFor('venus'); // 20-year lord
const SUN_START = longitudeFor('sun');     // 6-year lord

describe('the published drift table (plan §1.1) — every row', () => {
  // | birth-time uncertainty | shift, Venus start (20y) | shift, Sun start (6y) |
  const TABLE: [minutes: number, venusDays: number, sunDays: number][] = [
    [1, 5.0, 1.5],
    [4, 20, 6],
    [15, 75, 23],
    [30, 150, 45],
    [60, 301, 90],
  ];

  it.each(TABLE)('±%i min → ±%s days (Venus) and ±%s days (Sun)', (minutes, venus, sun) => {
    const v = boundaryUncertaintyDays({ moonLong: VENUS_START, accuracy: 'exact', errorMinutes: minutes });
    const s = boundaryUncertaintyDays({ moonLong: SUN_START, accuracy: 'exact', errorMinutes: minutes });
    // The table is rounded to whole days above 5, so tolerate half a day there.
    expect(v).toBeCloseTo(venus, venus < 10 ? 1 : -0.4);
    expect(s).toBeCloseTo(sun, sun < 10 ? 1 : -0.4);
  });

  it('the mechanism is linear in birth-time error and in the lord’s term length', () => {
    // Both follow from shift = (error / nakshatraCrossing) × lordYears. If either
    // stopped being linear, the table would only match at one row.
    const one = boundaryUncertaintyDays({ moonLong: VENUS_START, accuracy: 'exact', errorMinutes: 1 });
    const sixty = boundaryUncertaintyDays({ moonLong: VENUS_START, accuracy: 'exact', errorMinutes: 60 });
    expect(sixty / one).toBeCloseTo(60, 6);

    const venus = boundaryUncertaintyDays({ moonLong: VENUS_START, accuracy: 'within_15m' });
    const sun = boundaryUncertaintyDays({ moonLong: SUN_START, accuracy: 'within_15m' });
    expect(venus / sun).toBeCloseTo(20 / 6, 6);
  });

  it('the Moon crosses a nakshatra in ~24.3 hours, which is what sets the scale', () => {
    expect(NAKSHATRA_CROSSING_DAYS * 24).toBeCloseTo(24.29, 1);
  });
});

describe('accuracy levels', () => {
  it('an unknown birth time is ±12 hours, not a quiet noon default', () => {
    // Noon is a placeholder for "somewhere in that day", not a central estimate. Saying
    // ±12h out loud is what stops it being treated as a real time downstream.
    expect(ACCURACY_MINUTES.unknown).toBe(720);
  });

  it('degrades monotonically — a vaguer birth time never yields a tighter boundary', () => {
    const order: BirthTimeAccuracy[] = ['exact', 'near_minute', 'within_15m', 'within_hour', 'unknown'];
    let prev = 0;
    for (const accuracy of order) {
      const ms = boundaryUncertaintyMs({ moonLong: VENUS_START, accuracy });
      expect(ms).toBeGreaterThanOrEqual(prev);
      prev = ms;
    }
  });

  it('even an exact birth time carries days of drift', () => {
    // This is why the Messenger ring is decorative at EVERY accuracy level: a ±1 minute
    // certificate still moves every boundary by ~5 days on a Venus start.
    const days = boundaryUncertaintyDays({ moonLong: VENUS_START, accuracy: 'exact' });
    expect(days).toBeGreaterThan(4);
  });
});

describe('boundaryConfidence — is a period longer than its own uncertainty?', () => {
  const birth = new Date('1994-03-14T00:42:00.000Z');
  const court = getCourtAt(VENUS_START, birth, new Date('2026-07-29T12:00:00Z'));
  const uncertaintyMs = boundaryUncertaintyMs({ moonLong: VENUS_START, accuracy: 'exact' });

  it('a mahadasha is trustworthy and a pranadasha is fiction, on the same chart', () => {
    // The whole point: the test is not "is the error small" but "is it small RELATIVE TO
    // THIS PERIOD". Same ±5 days is a rounding error on 20 years and nonsense on 4 hours.
    const maha = court[0]!;
    const prana = court[4]!;
    expect(boundaryConfidence(maha.endUs / 1000 - maha.startUs / 1000, uncertaintyMs).verdict)
      .toBe('trustworthy');
    expect(boundaryConfidence(prana.endUs / 1000 - prana.startUs / 1000, uncertaintyMs).verdict)
      .toBe('fiction');
  });

  it('verdict worsens monotonically as periods get shorter', () => {
    const rank = { trustworthy: 0, approximate: 1, fiction: 2 } as const;
    let prev = -1;
    for (const p of court) {
      const lenMs = (p.endUs - p.startUs) / 1000;
      const r = rank[boundaryConfidence(lenMs, uncertaintyMs).verdict];
      expect(r).toBeGreaterThanOrEqual(prev);
      prev = r;
    }
  });

  it('a zero-length period is fiction rather than a divide-by-zero', () => {
    expect(boundaryConfidence(0, 1000).verdict).toBe('fiction');
  });
});

describe('formatUncertainty', () => {
  it('picks the unit a human would use', () => {
    expect(formatUncertainty(5.01 * 86_400_000)).toBe('±5 days');
    expect(formatUncertainty(5 * 3_600_000)).toBe('±5 hours');
    expect(formatUncertainty(12 * 60_000)).toBe('±12 minutes');
    expect(formatUncertainty(60_000)).toBe('±1 minute');
  });

  it('never renders a sub-minute drift as zero', () => {
    expect(formatUncertainty(500)).toBe('±1 minute');
  });
});

describe('boundaryDrift (M19) — what to do when the engine changes', () => {
  const birth = new Date('1994-03-14T00:42:00.000Z');
  const court = getCourtAt(VENUS_START, birth, new Date('2026-07-29T12:00:00Z'));

  it('an identical recomputation reports no drift and no notification', () => {
    const report = boundaryDrift(court, court);
    expect(report.maxShiftMs).toBe(0);
    expect(report.moved).toEqual([]);
    expect(report.notify).toBe(false);
  });

  it('stays silent below the threshold — a sub-6-hour shift is not worth a notice', () => {
    const shifted = court.map((p) => ({ ...p, start: new Date(p.start.getTime() + 3_600_000) }));
    const report = boundaryDrift(court, shifted);
    expect(report.maxShiftMs).toBe(3_600_000);
    expect(report.moved).toEqual([]);
    expect(report.notify).toBe(false);
  });

  it('reports every boundary that moved past the threshold, with its signed shift', () => {
    const day = 86_400_000;
    const shifted = court.map((p, i) => ({
      ...p,
      // Move only the two innermost levels, and move one backwards.
      start: new Date(p.start.getTime() + (i >= 3 ? (i === 3 ? day : -2 * day) : 0)),
    }));
    const report = boundaryDrift(court, shifted);
    expect(report.notify).toBe(true);
    expect(report.moved.map((m) => m.level)).toEqual(['sookshma', 'prana']);
    expect(report.moved[0]!.shiftMs).toBe(day);
    expect(report.moved[1]!.shiftMs).toBe(-2 * day);
    expect(report.maxShiftMs).toBe(2 * day);
  });

  it('a level appearing or disappearing is itself worth surfacing', () => {
    // Confidence dropping hides rings; that changes what the user is being told even
    // though no surviving boundary moved.
    expect(boundaryDrift(court, court.slice(0, 3)).notify).toBe(true);
  });
});
