import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Onboarding } from '../screens/Onboarding';

// The onboarding is no longer capped at the preset cities: "Other place…" reveals manual
// latitude / longitude / UTC-offset entry, so any birthplace works (we never guess coordinates).
describe('Onboarding — custom birthplace', () => {
  it('accepts any place via manual coordinates and passes them through', async () => {
    const onComplete = vi.fn();
    render(<Onboarding onComplete={onComplete} />);
    const user = userEvent.setup();

    await user.selectOptions(screen.getByLabelText('Birthplace'), '8'); // the "Other place…" option
    await user.type(screen.getByLabelText('Custom place name'), 'Chennai, IN');
    await user.type(screen.getByLabelText('Latitude'), '13.08');
    await user.type(screen.getByLabelText('Longitude'), '80.27');
    await user.type(screen.getByLabelText('UTC offset in hours'), '5.5');

    await user.click(screen.getByRole('button', { name: /Read my energy/i }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const birth = onComplete.mock.calls[0]![0];
    expect(birth.place).toBe('Chennai, IN');
    expect(birth.lat).toBeCloseTo(13.08, 2);
    expect(birth.lng).toBeCloseTo(80.27, 2);
    expect(birth.tzOffsetMinutes).toBe(330); // 5.5h × 60
  });

  it('blocks submit until the custom coordinates are valid', async () => {
    render(<Onboarding onComplete={vi.fn()} />);
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText('Birthplace'), '8');
    expect(screen.getByRole('button', { name: /Read my energy/i })).toBeDisabled();
    await user.type(screen.getByLabelText('Latitude'), '13.08');
    await user.type(screen.getByLabelText('Longitude'), '80.27');
    await user.type(screen.getByLabelText('UTC offset in hours'), '5.5');
    expect(screen.getByRole('button', { name: /Read my energy/i })).toBeEnabled();
  });

  it('rejects a future birth date', async () => {
    const onComplete = vi.fn();
    render(<Onboarding onComplete={onComplete} />);
    const user = userEvent.setup();
    const future = new Date(Date.now() + 366 * 86_400_000).toISOString().slice(0, 10);
    await user.clear(screen.getByLabelText('Birth date'));
    await user.type(screen.getByLabelText('Birth date'), future);
    expect(screen.getByRole('button', { name: /Read my energy/i })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /Read my energy/i }));
    expect(onComplete).not.toHaveBeenCalled();
  });
});
