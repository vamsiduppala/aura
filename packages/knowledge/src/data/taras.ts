// ─────────────────────────────────────────────────────────────────────────────
// Transit taras & special nakshatras — Ch 26. All counted from the janma (natal Moon)
// nakshatra. Taras (9-fold star strength, Table 64), the special nakshatras (karma,
// jaati…), and nakshatra-based aspects (26.5). Verified against the book's Bill Gates
// example (Krittika = Pratyak, Mrigasira = Naidhana from Uttarabhadrapada).
// ─────────────────────────────────────────────────────────────────────────────

import type { Graha } from '../types.js';

const mod27 = (n: number): number => ((n % 27) + 27) % 27;

export interface Tara { name: string; meaning: string; good: boolean }

/** The nine taras, in order (index 0 = Janma). */
export const TARAS: Tara[] = [
  { name: 'Janma', meaning: 'birth', good: false },        // mixed
  { name: 'Sampat', meaning: 'wealth', good: true },
  { name: 'Vipat', meaning: 'danger', good: false },
  { name: 'Kshema', meaning: 'well-being', good: true },
  { name: 'Pratyak', meaning: 'obstacles', good: false },
  { name: 'Saadhana', meaning: 'achievement', good: true },
  { name: 'Naidhana', meaning: 'death/loss', good: false }, // aka Vadha
  { name: 'Mitra', meaning: 'friend', good: true },
  { name: 'Parama Mitra', meaning: 'best friend', good: true },
];

export interface TaraResult { count: number; index: number; name: string; meaning: string; good: boolean }

/** The tara of a transit nakshatra relative to the janma (natal Moon) nakshatra (both 0..26). */
export function taraOf(janmaNak: number, transitNak: number): TaraResult {
  const count = mod27(transitNak - janmaNak) + 1; // 1..27
  const idx = (count - 1) % 9;                     // 0..8
  return { count, index: idx + 1, name: TARAS[idx]!.name, meaning: TARAS[idx]!.meaning, good: TARAS[idx]!.good };
}

/** Special nakshatras (26.4.2): the Nth nakshatra from janma, each governing a life area. */
export const SPECIAL_NAKSHATRAS: Record<string, { nth: number; shows: string }> = {
  janma: { nth: 1, shows: 'general well-being' },
  jaati: { nth: 4, shows: 'community' },
  naidhana: { nth: 7, shows: 'death and suffering' },
  karma: { nth: 10, shows: 'profession and workplace' },
  desa: { nth: 12, shows: 'country' },
  abhisheka: { nth: 13, shows: 'power and authority' }, // aka Raajya
  sanghaatika: { nth: 16, shows: 'group/social activity' },
  saamudaayika: { nth: 18, shows: 'crowd/group activity' },
  aadhaana: { nth: 19, shows: 'well-being of family' },
  vainaasika: { nth: 22, shows: 'destruction' },
  maanasa: { nth: 25, shows: 'mental state' },
};

/** The nakshatra index (0..26) of a named special nakshatra for a given janma nakshatra. */
export function specialNakshatra(janmaNak: number, which: keyof typeof SPECIAL_NAKSHATRAS): number {
  return mod27(janmaNak + SPECIAL_NAKSHATRAS[which]!.nth - 1);
}

/** Nakshatra-based aspects (26.5): the Nth nakshatras each planet aspects from its own. */
export const NAKSHATRA_ASPECTS: Record<Graha, number[]> = {
  sun: [14, 15], moon: [14, 15],
  mars: [1, 3, 7, 8, 15],
  mercury: [1, 15], venus: [1, 15],
  jupiter: [10, 15, 19],
  saturn: [3, 5, 15, 19],
  rahu: [], ketu: [], // nodes not assigned nakshatra aspects here
};

/** The nakshatra indices (0..26) a planet aspects while transiting `nak`. */
export function nakshatraAspectsFrom(graha: Graha, nak: number): number[] {
  return NAKSHATRA_ASPECTS[graha].map((n) => mod27(nak + n - 1));
}

// ── Latta / the transit "kick" (26.7) ─────────────────────────────────────────
// Each planet kicks a nakshatra a fixed count from its transit position — forward
// (purolatta) for Sun/Mars/Jupiter/Saturn, backward (prishtha) for Moon/Mercury/Venus/Rahu.
// Offsets are the 0-based step (inclusive Nth nakshatra − 1); Ketu has no latta.
export const LATTA_OFFSET: Partial<Record<Graha, number>> = {
  sun: 11, mars: 2, jupiter: 5, saturn: 7,        // purolatta (forward): 12th/3rd/6th/8th
  moon: -21, mercury: -6, venus: -4, rahu: -8,    // prishtha (backward): 22nd/7th/5th/9th
};

/** The nakshatra (0..26) a planet's latta lands on while transiting `transitNak`; null if none (Ketu). */
export function lattaNakshatra(graha: Graha, transitNak: number): number | null {
  const off = LATTA_OFFSET[graha];
  return off == null ? null : mod27(transitNak + off);
}

// ── Murthis / the "form" of a transiting planet (26.2) ────────────────────────
// When a planet enters a rasi, the house of the transit Moon (from the natal Moon) at that
// moment gives the planet a golden/silver/copper/iron form for that transit (Table 62).
export interface Murthi { name: string; metal: string; result: string; favorable: boolean }

const MURTHIS: Record<string, Murthi> = {
  swarna: { name: 'Swarna', metal: 'gold', result: 'highly favourable', favorable: true },
  rajata: { name: 'Rajata', metal: 'silver', result: 'favourable', favorable: true },
  taamra: { name: 'Taamra', metal: 'copper', result: 'unfavourable', favorable: false },
  loha: { name: 'Loha', metal: 'iron', result: 'highly unfavourable', favorable: false },
};
/** House (1..12, transit Moon from natal Moon) → murthi key. */
const MURTHI_BY_HOUSE = ['', 'swarna', 'rajata', 'taamra', 'loha', 'rajata', 'swarna', 'taamra', 'loha', 'rajata', 'taamra', 'swarna', 'loha'];

/** The murthi (form) of a transiting planet from the transit-Moon's house (1..12) off the natal Moon. */
export function murthiOf(houseFromMoon: number): Murthi {
  const h = ((houseFromMoon - 1) % 12 + 12) % 12 + 1;
  return MURTHIS[MURTHI_BY_HOUSE[h]!]!;
}
