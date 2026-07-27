import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { BirthData } from '@aura/engine';

// Control the API layer so we can play two different accounts against one browser.
const mock = vi.hoisted(() => ({
  me: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  saveProfile: vi.fn().mockResolvedValue(undefined),
  deleteAccount: vi.fn().mockResolvedValue(undefined),
  apiReachable: vi.fn().mockResolvedValue(true),
  getToken: vi.fn().mockReturnValue(null),
}));
vi.mock('../services/api', () => mock);

import * as api from '../services/api';
import { useAura } from '../store/useAura';

const birthA: BirthData = { date: '1990-01-02', time: '09:00', unknownTime: false, place: 'Alpha City', lat: 10, lng: 20, tzOffsetMinutes: 0 };

describe('two people, one browser — data must never mix', () => {
  beforeEach(() => {
    localStorage.clear();
    useAura.getState().reset();
    (api.saveProfile as Mock).mockClear();
  });

  it('signing out then signing in as someone else shows nothing of the first person', async () => {
    // --- Person A registers and builds a chart ---
    (api.register as Mock).mockResolvedValue({ id: 1, email: 'a@x.com' });
    await useAura.getState().doRegister('a@x.com', 'passwordone');
    useAura.getState().onboard(birthA, 'career', 'A goal', 'Alice');
    expect(useAura.getState().displayName).toBe('Alice');

    // --- A signs out ---
    useAura.getState().logout();
    const afterLogout = useAura.getState();
    expect(afterLogout.displayName).toBe('');
    expect(afterLogout.birth).toBeNull();
    expect(afterLogout.chart).toBeNull();

    // --- Person B signs in on the same browser, with no chart saved server-side ---
    (api.login as Mock).mockResolvedValue({ id: 2, email: 'b@x.com' });
    (api.me as Mock).mockResolvedValue({ user: { id: 2, email: 'b@x.com' }, profile: null });
    await useAura.getState().doLogin('b@x.com', 'passwordtwo');

    const b = useAura.getState();
    expect(b.user?.email).toBe('b@x.com');
    expect(b.screen).toBe('onboarding');   // asked for their own details
    expect(b.displayName).toBe('');        // NOT "Alice"
    expect(b.birth).toBeNull();            // NOT Alpha City
    expect(b.chart).toBeNull();
  });

  it("returning to A's account restores A's own chart, not B's blank slate", async () => {
    (api.register as Mock).mockResolvedValue({ id: 1, email: 'a@x.com' });
    await useAura.getState().doRegister('a@x.com', 'passwordone');
    useAura.getState().onboard(birthA, 'career', 'A goal', 'Alice');
    useAura.getState().logout();

    // A signs back in; the server still has their profile.
    (api.login as Mock).mockResolvedValue({ id: 1, email: 'a@x.com' });
    (api.me as Mock).mockResolvedValue({
      user: { id: 1, email: 'a@x.com' },
      profile: { birth: birthA, goalArea: 'career', goalName: 'A goal', displayName: 'Alice' },
    });
    await useAura.getState().doLogin('a@x.com', 'passwordone');

    const a = useAura.getState();
    expect(a.displayName).toBe('Alice');
    expect(a.birth?.place).toBe('Alpha City');
  });

  it('editing the name in the account screen updates it everywhere immediately', () => {
    (api.getToken as Mock).mockReturnValue(null);
    useAura.getState().onboard(birthA, 'career', 'A goal', 'Alice');
    useAura.getState().saveAccount({ displayName: 'Alicia' });
    expect(useAura.getState().displayName).toBe('Alicia');
  });
});
