// Plan persistence. Local-first and per-identity, same slotting rule as the profile: a
// signed-in account reads its own plans, a device-only session reads the device's.
//
// Only the plan's inputs are stored. Stages are always recomputed (see core/plan.ts).

import type { Plan } from '../core/plan';

const BASE = 'vim.plans';
let slot: string | null = null;

export function setPlansIdentity(userId: number | null): void {
  slot = userId == null ? null : String(userId);
}

const key = (): string => (slot ? `${BASE}.u${slot}` : BASE);

export function loadPlans(): Plan[] {
  try {
    const raw = localStorage.getItem(key());
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Plan[];
    if (!Array.isArray(parsed)) return [];
    // A plan without a horizon can't be cut into stages, so it isn't a plan.
    return parsed.filter((p) => p?.id && p.horizonEnd && p.createdAt);
  } catch {
    return [];
  }
}

export function savePlans(plans: Plan[]): void {
  try { localStorage.setItem(key(), JSON.stringify(plans)); } catch { /* storage full */ }
}

export function clearPlans(): void {
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(BASE)) localStorage.removeItem(k);
    }
  } catch { /* ignore */ }
}
