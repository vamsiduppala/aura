// ─────────────────────────────────────────────────────────────────────────────
// Panchanga — Ch 1 (§1.3.7–1.3.12). The five "limbs" of a day: tithi (lunar day),
// vaara (weekday), nakshatra (Moon's — see nakshatras.ts), nitya-yoga (Sun+Moon), and
// karana (half-tithi). Plus hora (planetary hour). All computed from Sun/Moon longitudes.
// Verified against the book's worked examples (nitya-yoga Ganda; hora Wed-16th → Moon).
// ─────────────────────────────────────────────────────────────────────────────

import type { Graha } from '../types.js';

const mod360 = (n: number): number => ((n % 360) + 360) % 360;

// ── Tithi (lunar day) ─────────────────────────────────────────────────────────
export interface Tithi { index: number; paksha: 'shukla' | 'krishna'; day: number; name: string }

const TITHI_DAY = ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi',
  'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi'];

/** Tithi = the Moon–Sun elongation in 12° steps (1..30). 1–15 Shukla (bright), 16–30 Krishna (dark). */
export function tithiOf(sunLong: number, moonLong: number): Tithi {
  const index = Math.floor(mod360(moonLong - sunLong) / 12) + 1; // 1..30
  const shukla = index <= 15;
  const day = ((index - 1) % 15) + 1; // 1..15
  const name = index === 15 ? 'Purnima' : index === 30 ? 'Amavasya' : `${shukla ? 'Shukla' : 'Krishna'} ${TITHI_DAY[day - 1]}`;
  return { index, paksha: shukla ? 'shukla' : 'krishna', day, name };
}

// ── Nitya-yoga (Sun + Moon) ───────────────────────────────────────────────────
export const NITYA_YOGAS = [
  'Vishkambha', 'Preeti', 'Aayushmaan', 'Saubhaagya', 'Sobhana', 'Atiganda', 'Sukarman',
  'Dhriti', 'Shoola', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaaghaata', 'Harshana', 'Vajra',
  'Siddhi', 'Vyatipaata', 'Variyan', 'Parigha', 'Shiva', 'Siddha', 'Saadhya', 'Subha',
  'Sukla', 'Brahma', 'Indra', 'Vaidhriti',
] as const;

/** Nitya-yoga = (Sun + Moon) in nakshatra-sized (13°20') steps → one of 27 yogas. */
export function nityaYoga(sunLong: number, moonLong: number): { index: number; name: string } {
  const index = Math.floor(mod360(sunLong + moonLong) / (360 / 27)); // 0..26
  return { index: index + 1, name: NITYA_YOGAS[index]! };
}

// ── Karana (half-tithi) ───────────────────────────────────────────────────────
const MOVABLE_KARANAS = ['Bava', 'Balava', 'Kaulava', 'Taitula', 'Garija', 'Vanija', 'Vishti'];

/**
 * Karana = the Moon–Sun elongation in 6° steps (60 per lunar month). The 7 movable
 * karanas repeat 8× (slots 1..56); the fixed ones bookend the month: slot 0 Kimstughna,
 * 57 Sakuna, 58 Chatushpada, 59 Naga.
 */
export function karanaOf(sunLong: number, moonLong: number): { index: number; name: string } {
  const n = Math.floor(mod360(moonLong - sunLong) / 6); // 0..59
  let name: string;
  if (n === 0) name = 'Kimstughna';
  else if (n <= 56) name = MOVABLE_KARANAS[(n - 1) % 7]!;
  else name = ['Sakuna', 'Chatushpada', 'Naga'][n - 57]!;
  return { index: n, name };
}

// ── Vaara (weekday) + Hora (planetary hour) ───────────────────────────────────
/** Weekday lord: 0=Sunday→Sun … 6=Saturday→Saturn. */
export const WEEKDAY_LORD: Graha[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];

/** Hora lords in decreasing planetary speed (Chaldean order). */
const HORA_ORDER: Graha[] = ['saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon'];

/** The lord of the `hora`-th planetary hour since sunrise (hora 1 = the weekday's lord). */
export function horaLord(weekday: number, hora: number): Graha {
  const start = HORA_ORDER.indexOf(WEEKDAY_LORD[((weekday % 7) + 7) % 7]!);
  return HORA_ORDER[(start + (hora - 1)) % 7]!;
}

export interface Panchanga { tithi: Tithi; nityaYoga: { index: number; name: string }; karana: { index: number; name: string } }

/** The three Sun/Moon-derived limbs at once (nakshatra + vaara depend on other inputs). */
export function panchanga(sunLong: number, moonLong: number): Panchanga {
  return { tithi: tithiOf(sunLong, moonLong), nityaYoga: nityaYoga(sunLong, moonLong), karana: karanaOf(sunLong, moonLong) };
}
