// Design tokens. Ported from the Figma source of truth (file mP16YA7x9BH1Ee0qPoSwDN)
// via ideafiles/_extract/vimshottari_app/lib/theme/tokens.dart, which is the reconciled
// copy — where Figma and these disagree, these win and Figma is stale.
//
// Surfaces, ink, radii and the shadow recipes live in app.css as custom properties,
// because CSS is where they're consumed. This file holds only what JavaScript needs
// to compute with: planet colour, ring geometry, motion timings, office metadata.
//
// Dark neumorphism. The base is deliberately mid-dark (#1B1D24), NOT black — pure
// black kills the effect because the light shadow has nothing to lift off.

import type { DashaLevel, Graha } from '@aura/engine';

// ---------------------------------------------------------------------------
// The court — the app's whole vocabulary
// ---------------------------------------------------------------------------

/** Level 1 is the slowest and innermost ring; level 5 the fastest and outermost. */
export type Office = 'king' | 'primeMinister' | 'governor' | 'magistrate' | 'messenger';

export interface OfficeMeta {
  office: Office;
  /** 1 = King … 5 = Messenger. */
  level: 1 | 2 | 3 | 4 | 5;
  /** The engine's name for the same tier. */
  dashaLevel: DashaLevel;
  /** Primary label. The role is primary, the planet secondary, the Sanskrit tertiary. */
  label: string;
  /** Second line, shown only when "Show Sanskrit terms" is on. */
  sanskrit: string;
  /** The permanent explainer on each court row. Never changes; the time-left pill does. */
  rules: string;
}

/** Ordered King → Messenger, i.e. slowest first, matching engine level order. */
export const OFFICES: readonly OfficeMeta[] = [
  {
    office: 'king', level: 1, dashaLevel: 'maha',
    label: 'King', sanskrit: 'Mahādaśā',
    rules: 'Rules for several years — typically 6 to 20.',
  },
  {
    office: 'primeMinister', level: 2, dashaLevel: 'antar',
    label: 'Prime Minister', sanskrit: 'Antardaśā',
    rules: 'Rules for months up to a few years — usually 1 to 3.',
  },
  {
    office: 'governor', level: 3, dashaLevel: 'pratyantar',
    label: 'Governor', sanskrit: 'Pratyantardaśā',
    rules: 'Rules for weeks to a few months.',
  },
  {
    office: 'magistrate', level: 4, dashaLevel: 'sookshma',
    label: 'Magistrate', sanskrit: 'Sūkṣma daśā',
    rules: 'Rules for days to a few weeks.',
  },
  {
    office: 'messenger', level: 5, dashaLevel: 'prana',
    label: 'Messenger', sanskrit: 'Prāṇa daśā',
    rules: 'Rules for hours to a few days.',
  },
] as const;

export const officeByLevel = (level: number): OfficeMeta =>
  OFFICES[level - 1] ?? OFFICES[0]!;

// ---------------------------------------------------------------------------
// Planets
// ---------------------------------------------------------------------------

/**
 * `ring` paints the wheel. `tabFill`/`tabInk` paint plan stage tabs: the tab is its
 * own ring colour deepened, and everything drawn ON the tab is a lighter shade of the
 * SAME hue. Never introduce a foreign colour.
 * Derivation: tabFill = hue at 18% over the base; tabInk = hue at 72% lightness.
 * `rim` is a forced outline where contrast fails.
 */
export interface PlanetPalette {
  ring: string;
  tabFill: string;
  tabFillActive: string;
  tabInk: string;
  rim?: string;
  /** Display name. Planet names are shown product-wide, never hidden behind jargon. */
  name: string;
  /** One word for what this ruler does. Reused in the court table and notifications. */
  keyword: string;
}

export const PLANET: Record<Graha, PlanetPalette> = {
  sun: {
    ring: '#FF7A18', tabFill: '#31220F', tabFillActive: '#3A2610', tabInk: '#E5A264',
    name: 'Sun', keyword: 'Authority',
  },
  // Pearl needs an outline in light contexts or it dissolves.
  moon: {
    ring: '#F2EDE4', tabFill: '#2B2A27', tabFillActive: '#34322D', tabInk: '#D8D3C9',
    rim: '#B9BCC4', name: 'Moon', keyword: 'Feel',
  },
  mars: {
    ring: '#E2342B', tabFill: '#401512', tabFillActive: '#5E201B', tabInk: '#FFB3AC',
    name: 'Mars', keyword: 'Drive',
  },
  mercury: {
    ring: '#2FBF71', tabFill: '#12301F', tabFillActive: '#164028', tabInk: '#79DDA6',
    name: 'Mercury', keyword: 'Exchange',
  },
  jupiter: {
    ring: '#F5C518', tabFill: '#332A0D', tabFillActive: '#453811', tabInk: '#EBCE6B',
    rim: '#C79A00', name: 'Jupiter', keyword: 'Expansion',
  },
  venus: {
    ring: '#FF6FA5', tabFill: '#321D28', tabFillActive: '#45242F', tabInk: '#E594B7',
    name: 'Venus', keyword: 'Attraction',
  },
  // True Saturn is unusable as a tab fill on a dark base — it vanishes. In plan tabs
  // only, the hue derives from the RIM value. The wheel ring stays near-black.
  saturn: {
    ring: '#0E0E12', tabFill: '#282C36', tabFillActive: '#343A46', tabInk: '#B6BCCA',
    rim: '#3A3D45', name: 'Saturn', keyword: 'Weight',
  },
  rahu: {
    ring: '#6B6F76', tabFill: '#25272B', tabFillActive: '#2F3237', tabInk: '#A2A7AF',
    name: 'Rahu', keyword: 'Hunger',
  },
  ketu: {
    ring: '#61C7F0', tabFill: '#0F2833', tabFillActive: '#143743', tabInk: '#96DBF5',
    name: 'Ketu', keyword: 'Release',
  },
};

export const planetName = (g: Graha): string => PLANET[g].name;

/**
 * Saturn's ring is near-black; Rahu's is mid-smoke. On a 12px stroke at arm's length
 * they are the same grey. Motion is what separates them: Saturn's stars drift WITH the
 * fill, Rahu's haze drifts AGAINST it. Planet identity never rests on hue alone —
 * always hue + name + motion.
 */
export const PLANET_MOTION = {
  saturnStarCount: 12, // cap at 14 or the ring reads as noise
  saturnStarLoopMs: 12_000,
  rahuHazeLoopMs: 9_000, // reversed direction
} as const;

// ---------------------------------------------------------------------------
// Wheel geometry
// ---------------------------------------------------------------------------

export interface RingSpec {
  /** 1 = King … 5 = Messenger. */
  level: 1 | 2 | 3 | 4 | 5;
  diameter: number;
  stroke: number;
}

/**
 * Timeline wheel: 290pt well, ~108pt centre hole for the readout.
 * Outermost = fastest (Messenger), so the outer edge is what visibly moves.
 * Rounded caps on both ends of every arc; that's what sells the Activity-Ring look.
 */
export const WHEEL_TIMELINE: readonly RingSpec[] = [
  { level: 5, diameter: 268, stroke: 14 }, // Messenger
  { level: 4, diameter: 230, stroke: 13 }, // Magistrate
  { level: 3, diameter: 194, stroke: 12 }, // Governor
  { level: 2, diameter: 160, stroke: 11 }, // Prime Minister
  { level: 1, diameter: 128, stroke: 10 }, // King
] as const;

/** Plan detail wheel: 240pt well, tighter centre. */
export const WHEEL_PLAN: readonly RingSpec[] = [
  { level: 5, diameter: 218, stroke: 13 },
  { level: 4, diameter: 182, stroke: 12 },
  { level: 3, diameter: 148, stroke: 11 },
  { level: 2, diameter: 116, stroke: 10 },
  { level: 1, diameter: 86, stroke: 9 },
] as const;

export const WHEEL = {
  wellTimeline: 290,
  wellPlan: 240,
  /** 12 o'clock. Every arc starts here so the glyph ticks line up. */
  startAngleDeg: -90,
  glowOpacity: 0.5,
  glowBlur: 12,
  /**
   * Adjacent rings sharing a planet blur into one fat band. Insert a small
   * background gap and drop the outer ring to 85%.
   */
  sameLordGap: 2,
  sameLordOuterOpacity: 0.85,
  /**
   * Hit-testing: at 10–14pt strokes with 5pt gaps, exact hit-testing loses about a
   * fifth of taps. Resolve by NEAREST RING-CENTRE DISTANCE instead, within this slop.
   */
  hitSlop: 11,
} as const;

// ---------------------------------------------------------------------------
// Motion
// ---------------------------------------------------------------------------

export const MOTION = {
  /** Ring load. Fires on every view appear, not just first mount. */
  ringLoadMs: 1400,
  /** Stagger outward-in: Messenger first, King last. */
  ringStaggerMs: 90,
  /** Ease-out, no overshoot. A progress ring that bounces past its value reads as a lie. */
  ringEase: 'cubic-bezier(0.33, 1, 0.68, 1)',

  readoutFadeDelayMs: 400,
  readoutRisePx: 14,

  /** Current pipeline stage: ONE breathing halo. Two is a heart-rate monitor. */
  haloBreatheMs: 2200,
  /** Dashed connector below the current stage crawls toward what's next. */
  connectorCrawlMs: 1400,
  chevronCrawlMs: 1200,

  checkDrawMs: 320,
  connectorFillMs: 400,

  /** A Turn is NOT an achievement — it's time passing. No confetti. A colour bleed. */
  turnBleedMs: 900,

  countdownTickMs: 1000,
  /** Recompute the court every 60s while foregrounded, and on foreground. */
  courtRefreshMs: 60_000,
} as const;

export const LAYOUT = {
  gutter: 20,
  /** 393 − 2×20, the iPhone 15/16 Pro canvas this was designed on. */
  cardWidth: 353,
  tabBarHeight: 66,
  tabBarInset: 24,
  courtRowHeight: 78,
} as const;
