import { useState } from 'react';
import type { BirthData, LifeArea } from '@aura/engine';
import { Button } from '@/components/ui/button';
import { Pressable } from '../components/Pressable';
import { changePassword } from '../services/api';
import { PlacePicker, type ResolvedPlace } from '../components/PlacePicker';

const GOALS: { label: string; area: LifeArea }[] = [
  { label: 'Career', area: 'career' },
  { label: 'Wealth', area: 'money' },
  { label: 'Love', area: 'partnership' },
  { label: 'Health', area: 'health' },
  { label: 'Self', area: 'self' },
];

const fieldStyle: React.CSSProperties = {
  width: '100%', background: 'var(--card)', border: '1px solid var(--line-2)', borderRadius: 12,
  padding: '11px 13px', color: 'var(--mist)', fontFamily: 'var(--sans)', fontSize: 14, outline: 'none',
};

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="acct-row">
      <span className="acct-label">{label}</span>
      {children}
      {hint ? <span className="acct-hint">{hint}</span> : null}
    </label>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="acct-section">
      <div className="acct-h">{title}</div>
      {note ? <p className="acct-note">{note}</p> : null}
      {children}
    </section>
  );
}

const TODAY = new Date().toISOString().slice(0, 10);

export function Account({
  account, displayName, birth, goalArea, goalName, memberSince, onSave, onBack, onLogout, onSignIn, onDelete, onDownload,
}: {
  account: { email: string } | 'guest';
  displayName: string;
  birth: BirthData;
  goalArea: LifeArea;
  goalName: string;
  memberSince?: string;
  onSave: (patch: { displayName?: string; goalArea?: LifeArea; goalName?: string; birth?: BirthData }) => void;
  onBack: () => void;
  onLogout: () => void;
  onSignIn: () => void;
  onDelete: () => void;
  onDownload: () => void;
}) {
  // ── Identity + focus ──
  const [name, setName] = useState(displayName);
  const [area, setArea] = useState<LifeArea>(goalArea);
  const [goal, setGoal] = useState(goalName);

  // ── Birth details ──
  const [date, setDate] = useState(birth.date);
  const [time, setTime] = useState(birth.time ?? '12:00');
  const [unknownTime, setUnknownTime] = useState(!!birth.unknownTime);
  const [place, setPlace] = useState<ResolvedPlace | null>({
    place: birth.place, lat: birth.lat, lng: birth.lng,
    tzOffsetMinutes: birth.tzOffsetMinutes, timezone: '',
  });

  const [savedMsg, setSavedMsg] = useState('');
  const flash = (m: string) => { setSavedMsg(m); window.setTimeout(() => setSavedMsg(''), 2600); };

  const birthValid = date >= '1900-01-01' && date <= TODAY && !!place;

  const saveIdentity = () => { onSave({ displayName: name.trim(), goalArea: area, goalName: goal.trim() || 'my goal' }); flash('Profile saved.'); };
  const saveBirth = () => {
    if (!birthValid) return;
    onSave({
      birth: {
        date, time: unknownTime ? undefined : time, unknownTime,
        place: place!.place, lat: place!.lat, lng: place!.lng, tzOffsetMinutes: place!.tzOffsetMinutes,
      },
    });
    flash('Birth details saved — your chart has been recomputed.');
  };

  // ── Password change ──
  const [cur, setCur] = useState(''); const [next, setNext] = useState(''); const [confirmPw, setConfirmPw] = useState('');
  const [pwBusy, setPwBusy] = useState(false); const [pwErr, setPwErr] = useState(''); const [pwOk, setPwOk] = useState('');
  const pwValid = cur.length > 0 && next.length >= 8 && next === confirmPw;
  const submitPassword = async () => {
    if (!pwValid) return;
    setPwBusy(true); setPwErr(''); setPwOk('');
    try {
      await changePassword(cur, next);
      setCur(''); setNext(''); setConfirmPw('');
      setPwOk('Password updated. Other devices have been signed out.');
    } catch (e) { setPwErr((e as Error).message); } finally { setPwBusy(false); }
  };

  const signedIn = account !== 'guest';
  const shownName = name.trim() || (signedIn ? account.email.split('@')[0]! : 'Guest');

  return (
    <div className="view acct" style={{ paddingTop: 6 }}>
      <div className="s3-top" style={{ padding: 0, marginBottom: 18 }}>
        <button className="back" onClick={onBack}>‹</button>
        <span className="ttl">Account</span>
        <span style={{ width: 22 }} />
      </div>

      {/* Identity header */}
      <div className="acct-hero">
        <div className="acct-avatar" aria-hidden>{shownName.slice(0, 1).toUpperCase()}</div>
        <div className="acct-hero-txt">
          <div className="acct-hero-name">{shownName}</div>
          <div className="acct-hero-sub">
            {signedIn ? account.email : 'On this device only — not signed in'}
          </div>
          {signedIn && memberSince ? <div className="acct-hero-meta">Member since {new Date(memberSince).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div> : null}
        </div>
      </div>

      {savedMsg ? <div className="acct-flash">{savedMsg}</div> : null}

      <Section title="Your profile" note="Your name is what aura calls you across the app.">
        <Row label="Your name" hint="Shown in the sidebar and your reading.">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vamsi" maxLength={60} aria-label="Your name" style={fieldStyle} />
        </Row>
        <Row label="What you’re building" hint="Your focus tunes every reading and forecast.">
          <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="my goal" aria-label="Goal name" style={fieldStyle} />
        </Row>
        <div className="chips" style={{ marginTop: 4 }}>
          {GOALS.map((g) => (
            <Pressable key={g.area} className={`chip${area === g.area ? ' on' : ''}`} active={area === g.area} onPress={() => setArea(g.area)}>{g.label}</Pressable>
          ))}
        </div>
        <Button size="sm" onClick={saveIdentity} className="!w-auto px-5" style={{ marginTop: 14 }}>Save profile</Button>
      </Section>

      <Section title="Birth details" note="Your whole chart is computed from these. Changing them recomputes every reading.">
        <div className="acct-grid">
          <Row label="Date of birth">
            <input type="date" value={date} min="1900-01-01" max={TODAY} onChange={(e) => setDate(e.target.value)} aria-label="Date of birth" style={fieldStyle} />
          </Row>
          <Row label="Time of birth" hint={unknownTime ? 'Reading by day — no exact ascendant.' : 'Local clock time at your birthplace.'}>
            <input type="time" value={time} disabled={unknownTime} onChange={(e) => setTime(e.target.value)} aria-label="Time of birth" style={{ ...fieldStyle, opacity: unknownTime ? 0.5 : 1 }} />
          </Row>
        </div>
        <Pressable className="unknown" active={unknownTime} onPress={() => setUnknownTime((v) => !v)}>
          <span className={`box${unknownTime ? ' on' : ''}`} /> I don’t know my birth time
        </Pressable>
        <div className="acct-row">
          <span className="acct-label">Birthplace</span>
          <PlacePicker value={place?.place ?? ''} birthDate={date} birthTime={unknownTime ? undefined : time}
            onResolved={setPlace} ariaLabel="Birthplace" />
          <span className="acct-hint">Pick your city and we work out the coordinates and the exact time-zone offset that applied on your birth date.</span>
        </div>
        <Button size="sm" onClick={saveBirth} disabled={!birthValid} className="!w-auto px-5" style={{ marginTop: 14 }}>Save birth details</Button>
      </Section>

      <Section title="Your full chart" note="A complete, printable record of your kundali — every house, planet, dasha and yoga.">
        <Button size="sm" onClick={onDownload} className="!w-auto px-5">Download my chart report</Button>
      </Section>

      {signedIn ? (
        <Section title="Security" note="Changing your password signs out every other device.">
          <Row label="Current password">
            <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" aria-label="Current password" style={fieldStyle} />
          </Row>
          <div className="acct-grid">
            <Row label="New password" hint="At least 8 characters.">
              <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" aria-label="New password" style={fieldStyle} />
            </Row>
            <Row label="Confirm new password" hint={confirmPw && next !== confirmPw ? 'Passwords don’t match.' : undefined}>
              <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} autoComplete="new-password" aria-label="Confirm new password" style={fieldStyle} />
            </Row>
          </div>
          {pwErr ? <div className="auth-error" style={{ marginTop: 8 }}>{pwErr}</div> : null}
          {pwOk ? <div className="acct-flash" style={{ marginTop: 8 }}>{pwOk}</div> : null}
          <Button size="sm" onClick={submitPassword} disabled={!pwValid || pwBusy} className="!w-auto px-5" style={{ marginTop: 14 }}>
            {pwBusy ? 'Updating…' : 'Update password'}
          </Button>
        </Section>
      ) : (
        <Section title="Sign in" note="You’re using aura on this device only. Create an account to keep your chart safe and sync it.">
          <Button size="sm" onClick={onSignIn} className="!w-auto px-5">Sign in or create an account</Button>
        </Section>
      )}

      <Section title="Session">
        {signedIn
          ? <Button size="sm" variant="ghost" onClick={onLogout} className="!w-auto px-5">Sign out</Button>
          : <p className="acct-note" style={{ margin: 0 }}>Nothing to sign out of — this device is holding your chart.</p>}
      </Section>

      <Section title="Danger zone" note={signedIn
        ? 'Deletes your account, your birth profile and every reading — from this device and your local aura server.'
        : 'Deletes your birth details and readings from this device.'}>
        <button
          className="btn"
          style={{ background: 'transparent', color: 'var(--forge)', border: '1px solid rgba(255,110,88,0.4)', boxShadow: 'none', maxWidth: 260 }}
          onClick={() => { if (confirm('Delete everything? This cannot be undone.')) onDelete(); }}
        >
          Delete everything
        </button>
      </Section>
    </div>
  );
}
