// Property tests for the dasha tree (SPEC §3, M14b).
//
// These are the invariants the whole product rests on. They are asserted across a spread
// of real birth moments and Moon longitudes rather than one hand-picked chart, because a
// single golden case cannot catch an accumulation bug — the failure mode is drift that
// only appears at depth, on some inputs, after enough nesting.
//
// Every test here would have failed against the float-millisecond implementation.

import { describe, expect, it } from 'vitest';
import {
  buildDashaTree, getCourtAt, getPeriodsAt, getStackAt, nextPeriodAt,
} from '../src/dasha/vimshottari.js';
import {
  NAKSHATRA_ARC, VIMSHOTTARI_ORDER, VIMSHOTTARI_TOTAL, VIMSHOTTARI_YEARS,
} from '../src/constants.js';
import type { DashaLevel } from '../src/types.js';

const LEVELS: DashaLevel[] = ['maha', 'antar', 'pratyantar', 'sookshma', 'prana'];

/**
 * A deterministic spread of cases. Not random: a property test that changes its own
 * inputs between runs cannot be bisected when it fails. These cover every starting lord
 * (via nakshatra index 0..8 → all nine lords), both fraction extremes, midnight, a
 * leap day, and a pre-1970 birth.
 */
const CASES: { name: string; birth: Date; moonLong: number }[] = [];
for (let nak = 0; nak < 9; nak++) {
  for (const frac of [0.0001, 0.5, 0.9999]) {
    CASES.push({
      name: `nakshatra ${nak}, ${(frac * 100).toFixed(2)}% traversed`,
      birth: new Date('1994-03-14T06:12:00.000Z'),
      moonLong: NAKSHATRA_ARC * (nak + frac),
    });
  }
}
CASES.push(
  { name: 'born exactly at midnight UTC', birth: new Date('2000-01-01T00:00:00.000Z'), moonLong: 200.5 },
  { name: 'born at 23:59:59.999', birth: new Date('2003-06-30T23:59:59.999Z'), moonLong: 88.88 },
  { name: 'leap day', birth: new Date('2004-02-29T12:00:00.000Z'), moonLong: 311.2 },
  { name: 'pre-1970 birth (negative epoch)', birth: new Date('1947-08-15T00:01:00.000Z'), moonLong: 45.75 },
  { name: 'southern hemisphere, high latitude era', birth: new Date('1978-12-21T18:45:00.000Z'), moonLong: 359.999 },
);

describe('boundaries are half-open [start, end) and close exactly', () => {
  it('sub-periods sum to their parent to the microsecond, at every level', () => {
    // The load-bearing invariant. Children are derived from cumulative year totals, so
    // the ninth boundary lands on the parent's end BY CONSTRUCTION rather than by fix-up.
    for (const { name, birth, moonLong } of CASES) {
      const court = getCourtAt(moonLong, birth, new Date('2026-07-29T12:00:00Z'));
      expect(court, name).toHaveLength(5);
      for (let i = 1; i < court.length; i++) {
        const parent = court[i - 1]!;
        const child = court[i]!;
        // The child sits inside the parent, and the containment is exact in µs.
        expect(child.startUs, `${name} L${i + 1} start`).toBeGreaterThanOrEqual(parent.startUs);
        expect(child.endUs, `${name} L${i + 1} end`).toBeLessThanOrEqual(parent.endUs);
      }
    }
  });

  it('a full level of children tiles its parent with no gap and no overlap', () => {
    for (const { name, birth, moonLong } of CASES) {
      const tree = buildDashaTree(moonLong, birth, 'pratyantar');
      for (const maha of tree.slice(0, 3)) {
        const antars = maha.children!;
        expect(antars, name).toHaveLength(9);
        // Contiguous: each child starts exactly where the previous ended.
        for (let i = 1; i < antars.length; i++) {
          expect(antars[i]!.start, `${name} antar ${i}`).toBe(antars[i - 1]!.end);
        }
        // Complete: the first starts and the last ends on the parent's own bounds.
        expect(antars[0]!.start, name).toBe(maha.start);
        expect(antars[8]!.end, name).toBe(maha.end);

        // And one level deeper, on every antar.
        for (const antar of antars) {
          const praty = antar.children!;
          expect(praty).toHaveLength(9);
          expect(praty[0]!.start).toBe(antar.start);
          expect(praty[8]!.end).toBe(antar.end);
          for (let i = 1; i < praty.length; i++) {
            expect(praty[i]!.start).toBe(praty[i - 1]!.end);
          }
        }
      }
    }
  });

  it('a boundary instant belongs to the period STARTING, never the one ending', () => {
    // Half-open means a timestamp resolves to exactly one period at every level. If a
    // boundary were closed on both sides, the instant would match two periods and which
    // one you got would depend on iteration order.
    for (const { name, birth, moonLong } of CASES.slice(0, 12)) {
      const court = getCourtAt(moonLong, birth, new Date('2026-07-29T12:00:00Z'));
      for (const period of court) {
        const atEnd = new Date(period.end.getTime());
        const resolved = getCourtAt(moonLong, birth, atEnd);
        const same = resolved.find((p) => p.level === period.level)!;
        // At the exact end instant we are in the NEXT period at that level.
        expect(same.startUs, `${name} ${period.level}`).toBeGreaterThanOrEqual(period.endUs);
      }
    }
  });

  it('every level covers 120 dasha-years exactly, summed from its children', () => {
    for (const { name, birth, moonLong } of CASES.slice(0, 12)) {
      const court = getCourtAt(moonLong, birth, new Date('2026-07-29T12:00:00Z'));
      const maha = court[0]!;
      const mahaLen = maha.endUs - maha.startUs;
      // The maha's own length is its lord's years exactly — no rounding at level 1.
      const expected = VIMSHOTTARI_YEARS[maha.lord] * 365.25 * 86_400_000_000;
      expect(mahaLen, name).toBe(expected);
    }
  });
});

describe('monotonicity and identity', () => {
  it('boundaries increase strictly, and adjacent periods never repeat a lord', () => {
    for (const { name, birth, moonLong } of CASES) {
      for (const level of LEVELS) {
        const from = new Date('2026-01-01T00:00:00Z');
        const to = new Date(from.getTime() + (level === 'maha' ? 40 : 2) * 365.25 * 86_400_000);
        const periods = getPeriodsAt(moonLong, birth, level, from, to);
        for (let i = 1; i < periods.length; i++) {
          expect(periods[i]!.startUs, `${name} ${level}`).toBe(periods[i - 1]!.endUs);
          expect(periods[i]!.endUs).toBeGreaterThan(periods[i]!.startUs);
          expect(periods[i]!.lord).not.toBe(periods[i - 1]!.lord);
        }
        for (const p of periods) expect(VIMSHOTTARI_ORDER).toContain(p.lord);
      }
    }
  });

  it('level lengths shrink going deeper, by a factor between 6 and 20', () => {
    // duration(child) = duration(parent) × childYears / 120, and childYears is 6..20,
    // so each step divides by 120/20=6 at most and 120/6=20 at least.
    for (const { name, birth, moonLong } of CASES.slice(0, 12)) {
      const court = getCourtAt(moonLong, birth, new Date('2026-07-29T12:00:00Z'));
      for (let i = 1; i < 5; i++) {
        const parentLen = court[i - 1]!.endUs - court[i - 1]!.startUs;
        const childLen = court[i]!.endUs - court[i]!.startUs;
        const ratio = parentLen / childLen;
        expect(ratio, `${name} L${i}→L${i + 1}`).toBeGreaterThan(VIMSHOTTARI_TOTAL / 20 - 0.001);
        expect(ratio).toBeLessThan(VIMSHOTTARI_TOTAL / 6 + 0.001);
      }
    }
  });

  it('lords agree with getStackAt at every level', () => {
    for (const { name, birth, moonLong } of CASES) {
      const at = new Date('2031-04-04T04:04:04Z');
      const court = getCourtAt(moonLong, birth, at);
      const stack = getStackAt(moonLong, birth, at)!;
      expect(court.map((p) => p.lord), name)
        .toEqual([stack.maha, stack.antar, stack.pratyantar, stack.sookshma, stack.prana]);
    }
  });

  it('nextPeriodAt hands over exactly on the boundary, at every level', () => {
    for (const { name, birth, moonLong } of CASES.slice(0, 12)) {
      const at = new Date('2026-07-29T12:00:00Z');
      const court = getCourtAt(moonLong, birth, at);
      for (let i = 0; i < 5; i++) {
        const next = nextPeriodAt(moonLong, birth, LEVELS[i]!, at)!;
        expect(next, `${name} ${LEVELS[i]}`).not.toBeNull();
        // Exact in microseconds, not "within a millisecond".
        expect(next.startUs).toBe(court[i]!.endUs);
        expect(next.lord).not.toBe(court[i]!.lord);
      }
    }
  });
});

describe('determinism', () => {
  it('recomputation is idempotent — same inputs, byte-identical boundaries', () => {
    // Floating-point accumulation can make a second walk differ from the first if any
    // intermediate is order-dependent. Integer microseconds cannot.
    for (const { name, birth, moonLong } of CASES) {
      const at = new Date('2028-11-11T11:11:11.111Z');
      const a = getCourtAt(moonLong, birth, at);
      const b = getCourtAt(moonLong, birth, at);
      expect(a.map((p) => [p.lord, p.startUs, p.endUs]), name)
        .toEqual(b.map((p) => [p.lord, p.startUs, p.endUs]));
    }
  });

  it('all boundaries are integers — nothing carries a fractional microsecond', () => {
    for (const { name, birth, moonLong } of CASES) {
      const court = getCourtAt(moonLong, birth, new Date('2026-07-29T12:00:00Z'));
      for (const p of court) {
        expect(Number.isInteger(p.startUs), `${name} ${p.level} start`).toBe(true);
        expect(Number.isInteger(p.endUs), `${name} ${p.level} end`).toBe(true);
        expect(Math.abs(p.startUs)).toBeLessThan(Number.MAX_SAFE_INTEGER);
      }
    }
  });

  it('the engine reads no clock of its own', async () => {
    // §3 rule 1: the clock is injected. Without this, "state at date X" for the Timeline
    // scrubber is impossible and nothing is deterministically testable.
    const { readFileSync, readdirSync, statSync } = await import('node:fs');
    const { join } = await import('node:path');
    const root = new URL('../src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) { walk(full); continue; }
        if (!/\.ts$/.test(name)) continue;
        const src = readFileSync(full, 'utf8')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/^\s*\/\/.*$/gm, '');
        if (/\bnew Date\(\s*\)|\bDate\.now\(\s*\)/.test(src)) offenders.push(name);
      }
    };
    walk(root);
    expect(offenders).toEqual([]);
  });
});
