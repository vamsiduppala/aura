import { ENERGY_META, type Energy } from '@aura/engine';
import type { CSSProperties } from 'react';

export const energyColor = (e: Energy): string => ENERGY_META[e].color;
export const energyLabel = (e: Energy): string => ENERGY_META[e].label;
export const energyGloss = (e: Energy): string => ENERGY_META[e].gloss;

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
