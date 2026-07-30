// ─────────────────────────────────────────────────────────────────────────────
// The depth gate: which dasha levels a given birth-time precision entitles you to
// STATE, versus show dimmed, versus not show at all.
//
// `uncertainty.ts` computes how far a boundary can move. This module turns that into
// the one permission question every surface has to answer. It lives in the engine, not
// in a client, because there are now three callers and they must not disagree:
//
//   - the web app's rings and court table
//   - the Mentor gateway's system prompt and tools (a model asked "what's my Messenger
//     doing next week" must be refused at the same depth the UI refuses)
//   - notification scheduling, which must never fire on a boundary it cannot locate
//
// It was previously a function inside apps/vim. That was fine while the UI was the only
// consumer and became a correctness risk the moment the server needed the same answer:
// two copies of a safety rule is one copy of a safety rule and one bug waiting.
// ─────────────────────────────────────────────────────────────────────────────

import type { BirthTimeAccuracy } from '../types.js';

/**
 * How well the birth time is known, in the four buckets a person can actually answer.
 *
 * Deliberately coarser than the engine's five-value `BirthTimeAccuracy`: this is the
 * question a *user* is asked at onboarding and the value that gets persisted, so it has
 * to be answerable without a certificate in hand. `accuracyFor` bridges the two.
 */
export type BirthTimeConfidence = 'exact' | 'within15min' | 'within1hour' | 'unknown';

/**
 * What a level is allowed to do on screen and in prose.
 *
 * - `solid`       — state the lord and the dates as fact.
 * - `approximate` — show it, always marked, never built on. No notification may fire on it.
 * - `hidden`      — do not render, do not mention, do not let a tool return it.
 */
export type RingVisibility = 'solid' | 'approximate' | 'hidden';

/** The engine-side accuracy that corresponds to each user-facing confidence answer. */
export const CONFIDENCE_ACCURACY: Record<BirthTimeConfidence, BirthTimeAccuracy> = {
  exact: 'near_minute',
  within15min: 'within_15m',
  within1hour: 'within_hour',
  unknown: 'unknown',
};

export const accuracyFor = (c: BirthTimeConfidence): BirthTimeAccuracy => CONFIDENCE_ACCURACY[c];

/**
 * What each level (1 = Mahadasha … 5 = Pranadasha) may claim at a given confidence.
 *
 * The shape of the table is not caution, it is the arithmetic in `uncertainty.ts`: one
 * minute of birth-time error shifts every boundary in the 120-year tree by up to five
 * days, and that shift stays the same absolute size while the periods get shorter. So
 * each step down in precision costs one level of depth.
 *
 * **Level 5 is never `solid` — not even at `exact`.** A to-the-minute birth time still
 * carries ±5 days of boundary drift, and a pranadasha lasts hours to a few days. The
 * ring ships because it is beautiful and because it is honest about being decorative;
 * nothing may be built on it.
 */
export function visibilityFor(level: number, c: BirthTimeConfidence): RingVisibility {
  switch (c) {
    case 'exact':
      return level <= 4 ? 'solid' : 'approximate';
    case 'within15min':
      if (level <= 3) return 'solid';
      return level === 4 ? 'approximate' : 'hidden';
    case 'within1hour':
      if (level <= 2) return 'solid';
      return level === 3 ? 'approximate' : 'hidden';
    case 'unknown':
      if (level === 1) return 'solid';
      return level === 2 ? 'approximate' : 'hidden';
  }
}

/**
 * The deepest level that may be stated as fact — i.e. the last `solid` one.
 *
 * Derived from `visibilityFor` rather than restated, so the two can never drift apart.
 * Returns 1 in the worst case: there is always a King, because a mahadasha is years long
 * and survives even a ±12-hour placeholder.
 */
export function deepestTrustworthyLevel(c: BirthTimeConfidence): 1 | 2 | 3 | 4 | 5 {
  let deepest: 1 | 2 | 3 | 4 | 5 = 1;
  for (const level of [1, 2, 3, 4, 5] as const) {
    if (visibilityFor(level, c) === 'solid') deepest = level;
  }
  return deepest;
}

/** Every level a caller is allowed to render or return at this confidence. */
export const visibleLevels = (c: BirthTimeConfidence): (1 | 2 | 3 | 4 | 5)[] =>
  ([1, 2, 3, 4, 5] as const).filter((l) => visibilityFor(l, c) !== 'hidden');

/**
 * Clamp an arbitrary stored or client-supplied string to a confidence value.
 *
 * Unrecognised input becomes `unknown`, the most conservative answer — a malformed value
 * must never be able to talk any surface into claiming precision nobody asserted.
 */
export function cleanConfidence(v: unknown): BirthTimeConfidence {
  return v === 'exact' || v === 'within15min' || v === 'within1hour' ? v : 'unknown';
}
