import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../components/ErrorBoundary';

function Boom(): never { throw new Error('boom'); }

describe('ErrorBoundary', () => {
  it('renders a calm recovery instead of a white screen when a child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary><Boom /></ErrorBoundary>);
    expect(screen.getByText(/Something slipped/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reload/i })).toBeInTheDocument();
    spy.mockRestore();
  });

  it('renders children normally when there is no error', () => {
    render(<ErrorBoundary><div>all good</div></ErrorBoundary>);
    expect(screen.getByText('all good')).toBeInTheDocument();
  });
});
