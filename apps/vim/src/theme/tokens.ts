// Product semantics, on top of the generated design tokens.
//
// The seam matters: `@vim/tokens` owns every DESIGN value (colour, shadow, radius, type,
// ring geometry, breakpoints) and generates CSS + TS + Dart from one JSON. This file owns
// PRODUCT meaning — what an office is, which planet holds which keyword, what the motion
// contract is called. A designer changing Venus pink edits tokens.json; an engineer changing
// what "Governor" means edits here.

import { layout, motion, planet, wheel } from '@vim/tokens';
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
    rules: 'Reigns for several years — typically 6 to 20.',
  },
  {
    office: 'primeMinister', level: 2, dashaLevel: 'antar',
    label: 'Prime Minister', sanskrit: 'Antardaśā',
    rules: 'Serves for months up to a few years — usually 1 to 3.',
  },
  {
    office: 'governor', level: 3, dashaLevel: 'pratyantar',
    label: 'Governor', sanskrit: 'Pratyantardaśā',
    rules: 'Holds office for weeks to a few months.',
  },
  {
    office: 'magistrate', level: 4, dashaLevel: 'sookshma',
    label: 'Magistrate', sanskrit: 'Sūkṣma daśā',
    rules: 'Sits for days to a few weeks.',
  },
  {
    office: 'messenger', level: 5, dashaLevel: 'prana',
    label: 'Messenger', sanskrit: 'Prāṇa daśā',
    rules: 'Arrives for hours to a few days.',
  },
] as const;

export const officeByLevel = (level: number): OfficeMeta =>
  OFFICES[level - 1] ?? OFFICES[0]!;

// ---------------------------------------------------------------------------
// Planets
// ---------------------------------------------------------------------------

export interface PlanetPalette {
  ring: string;
  tabFill: string;
  tabFillActive: string;
  tabInk: string;
  /** Forced outline where the ring colour cannot carry an edge (Saturn, Moon, Jupiter). */
  rim: string | null;
  /** Non-colour identity channel #1. Drawn as a tick at each ring's 12 o'clock start. */
  glyph: string;
  /** Non-colour identity channel #2. An SVG pattern id — see Wheel's <defs>. */
  texture: string;
  name: string;
  /** One word for what this ruler does. Reused in the court table and notifications. */
  keyword: string;
}

/**
 * Straight from the generated tokens, so the nine planet colours exist in exactly one place
 * and reach Dart and CSS from the same edit.
 *
 * M9: roughly 8% of male users cannot reliably separate Mars red from Mercury green, and
 * Saturn (#1A1A20) against Rāhu (#6B6F76) is two greys at a 22px stroke. Hence `glyph` and
 * `texture` — identity never rests on hue alone.
 */
export const PLANET = planet as Record<Graha, PlanetPalette>;

export const planetName = (g: Graha): string => PLANET[g].name;

// ---------------------------------------------------------------------------
// Wheel geometry — §4.2, derived from the generated tokens
// ---------------------------------------------------------------------------

export interface RingSpec {
  /** 1 = King … 5 = Messenger. */
  level: 1 | 2 | 3 | 4 | 5;
  /** Radius of the stroke's centre line, in canvas units. */
  radius: number;
  stroke: number;
}

export const WHEEL_CANVAS = wheel.canvas;

/**
 * A 360-unit canvas with a uniform 22 stroke, radii stepping by 28.
 *
 * Outermost = fastest (Messenger). The outer ring has the most arc-length per pixel, so the
 * thing that visibly moves gets the most room to move in. A uniform stroke — rather than the
 * earlier 14→10 taper — means 22 + 11 slop clears 44pt on every ring, so all five are
 * genuinely tappable instead of three of them being aspirational.
 */
export const WHEEL_TIMELINE: readonly RingSpec[] = [
  { level: 5, radius: wheel.radiusL5, stroke: wheel.stroke },
  { level: 4, radius: wheel.radiusL4, stroke: wheel.stroke },
  { level: 3, radius: wheel.radiusL3, stroke: wheel.stroke },
  { level: 2, radius: wheel.radiusL2, stroke: wheel.stroke },
  { level: 1, radius: wheel.radiusL1, stroke: wheel.stroke },
] as const;

/** The plan wheel is the same geometry rendered smaller, never a second design. */
export const WHEEL_PLAN = WHEEL_TIMELINE;

export const WHEEL = {
  canvas: wheel.canvas,
  stroke: wheel.stroke,
  startAngleDeg: wheel.startAngleDeg,
  /** The unfilled arc is the ring colour at 12%, so an empty ring still says which it is. */
  trackOpacity: wheel.trackOpacity,
  glowOpacity: wheel.glowOpacity,
  /** Nearest-ring-centre hit-testing slop. Exact annulus testing loses about a fifth of taps. */
  hitSlop: wheel.hitSlop,
  /** Adjacent rings sharing a planet blur into one band without this. */
  sameLordGap: wheel.sameLordGap,
  sameLordOuterOpacity: wheel.sameLordOuterOpacity,
  /** Past this, a ring gets a settle so "almost done" is felt rather than merely shown. */
  overshootThreshold: wheel.overshootThreshold,
} as const;

// ---------------------------------------------------------------------------
// Motion
// ---------------------------------------------------------------------------

export const MOTION = {
  /** Rings sweep 0 → current on every appear, staggered outward-in. Under 1.3s total. */
  ringSweepMs: motion.ringSweepMs,
  ringStaggerMs: motion.ringStaggerMs,
  ringEase: motion.ringEase,
  haloBreatheMs: motion.haloBreatheMs,
  connectorCrawlMs: motion.connectorCrawlMs,
  /** A Turn is not an achievement — it's time passing. A colour bleed, never confetti. */
  turnBleedMs: motion.turnBleedMs,
  countdownTickMs: 1000,
  /** Recompute the tree on the minute; never walk five levels at 1Hz. */
  courtRefreshMs: 60_000,
} as const;

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

/**
 * Breakpoints. Duplicated as literals inside app.css because CSS custom properties cannot
 * be used in a media query — the two must be changed together, and tokens.json is the note
 * that says so.
 */
export const BREAKPOINT = {
  tablet: layout.bpTablet,
  laptop: layout.bpLaptop,
  desktop: layout.bpDesktop,
  wide: layout.bpWide,
} as const;

export const LAYOUT = layout;

/**
 * Bottom nav is THREE items — Planner, Timeline, Mentor. Account lives behind the avatar.
 * A fourth tab dilutes the Mentor, which is the retention driver, and nobody navigates to
 * settings by thumb.
 */
export const NAV_TABS = ['planner', 'timeline', 'mentor'] as const;
