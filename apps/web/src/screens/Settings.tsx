import { useEffect, useState } from 'react';
import { DISCLAIMER } from '@aura/engine';
import { hasUserKey, setGeminiKey, clearGeminiKey } from '../services/chat';
import { apiReachable, API_BASE } from '../services/api';
import { Button } from '@/components/ui/button';

/** About / privacy / delete + Cosmic Mentor key (SPEC §11.1, §11.6). */
export function Settings({ place, account, canEdit, onDelete, onBack, onLogout, onSignIn, onEdit, onAccount }: {
  place: string;
  account: { email: string } | 'guest';
  canEdit: boolean;
  onDelete: () => void; onBack: () => void; onLogout: () => void; onSignIn: () => void;
  onEdit: () => void; onAccount: () => void;
}) {
  const [keyInput, setKeyInput] = useState('');
  const [saved, setSaved] = useState(hasUserKey());
  const [backend, setBackend] = useState<'checking' | 'up' | 'down'>('checking');
  useEffect(() => { let a = true; apiReachable().then((ok) => { if (a) setBackend(ok ? 'up' : 'down'); }); return () => { a = false; }; }, []);

  const save = () => {
    if (!keyInput.trim()) return;
    setGeminiKey(keyInput.trim());
    setKeyInput(''); setSaved(true);
  };
  const clear = () => { clearGeminiKey(); setSaved(false); };

  return (
    <>
      <div className="view" style={{ paddingTop: 6 }}>
        <div className="s3-top" style={{ padding: 0, marginBottom: 20 }}>
          <button className="back" onClick={onBack}>‹</button>
          <span className="ttl">Settings</span>
          <span style={{ width: 22 }} />
        </div>

        <div className="qh" style={{ marginBottom: 10 }}>Account</div>
        {account === 'guest' ? (
          <>
            <p className="body" style={{ marginBottom: 8 }}>You’re using aura on this device only. Sign in to keep your chart safe and sync it.</p>
            <Button size="sm" onClick={onSignIn} className="!w-auto px-5" style={{ marginBottom: 26 }}>Sign in or create an account</Button>
          </>
        ) : (
          <>
            <p className="body" style={{ marginBottom: 8 }}>Signed in as <b style={{ color: 'var(--mist)' }}>{account.email}</b>. Your profile is saved to your local aura server.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 26 }}>
              <Button size="sm" onClick={onAccount} className="!w-auto px-5">Manage account</Button>
              <Button size="sm" variant="ghost" onClick={onLogout} className="!w-auto px-5">Sign out</Button>
            </div>
          </>
        )}

        <div className="qh" style={{ marginBottom: 10 }}>Local aura server</div>
        <p className="body" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', flex: 'none', background: backend === 'up' ? 'var(--bloom)' : backend === 'down' ? 'var(--forge)' : 'var(--mist-3)' }} />
          {backend === 'checking' ? 'Checking…' : backend === 'up'
            ? 'Connected — your chart, timing systems and mentor run against the local backend.'
            : 'Not running — aura works on-device. Start it with: npm --workspace @aura/api run start'}
        </p>
        <p className="disclaimer" style={{ textAlign: 'left', padding: 0, marginBottom: 26 }}>{API_BASE}</p>

        <div className="qh" style={{ marginBottom: 10 }}>What aura is</div>
        <p className="body" style={{ marginBottom: 26 }}>{DISCLAIMER}</p>

        <div className="qh" style={{ marginBottom: 10 }}>Cosmic Mentor</div>
        <p className="body" style={{ marginBottom: 10 }}>
          The Mentor always answers from your real reading. Add your own Gemini API key to get
          warmer, LLM-narrated replies — {saved ? 'a key is set.' : 'otherwise it runs in grounded offline mode.'}
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)}
            placeholder={saved ? '•••••• (key set — paste to replace)' : 'Paste a Gemini API key'}
            aria-label="Gemini API key"
            style={{ flex: 1, minWidth: 0, background: 'var(--card)', border: '1px solid var(--line-2)', borderRadius: 12, padding: '12px 14px', color: 'var(--mist)', fontFamily: 'var(--sans)', fontSize: 14, outline: 'none' }}
          />
          <Button size="sm" onClick={save} disabled={!keyInput.trim()} className="!w-auto shrink-0 px-5">Save</Button>
        </div>
        {saved ? <button className="btn ghost" onClick={clear} style={{ textAlign: 'left', padding: '2px 0' }}>Remove my key</button> : null}
        <p className="disclaimer" style={{ textAlign: 'left', padding: 0, margin: '6px 0 26px' }}>
          Stored only in this browser. A client-side key is visible in the page — use a throwaway/
          restricted key here; production proxies this through a server.
        </p>

        <div className="qh" style={{ marginBottom: 10 }}>Your data</div>
        <p className="body" style={{ marginBottom: 8 }}>
          Your birth details ({place}) live only on this device{account === 'guest' ? '' : ' and your local aura server'}.
          We never sell or share them, and nothing sensitive leaves your phone.
        </p>
        {canEdit ? <Button size="sm" onClick={onEdit} className="!w-auto px-5" style={{ marginBottom: 8 }}>Edit birth details</Button> : null}
        <p className="disclaimer" style={{ textAlign: 'left', padding: 0, marginBottom: 26 }}>
          On this web preview they’re stored in your browser’s local storage. The mobile app uses
          the device’s encrypted secure storage.
        </p>

        <button
          className="btn"
          style={{ background: 'transparent', color: 'var(--forge)', border: '1px solid rgba(255,110,88,0.4)', boxShadow: 'none' }}
          onClick={() => { if (confirm('Delete everything? This removes your birth details and readings from this device.')) onDelete(); }}
        >
          Delete everything
        </button>
        <div className="fineprint" style={{ marginTop: 12 }}>One tap. Gone. No account, nothing to recover.</div>
      </div>
    </>
  );
}
