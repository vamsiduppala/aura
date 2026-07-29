// Client for the local backend (apps/api): accounts, sessions, and the birth profile.
// Falls back cleanly when the API isn't running — the app still works on-device, because
// the chart, the court and the whole Timeline are computed locally from the birth details.

import type { BirthData } from '@aura/engine';
import type { BirthTimeConfidence } from '../core/court';

const TOKEN_KEY = 'vim.token';
const SERVER_KEY = 'vim.serverUrl';

/**
 * Where the server lives. Resolved at RUNTIME, never baked in at build time, because a
 * phone cannot reach "localhost" — on Android/iOS the server is the dev machine's LAN
 * address, which the user sets in Settings.
 * Order: user-set value → build-time VITE_API_URL → this origin → localhost:8787.
 */
function defaultBase(): string {
  const configured = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '');
  if (configured) return configured;
  // Served by the API itself (a LAN box, any single-port host)? Then the API is right here.
  // Only the Vite dev server on :5174 needs the separate :8787.
  if (typeof location !== 'undefined' && location.origin && !/:517[34]$/.test(location.origin)
      && /^https?:/.test(location.origin)) {
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
  } catch { /* storage blocked → fall through */ }
  return BUILD_DEFAULT;
}

/** Point the app at a different server (e.g. http://192.168.1.65:8787 from a phone). */
export function setApiBase(url: string): void {
  try {
    const v = clean(url);
    if (v) localStorage.setItem(SERVER_KEY, v); else localStorage.removeItem(SERVER_KEY);
  } catch { /* ignore */ }
}
export const DEFAULT_API_BASE = BUILD_DEFAULT;

export interface AuthUser { id: number; email: string; createdAt?: string }

/** The profile as it crosses the wire. `goalArea`/`goalName` are the API's own fields. */
export interface ServerProfile {
  birth: BirthData;
  birthTimeConfidence: BirthTimeConfidence;
  displayName: string;
}

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

/** Is the API reachable? Decides whether signing in is even offered. */
export async function apiReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${apiBase()}/health`, { signal: AbortSignal.timeout(4000) });
    return res.ok;
  } catch { return false; }
}

const unreachableMsg = (): string =>
  `Can't reach the server at ${apiBase()}. Start it with "npm run dev:api", or continue on this device only.`;

async function authCall(path: string, email: string, password: string): Promise<AuthUser> {
  let res: Response;
  try {
    res = await req(path, { method: 'POST', body: JSON.stringify({ email, password }) });
  } catch {
    throw new Error(unreachableMsg()); // network failure → the server isn't running
  }
  const body = await res.json().catch(() => ({} as Record<string, string>));
  if (!res.ok) throw new Error(body.error ?? 'Something went wrong.');
  setToken(body.token);
  return body.user;
}
export const register = (email: string, password: string): Promise<AuthUser> =>
  authCall('/auth/register', email, password);
export const login = (email: string, password: string): Promise<AuthUser> =>
  authCall('/auth/login', email, password);

export function logout(): void { clearToken(); }

/** Current user + their saved profile (null if none). Clears an invalid token. */
export async function me(): Promise<{ user: AuthUser; profile: ServerProfile | null } | null> {
  if (!getToken()) return null;
  const res = await req('/auth/me');
  if (res.status === 401) { clearToken(); return null; }
  if (!res.ok) return null;
  const body = await res.json() as {
    user: AuthUser;
    profile: (ServerProfile & { birthTimeConfidence?: string }) | null;
  };
  if (!body.profile) return { user: body.user, profile: null };
  return {
    user: body.user,
    profile: {
      birth: body.profile.birth,
      // The server clamps anything unrecognised to 'unknown'; trust that, but never
      // let a missing field read as precision we were not given.
      birthTimeConfidence: (body.profile.birthTimeConfidence ?? 'unknown') as BirthTimeConfidence,
      displayName: body.profile.displayName ?? '',
    },
  };
}

/** Persist the birth profile for the signed-in user. */
export async function saveProfile(p: ServerProfile): Promise<void> {
  let res: Response;
  try {
    res = await req('/profile', { method: 'PUT', body: JSON.stringify(p) });
  } catch {
    throw new Error(unreachableMsg());
  }
  if (!res.ok) throw new Error('Could not save your details.');
}

/** Change the signed-in user's password. Other devices are signed out server-side. */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  let res: Response;
  try {
    res = await req('/auth/password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
  } catch {
    throw new Error(unreachableMsg());
  }
  const body = await res.json().catch(() => ({} as Record<string, string>));
  if (!res.ok) throw new Error(body.error ?? 'Could not change your password.');
}

/** Permanently delete the account + all its server data. Best-effort; the local token
 *  is cleared regardless, so the client always ends up signed out. */
export async function deleteAccount(): Promise<void> {
  try {
    if (getToken()) await req('/account', { method: 'DELETE' });
  } catch { /* server unreachable — local state is wiped either way */ }
  clearToken();
}
