# @vim/vectors — golden dasha fixtures

Language-agnostic JSON. Every implementation of the dasha engine runs these in CI: this
TypeScript engine today, a Dart port or a `dart compile js` build tomorrow, any future
Swift/Kotlin port after that. **A vector mismatch fails the build.**

```
npx tsx packages/vectors/generate.ts     # regenerate
npm run check --workspace @vim/vectors   # fails if vectors.json is stale
npx vitest run --root packages/engine vectors
```

## What these prove, and what they do not

Be precise about this, because a golden vector is easy to over-trust.

**They prove parity and stability.** Two implementations that agree on all 41 vectors agree
on the arithmetic. And a boundary that moves between commits shows up as a diff, which is
what makes an engine change auditable rather than a mystery.

**They do not prove correctness.** The expected values are generated *from this engine*, so
they cannot catch an error that was present when they were generated. They are a ratchet,
not an oracle.

**Correctness is proved elsewhere, by hand-computed anchors:**

- `packages/engine/test/dasha.test.ts` — Moon at the exact middle of Ashwini gives a Ketu
  mahadasha with a 3.5-year balance, derived from the book's balance formula rather than
  from the code.
- `packages/engine/test/uncertainty.test.ts` — the boundary-uncertainty formula is asserted
  against the drift table published in `new-structure.md` §1.1, every row and both columns.
  That table was computed independently of this code.
- `packages/engine/test/dasha-invariants.test.ts` — property tests that hold regardless of
  what the numbers are: children sum to their parent exactly, boundaries are half-open and
  strictly increasing, adjacent periods never repeat a lord, recomputation is idempotent.

So: **invariants say the shape is right, hand-anchors say the scale is right, and vectors
say nothing has changed since.** All three are needed and none substitutes for another.

## Regenerating

Regeneration is deliberate. If `git diff vectors.json` shows a boundary moving:

1. Decide whether you fixed a bug or introduced one. The invariant and anchor tests are how
   you tell — if they still pass and a vector moved, look hard at what you changed.
2. Bump `ENGINE_VERSION` in `packages/engine/src/constants.ts`.
3. Say in the commit message which boundaries moved, by how much, and why.
4. Follow the M19 path: recompute stored charts, diff with `boundaryDrift`, and notify only
   the users whose boundaries moved past the 6-hour threshold.

## Coverage

41 cases:

- **27** — all nine starting lords at the start, middle and end of their nakshatra. The
  fraction traversed at birth sets the first mahadasha's balance and therefore every
  boundary in the tree, so the extremes are where an off-by-one or a rounding shows.
- **14** — the edge cases `new-structure.md` §3 names, plus a few of our own: midnight UTC,
  23:59:59.999, a leap day, a pre-epoch (negative timestamp) birth, India's 1942–45 wartime
  DST, a DST spring-forward gap, a DST fall-back overlap, southern hemisphere, high
  latitude, 1901, a court resolved 70 years after birth, Moon at exactly 0°, Moon exactly on
  a nakshatra boundary, and a court resolved at the birth instant itself.

Each case carries a `why`. A vector without a stated reason is a vector the next person
deletes, so keep that field honest.
