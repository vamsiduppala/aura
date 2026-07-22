// Auth helpers for aura's local API — scrypt password hashing + random session tokens.
// Local app, no external identity provider; still hashes passwords properly.

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import {
  createSession, createUser, findUserByEmail, userIdForToken, findUserById, type UserRow,
} from './db.js';

const hash = (password: string, salt: string): string => scryptSync(password, salt, 64).toString('hex');

export interface AuthResult { token: string; user: { id: number; email: string } }

export class AuthError extends Error {}

/** Register a new user and open a session. Throws AuthError on bad input / taken email. */
export function register(email: string, password: string): AuthResult {
  const e = (email ?? '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) throw new AuthError('Enter a valid email address.');
  if ((password ?? '').length < 8) throw new AuthError('Password must be at least 8 characters.');
  if (findUserByEmail(e)) throw new AuthError('An account with this email already exists.');

  const salt = randomBytes(16).toString('hex');
  const user = createUser(e, hash(password, salt), salt);
  return openSession(user);
}

/** Log in an existing user. Throws AuthError on bad credentials. */
export function login(email: string, password: string): AuthResult {
  const user = findUserByEmail((email ?? '').trim().toLowerCase());
  if (!user) throw new AuthError('No account found for that email.');
  const candidate = Buffer.from(hash(password ?? '', user.salt), 'hex');
  const stored = Buffer.from(user.password_hash, 'hex');
  if (candidate.length !== stored.length || !timingSafeEqual(candidate, stored)) {
    throw new AuthError('Incorrect password.');
  }
  return openSession(user);
}

function openSession(user: UserRow): AuthResult {
  const token = randomBytes(32).toString('hex');
  createSession(token, user.id);
  return { token, user: { id: user.id, email: user.email } };
}

/** Resolve a bearer token to a user, or undefined. */
export function userForToken(token: string | undefined): { id: number; email: string } | undefined {
  if (!token) return undefined;
  const id = userIdForToken(token);
  if (id == null) return undefined;
  const user = findUserById(id);
  return user ? { id: user.id, email: user.email } : undefined;
}
