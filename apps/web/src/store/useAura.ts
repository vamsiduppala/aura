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
import {
  loadProfile, saveProfile, loadReads, bumpReads, clearAll, setStorageIdentity, type ReadsState,
} from '../services/storage';
import {
  me, login as apiLogin, register as apiRegister, logout as apiLogout,
  saveProfile as apiSaveProfile, deleteAccount as apiDeleteAccount, apiReachable, getToken, type AuthUser,
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
  /** The person's own name, shown in the app chrome. Editable on the Account screen. */
  displayName: string;
  /** True only when the birth profile was entered during this browser session. A profile merely
   *  restored from localStorage does NOT count — it may belong to whoever used the browser last,
   *  and must never be silently adopted into a newly created account. */
  enteredThisSession: boolean;
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
  onboard: (birth: BirthData, goalArea: LifeArea, goalName: string, displayName?: string) => void;
  setCheckin: (checkin: Checkin | undefined) => void;
  openReading: () => void;
  deleteAll: () => void;
  reset: () => void;
  /** A question queued from the command palette for the mentor to pick up on arrival. */
  pendingQuestion: string | null;
  askMentorAbout: (question: string) => void;
  clearPendingQuestion: () => void;
  /** Save edited account/profile fields (name, focus, birth details) locally + to the server. */
  saveAccount: (patch: { displayName?: string; goalArea?: LifeArea; goalName?: string; birth?: BirthData }) => void;
}

/** Every per-person field, reset. Used whenever the identity changes so nothing leaks across users. */
function blankPerson() {
  return {
    birth: null, chart: null, daily: null, error: null,
    goalArea: 'career' as LifeArea, goalName: 'my goal', displayName: '',
    checkin: undefined, enteredThisSession: false, reads: { count: 0, lastDay: '' },
  };
}

/** Apply a loaded profile (from server or local) to the derived state. */
function applyProfile(get: () => AuraState, p: { birth: BirthData; goalArea: LifeArea; goalName: string; displayName?: string }) {
  const d = compute(p.birth, p.goalArea, undefined, get().now);
  return {
    birth: p.birth, goalArea: p.goalArea, goalName: p.goalName,
    displayName: p.displayName ?? '', checkin: undefined, ...d,
  };
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
    displayName: saved?.displayName ?? '',
    enteredThisSession: false,
    pendingQuestion: null,
    checkin: undefined,
    reads: loadReads(),
    ...initial,

    go: (screen) => set({ screen }),

    // The palette can ask a question from anywhere; the chat screen picks it up on mount.
    askMentorAbout: (question) => set({ pendingQuestion: question, screen: 'chat' }),
    clearPendingQuestion: () => set({ pendingQuestion: null }),

    // Verify the stored token with the API; load the server profile if present.
    initAuth: async () => {
      if (get().authStatus !== 'loading') return;
      try {
        const res = await me();
        if (res) {
          // Switch to THIS account's storage slot before reading or writing anything local.
          setStorageIdentity(res.user.id);
          if (res.profile) {
            saveProfile(res.profile); // cached under their own slot
            set({
              ...blankPerson(), authStatus: 'authed', user: res.user,
              ...applyProfile(get, res.profile), reads: loadReads(), screen: 'today',
            });
          } else {
            // Signed in but no chart yet — start clean, never inheriting the last person's.
            set({ ...blankPerson(), authStatus: 'authed', user: res.user, screen: 'onboarding' });
          }
          return;
        }
        setStorageIdentity(null); // no valid session -> device-only slot
      } catch { /* token invalid or API unreachable → fall back */ }
      const local = loadProfile();
      if (local) { set({ authStatus: 'guest', ...applyProfile(get, local), reads: loadReads(), screen: 'today' }); return; }
      // No token and no local profile. Only force the sign-in screen if the server is actually
      // reachable — otherwise register/login can't work, so send them straight to guest onboarding.
      const online = await apiReachable();
      set(online ? { authStatus: 'anon' } : { authStatus: 'guest', screen: 'onboarding' });
    },

    doLogin: async (email, password) => {
      set({ authBusy: true, authError: null });
      try {
        const user = await apiLogin(email, password);
        setStorageIdentity(user.id); // their own slot, before any local read/write
        const res = await me();
        if (res?.profile) {
          saveProfile(res.profile);
          set({
            ...blankPerson(), user, authStatus: 'authed', authBusy: false,
            ...applyProfile(get, res.profile), reads: loadReads(), screen: 'today',
          });
        } else {
          // No chart on the server yet. Fall back only to what is saved under THEIR slot —
          // never whatever the previous person left behind.
          const own = loadProfile();
          set(own
            ? { ...blankPerson(), user, authStatus: 'authed', authBusy: false, ...applyProfile(get, own), reads: loadReads(), screen: 'today' }
            : { ...blankPerson(), user, authStatus: 'authed', authBusy: false, screen: 'onboarding' });
        }
      } catch (e) { set({ authBusy: false, authError: (e as Error).message }); }
    },

    doRegister: async (email, password) => {
      set({ authBusy: true, authError: null });
      try {
        const user = await apiRegister(email, password);
        // Carry over a profile ONLY if this person typed it during this session (guest -> account).
        // A profile restored from localStorage belongs to whoever used this browser last, so a new
        // account must start from onboarding rather than silently inherit a stranger's birth chart.
        const { birth, goalArea, goalName, displayName, enteredThisSession } = get();
        const carry = birth && enteredThisSession;
        setStorageIdentity(user.id); // the new account gets its own slot
        if (carry) {
          saveProfile({ birth, goalArea, goalName, displayName });
          apiSaveProfile({ birth, goalArea, goalName, displayName }).catch(() => {});
          set({ user, authStatus: 'authed', authBusy: false, screen: 'today' });
        } else {
          set({ ...blankPerson(), user, authStatus: 'authed', authBusy: false, screen: 'onboarding' });
        }
      } catch (e) { set({ authBusy: false, authError: (e as Error).message }); }
    },

    continueAsGuest: () => {
      setStorageIdentity(null); // device-only slot
      const local = loadProfile();
      set(local
        ? { ...blankPerson(), authStatus: 'guest', ...applyProfile(get, local), reads: loadReads(), screen: 'today' }
        : { ...blankPerson(), authStatus: 'guest', screen: 'onboarding' });
    },

    // Send a guest to the sign-in screen without clearing their on-device profile.
    showLogin: () => set({ authStatus: 'anon', authError: null }),

    logout: () => {
      apiLogout();
      // Drop the signed-in identity AND wipe every per-person field, so the next person to use
      // this browser sees nothing of the last one. Their data stays safe in their own slot.
      setStorageIdentity(null);
      set({ ...blankPerson(), authStatus: 'anon', user: null, authError: null, screen: 'onboarding' });
    },

    onboard: (birth, area, name, who) => {
      // Never "read" a crisis (SPEC §11.3).
      if (detectCrisis(name)) { set({ screen: 'support' }); return; }
      const displayName = (who ?? '').trim() || get().displayName;
      saveProfile({ birth, goalArea: area, goalName: name, displayName });
      const d = compute(birth, area, undefined, get().now);
      // Editing an existing profile skips the retrospective audit; a fresh chart runs it.
      const wasEditing = get().editing;
      set({ birth, goalArea: area, goalName: name, displayName, enteredThisSession: true, checkin: undefined, ...d, editing: false, screen: wasEditing ? 'today' : 'audit' });
      // Persist to the server when signed in (fire-and-forget; local copy already saved).
      if (get().authStatus === 'authed') apiSaveProfile({ birth, goalArea: area, goalName: name, displayName }).catch(() => {});
    },

    // Account-screen saves: patch any of name / focus / goal / birth, recompute, persist both ways.
    saveAccount: (patch) => {
      const s = get();
      const birth = patch.birth ?? s.birth;
      if (!birth) return;
      const goalArea = patch.goalArea ?? s.goalArea;
      const goalName = patch.goalName ?? s.goalName;
      const displayName = patch.displayName ?? s.displayName;
      const d = compute(birth, goalArea, s.checkin, s.now);
      saveProfile({ birth, goalArea, goalName, displayName });
      set({ birth, goalArea, goalName, displayName, enteredThisSession: true, ...d });
      if (s.authStatus === 'authed') apiSaveProfile({ birth, goalArea, goalName, displayName }).catch(() => {});
    },

    startEdit: () => set({ editing: true, screen: 'onboarding' }),
    cancelEdit: () => set({ editing: false, screen: 'today' }),

    setCheckin: (checkin) => {
      const { birth, goalArea: area, now: n } = get();
      set({ checkin, ...compute(birth, area, checkin, n) });
    },

    openReading: () => set((s) => ({ reads: bumpReads(s.reads), screen: 'reading' })),

    deleteAll: () => {
      // Signed in → also erase the server-side account + profile, honouring "yours only, delete
      // anytime". Best-effort (clears the local token regardless); local data is wiped either way.
      const wasAuthed = get().authStatus === 'authed';
      if (wasAuthed) void apiDeleteAccount();
      clearAll();
      set({
        // A deleted account drops back to the sign-in screen ('anon'); a guest stays a guest.
        authStatus: wasAuthed ? 'anon' : get().authStatus,
        user: null, birth: null, chart: null, daily: null, checkin: undefined,
        error: null, reads: { count: 0, lastDay: '' }, screen: 'onboarding',
      });
    },

    reset: () => {
      const p = loadProfile();
      const area = p?.goalArea ?? 'career';
      set({
        authStatus: getToken() ? 'loading' : (p ? 'guest' : 'anon'),
        user: null, authError: null, authBusy: false, editing: false, enteredThisSession: false,
        screen: p ? 'today' : 'onboarding',
        birth: p?.birth ?? null, goalArea: area, goalName: p?.goalName ?? 'my goal',
        checkin: undefined, reads: loadReads(), ...compute(p?.birth ?? null, area, undefined, get().now),
      });
    },
  };
});
