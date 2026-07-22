import { describe, it, expect, beforeAll } from 'vitest';

// Use an in-memory DB so the test never touches disk.
process.env.AURA_DB_PATH = ':memory:';

const { buildServer } = await import('../src/server.js');
const app = buildServer();
beforeAll(async () => { await app.ready(); });

const json = (payload: unknown) => ({ 'content-type': 'application/json', ...(payload ? {} : {}) });

describe('auth + profile (Phase 2 local accounts)', () => {
  let token = '';

  it('registers a new user and returns a session token', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/register', payload: { email: 'kai@example.com', password: 'hunter2hunter' } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.token).toMatch(/^[a-f0-9]{64}$/);
    expect(body.user.email).toBe('kai@example.com');
    token = body.token;
  });

  it('rejects a duplicate email and a short password', async () => {
    const dup = await app.inject({ method: 'POST', url: '/auth/register', payload: { email: 'kai@example.com', password: 'hunter2hunter' } });
    expect(dup.statusCode).toBe(400);
    const short = await app.inject({ method: 'POST', url: '/auth/register', payload: { email: 'x@y.com', password: 'short' } });
    expect(short.statusCode).toBe(400);
  });

  it('logs in with correct credentials and rejects wrong ones', async () => {
    const ok = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'kai@example.com', password: 'hunter2hunter' } });
    expect(ok.statusCode).toBe(200);
    const bad = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'kai@example.com', password: 'wrongpass' } });
    expect(bad.statusCode).toBe(401);
  });

  it('requires a token for profile access', async () => {
    const res = await app.inject({ method: 'GET', url: '/profile' });
    expect(res.statusCode).toBe(401);
  });

  it('saves and loads the birth profile for the logged-in user', async () => {
    const birth = { date: '2001-03-14', time: '09:42', unknownTime: false, place: 'Jaipur', lat: 26.92, lng: 75.82, tzOffsetMinutes: 330 };
    const save = await app.inject({
      method: 'PUT', url: '/profile', headers: { authorization: `Bearer ${token}` },
      payload: { birth, goalArea: 'career', goalName: 'Kai' },
    });
    expect(save.statusCode).toBe(200);

    const load = await app.inject({ method: 'GET', url: '/profile', headers: { authorization: `Bearer ${token}` } });
    expect(load.statusCode).toBe(200);
    const p = load.json();
    expect(p.birth.place).toBe('Jaipur');
    expect(p.birth.tzOffsetMinutes).toBe(330);
    expect(p.goalName).toBe('Kai');

    const me = await app.inject({ method: 'GET', url: '/auth/me', headers: { authorization: `Bearer ${token}` } });
    expect(me.json().profile.birth.place).toBe('Jaipur');
  });

  it('still serves the knowledge API (health)', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.json().ok).toBe(true);
  });

  void json;
});
