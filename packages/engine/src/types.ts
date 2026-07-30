// ─────────────────────────────────────────────────────────────────────────────
// aura engine — core data model (SPEC §7). Astrology stays here; the UI never
// sees these terms. Energies/LifeAreas are the only vocabulary that reaches users.
// ─────────────────────────────────────────────────────────────────────────────

/** The 9 grahas (internal only — never shown to the user). */
export type Graha =
  | 'sun' | 'moon' | 'mars' | 'mercury' | 'jupiter'
  | 'venus' | 'saturn' | 'rahu' | 'ketu';

/** The 9 user-facing energies. 1:1 with grahas. */
export type Energy =
  | 'main'   // Main Character  (Sun)
  | 'feel'   // Big Feelings    (Moon)
  | 'fire'   // Fired Up        (Mars)
  | 'mind'   // Busy Mind       (Mercury)
  | 'grow'   // Green Light     (Jupiter)
  | 'love'   // Soft Spot       (Venus)
  | 'build'  // Heavy Lifting   (Saturn)
  | 'crave'  // Never Enough    (Rahu)
  | 'let';   // Letting Go      (Ketu)

/** The 12 life areas the 12 houses map to (user-facing, plain-language). */
export type LifeArea =
  | 'self' | 'money' | 'communication' | 'home' | 'creativity' | 'health'
  | 'partnership' | 'transformation' | 'luck' | 'career' | 'gains' | 'release';

/** House index is 1..12. Sign index is 0..11 (0 = Aries). */
export type House = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

// ── Birth data & chart ───────────────────────────────────────────────────────

export interface BirthData {
  /** ISO date `YYYY-MM-DD` (local calendar date at birthplace). */
  date: string;
  /** Local clock time `HH:mm` (24h). Absent/unknown → solar chart. */
  time?: string;
  unknownTime: boolean;
  place: string;
  lat: number;
  lng: number;
  /** Minutes east of UTC that were in effect at the birthplace on the birth date
   *  (includes DST). e.g. IST = +330, US EDT = −240. */
  tzOffsetMinutes: number;
}

export interface PlanetPos {
  graha: Graha;
  /** Sidereal ecliptic longitude in degrees [0,360). */
  siderealLong: number;
  /** Sign 0..11 (0 = Aries) derived from siderealLong. */
  sign: number;
  /** Whole-sign house 1..12 relative to the Lagna. */
  house: House;
  /** Nakshatra index 0..26 (Moon-relevant; computed for all for completeness). */
  nakshatra?: number;
  /** Pada 1..4. */
  pada?: number;
  retrograde: boolean;
  combust: boolean;
  /** Dignity scalar ≈ [−1, +1] (D1 rasi dignity). */
  dignity: number;
  /** Navamsa (D9) sign 0..11. */
  navamsa: number;
  /** Same sign in D1 and D9 → very strong. */
  vargottama: boolean;
  /** Composite Shadbala-inspired strength in [0,1] (drives energy loudness). */
  strength: number;
  /** Functional polarity for this Lagna: +1 benefic-leaning, −1 malefic-leaning. */
  polarity: number;
  /** Houses (1..12) this planet aspects via graha drishti. */
  aspects: House[];
}

export type Precision = 'full' | 'solar';

export interface Chart {
  birth: BirthData;
  /** Julian Day (UT) of birth moment. */
  julianDayUT: number;
  /** Ayanamsa (degrees) used to sidereal-ize. */
  ayanamsa: number;
  /**
   * WHICH ayanamsa produced that value. Stored, never assumed: Lahiri, Raman and KP
   * disagree by up to ~1.2°, which against a 13°20' nakshatra is ~9% of a mahadasha —
   * years. If this were a constant, adding a second system would silently move every
   * date every existing user has ever been shown.
   */
  ayanamsaSystem: AyanamsaSystem;
  /**
   * The engine build that produced this chart. Stamped on every persisted computation
   * so a maths fix is auditable: recompute, diff, and notify only the users whose
   * boundaries actually moved (see `boundaryDrift`).
   */
  engineVersion: string;
  lagnaSign: number;      // 0..11
  lagnaLong: number;      // sidereal degrees of the ascendant
  moonNakshatra: number;  // 0..26
  moonPada: number;       // 1..4
  moonSign: number;       // 0..11 (needed for transit refs)
  planets: Record<Graha, PlanetPos>;
  precision: Precision;
}

// ── Dasha (time) ─────────────────────────────────────────────────────────────

export interface DashaNode {
  lord: Graha;
  /** ISO timestamps. */
  start: string;
  end: string;
  level: DashaLevel;
  children?: DashaNode[];
}

export type DashaLevel = 'maha' | 'antar' | 'pratyantar' | 'sookshma' | 'prana';

export interface DashaStack {
  maha: Graha;
  antar: Graha;
  pratyantar: Graha;
  sookshma: Graha;
  prana: Graha;
}

export interface DashaPeriod {
  lord: Graha;
  start: Date;
  end: Date;
  level: DashaLevel;
  /** Exact boundary in integer microseconds since the epoch. `start`/`end` are Dates
   *  and therefore truncate to milliseconds; these do not. Half-open `[startUs, endUs)`. */
  startUs: number;
  endUs: number;
}

/** Which sidereal reference the chart was computed against. Frozen per chart. */
export type AyanamsaSystem = 'lahiri';

/**
 * How well the birth time is known, and therefore how far every boundary in the tree
 * could be wrong. Not a preference — it decides what the app is allowed to state.
 */
export type BirthTimeAccuracy = 'exact' | 'near_minute' | 'within_15m' | 'within_hour' | 'unknown';

// ── Transits ─────────────────────────────────────────────────────────────────

export type SadeSatiPhase = 'rising' | 'peak' | 'setting' | null;

export interface TransitState {
  date: string;
  /** Sidereal longitudes by graha for the day. */
  positions: Record<Graha, number>;
  /** Sign 0..11 by graha. */
  signs: Record<Graha, number>;
  sadeSati: SadeSatiPhase;
  /** Jupiter's house (1..12) counted from the natal Moon sign. */
  jupiterHouseFromMoon: number;
  /** Transiting Moon's sign 0..11 (the ~2.25-day texture). */
  transitMoonSign: number;
  /** Per-graha house (1..12) counted from natal Moon sign. */
  houseFromMoon: Record<Graha, number>;
  /** Per-graha house (1..12) counted from natal Lagna. */
  houseFromLagna: Record<Graha, number>;
}

// ── Lattice / aggregation ────────────────────────────────────────────────────

export interface SignalCell {
  energy: Energy;
  house: House;
  /** Static natal contribution. */
  static: number;
  /** Live (temporally modulated) value. */
  live: number;
}

export interface Checkin {
  mood?: string;
  focus?: LifeArea;
}

export interface ReadingInput {
  majorEnergy: Energy;
  passingEnergy: Energy;
  energyScore: Record<Energy, number>;
  /** 12 entries, index 0 = house 1. */
  houseScore: number[];
  dominantAreas: LifeArea[];
  stack: DashaStack;
  transit: TransitState;
  checkin?: Checkin;
  precision: Precision;
  /** For synthesis: the user's stated goal area from onboarding. */
  goalArea?: LifeArea;
}

// ── Synthesis output ─────────────────────────────────────────────────────────

export interface Reading {
  headline: string;
  gift: string;
  trap: string;
  move: string;
  watch: string;
  remedy: string;
  blendNote?: string;
  startDate?: string;
  endDate?: string;
  energy: Energy;
  passingEnergy?: Energy;
}

export interface ForecastPeriod {
  energy: Energy;
  start: string;
  end: string;
  gloss: string;
  isNow: boolean;
  level: DashaLevel;
}

// ── Config ───────────────────────────────────────────────────────────────────

export interface EngineConfig {
  nodeType: 'true' | 'mean';
  yearLengthDays: number;
  /** Lattice knobs (SPEC §5.2). */
  alpha: number;
  beta: number;
  gamma: number;
  /** Static-cell influence weights (SPEC §5.1). */
  wOccupy: number;
  wLordship: number;
  wAspect: number;
  /** Dasha level multipliers m1..m5 (SPEC §5.2). */
  dashaMultipliers: [number, number, number, number, number];
  /** Transit weights. */
  transitWeight: number;
  sadeSatiWeight: number;
}

export const DEFAULT_CONFIG: EngineConfig = {
  nodeType: 'true',
  yearLengthDays: 365.25,
  alpha: 1.5,
  beta: 0.8,
  gamma: 0.3,
  wOccupy: 1.0,
  wLordship: 0.7,
  wAspect: 0.4,
  dashaMultipliers: [1.0, 0.6, 0.35, 0.2, 0.1],
  transitWeight: 1.0,
  sadeSatiWeight: 0.6,
};
