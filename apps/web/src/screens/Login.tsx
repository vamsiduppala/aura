import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function Login({ busy, error, onLogin, onRegister, onGuest }: {
  busy: boolean;
  error: string | null;
  onLogin: (email: string, password: string) => void;
  onRegister: (email: string, password: string) => void;
  onGuest: () => void;
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    (mode === 'login' ? onLogin : onRegister)(email.trim(), password);
  };

  return (
    <div className="view auth-view">
      <div className="auth-card">
        <div className="wordmark"><span className="glyph" /> aura</div>
        <h2 className="auth-h">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <p className="auth-sub">
          {mode === 'login'
            ? 'Sign in to sync your chart across this device.'
            : 'One honest reading a day — your birth details stay on your machine.'}
        </p>

        <form onSubmit={submit} className="auth-form">
          <label className="auth-field">
            <span>Email</span>
            <input type="email" autoComplete="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <label className="auth-field">
            <span>Password</span>
            <input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required minLength={8} value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="at least 8 characters" />
          </label>

          {error ? <div className="auth-error">{error}</div> : null}

          <Button type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'One moment…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? (
            <>New here? <button className="linklike" onClick={() => setMode('register')}>Create an account</button></>
          ) : (
            <>Already have an account? <button className="linklike" onClick={() => setMode('login')}>Sign in</button></>
          )}
        </div>

        <div className="auth-divider"><span>or</span></div>
        <Button variant="ghost" onClick={onGuest} style={{ width: '100%' }}>Continue on this device only</Button>
      </div>
    </div>
  );
}
