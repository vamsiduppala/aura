import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { BirthData } from '@aura/engine';

// Mock the API layer so doRegister runs without a server. vi.mock is hoisted above the imports.
vi.mock('../services/api', () => ({
  me: vi.fn().mockResolvedValue(null),
  login: vi.fn(),
  register: vi.fn().mockResolvedValue({ id: 1, email: 'new@x.com' }),
  logout: vi.fn(),
  saveProfile: vi.fn().mockResolvedValue(undefined),
  deleteAccount: vi.fn().mockResolvedValue(undefined),
  getToken: vi.fn().mockReturnValue(null),
}));

import * as api from '../services/api';
import { useAura } from '../store/useAura';
import { setStorageIdentity } from '../services/storage';

const birth: BirthData = { date: '1990-05-15', time: '08:30', unknownTime: false, place: 'Delhi', lat: 28.61, lng: 77.21, tzOffsetMinutes: 330 };

describe('creating an account keeps an existing (guest) profile', () => {
  beforeEach(() => {
    localStorage.clear();
    setStorageIdentity(null); // each test starts on the device-only slot
    useAura.getState().reset();
    (api.saveProfile as Mock).mockClear();
  });

  it('migrates the guest chart into the new account and lands on today', async () => {
    useAura.getState().onboard(birth, 'career', 'Kai'); // entered as a guest
    await useAura.getState().doRegister('new@x.com', 'password123');

    const s = useAura.getState();
    expect(s.authStatus).toBe('authed');
    expect(s.screen).toBe('today');           // not sent back to a blank onboarding
    expect(s.birth?.place).toBe('Delhi');     // profile preserved
    expect(api.saveProfile as Mock).toHaveBeenCalledWith(
      expect.objectContaining({ birth: expect.objectContaining({ place: 'Delhi' }), goalArea: 'career' }),
    );
  });

  it('a fresh register with no profile still goes to onboarding', async () => {
    await useAura.getState().doRegister('fresh@x.com', 'password123');
    expect(useAura.getState().screen).toBe('onboarding');
    expect(api.saveProfile as Mock).not.toHaveBeenCalled();
  });

  // Regression: a profile left in localStorage by whoever used this browser last must NEVER be
  // adopted into a newly created account. It once silently gave a new user a stranger's chart.
  it('does NOT adopt a stale on-device profile the new user never entered', async () => {
    // Simulate leftover storage from a previous person, then boot the store fresh from it.
    localStorage.setItem('aura.v1.guest.profile', JSON.stringify({
      birth: { date: '1993-06-15', time: '14:35', unknownTime: false, place: 'Someone Else', lat: 12.97, lng: 77.59, tzOffsetMinutes: 330 },
      goalArea: 'career', goalName: 'their goal', displayName: 'Stranger',
    }));
    setStorageIdentity(null);
    useAura.getState().reset();
    expect(useAura.getState().birth?.place).toBe('Someone Else'); // guest mode shows it, fine

    await useAura.getState().doRegister('newperson@x.com', 'password123');

    const s = useAura.getState();
    expect(s.screen).toBe('onboarding');   // they get asked for their OWN details
    expect(s.birth).toBeNull();            // the stranger's chart is gone
    expect(s.displayName).toBe('');
    expect(api.saveProfile as Mock).not.toHaveBeenCalled(); // nothing uploaded to the new account
  });
});
