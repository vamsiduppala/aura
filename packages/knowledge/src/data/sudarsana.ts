// ─────────────────────────────────────────────────────────────────────────────
// Sudarsana Chakra Dasa — Ch 31. A natal dasa where each house's dasa runs one solar year,
// cycling every 12 years, judged from all three references (lagna / Moon / Sun). Antardasas
// give one month to each of the 12 houses from the dasa sign. Verified vs the book's
// 45th-year (9th house) and Example 126 (18th year → 6th → Scorpio).
// ─────────────────────────────────────────────────────────────────────────────

const mod12 = (n: number): number => ((n % 12) + 12) % 12;

export interface SudarsanaDasa { house: number; dasaSign: number; antardashas: { sign: number; months: number }[] }

/**
 * The Sudarsana Chakra dasa for the `yearNumber`-th year of life, measured from a reference
 * sign (lagna, Moon or Sun). House = ((year−1) mod 12)+1; dasa sign = that house from the
 * reference; the 12 antardasas take one house each (one month) zodiacally from the dasa sign.
 */
export function sudarsanaDasa(refSign: number, yearNumber: number): SudarsanaDasa {
  const house = ((yearNumber - 1) % 12 + 12) % 12 + 1; // 1..12
  const dasaSign = mod12(refSign + house - 1);
  return {
    house,
    dasaSign,
    antardashas: Array.from({ length: 12 }, (_, k) => ({ sign: mod12(dasaSign + k), months: 1 })),
  };
}

export interface SudarsanaAllRefs {
  house: number;
  lagna: number;   // dasa sign from lagna
  moon: number;    // dasa sign from Moon
  sun: number;     // dasa sign from Sun
}

/** The dasa sign for the year from all three references at once (the full Sudarsana Chakra). */
export function sudarsanaAllRefs(lagnaSign: number, moonSign: number, sunSign: number, yearNumber: number): SudarsanaAllRefs {
  const house = ((yearNumber - 1) % 12 + 12) % 12 + 1;
  return {
    house,
    lagna: mod12(lagnaSign + house - 1),
    moon: mod12(moonSign + house - 1),
    sun: mod12(sunSign + house - 1),
  };
}
