// ─────────────────────────────────────────────────────────────────────────────
// Upagrahas (sub-planets) — Ch 4. Five Sun-based upagrahas are pure functions of the
// Sun's longitude; six time-based ones (Kaala…Maandi) rise at the middle/beginning of a
// particular planet's 1/8 part of the day or night. This module gives the Sun-based
// longitudes directly and, for the time-based ones, the part-lord table + the fraction
// of the day/night at which each rises (the caller finds the rising lagna at that time).
// ─────────────────────────────────────────────────────────────────────────────

import type { Graha } from '../types.js';

const mod360 = (n: number): number => ((n % 360) + 360) % 360;

// ── 4.2 Sun-based upagrahas (all malefic) ─────────────────────────────────────
export interface SunUpagrahas { dhuma: number; vyatipaata: number; parivesha: number; indrachaapa: number; upaketu: number }

/** The five Sun-based upagraha longitudes (0..360) from the Sun's longitude. */
export function sunUpagrahas(sunLong: number): SunUpagrahas {
  const dhuma = mod360(sunLong + 133 + 20 / 60);      // Sun + 133°20'
  const vyatipaata = mod360(360 - dhuma);
  const parivesha = mod360(vyatipaata + 180);
  const indrachaapa = mod360(360 - parivesha);
  const upaketu = mod360(indrachaapa + 16 + 40 / 60); // = Sun − 30°
  return { dhuma, vyatipaata, parivesha, indrachaapa, upaketu };
}

// ── 4.3 Time-based upagrahas ──────────────────────────────────────────────────
// Weekday planet order (index 0 = Sunday's Sun … 6 = Saturday's Saturn), matching
// JS getDay(): Sun,Mon,Tue,Wed,Thu,Fri,Sat.
const WEEKDAY_ORDER: Graha[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];

/**
 * The lords of the 8 equal parts of the day (or night). Day starts with the weekday's
 * lord; night starts with the 5th planet from it. A lord-less slot follows Saturn.
 * `weekday`: 0=Sunday … 6=Saturday.
 */
export function partLords(weekday: number, isDay: boolean): (Graha | null)[] {
  const lordIdx = ((weekday % 7) + 7) % 7;
  const startIdx = isDay ? lordIdx : (lordIdx + 4) % 7; // night: 5th from the lord (inclusive)
  const seq: (Graha | null)[] = [];
  for (let i = 0; i < 7; i++) {
    const g = WEEKDAY_ORDER[(startIdx + i) % 7]!;
    seq.push(g);
    if (g === 'saturn') seq.push(null); // lord-less part right after Saturn
  }
  return seq.slice(0, 8);
}

export const UPAGRAHA_PART: Record<string, { lord: Graha; at: 'middle' | 'begin'; like: string }> = {
  kaala:         { lord: 'sun',     at: 'middle', like: 'a malefic like the Sun' },
  mrityu:        { lord: 'mars',    at: 'middle', like: 'a malefic like Mars' },
  arthaprahaara: { lord: 'mercury', at: 'middle', like: 'like Mercury' },
  yamaghantaka:  { lord: 'jupiter', at: 'middle', like: 'like Jupiter' },
  gulika:        { lord: 'saturn',  at: 'middle', like: 'a malefic like Saturn' },
  maandi:        { lord: 'saturn',  at: 'begin',  like: 'a malefic like Saturn' },
};

/**
 * The fraction (0..1) of the day/night period at which a time-based upagraha rises.
 * Multiply by the period length and add to sunrise (day) or sunset (night) to get the
 * moment; the rising lagna at that moment is the upagraha's longitude.
 */
export function upagrahaFraction(weekday: number, isDay: boolean, name: keyof typeof UPAGRAHA_PART | string): number {
  const spec = UPAGRAHA_PART[name];
  if (!spec) throw new RangeError(`Unknown upagraha: ${name}`);
  const parts = partLords(weekday, isDay);
  const idx = parts.indexOf(spec.lord);
  return (idx + (spec.at === 'middle' ? 0.5 : 0)) / 8;
}

export const UPAGRAHA_NOTES: string[] = [
  'The five Sun-based upagrahas (Dhuma, Vyatipaata, Parivesha, Indrachaapa, Upaketu) are all strongly malefic — they spoil the houses they fall in.',
  'The six time-based upagrahas rise at the middle of a planet\'s 1/8 part of the day/night (Maandi at the beginning of Saturn\'s part). Gulika/Maandi behave like Saturn and are the most used.',
];
