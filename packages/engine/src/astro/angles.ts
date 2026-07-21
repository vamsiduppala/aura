// Small, dependency-free angle helpers. Degrees unless noted.

export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;

/** Normalize to [0, 360). */
export function norm360(x: number): number {
  const r = x % 360;
  return r < 0 ? r + 360 : r;
}

/** Normalize to [-180, 180). */
export function norm180(x: number): number {
  return norm360(x + 180) - 180;
}

/** Sign index 0..11 (0 = Aries) for an ecliptic longitude. */
export function signOf(long: number): number {
  return Math.floor(norm360(long) / 30);
}

/** Degrees within the current sign [0,30). */
export function degInSign(long: number): number {
  return norm360(long) % 30;
}

export function sinDeg(d: number): number { return Math.sin(d * DEG); }
export function cosDeg(d: number): number { return Math.cos(d * DEG); }
export function tanDeg(d: number): number { return Math.tan(d * DEG); }

/** Whole-sign house 1..12 of `sign` counted from `refSign` (both 0..11). */
export function houseFrom(sign: number, refSign: number): number {
  return (((sign - refSign) % 12) + 12) % 12 + 1;
}
