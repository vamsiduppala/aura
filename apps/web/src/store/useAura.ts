// Central app state (enterprise architecture, SPEC §10 Zustand). Owns navigation +
// auth + profile + session state and the derived chart/daily bundle, computed inside
// actions. Auth/profile persist to the local API (apps/api); a guest mode keeps the app
// working on-device (localStorage) when the API isn't running.

import { create } from 'zustand';
import {
  Aura, AstronomiaEphemeris, detectCrisis,
  type BirthData, type Chart, type Checkin, type DailyBundle, type LifeArea,
} from '@aura/engine';
import type { Screen } from '../components/Chrome';
import { loadProfile, saveProfile, loadReads, bumpReads, clearAll, type ReadsState } from '../services/storage';
import {
  me, login as apiLogin, register as apiRegister, logout as apiLogout,
  saveProfile as apiSaveProfile, getToken, type AuthUser,
} from '../services/api';

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

export type AuthStatus = 'loading' | 'anon' | 'authed' | 'guest';

export interface AuraState {
  aura: Aura;
  now: Date;
  authStatus: AuthStatus;
  user: AuthUser | null;
  authError: string | null;
  authBusy: boolean;
  editing: boolean;
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
  initAuth: () => Promise<void>;
  doLogin: (email: string, password: string) => Promise<void>;
  doRegister: (email: string, password: string) => Promise<void>;
  continueAsGuest: () => void;
  showLogin: () => void;
  logout: () => void;
  startEdit: () => void;
  cancelEdit: () => void;
  onboard: (birth: BirthData, goalArea: LifeArea, goalName: string) => void;
  setCheckin: (checkin: Checkin | undefined) => void;
  openReading: () => void;
  deleteAll: () => void;
  reset: () => void;
}

/** Apply a loaded profile (from server or local) to the derived state. */
function applyProfile(get: () => AuraState, p: { birth: BirthData; goalArea: LifeArea; goalName: string }) {
  const d = compute(p.birth, p.goalArea, undefined, get().now);
  return { birth: p.birth, goalArea: p.goalArea, goalName: p.goalName, checkin: undefined, ...d };
}

export const useAura = create<AuraState>((set, get) => {
  const saved = loadProfile();
  const now = new Date();
  const goalArea = saved?.goalArea ?? 'career';
  const initial = compute(saved?.birth ?? null, goalArea, undefined, now);

  return {
    aura: engine,
    now,
    authStatus: getToken() ? 'loading' : (saved ? 'guest' : 'anon'),
    user: null,
    authError: null,
    authBusy: false,
    editing: false,
    screen: saved ? 'today' : 'onboarding',
    birth: saved?.birth ?? null,
    goalArea,
    goalName: saved?.goalName ?? 'my goal',
    checkin: undefined,
    reads: loadReads(),
    ...initial,

    go: (screen) => set({ screen }),

    // Verify the stored token with the API; load the server profile if present.
    initAuth: async () => {
      if (get().authStatus !== 'loading') return;
      try {
        const res = await me();
        if (res) {
          if (res.profile) {
            saveProfile(res.profile); // cache locally
            set({ authStatus: 'authed', user: res.user, ...applyProfile(get, res.profile), screen: 'today' });
          } else {
            set({ authStatus: 'authed', user: res.user, screen: 'onboarding' });
          }
          return;
        }
      } catch { /* token invalid or API unreachable → fall back */ }
      const local = loadProfile();
      set(local ? { authStatus: 'guest', screen: 'today' } : { authStatus: 'anon' });
    },

    doLogin: async (email, password) => {
      set({ authBusy: true, authError: null });
      try {
        const user = await apiLogin(email, password);
        const res = await me();
        if (res?.profile) {
          saveProfile(res.profile);
          set({ user, authStatus: 'authed', authBusy: false, ...applyProfile(get, res.profile), screen: 'today' });
        } else {
          set({ user, authStatus: 'authed', authBusy: false, screen: 'onboarding' });
        }
      } catch (e) { set({ authBusy: false, authError: (e as Error).message }); }
    },

    doRegister: async (email, password) => {
      set({ authBusy: true, authError: null });
      try {
        const user = await apiRegister(email, password);
        set({ user, authStatus: 'authed', authBusy: false, screen: 'onboarding' });
      } catch (e) { set({ authBusy: false, authError: (e as Error).message }); }
    },

    continueAsGuest: () => {
      const local = loadProfile();
      if (local) set({ authStatus: 'guest', ...applyProfile(get, local), screen: 'today' });
      else set({ authStatus: 'guest', screen: 'onboarding' });
    },

    // Send a guest to the sign-in screen without clearing their on-device profile.
    showLogin: () => set({ authStatus: 'anon', authError: null }),

    logout: () => {
      apiLogout();
      set({ authStatus: 'anon', user: null, authError: null, birth: null, chart: null, daily: null, checkin: undefined, screen: 'onboarding' });
    },

    onboard: (birth, area, name) => {
      // Never "read" a crisis (SPEC §11.3).
      if (detectCrisis(name)) { set({ screen: 'support' }); return; }
      saveProfile({ birth, goalArea: area, goalName: name });
      const d = compute(birth, area, undefined, get().now);
      // Editing an existing profile skips the retrospective audit; a fresh chart runs it.
      const wasEditing = get().editing;
      set({ birth, goalArea: area, goalName: name, checkin: undefined, ...d, editing: false, screen: wasEditing ? 'today' : 'audit' });
      // Persist to the server when signed in (fire-and-forget; local copy already saved).
      if (get().authStatus === 'authed') apiSaveProfile({ birth, goalArea: area, goalName: name }).catch(() => {});
    },

    startEdit: () => set({ editing: true, screen: 'onboarding' }),
    cancelEdit: () => set({ editing: false, screen: 'today' }),

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
        authStatus: getToken() ? 'loading' : (p ? 'guest' : 'anon'),
        user: null, authError: null, authBusy: false, editing: false,
        screen: p ? 'today' : 'onboarding',
        birth: p?.birth ?? null, goalArea: area, goalName: p?.goalName ?? 'my goal',
        checkin: undefined, reads: loadReads(), ...compute(p?.birth ?? null, area, undefined, get().now),
      });
    },
  };
});
