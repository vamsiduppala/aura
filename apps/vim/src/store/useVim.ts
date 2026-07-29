// Central app state. Owns identity, the birth details, and the chart derived from them.
//
// The chart is computed on this device from a real ephemeris — there is no seeded chart,
// no sample person, and no state in which the app shows numbers it did not derive from
// what the user typed. `chart` is null until real birth details exist, and every screen
// is written to handle that.

import { create } from 'zustand';
import { AstronomiaEphemeris, computeChart } from '@aura/engine';
import type { BirthData, Chart } from '@aura/engine';
import type { BirthTimeConfidence } from '../core/court';
import {
  loadProfile, saveProfile as saveLocal, clearAll, setStorageIdentity,
  loadPrefs, savePrefs, DEFAULT_PREFS, type Prefs, type StoredProfile,
} from '../services/storage';
import {
  me, login as apiLogin, register as apiRegister, logout as apiLogout,
  saveProfile as apiSaveProfile, deleteAccount as apiDeleteAccount, apiReachable,
  getToken, type AuthUser,
} from '../services/api';

const ephemeris = new AstronomiaEphemeris();

export type Tab = 'planner' | 'timeline' | 'mentor' | 'you';
export type AuthStatus = 'loading' | 'anon' | 'authed' | 'guest';

/** Where the user is, beyond the four tabs. Onboarding is a route, not a modal. */
export type Route =
  | { kind: 'welcome' }
  | { kind: 'signin' }
  | { kind: 'onboarding' }
  | { kind: 'tabs' }
  /** The daśā detail page for one office, reached from a ring or a court row. */
  | { kind: 'office'; level: number };

interface Derived {
  chart: Chart | null;
  chartError: string | null;
}

/** The one place a chart is built. Any failure surfaces as a message, never as zeros. */
function derive(birth: BirthData | null): Derived {
  if (!birth) return { chart: null, chartError: null };
  try {
    return { chart: computeChart(birth, ephemeris), chartError: null };
  } catch (e) {
    return { chart: null, chartError: (e as Error).message };
  }
}

export interface VimState {
  authStatus: AuthStatus;
  user: AuthUser | null;
  authError: string | null;
  authBusy: boolean;

  route: Route;
  tab: Tab;

  birth: BirthData | null;
  confidence: BirthTimeConfidence;
  displayName: string;
  tzId: string | null;

  chart: Chart | null;
  chartError: string | null;

  prefs: Prefs;

  /** True only when these birth details were entered in this browser session. A profile
   *  merely restored from storage does NOT count — it may belong to whoever used this
   *  browser last, and must never be silently adopted into a newly created account. */
  enteredThisSession: boolean;

  // ── actions ──
  go: (route: Route) => void;
  setTab: (tab: Tab) => void;
  initAuth: () => Promise<void>;
  doLogin: (email: string, password: string) => Promise<void>;
  doRegister: (email: string, password: string) => Promise<void>;
  continueOnDevice: () => void;
  showSignIn: () => void;
  logout: () => void;
  /** Commit real birth details. This is the only way a chart comes into existence. */
  saveBirth: (input: {
    birth: BirthData;
    confidence: BirthTimeConfidence;
    displayName?: string;
    tzId?: string;
  }) => void;
  setConfidence: (c: BirthTimeConfidence) => void;
  setPrefs: (patch: Partial<Prefs>) => void;
  deleteEverything: () => void;
}

/** Every per-person field, blanked. Used whenever the identity changes, so nothing leaks. */
function blankPerson() {
  return {
    birth: null, confidence: 'unknown' as BirthTimeConfidence, displayName: '',
    tzId: null, chart: null, chartError: null, enteredThisSession: false,
  };
}

function applyProfile(p: StoredProfile) {
  return {
    birth: p.birth,
    confidence: p.birthTimeConfidence,
    displayName: p.displayName ?? '',
    tzId: p.tzId ?? null,
    ...derive(p.birth),
  };
}

export const useVim = create<VimState>((set, get) => {
  const saved = loadProfile();
  return {
    authStatus: getToken() ? 'loading' : saved ? 'guest' : 'anon',
    user: null,
    authError: null,
    authBusy: false,

    route: saved ? { kind: 'tabs' } : { kind: 'welcome' },
    // Planner is home. With no plans it shows its own empty state — never a filled one.
    tab: 'planner',

    ...blankPerson(),
    ...(saved ? applyProfile(saved) : {}),

    prefs: loadPrefs(),

    go: (route) => set({ route }),
    setTab: (tab) => set({ tab, route: { kind: 'tabs' } }),

    // Verify a stored token against the API and load that account's profile.
    initAuth: async () => {
      if (get().authStatus !== 'loading') return;
      try {
        const res = await me();
        if (res) {
          setStorageIdentity(res.user.id); // their slot, before any local read or write
          if (res.profile) {
            const stored: StoredProfile = {
              birth: res.profile.birth,
              birthTimeConfidence: res.profile.birthTimeConfidence,
              displayName: res.profile.displayName,
            };
            saveLocal(stored); // cached under their own slot, for offline use
            set({
              ...blankPerson(), authStatus: 'authed', user: res.user,
              ...applyProfile(stored), route: { kind: 'tabs' },
            });
          } else {
            // Signed in with no chart yet: start clean, never inheriting anyone else's.
            set({
              ...blankPerson(), authStatus: 'authed', user: res.user,
              route: { kind: 'onboarding' },
            });
          }
          return;
        }
        setStorageIdentity(null); // no valid session → device-only slot
      } catch { /* token invalid or API down → fall through to local */ }

      const local = loadProfile();
      if (local) {
        set({ authStatus: 'guest', ...applyProfile(local), route: { kind: 'tabs' } });
        return;
      }
      // Nothing stored. Only offer sign-in if the server can actually answer; otherwise
      // register/login cannot work, so go straight to entering details on this device.
      const online = await apiReachable();
      set(online
        ? { authStatus: 'anon', route: { kind: 'welcome' } }
        : { authStatus: 'guest', route: { kind: 'welcome' } });
    },

    doLogin: async (email, password) => {
      set({ authBusy: true, authError: null });
      try {
        const user = await apiLogin(email, password);
        setStorageIdentity(user.id);
        const res = await me();
        if (res?.profile) {
          const stored: StoredProfile = {
            birth: res.profile.birth,
            birthTimeConfidence: res.profile.birthTimeConfidence,
            displayName: res.profile.displayName,
          };
          saveLocal(stored);
          set({
            ...blankPerson(), user, authStatus: 'authed', authBusy: false,
            ...applyProfile(stored), route: { kind: 'tabs' },
          });
        } else {
          // No chart on the server. Fall back only to what is saved under THEIR slot.
          const own = loadProfile();
          set(own
            ? { ...blankPerson(), user, authStatus: 'authed', authBusy: false, ...applyProfile(own), route: { kind: 'tabs' } }
            : { ...blankPerson(), user, authStatus: 'authed', authBusy: false, route: { kind: 'onboarding' } });
        }
      } catch (e) {
        set({ authBusy: false, authError: (e as Error).message });
      }
    },

    doRegister: async (email, password) => {
      set({ authBusy: true, authError: null });
      try {
        const user = await apiRegister(email, password);
        // Carry details over ONLY if this person typed them in this session (device → account).
        const { birth, confidence, displayName, tzId, enteredThisSession } = get();
        const carry = birth && enteredThisSession;
        setStorageIdentity(user.id);
        if (carry) {
          const stored: StoredProfile = {
            birth, birthTimeConfidence: confidence, displayName,
            ...(tzId ? { tzId } : {}),
          };
          saveLocal(stored);
          void apiSaveProfile({ birth, birthTimeConfidence: confidence, displayName })
            .catch(() => { /* local copy is already saved; it syncs on the next save */ });
          set({ user, authStatus: 'authed', authBusy: false, route: { kind: 'tabs' } });
        } else {
          set({
            ...blankPerson(), user, authStatus: 'authed', authBusy: false,
            route: { kind: 'onboarding' },
          });
        }
      } catch (e) {
        set({ authBusy: false, authError: (e as Error).message });
      }
    },

    continueOnDevice: () => {
      setStorageIdentity(null);
      const local = loadProfile();
      set(local
        ? { ...blankPerson(), authStatus: 'guest', ...applyProfile(local), route: { kind: 'tabs' } }
        : { ...blankPerson(), authStatus: 'guest', route: { kind: 'onboarding' } });
    },

    showSignIn: () => set({ authStatus: 'anon', authError: null, route: { kind: 'signin' } }),

    logout: () => {
      apiLogout();
      setStorageIdentity(null);
      // Drop the identity AND every per-person field, so the next person to open this
      // browser sees nothing of the last one. Their data stays safe in their own slot.
      set({
        ...blankPerson(), authStatus: 'anon', user: null, authError: null,
        route: { kind: 'welcome' },
      });
    },

    saveBirth: ({ birth, confidence, displayName, tzId }) => {
      const name = (displayName ?? get().displayName ?? '').trim();
      const zone = tzId ?? get().tzId ?? undefined;
      const stored: StoredProfile = {
        birth, birthTimeConfidence: confidence, displayName: name,
        ...(zone ? { tzId: zone } : {}),
      };
      saveLocal(stored);
      set({
        birth, confidence, displayName: name, tzId: zone ?? null,
        enteredThisSession: true, ...derive(birth), route: { kind: 'tabs' }, tab: 'timeline',
      });
      if (get().authStatus === 'authed') {
        void apiSaveProfile({ birth, birthTimeConfidence: confidence, displayName: name })
          .catch(() => { /* saved locally; nothing is lost if the server is down */ });
      }
    },

    setConfidence: (confidence) => {
      const { birth, displayName, tzId, authStatus } = get();
      set({ confidence });
      if (!birth) return;
      saveLocal({
        birth, birthTimeConfidence: confidence, displayName,
        ...(tzId ? { tzId } : {}),
      });
      if (authStatus === 'authed') {
        void apiSaveProfile({ birth, birthTimeConfidence: confidence, displayName })
          .catch(() => { /* local copy stands */ });
      }
    },

    setPrefs: (patch) => {
      const next = { ...get().prefs, ...patch };
      savePrefs(next);
      set({ prefs: next });
    },

    deleteEverything: () => {
      const wasAuthed = get().authStatus === 'authed';
      if (wasAuthed) void apiDeleteAccount(); // also erases the server-side account
      clearAll();
      savePrefs(DEFAULT_PREFS);
      set({
        ...blankPerson(),
        authStatus: wasAuthed ? 'anon' : get().authStatus,
        user: null, prefs: DEFAULT_PREFS, route: { kind: 'welcome' },
      });
    },
  };
});
