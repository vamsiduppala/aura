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

  it('DELETE /account erases the user, their profile and their sessions', async () => {
    // A fresh account with a saved profile.
    const reg = await app.inject({ method: 'POST', url: '/auth/register', payload: { email: 'del@example.com', password: 'deletemeplease' } });
    const tok = reg.json().token as string;
    await app.inject({
      method: 'PUT', url: '/profile', headers: { authorization: `Bearer ${tok}` },
      payload: { birth: { date: '1995-06-01', place: 'X', lat: 1, lng: 2, tzOffsetMinutes: 0 }, goalArea: 'self', goalName: 'x' },
    });

    const del = await app.inject({ method: 'DELETE', url: '/account', headers: { authorization: `Bearer ${tok}` } });
    expect(del.statusCode).toBe(200);

    // Session gone → the old token no longer authenticates.
    expect((await app.inject({ method: 'GET', url: '/profile', headers: { authorization: `Bearer ${tok}` } })).statusCode).toBe(401);
    // User gone → old credentials no longer log in.
    expect((await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'del@example.com', password: 'deletemeplease' } })).statusCode).toBe(401);
    // Email freed → the same address can register again (proves the user row was removed).
    expect((await app.inject({ method: 'POST', url: '/auth/register', payload: { email: 'del@example.com', password: 'deletemeplease' } })).statusCode).toBe(200);
  });

  it('rejects account deletion without a token', async () => {
    expect((await app.inject({ method: 'DELETE', url: '/account' })).statusCode).toBe(401);
  });

  it('changes the password, invalidates the old one, and signs other sessions out', async () => {
    const reg = await app.inject({ method: 'POST', url: '/auth/register', payload: { email: 'pw@example.com', password: 'originalpass' } });
    const first = reg.json().token as string;
    // A second device/session for the same account.
    const second = (await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'pw@example.com', password: 'originalpass' } })).json().token as string;

    const bad = await app.inject({ method: 'POST', url: '/auth/password', headers: { authorization: `Bearer ${first}` }, payload: { currentPassword: 'wrongpass', newPassword: 'brandnewpass' } });
    expect(bad.statusCode).toBe(400);

    const ok = await app.inject({ method: 'POST', url: '/auth/password', headers: { authorization: `Bearer ${first}` }, payload: { currentPassword: 'originalpass', newPassword: 'brandnewpass' } });
    expect(ok.statusCode).toBe(200);

    // Old password no longer logs in; the new one does.
    expect((await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'pw@example.com', password: 'originalpass' } })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'pw@example.com', password: 'brandnewpass' } })).statusCode).toBe(200);
    // The caller keeps its session; the other device was signed out.
    expect((await app.inject({ method: 'GET', url: '/auth/me', headers: { authorization: `Bearer ${first}` } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/profile', headers: { authorization: `Bearer ${second}` } })).statusCode).toBe(401);
  });

  it('rejects a too-short new password and requires auth', async () => {
    const tok = (await app.inject({ method: 'POST', url: '/auth/register', payload: { email: 'pw2@example.com', password: 'originalpass' } })).json().token as string;
    expect((await app.inject({ method: 'POST', url: '/auth/password', headers: { authorization: `Bearer ${tok}` }, payload: { currentPassword: 'originalpass', newPassword: 'short' } })).statusCode).toBe(400);
    expect((await app.inject({ method: 'POST', url: '/auth/password', payload: { currentPassword: 'a', newPassword: 'bbbbbbbbbb' } })).statusCode).toBe(401);
  });

  it('round-trips the display name on the profile', async () => {
    const tok = (await app.inject({ method: 'POST', url: '/auth/register', payload: { email: 'dn@example.com', password: 'originalpass' } })).json().token as string;
    await app.inject({
      method: 'PUT', url: '/profile', headers: { authorization: `Bearer ${tok}` },
      payload: { birth: { date: '1990-01-01', place: 'X', lat: 1, lng: 2, tzOffsetMinutes: 0 }, goalArea: 'self', goalName: 'g', displayName: 'Vamsi' },
    });
    const p = await app.inject({ method: 'GET', url: '/profile', headers: { authorization: `Bearer ${tok}` } });
    expect(p.json().displayName).toBe('Vamsi');
  });

  void json;
});

describe('blueprint kundali endpoint (full chart reading)', () => {
  // Aries lagna: house = sign + 1. Two planets share the 1st house.
  const planets = {
    sun: { sign: 0, house: 1, longitude: 10 },
    moon: { sign: 3, house: 4, longitude: 100 },
    mars: { sign: 0, house: 1, longitude: 5 },
    mercury: { sign: 1, house: 2, longitude: 45 },
    jupiter: { sign: 8, house: 9, longitude: 250 },
    venus: { sign: 1, house: 2, longitude: 40 },
    saturn: { sign: 6, house: 7, longitude: 190 },
    rahu: { sign: 2, house: 3, longitude: 75 },
    ketu: { sign: 8, house: 9, longitude: 255 },
  };

  it('reads the whole chart from computed positions', async () => {
    const res = await app.inject({ method: 'POST', url: '/kundali', payload: { lagnaSign: 0, planets } });
    expect(res.statusCode).toBe(200);
    const k = res.json();
    expect(k.lagna.signName).toBe('Aries');
    expect(k.lagna.lord).toBe('mars');           // Aries lord
    expect(k.lagna.lordReading.text.length).toBeGreaterThan(20);
    expect(k.houses).toHaveLength(12);
    expect(k.houses[0].occupants.map((o: { graha: string }) => o.graha).sort()).toEqual(['mars', 'sun']);
    expect(k.houses[0].occupants[0].text.length).toBeGreaterThan(20); // real interpretation text
    expect(['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu']).toContain(k.karakas.atmakaraka);
    expect(k.shape.name.length).toBeGreaterThan(0);
    expect(typeof k.vipareeta.present).toBe('boolean');
    expect(Array.isArray(k.rajaYogas)).toBe(true);
  });

  it('rejects an incomplete chart', async () => {
    const res = await app.inject({ method: 'POST', url: '/kundali', payload: { lagnaSign: 0, planets: { sun: { sign: 0, house: 1, longitude: 10 } } } });
    expect(res.statusCode).toBe(400);
  });

  it('rejects out-of-range signs/houses/longitudes instead of returning a garbage reading', async () => {
    const badSign = { ...planets, sun: { sign: 50, house: 1, longitude: 10 } };
    expect((await app.inject({ method: 'POST', url: '/kundali', payload: { lagnaSign: 0, planets: badSign } })).statusCode).toBe(400);
    const badHouse = { ...planets, sun: { sign: 0, house: 99, longitude: 10 } };
    expect((await app.inject({ method: 'POST', url: '/kundali', payload: { lagnaSign: 0, planets: badHouse } })).statusCode).toBe(400);
    const badLong = { ...planets, sun: { sign: 0, house: 1, longitude: 999 } };
    expect((await app.inject({ method: 'POST', url: '/kundali', payload: { lagnaSign: 0, planets: badLong } })).statusCode).toBe(400);
    expect((await app.inject({ method: 'POST', url: '/kundali', payload: { lagnaSign: 12, planets } })).statusCode).toBe(400);
  });
});


describe('final book-chunk routes (Ch 7/13/14/15/18/28)', () => {
  it('POST /avastha/mood returns conjunction moods + Lajjitadi states', async () => {
    const res = await app.inject({ method: 'POST', url: '/avastha/mood', payload: { joinedByMalefic: true, exaltedOrMoolatrikona: true } });
    expect(res.statusCode).toBe(200);
    const b = res.json();
    expect(b.conjunctionMoods.map((m: { name: string }) => m.name)).toEqual(['Vikala']);
    expect(b.lajjitadi.map((m: { name: string }) => m.name)).toEqual(['Garvita']);
  });

  it('POST /longevity/rudra picks the stronger candidate and returns Trishoola rasis', async () => {
    const base = { conjunctCount: 0, exaltedOrOwn: false, joinsExalted: false, rasiAspectCount: 0, degreeInSign: 10 };
    const res = await app.inject({
      method: 'POST', url: '/longevity/rudra',
      payload: { fromLagna: { graha: 'mars', ...base, conjunctCount: 2 }, fromSeventh: { graha: 'venus', ...base }, rudraSign: 7 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ rudra: 'mars', overridden: false, trishoolaRasis: [7, 11, 3] });
    expect((await app.inject({ method: 'POST', url: '/longevity/rudra', payload: {} })).statusCode).toBe(400);
  });

  it('POST /longevity/maheswara-full honours the Rahu/Ketu exception', async () => {
    const plain = await app.inject({ method: 'POST', url: '/longevity/maheswara-full', payload: { akSign: 2 } });
    expect(plain.json().maheswara).toBe('saturn');
    const exc = await app.inject({ method: 'POST', url: '/longevity/maheswara-full', payload: { akSign: 1, rahuKetuWithAKor8th: true } });
    expect(exc.json().maheswara).toBe('venus');
  });

  it('POST /tajaka/pancha-vargeeya totals /4 with a verdict, and 400s with the unit table', async () => {
    const ok = await app.inject({ method: 'POST', url: '/tajaka/pancha-vargeeya', payload: { kshetra: 30, uchcha: 20, hadda: 15, drekkana: 10, navamsa: 5 } });
    expect(ok.json()).toMatchObject({ total: 20, verdict: 'very strong' });
    const bad = await app.inject({ method: 'POST', url: '/tajaka/pancha-vargeeya', payload: { kshetra: 30 } });
    expect(bad.statusCode).toBe(400);
    expect(bad.json().units.kshetra.own).toBe(30);
  });

  it('GET /dasha/narayana/varga-seed maps D-n to its seed house', async () => {
    expect((await app.inject({ method: 'GET', url: '/dasha/narayana/varga-seed?divisor=9' })).json().seedHouse).toBe(9);
    expect((await app.inject({ method: 'GET', url: '/dasha/narayana/varga-seed?divisor=30' })).json().seedHouse).toBe(6);
    expect((await app.inject({ method: 'GET', url: '/dasha/narayana/varga-seed' })).statusCode).toBe(400);
  });

  it('GET /reference now carries the analysis guidelines + house references', async () => {
    const b = (await app.inject({ method: 'GET', url: '/reference' })).json();
    expect(b.analysisGuidelines.length).toBeGreaterThanOrEqual(6);
    expect(b.houseReferences.map((r: { key: string }) => r.key)).toContain('paaka');
  });
});
