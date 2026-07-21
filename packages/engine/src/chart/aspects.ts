// Graha drishti (SPEC §4.3). A planet in house H aspects H + offset, where the
// drishti offsets count houses ahead (7th = +6). Returns the aspected houses 1..12.

import { SPECIAL_ASPECT_OFFSETS } from '../constants.js';
import { houseFrom } from '../astro/angles.js';
import type { Graha, House } from '../types.js';

/** Houses (1..12) aspected by `graha` sitting in `sign`, relative to `lagnaSign`. */
export function aspectedHouses(graha: Graha, sign: number, lagnaSign: number): House[] {
  const own = houseFrom(sign, lagnaSign); // 1..12
  const offsets = SPECIAL_ASPECT_OFFSETS[graha];
  return offsets.map((o) => (((own - 1 + o) % 12) + 12) % 12 + 1 as House);
}
