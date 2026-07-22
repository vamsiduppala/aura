import { ENERGY_META, ENERGY_TO_GRAHA, type Energy, type Graha } from '@aura/engine';
import type { CSSProperties } from 'react';

export const energyColor = (e: Energy): string => ENERGY_META[e].color;
export const energyLabel = (e: Energy): string => ENERGY_META[e].label;
export const energyGloss = (e: Energy): string => ENERGY_META[e].gloss;

// ── Planet (graha) name + colour layer ───────────────────────────────────────
// The surface stays in the 9 energies, but the user asked to show the classical
// planet name + its own colour alongside each energy (Saturn navy, Ketu sky-blue,
// Mars red, Sun orange, Jupiter yellow, Mercury green, Moon white, Venus pink,
// Rahu grey). Colours are tuned to stay legible on the dark UI.
export const GRAHA_LABEL: Record<Graha, string> = {
  sun: 'Sun', moon: 'Moon', mars: 'Mars', mercury: 'Mercury', jupiter: 'Jupiter',
  venus: 'Venus', saturn: 'Saturn', rahu: 'Rahu', ketu: 'Ketu',
};
export const GRAHA_COLOR: Record<Graha, string> = {
  sun: '#FF9A3D',     // orange
  moon: '#EAF0FA',    // white
  mars: '#F2544B',    // red
  mercury: '#3ECF8E', // green
  jupiter: '#F2C94C', // yellow
  venus: '#F7A8C4',   // baby pink
  saturn: '#5A6AD8',  // navy blue (lightened so it reads on dark)
  rahu: '#A0A6B4',    // grey
  ketu: '#6FC9F2',    // sky blue
};
export const grahaOfEnergy = (e: Energy): Graha => ENERGY_TO_GRAHA[e];
export const grahaLabel = (g: Graha): string => GRAHA_LABEL[g];
export const grahaColor = (g: Graha): string => GRAHA_COLOR[g];

/** CSS custom properties for the aura orb (typed escape hatch). */
export function orbVars(e1: string, e2: string, size?: number): CSSProperties {
  return { ['--e1' as never]: e1, ['--e2' as never]: e2, ...(size ? { width: size, height: size } : {}) } as CSSProperties;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "18 Jul 2026" */
export function fmtFull(iso: string | Date): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
/** "18 Jul" */
export function fmtShort(iso: string | Date): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}
/** "Mar 2019" */
export function fmtMonthYear(iso: string | Date): string {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
/** "Mon 20" */
export function fmtDow(d: Date): string {
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()];
  return `${dow} ${d.getUTCDate()}`;
}
export function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}
