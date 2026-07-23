// Auth helpers for aura's local API — scrypt password hashing + random session tokens.
// Local app, no external identity provider; still hashes passwords properly.

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import {
  createSession, createUser, findUserByEmail, userIdForToken, findUserById,
  updateUserPassword, deleteOtherSessions, type UserRow,
} from './db.js';

const hash = (password: string, salt: string): string => scryptSync(password, salt, 64).toString('hex');

export interface PublicUser { id: number; email: string; createdAt: string }
export interface AuthResult { token: string; user: PublicUser }

export class AuthError extends Error {}

const publicUser = (u: UserRow): PublicUser => ({ id: u.id, email: u.email, createdAt: u.created_at });

/** Constant-time check of a candidate password against a stored hash. */
function passwordMatches(user: UserRow, password: string): boolean {
  const candidate = Buffer.from(hash(password ?? '', user.salt), 'hex');
  const stored = Buffer.from(user.password_hash, 'hex');
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
}

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
  if (!passwordMatches(user, password)) throw new AuthError('Incorrect password.');
  return openSession(user);
}

/**
 * Change a user's password after re-checking the current one, then sign every OTHER session out
 * (the caller's token stays valid). Throws AuthError on a wrong current password / weak new one.
 */
export function changePassword(userId: number, currentPassword: string, newPassword: string, keepToken: string): void {
  const user = findUserById(userId);
  if (!user) throw new AuthError('Account not found.');
  if (!passwordMatches(user, currentPassword)) throw new AuthError('Your current password is incorrect.');
  if ((newPassword ?? '').length < 8) throw new AuthError('New password must be at least 8 characters.');
  if (newPassword === currentPassword) throw new AuthError('Choose a password different from your current one.');
  const salt = randomBytes(16).toString('hex');
  updateUserPassword(userId, hash(newPassword, salt), salt);
  deleteOtherSessions(userId, keepToken);
}

function openSession(user: UserRow): AuthResult {
  const token = randomBytes(32).toString('hex');
  createSession(token, user.id);
  return { token, user: publicUser(user) };
}

/** Resolve a bearer token to a user, or undefined. */
export function userForToken(token: string | undefined): PublicUser | undefined {
  if (!token) return undefined;
  const id = userIdForToken(token);
  if (id == null) return undefined;
  const user = findUserById(id);
  return user ? publicUser(user) : undefined;
}
