// Client for aura's local backend (apps/api). Handles auth (register/login), the session
// token, and server-side birth-profile persistence. Falls back gracefully when the API
// isn't running — the app still works on-device (guest mode) via services/storage.
import type { BirthData, LifeArea } from '@aura/engine';

export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:8787';
const TOKEN_KEY = 'aura.token';

export interface AuthUser { id: number; email: string }
export interface ServerProfile { birth: BirthData; goalArea: LifeArea; goalName: string }

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
function setToken(t: string): void { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ } }
export function clearToken(): void { try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } }

async function req(path: string, opts: RequestInit = {}): Promise<Response> {
  const token = getToken();
  return fetch(`${API_BASE}${path}`, {
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
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch { return false; }
}

/** A friendly, actionable message when the local API can't be reached at all. */
const UNREACHABLE = `Can’t reach your local aura server at ${API_BASE}. Make sure it’s running (npm run dev), or use “continue on this device only”.`;

async function authCall(path: string, email: string, password: string): Promise<AuthUser> {
  let res: Response;
  try {
    res = await req(path, { method: 'POST', body: JSON.stringify({ email, password }) });
  } catch {
    throw new Error(UNREACHABLE); // network failure → the server isn't running
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

/** Persist the birth profile to the server for the logged-in user. */
export async function saveProfile(p: ServerProfile): Promise<void> {
  let res: Response;
  try {
    res = await req('/profile', { method: 'PUT', body: JSON.stringify(p) });
  } catch {
    throw new Error(UNREACHABLE);
  }
  if (!res.ok) throw new Error('Could not save your profile.');
}
