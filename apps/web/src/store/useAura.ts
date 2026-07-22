// Central app state (enterprise architecture, SPEC §10 Zustand). Owns navigation +
// profile + session state and the derived chart/daily bundle, computed inside actions
// (no render-time side effects). The UI subscribes; screens stay presentational.

import { create } from 'zustand';
import {
  Aura, AstronomiaEphemeris, detectCrisis,
  type BirthData, type Chart, type Checkin, type DailyBundle, type LifeArea,
} from '@aura/engine';
import type { Screen } from '../components/Chrome';
import { loadProfile, saveProfile, loadReads, bumpReads, clearAll, type ReadsState } from '../services/storage';

const engine = new Aura(new AstronomiaEphemeris());

interface Derived { chart: Chart | null; daily: DailyBundle | null; error: string | null }

function compute(birth: BirthData | null, goalArea: LifeArea, checkin: Checkin | undefined, now: Date): Derived {
  if (!birth) return { chart: null, daily: null, error: null };
  try {
    const chart = engine.chart(birth);
    const daily = engine.daily(chart, now, { goalArea, ...(checkin ? { checkin } : {}) });
    return { chart, daily, error: null };
  } catch (e) {
    return { chart: null, daily: null, error: String(e) };
  }
}

export interface AuraState {
  aura: Aura;
  now: Date;
  screen: Screen;
  birth: BirthData | null;
  goalArea: LifeArea;
  goalName: string;
  checkin?: Checkin;
  reads: ReadsState;
  chart: Chart | null;
  daily: DailyBundle | null;
  error: string | null;
  // actions
  go: (screen: Screen) => void;
  onboard: (birth: BirthData, goalArea: LifeArea, goalName: string) => void;
  setCheckin: (checkin: Checkin | undefined) => void;
  openReading: () => void;
  deleteAll: () => void;
  /** Re-initialise from storage (used to reset between tests). */
  reset: () => void;
}

export const useAura = create<AuraState>((set, get) => {
  const saved = loadProfile();
  const now = new Date();
  const goalArea = saved?.goalArea ?? 'career';
  const initial = compute(saved?.birth ?? null, goalArea, undefined, now);

  return {
    aura: engine,
    now,
    screen: saved ? 'today' : 'onboarding',
    birth: saved?.birth ?? null,
    goalArea,
    goalName: saved?.goalName ?? 'my goal',
    checkin: undefined,
    reads: loadReads(),
    ...initial,

    go: (screen) => set({ screen }),

    onboard: (birth, area, name) => {
      // Never "read" a crisis (SPEC §11.3).
      if (detectCrisis(name)) { set({ screen: 'support' }); return; }
      saveProfile({ birth, goalArea: area, goalName: name });
      const d = compute(birth, area, undefined, get().now);
      set({ birth, goalArea: area, goalName: name, checkin: undefined, ...d, screen: 'audit' });
    },

    setCheckin: (checkin) => {
      const { birth, goalArea: area, now: n } = get();
      set({ checkin, ...compute(birth, area, checkin, n) });
    },

    openReading: () => set((s) => ({ reads: bumpReads(s.reads), screen: 'reading' })),

    deleteAll: () => {
      clearAll();
      set({ birth: null, chart: null, daily: null, checkin: undefined, error: null, reads: { count: 0, lastDay: '' }, screen: 'onboarding' });
    },

    reset: () => {
      const p = loadProfile();
      const area = p?.goalArea ?? 'career';
      set({
        screen: p ? 'today' : 'onboarding',
        birth: p?.birth ?? null, goalArea: area, goalName: p?.goalName ?? 'my goal',
        checkin: undefined, reads: loadReads(), ...compute(p?.birth ?? null, area, undefined, get().now),
      });
    },
  };
});
