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

const birth: BirthData = { date: '1990-05-15', time: '08:30', unknownTime: false, place: 'Delhi', lat: 28.61, lng: 77.21, tzOffsetMinutes: 330 };

describe('creating an account keeps an existing (guest) profile', () => {
  beforeEach(() => { localStorage.clear(); useAura.getState().reset(); (api.saveProfile as Mock).mockClear(); });

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
});
