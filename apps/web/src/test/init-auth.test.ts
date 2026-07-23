import { describe, it, expect, vi, beforeEach } from 'vitest';

// A controllable API mock. vi.hoisted lets the factory reference it despite hoisting.
const mock = vi.hoisted(() => ({
  me: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  saveProfile: vi.fn(),
  deleteAccount: vi.fn(),
  apiReachable: vi.fn(),
  getToken: vi.fn(),
}));
vi.mock('../services/api', () => mock);

import { useAura } from '../store/useAura';

// With no token and no on-device profile, initAuth should only force the sign-in screen when the
// server is actually reachable; offline it goes straight to guest onboarding (offline-first).
describe('initAuth — offline-first fallback', () => {
  beforeEach(() => {
    localStorage.clear();
    mock.getToken.mockReturnValue(null);
    mock.me.mockResolvedValue(null);
  });

  it('offline: skips the dead sign-in screen → guest onboarding', async () => {
    mock.apiReachable.mockResolvedValue(false);
    useAura.setState({ authStatus: 'loading' });
    await useAura.getState().initAuth();
    const s = useAura.getState();
    expect(s.authStatus).toBe('guest');
    expect(s.screen).toBe('onboarding');
  });

  it('online: shows the sign-in screen so they can register/login', async () => {
    mock.apiReachable.mockResolvedValue(true);
    useAura.setState({ authStatus: 'loading' });
    await useAura.getState().initAuth();
    expect(useAura.getState().authStatus).toBe('anon');
  });
});
