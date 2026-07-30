// Generates packages/vectors/vectors.json — the language-agnostic golden fixtures.
//
// Run: npx tsx packages/vectors/generate.ts
// The output IS committed. Regenerating it is a deliberate act: if the diff shows a
// boundary moving, either you fixed a bug or you introduced one, and the commit message
// has to say which. That is the whole value of a golden vector.
//
// See README.md for what these prove and, importantly, what they do not.

import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCourtAt, getPeriodsAt } from '../engine/src/dasha/vimshottari.js';
import { ENGINE_VERSION, NAKSHATRA_ARC, NAKSHATRAS } from '../engine/src/constants.js';
import type { Graha } from '../engine/src/types.js';

const here = dirname(fileURLToPath(import.meta.url));

interface Case {
  id: string;
  /** Why this case exists. A vector without a reason gets deleted by the next person. */
  why: string;
  birthUtc: string;
  moonLongSidereal: number;
  /** The instant the court is resolved at. Fixed, never "now". */
  atUtc: string;
  yearLengthDays: number;
}

/** A longitude inside the nakshatra whose lord is `lord`, at `frac` through it. */
function longitude(lord: Graha, frac: number): number {
  const nak = NAKSHATRAS.find((n) => n.lord === lord)!;
  return NAKSHATRA_ARC * (nak.index + frac);
}

const LORDS: Graha[] = ['ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury'];
const AT = '2026-07-29T12:00:00.000Z';
const BASE_BIRTH = '1994-03-14T00:42:00.000Z';

const cases: Case[] = [];

// 1–27 · every starting lord, at three positions through its nakshatra. The fraction
// traversed is what sets the first maha's balance, so the extremes are where an
// off-by-one in the nakshatra index or a float rounding would show up.
for (const lord of LORDS) {
  for (const [label, frac] of [['start', 0.001], ['middle', 0.5], ['end', 0.999]] as const) {
    cases.push({
      id: `lord-${lord}-${label}`,
      why: `${lord} as starting lord, ${label} of its nakshatra — fixes the first maha balance`,
      birthUtc: BASE_BIRTH,
      moonLongSidereal: longitude(lord, frac),
      atUtc: AT,
      yearLengthDays: 365.25,
    });
  }
}

// 28–40 · the edge cases the plan names, plus a few of its own.
const EDGE: Case[] = [
  {
    id: 'midnight-utc',
    why: 'born exactly at 00:00:00.000 — the boundary between two calendar days',
    birthUtc: '2000-01-01T00:00:00.000Z', moonLongSidereal: 200.5, atUtc: AT, yearLengthDays: 365.25,
  },
  {
    id: 'last-millisecond-of-day',
    why: 'born at 23:59:59.999 — one millisecond from rolling over',
    birthUtc: '2003-06-30T23:59:59.999Z', moonLongSidereal: 88.88, atUtc: AT, yearLengthDays: 365.25,
  },
  {
    id: 'leap-day',
    why: '29 February — the date arithmetic most likely to be special-cased wrongly',
    birthUtc: '2004-02-29T12:00:00.000Z', moonLongSidereal: 311.2, atUtc: AT, yearLengthDays: 365.25,
  },
  {
    id: 'pre-1970-negative-epoch',
    why: 'birth before the Unix epoch — every timestamp is negative, which breaks naive division',
    birthUtc: '1947-08-14T18:31:00.000Z', moonLongSidereal: 45.75, atUtc: AT, yearLengthDays: 365.25,
  },
  {
    id: 'india-wartime-dst-1942',
    why: 'India ran +06:30 wartime DST 1942-45; using the modern +05:30 costs ~10 months of drift',
    birthUtc: '1943-07-04T02:15:00.000Z', moonLongSidereal: 128.4, atUtc: AT, yearLengthDays: 365.25,
  },
  {
    id: 'dst-spring-forward',
    why: 'born during a US spring-forward gap, when local wall time does not exist',
    birthUtc: '1990-04-01T07:30:00.000Z', moonLongSidereal: 265.31, atUtc: AT, yearLengthDays: 365.25,
  },
  {
    id: 'dst-fall-back',
    why: 'born during a US fall-back overlap, when local wall time happens twice',
    birthUtc: '1990-10-28T08:30:00.000Z', moonLongSidereal: 12.07, atUtc: AT, yearLengthDays: 365.25,
  },
  {
    id: 'southern-hemisphere',
    why: 'southern-hemisphere birth — seasons and ascendant behave differently, dashas must not',
    birthUtc: '1978-12-21T18:45:00.000Z', moonLongSidereal: 178.02, atUtc: AT, yearLengthDays: 365.25,
  },
  {
    id: 'high-latitude',
    why: 'high-latitude birth (Tromso, polar night) — an ascendant edge case downstream',
    birthUtc: '1985-01-15T11:00:00.000Z', moonLongSidereal: 96.5, atUtc: AT, yearLengthDays: 365.25,
  },
  {
    id: 'year-1901',
    why: 'earliest plausible living birth — the far end of the representable range',
    birthUtc: '1901-05-09T09:09:09.000Z', moonLongSidereal: 240.001, atUtc: AT, yearLengthDays: 365.25,
  },
  {
    id: 'far-future-resolve',
    why: 'resolved 70 years after birth, deep in the second 120-year cycle',
    birthUtc: '1994-03-14T00:42:00.000Z', moonLongSidereal: 55.55, atUtc: '2094-03-14T00:42:00.000Z',
    yearLengthDays: 365.25,
  },
  {
    id: 'longitude-exact-zero',
    why: 'Moon at exactly 0deg — the start of Ashwini and of the zodiac',
    birthUtc: '1994-03-14T00:42:00.000Z', moonLongSidereal: 0, atUtc: AT, yearLengthDays: 365.25,
  },
  {
    id: 'longitude-on-nakshatra-edge',
    why: 'Moon exactly on a nakshatra boundary — the floor() in nakshatraOf decides the lord',
    birthUtc: '1994-03-14T00:42:00.000Z', moonLongSidereal: NAKSHATRA_ARC * 9, atUtc: AT,
    yearLengthDays: 365.25,
  },
  {
    id: 'resolved-at-birth-instant',
    why: 'court resolved at the birth instant itself — the first maha is mid-term by definition',
    birthUtc: '1997-04-11T15:25:00.000Z', moonLongSidereal: 40.12,
    atUtc: '1997-04-11T15:25:00.000Z', yearLengthDays: 365.25,
  },
];
cases.push(...EDGE);

// Emit. Both ISO strings (readable, portable) and integer microseconds (exact) — a port
// that only reads one of them still has enough to verify against.
const vectors = cases.map((c) => {
  const birth = new Date(c.birthUtc);
  const at = new Date(c.atUtc);
  const opts = { yearLengthDays: c.yearLengthDays };
  const court = getCourtAt(c.moonLongSidereal, birth, at, opts);
  // The first three mahadashas, so a port can check the top-level sequence independently
  // of whatever instant it resolves at.
  const mahas = getPeriodsAt(
    c.moonLongSidereal, birth, 'maha',
    new Date(birth.getTime() - 40 * 365.25 * 86_400_000),
    new Date(birth.getTime() + 40 * 365.25 * 86_400_000),
    opts,
  ).slice(0, 3);
  return {
    ...c,
    court: court.map((p) => ({
      level: p.level, lord: p.lord,
      startUtc: p.start.toISOString(), endUtc: p.end.toISOString(),
      startUs: p.startUs, endUs: p.endUs,
    })),
    firstMahadashas: mahas.map((p) => ({
      lord: p.lord, startUtc: p.start.toISOString(), endUtc: p.end.toISOString(),
      startUs: p.startUs, endUs: p.endUs,
    })),
  };
});

const out = {
  $schema: 'https://vimshottari.app/schemas/dasha-vectors-1.json',
  generatedBy: `@aura/engine ${ENGINE_VERSION}`,
  note:
    'Golden fixtures. Every implementation — this TS engine, a future Dart port, the ' +
    'compiled JS — must reproduce these exactly. A mismatch fails the build. Regenerate ' +
    'only deliberately: a moved boundary is either a fix or a regression, and the commit ' +
    'message must say which.',
  count: vectors.length,
  vectors,
};

writeFileSync(resolve(here, 'vectors.json'), `${JSON.stringify(out, null, 2)}\n`, 'utf8');
console.log(`wrote ${vectors.length} vectors (engine ${ENGINE_VERSION})`);
