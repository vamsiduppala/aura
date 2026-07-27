// Client for aura's local backend (apps/api). Handles auth (register/login), the session
// token, and server-side birth-profile persistence. Falls back gracefully when the API
// isn't running — the app still works on-device (guest mode) via services/storage.
import type { BirthData, LifeArea } from '@aura/engine';

const TOKEN_KEY = 'aura.token';
const SERVER_KEY = 'aura.serverUrl';

// Where the local aura server lives. Resolved at RUNTIME, not build time, because a phone can't
// reach "localhost" — on Android/iOS the server is your computer's LAN address, which the user
// sets in Settings. Order: user-set value -> build-time VITE_API_URL -> localhost default.
function defaultBase(): string {
  const configured = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '');
  if (configured) return configured;
  // Served by the API itself (Replit, a LAN box, any single-port host)? Then the API is right
  // here — use this origin. Only the Vite dev server on :5173 needs the separate :8787.
  if (typeof location !== 'undefined' && location.origin && !/:5173$/.test(location.origin)) {
    return location.origin.replace(/\/+$/, '');
  }
  return 'http://localhost:8787';
}
const BUILD_DEFAULT = defaultBase();

const clean = (u: string): string => u.trim().replace(/\/+$/, '');

/** The server address in use right now. */
export function apiBase(): string {
  try {
    const saved = localStorage.getItem(SERVER_KEY);
    if (saved && saved.trim()) return clean(saved);
  } catch { /* storage blocked -> fall through */ }
  return BUILD_DEFAULT;
}

/** Point the app at a different aura server (e.g. http://192.168.1.65:8787 from a phone). */
export function setApiBase(url: string): void {
  try {
    const v = clean(url);
    if (v) localStorage.setItem(SERVER_KEY, v); else localStorage.removeItem(SERVER_KEY);
  } catch { /* ignore */ }
}
export function clearApiBase(): void { try { localStorage.removeItem(SERVER_KEY); } catch { /* ignore */ } }
/** The compiled-in default, shown in Settings so the user knows what "reset" restores. */
export const DEFAULT_API_BASE = BUILD_DEFAULT;

/** @deprecated read-only snapshot for display; call apiBase() when making a request. */
export const API_BASE = BUILD_DEFAULT;

export interface AuthUser { id: number; email: string; createdAt?: string }
export interface ServerProfile { birth: BirthData; goalArea: LifeArea; goalName: string; displayName?: string }

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
function setToken(t: string): void { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ } }
export function clearToken(): void { try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } }

async function req(path: string, opts: RequestInit = {}): Promise<Response> {
  const token = getToken();
  return fetch(`${apiBase()}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
}

/** Is the local API reachable? Used to decide whether to require login. */
export async function apiReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${apiBase()}/health`, { signal: AbortSignal.timeout(4000) });
    return res.ok;
  } catch { return false; }
}

/** A friendly, actionable message when the local API can't be reached at all. */
const unreachableMsg = (): string => `Can’t reach your local aura server at ${apiBase()}. Make sure it’s running (npm run dev), or use “continue on this device only”.`;

async function authCall(path: string, email: string, password: string): Promise<AuthUser> {
  let res: Response;
  try {
    res = await req(path, { method: 'POST', body: JSON.stringify({ email, password }) });
  } catch {
    throw new Error(unreachableMsg()); // network failure → the server isn't running
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? 'Something went wrong.');
  setToken(body.token);
  return body.user;
}
export const register = (email: string, password: string): Promise<AuthUser> => authCall('/auth/register', email, password);
export const login = (email: string, password: string): Promise<AuthUser> => authCall('/auth/login', email, password);

export function logout(): void { clearToken(); }

/** Current user + their saved profile (null if none). Throws if the token is invalid. */
export async function me(): Promise<{ user: AuthUser; profile: ServerProfile | null } | null> {
  if (!getToken()) return null;
  const res = await req('/auth/me');
  if (res.status === 401) { clearToken(); return null; }
  if (!res.ok) return null;
  return res.json();
}

/** Change the signed-in user's password. Throws with the server's message on failure. */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  let res: Response;
  try {
    res = await req('/auth/password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
  } catch {
    throw new Error(unreachableMsg());
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? 'Could not change your password.');
}

/** Permanently delete the signed-in user's account + all their server data. Best-effort:
 *  clears the local token regardless, so the client always ends up signed out. */
export async function deleteAccount(): Promise<void> {
  try {
    if (getToken()) await req('/account', { method: 'DELETE' });
  } catch { /* server unreachable — best-effort; the local token is cleared regardless */ }
  clearToken();
}

/** Persist the birth profile to the server for the logged-in user. */
export async function saveProfile(p: ServerProfile): Promise<void> {
  let res: Response;
  try {
    res = await req('/profile', { method: 'PUT', body: JSON.stringify(p) });
  } catch {
    throw new Error(unreachableMsg());
  }
  if (!res.ok) throw new Error('Could not save your profile.');
}
