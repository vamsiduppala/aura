import { describe, it, expect, vi, afterEach } from 'vitest';
import { login, register, saveProfile } from '../services/api';

// When the local API isn't running, fetch rejects (TypeError: Failed to fetch). The client should
// surface a friendly, actionable message — not the raw browser error — so the Login screen can show it.
describe('api client — server-unreachable handling', () => {
  afterEach(() => vi.restoreAllMocks());

  it('turns a network failure on login/register into an actionable message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(login('a@b.com', 'password123')).rejects.toThrow(/Can.t reach your local aura server/i);
    await expect(register('a@b.com', 'password123')).rejects.toThrow(/npm run dev/i);
  });

  it('does the same for a profile save', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(saveProfile({ birth: { date: '1990-01-01' } as never, goalArea: 'self', goalName: 'x' }))
      .rejects.toThrow(/Can.t reach your local aura server/i);
  });

  it('still surfaces a server-sent error message on an HTTP failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'email already registered' }), { status: 400 }),
    ));
    await expect(register('a@b.com', 'password123')).rejects.toThrow(/email already registered/i);
  });
});
