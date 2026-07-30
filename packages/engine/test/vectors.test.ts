// Golden vectors (SPEC §3, M14a). Every implementation runs these; a mismatch fails CI.
//
// This is the regression ratchet, not the correctness proof — see packages/vectors/README.md
// for why that distinction matters and where correctness is actually established.

import { describe, expect, it } from 'vitest';
import { getCourtAt, getPeriodsAt } from '../src/dasha/vimshottari.js';
import type { DashaLevel, Graha } from '../src/types.js';
import vectorFile from '../../vectors/vectors.json' with { type: 'json' };

interface Boundary {
  level?: DashaLevel;
  lord: Graha;
  startUtc: string;
  endUtc: string;
  startUs: number;
  endUs: number;
}
interface Vector {
  id: string;
  why: string;
  birthUtc: string;
  moonLongSidereal: number;
  atUtc: string;
  yearLengthDays: number;
  court: Boundary[];
  firstMahadashas: Boundary[];
}

const file = vectorFile as unknown as { count: number; vectors: Vector[] };

describe('golden vectors', () => {
  it('the fixture file is present and self-consistent', () => {
    expect(file.vectors.length).toBe(file.count);
    expect(file.count).toBeGreaterThanOrEqual(40); // §3 asks for ~40 charts
    // Every case must justify itself, or the next person deletes it.
    for (const v of file.vectors) {
      expect(v.why.length, v.id).toBeGreaterThan(20);
      expect(v.court.length, v.id).toBe(5);
    }
    // No duplicate ids, and no two cases with identical inputs (which would be one case).
    const ids = new Set(file.vectors.map((v) => v.id));
    expect(ids.size).toBe(file.vectors.length);
    const inputs = new Set(file.vectors.map((v) => `${v.birthUtc}|${v.moonLongSidereal}|${v.atUtc}`));
    expect(inputs.size).toBe(file.vectors.length);
  });

  it.each(file.vectors.map((v) => [v.id, v] as const))(
    'reproduces %s exactly',
    (_id, v) => {
      const opts = { yearLengthDays: v.yearLengthDays };
      const birth = new Date(v.birthUtc);
      const at = new Date(v.atUtc);

      const court = getCourtAt(v.moonLongSidereal, birth, at, opts);
      expect(court).toHaveLength(v.court.length);
      court.forEach((p, i) => {
        const want = v.court[i]!;
        expect(p.level).toBe(want.level);
        expect(p.lord).toBe(want.lord);
        // Microseconds, not milliseconds: a port that rounds differently must fail here.
        expect(p.startUs).toBe(want.startUs);
        expect(p.endUs).toBe(want.endUs);
        expect(p.start.toISOString()).toBe(want.startUtc);
        expect(p.end.toISOString()).toBe(want.endUtc);
      });

      // The top-level sequence, independent of the instant the court was resolved at.
      const mahas = getPeriodsAt(
        v.moonLongSidereal, birth, 'maha',
        new Date(birth.getTime() - 40 * 365.25 * 86_400_000),
        new Date(birth.getTime() + 40 * 365.25 * 86_400_000),
        opts,
      ).slice(0, v.firstMahadashas.length);
      mahas.forEach((p, i) => {
        const want = v.firstMahadashas[i]!;
        expect(p.lord).toBe(want.lord);
        expect(p.startUs).toBe(want.startUs);
        expect(p.endUs).toBe(want.endUs);
      });
    },
  );

  it('covers pre-epoch births — at least one boundary is a negative timestamp', () => {
    // Negative microseconds are where naive integer division and Math.floor go wrong, so
    // the set is worthless without them.
    const negatives = file.vectors.flatMap((v) => v.firstMahadashas)
      .filter((b) => b.startUs < 0);
    expect(negatives.length).toBeGreaterThan(0);
  });

  it('covers all nine starting lords', () => {
    const lords = new Set(file.vectors.map((v) => v.firstMahadashas[0]!.lord));
    expect(lords.size).toBe(9);
  });

  it('every boundary in the file is an exact integer microsecond', () => {
    for (const v of file.vectors) {
      for (const b of [...v.court, ...v.firstMahadashas]) {
        expect(Number.isInteger(b.startUs), `${v.id} ${b.lord}`).toBe(true);
        expect(Number.isInteger(b.endUs), `${v.id} ${b.lord}`).toBe(true);
        expect(b.endUs).toBeGreaterThan(b.startUs);
      }
    }
  });
});
