// ─────────────────────────────────────────────────────────────────────────────
// Reference data (SPEC §2, §4.4, App B/C/D). Correctness-critical: everything
// downstream reads these. Nakshatra/dasha/dignity tables are golden-tested.
// ─────────────────────────────────────────────────────────────────────────────

import type { Energy, Graha, LifeArea } from './types.js';

export const GRAHAS: Graha[] = [
  'sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu',
];

export const ENERGIES: Energy[] = [
  'main', 'feel', 'fire', 'mind', 'grow', 'love', 'build', 'crave', 'let',
];

/** graha → energy (SPEC §2). */
export const GRAHA_TO_ENERGY: Record<Graha, Energy> = {
  sun: 'main',
  moon: 'feel',
  mars: 'fire',
  mercury: 'mind',
  jupiter: 'grow',
  venus: 'love',
  saturn: 'build',
  rahu: 'crave',
  ketu: 'let',
};

export const ENERGY_TO_GRAHA: Record<Energy, Graha> = {
  main: 'sun',
  feel: 'moon',
  fire: 'mars',
  mind: 'mercury',
  grow: 'jupiter',
  love: 'venus',
  build: 'saturn',
  crave: 'rahu',
  let: 'ketu',
};

export interface EnergyMeta {
  energy: Energy;
  /** User-facing name. */
  label: string;
  /** Plain-language gloss (SPEC §2). */
  gloss: string;
  /** Spec token name (SPEC §2). */
  colorToken: string;
  /** Evocative CSS var used in the mockup (docs/mockups/aura_app_screens.html). */
  uiVar: string;
  color: string;
}

// Colors + uiVar names verified against the real mockup CSS (docs/mockups). Hex
// values are identical to SPEC §2; uiVar is the design token the RN theme mirrors.
export const ENERGY_META: Record<Energy, EnergyMeta> = {
  main:  { energy: 'main',  label: 'Main Character', gloss: 'being seen · identity · recognition',     colorToken: '--main',  uiVar: '--radiance', color: '#FFD070' },
  feel:  { energy: 'feel',  label: 'Big Feelings',   gloss: 'your feelings · comfort · moods',          colorToken: '--feel',  uiVar: '--tide',     color: '#8FB7FF' },
  fire:  { energy: 'fire',  label: 'Fired Up',       gloss: 'drive · courage · heat · action',          colorToken: '--fire',  uiVar: '--forge',    color: '#FF6E58' },
  mind:  { energy: 'mind',  label: 'Busy Mind',      gloss: 'thinking · talking · learning · deals',    colorToken: '--mind',  uiVar: '--signal',   color: '#5FE0C0' },
  grow:  { energy: 'grow',  label: 'Green Light',    gloss: 'lucky growth · opportunity · expansion',   colorToken: '--grow',  uiVar: '--bloom',    color: '#7ED69B' },
  love:  { energy: 'love',  label: 'Soft Spot',      gloss: 'love · charm · beauty · pleasure',         colorToken: '--love',  uiVar: '--velvet',   color: '#F49CC9' },
  build: { energy: 'build', label: 'Heavy Lifting',  gloss: 'discipline · pressure · the long build',   colorToken: '--build', uiVar: '--slate',    color: '#8E93C8' },
  crave: { energy: 'crave', label: 'Never Enough',   gloss: 'restless hunger · craving · overthinking', colorToken: '--crave', uiVar: '--smoke',    color: '#AE8FE6' },
  let:   { energy: 'let',   label: 'Letting Go',     gloss: 'detachment · endings · release',           colorToken: '--let',   uiVar: '--ash',      color: '#A6ABB8' },
};

// ── Houses → life areas (App A) ──────────────────────────────────────────────

export const HOUSE_TO_AREA: Record<number, LifeArea> = {
  1: 'self', 2: 'money', 3: 'communication', 4: 'home', 5: 'creativity', 6: 'health',
  7: 'partnership', 8: 'transformation', 9: 'luck', 10: 'career', 11: 'gains', 12: 'release',
};

export const AREA_TO_HOUSE: Record<LifeArea, number> = {
  self: 1, money: 2, communication: 3, home: 4, creativity: 5, health: 6,
  partnership: 7, transformation: 8, luck: 9, career: 10, gains: 11, release: 12,
};

export interface AreaMeta { area: LifeArea; label: string; gloss: string; }

export const AREA_META: Record<LifeArea, AreaMeta> = {
  self:          { area: 'self',          label: 'You',           gloss: 'your body, energy, how you show up' },
  money:         { area: 'money',         label: 'Money',         gloss: 'what you earn, own, and value' },
  communication: { area: 'communication', label: 'Voice',         gloss: 'talking, skills, courage, close kin' },
  home:          { area: 'home',          label: 'Home',          gloss: 'roots, family, your inner ground' },
  creativity:    { area: 'creativity',    label: 'Play',          gloss: 'romance, making things, self-expression' },
  health:        { area: 'health',        label: 'Routines',      gloss: 'daily work, habits, the body upkeep' },
  partnership:   { area: 'partnership',   label: 'Partners',      gloss: 'the people you pair up with' },
  transformation:{ area: 'transformation',label: 'Deep Change',   gloss: 'the big shifts, the hidden, the reset' },
  luck:          { area: 'luck',          label: 'Fortune',       gloss: 'luck, learning, belief, the long view' },
  career:        { area: 'career',        label: 'Work',          gloss: 'status, direction, action in the world' },
  gains:         { area: 'gains',         label: 'Gains',         gloss: 'income, network, hopes coming through' },
  release:       { area: 'release',       label: 'Rest',          gloss: 'letting go, rest, quiet, spirit' },
};

/** House-nature weight (SPEC §5.1): dusthanas 6/8/12 weighted for challenge. */
export const HOUSE_NATURE_WEIGHT: Record<number, number> = {
  1: 1.0, 2: 0.9, 3: 0.85, 4: 1.0, 5: 1.0, 6: 1.15,
  7: 1.0, 8: 1.2, 9: 1.0, 10: 1.0, 11: 0.95, 12: 1.15,
};

export const KENDRAS = [1, 4, 7, 10];
export const TRIKONAS = [1, 5, 9];
export const DUSTHANAS = [6, 8, 12];

// ── Sign lords (rulership) — index 0..11 = Aries..Pisces ─────────────────────

export const SIGN_LORD: Graha[] = [
  'mars',    // 0 Aries
  'venus',   // 1 Taurus
  'mercury', // 2 Gemini
  'moon',    // 3 Cancer
  'sun',     // 4 Leo
  'mercury', // 5 Virgo
  'venus',   // 6 Libra
  'mars',    // 7 Scorpio
  'jupiter', // 8 Sagittarius
  'saturn',  // 9 Capricorn
  'saturn',  // 10 Aquarius
  'jupiter', // 11 Pisces
];

// ── Nakshatras (27) with their Vimshottari lord (App D) ──────────────────────

export interface NakshatraDef { index: number; name: string; lord: Graha; }

export const NAKSHATRAS: NakshatraDef[] = [
  { index: 0,  name: 'Ashwini',       lord: 'ketu' },
  { index: 1,  name: 'Bharani',       lord: 'venus' },
  { index: 2,  name: 'Krittika',      lord: 'sun' },
  { index: 3,  name: 'Rohini',        lord: 'moon' },
  { index: 4,  name: 'Mrigashira',    lord: 'mars' },
  { index: 5,  name: 'Ardra',         lord: 'rahu' },
  { index: 6,  name: 'Punarvasu',     lord: 'jupiter' },
  { index: 7,  name: 'Pushya',        lord: 'saturn' },
  { index: 8,  name: 'Ashlesha',      lord: 'mercury' },
  { index: 9,  name: 'Magha',         lord: 'ketu' },
  { index: 10, name: 'P. Phalguni',   lord: 'venus' },
  { index: 11, name: 'U. Phalguni',   lord: 'sun' },
  { index: 12, name: 'Hasta',         lord: 'moon' },
  { index: 13, name: 'Chitra',        lord: 'mars' },
  { index: 14, name: 'Swati',         lord: 'rahu' },
  { index: 15, name: 'Vishakha',      lord: 'jupiter' },
  { index: 16, name: 'Anuradha',      lord: 'saturn' },
  { index: 17, name: 'Jyeshtha',      lord: 'mercury' },
  { index: 18, name: 'Mula',          lord: 'ketu' },
  { index: 19, name: 'P. Ashadha',    lord: 'venus' },
  { index: 20, name: 'U. Ashadha',    lord: 'sun' },
  { index: 21, name: 'Shravana',      lord: 'moon' },
  { index: 22, name: 'Dhanishta',     lord: 'mars' },
  { index: 23, name: 'Shatabhisha',   lord: 'rahu' },
  { index: 24, name: 'P. Bhadrapada', lord: 'jupiter' },
  { index: 25, name: 'U. Bhadrapada', lord: 'saturn' },
  { index: 26, name: 'Revati',        lord: 'mercury' },
];

export const NAKSHATRA_ARC = 360 / 27; // 13.333… degrees
export const PADA_ARC = NAKSHATRA_ARC / 4; // 3.333… degrees

// ── Vimshottari dasha order & years (App D) ──────────────────────────────────

export const VIMSHOTTARI_ORDER: Graha[] = [
  'ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury',
];

export const VIMSHOTTARI_YEARS: Record<Graha, number> = {
  ketu: 7, venus: 20, sun: 6, moon: 10, mars: 7,
  rahu: 18, jupiter: 16, saturn: 19, mercury: 17,
};

export const VIMSHOTTARI_TOTAL = 120;

// ── Dignity tables (App B). Signs as index 0..11. ────────────────────────────

export interface DignityDef {
  exaltSign: number | null;
  /** Deep-exaltation degree within the sign (for scaling near the point). */
  exaltDeg: number | null;
  debilSign: number | null;
  ownSigns: number[];
  /** Moolatrikona sign (subset of own), optional. */
  moolatrikonaSign: number | null;
}

export const DIGNITY: Record<Graha, DignityDef> = {
  sun:     { exaltSign: 0,  exaltDeg: 10, debilSign: 6,  ownSigns: [4],      moolatrikonaSign: 4 },
  moon:    { exaltSign: 1,  exaltDeg: 3,  debilSign: 7,  ownSigns: [3],      moolatrikonaSign: 1 },
  mars:    { exaltSign: 9,  exaltDeg: 28, debilSign: 3,  ownSigns: [0, 7],   moolatrikonaSign: 0 },
  mercury: { exaltSign: 5,  exaltDeg: 15, debilSign: 11, ownSigns: [2, 5],   moolatrikonaSign: 5 },
  jupiter: { exaltSign: 3,  exaltDeg: 5,  debilSign: 9,  ownSigns: [8, 11],  moolatrikonaSign: 8 },
  venus:   { exaltSign: 11, exaltDeg: 27, debilSign: 5,  ownSigns: [1, 6],   moolatrikonaSign: 6 },
  saturn:  { exaltSign: 6,  exaltDeg: 20, debilSign: 0,  ownSigns: [9, 10],  moolatrikonaSign: 10 },
  // Rahu/Ketu dignities vary by tradition — default toward neutral (App B note).
  rahu:    { exaltSign: 1,  exaltDeg: null, debilSign: 7,  ownSigns: [],     moolatrikonaSign: null },
  ketu:    { exaltSign: 7,  exaltDeg: null, debilSign: 1,  ownSigns: [],     moolatrikonaSign: null },
};

/** Natural benefic (+1) / malefic (−1) baseline (App B). Moon handled by phase. */
export const NATURAL_POLARITY: Record<Graha, number> = {
  jupiter: 1, venus: 1, mercury: 1, moon: 1,
  saturn: -1, mars: -1, sun: -1, rahu: -1, ketu: -1,
};

// ── Friendship (naisargika maitri) — for dignity refinement (App B) ──────────
// Rows: how the key graha regards the column graha. F=friend,N=neutral,E=enemy.
type Rel = 'F' | 'N' | 'E';
export const NATURAL_FRIENDSHIP: Record<Graha, Partial<Record<Graha, Rel>>> = {
  sun:     { moon: 'F', mars: 'F', jupiter: 'F', mercury: 'N', venus: 'E', saturn: 'E' },
  moon:    { sun: 'F', mercury: 'F', mars: 'N', jupiter: 'N', venus: 'N', saturn: 'N' },
  mars:    { sun: 'F', moon: 'F', jupiter: 'F', venus: 'N', saturn: 'N', mercury: 'E' },
  mercury: { sun: 'F', venus: 'F', moon: 'E', mars: 'N', jupiter: 'N', saturn: 'N' },
  jupiter: { sun: 'F', moon: 'F', mars: 'F', saturn: 'N', mercury: 'E', venus: 'E' },
  venus:   { mercury: 'F', saturn: 'F', mars: 'N', jupiter: 'N', sun: 'E', moon: 'E' },
  saturn:  { mercury: 'F', venus: 'F', jupiter: 'N', sun: 'E', moon: 'E', mars: 'E' },
  rahu:    {},
  ketu:    {},
};

// ── Special aspects (graha drishti). All aspect the 7th (offset 6). ──────────
// Offsets are counted as (house distance − 1): 7th house = +6 signs.
export const SPECIAL_ASPECT_OFFSETS: Record<Graha, number[]> = {
  sun:     [6],
  moon:    [6],
  mercury: [6],
  venus:   [6],
  mars:    [3, 6, 7],       // 4th, 7th, 8th
  jupiter: [4, 6, 8],       // 5th, 7th, 9th
  saturn:  [2, 6, 9],       // 3rd, 7th, 10th
  rahu:    [4, 6, 8],       // 5th, 7th, 9th (optional tradition; configurable)
  ketu:    [4, 6, 8],
};

export const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

// ─────────────────────────────────────────────────────────────────────────────
// Engine identity
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Semver of the dasha/chart maths, stamped onto every persisted computation.
 *
 * Bump it whenever a change can move a boundary — then recompute affected charts,
 * diff old against new with `boundaryDrift`, and notify only the users whose
 * boundaries actually moved more than the threshold. This is the module nobody
 * builds and everybody needs: without it, the first maths fix is indistinguishable
 * from a data corruption bug.
 *
 * 0.2.0 — internal arithmetic moved from float milliseconds to integer microseconds,
 *         and sub-period boundaries are now derived from cumulative year totals so
 *         children close exactly on the parent. Boundaries move by under a
 *         millisecond, so no user-visible date changes.
 */
export const ENGINE_VERSION = '0.2.0';

/**
 * Moon's mean sidereal motion in degrees per day. Used to convert a birth-time
 * uncertainty into a boundary uncertainty: the Moon crosses one nakshatra
 * (13°20') in NAKSHATRA_ARC / this ≈ 1.0119 days ≈ 24.29 hours, and the fraction
 * of that nakshatra already traversed at birth is what sets every boundary in the
 * whole 120-year tree.
 */
export const MOON_MEAN_DAILY_MOTION = 13.176358;

/** Days the Moon takes to cross one nakshatra. ≈1.0119 d (≈24.29 h). */
export const NAKSHATRA_CROSSING_DAYS = NAKSHATRA_ARC / MOON_MEAN_DAILY_MOTION;
