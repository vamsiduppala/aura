// ─────────────────────────────────────────────────────────────────────────────
// Divisional charts (vargas) — reliability boost for the strength model (SPEC v2).
// The Navamsa (D9) is the most important divisional in Parashari Jyotish: a planet's
// real dignity is judged in BOTH the rasi (D1) and the navamsa (D9). A planet in the
// same sign in D1 and D9 is "vargottama" (very strong).
//
// D9 has a clean continuous form: the 360° circle splits into 108 navamsas of 3°20′
// each; the navamsa sign = floor(longitude / 3°20′) mod 12. This automatically yields
// the movable/fixed/dual start rule (movable→same sign, fixed→9th, dual→5th).
// ─────────────────────────────────────────────────────────────────────────────

import { norm360 } from '../astro/angles.js';

const NAVAMSA_ARC = 360 / 108; // 3°20′

/** Navamsa (D9) sign 0..11 for a sidereal longitude. */
export function navamsaSign(long: number): number {
  return Math.floor(norm360(long) / NAVAMSA_ARC) % 12;
}

/** Rasi (D1) sign 0..11. */
export function rasiSign(long: number): number {
  return Math.floor(norm360(long) / 30) % 12;
}

/** Vargottama: same sign in D1 and D9 (a strong, self-reinforcing placement). */
export function isVargottama(long: number): boolean {
  return rasiSign(long) === navamsaSign(long);
}

/**
 * Dasamsa (D10) sign — the career/karma divisional. Parashari rule: from odd signs
 * count the 10 parts from the same sign; from even signs, from the 9th sign.
 */
export function dasamsaSign(long: number): number {
  const l = norm360(long);
  const sign = Math.floor(l / 30) % 12;
  const part = Math.floor((l % 30) / 3); // 0..9
  const startsFrom = sign % 2 === 0 ? sign : (sign + 8) % 12; // odd sign(0-idx even)→same; even sign(0-idx odd)→9th
  return (startsFrom + part) % 12;
}
