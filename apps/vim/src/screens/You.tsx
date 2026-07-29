// You — the birth details every number in the app is derived from, and the switches that
// change what the app is allowed to claim. Nothing here is cosmetic except Display.

import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { NAKSHATRAS, SIGN_NAMES } from '@aura/engine';
import { Inset, Pressable } from '../components/neu';
import { CONFIDENCE_EFFECT, CONFIDENCE_LABEL, courtAt, deepestTrustworthy, type BirthTimeConfidence } from '../core/court';
import { shortDate } from '../core/time';
import { formatOffset } from '../services/geo';
import { DEFAULT_API_BASE, apiBase, setApiBase } from '../services/api';
import { PLANET } from '../theme/tokens';
import { useVim } from '../store/useVim';
import { useNow } from '../hooks/useNow';

const CONFIDENCES: BirthTimeConfidence[] = ['exact', 'within15min', 'within1hour', 'unknown'];

export function You() {
  const {
    birth, chart, confidence, displayName, tzId, prefs, user, authStatus,
    setConfidence, setPrefs, logout, showSignIn, deleteEverything, go,
  } = useVim();
  const now = useNow(60_000);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [server, setServer] = useState(apiBase());

  const seats = useMemo(
    () => (chart ? courtAt(chart, now, confidence) : []),
    [chart, now, confidence],
  );
  const king = seats[0];
  const pm = seats[1];

  if (!birth) return null;

  const nak = chart ? NAKSHATRAS[chart.moonNakshatra] : undefined;

  return (
    <div className="screen-scroll">
      <header className="screen-head">
        <h1 className="t-page-title">{displayName || 'You'}</h1>
        {king && (
          <p className="t-sub">
            <span style={{ color: PLANET[king.lord].ring }}>{PLANET[king.lord].name}</span> King
            {pm && pm.visibility !== 'hidden' && (
              <>
                {' · '}
                <span style={{ color: PLANET[pm.lord].ring }}>{PLANET[pm.lord].name}</span> Prime Minister
              </>
            )}
          </p>
        )}
      </header>

      <Section label="Birth details">
        <Row label="Date" value={shortDate(new Date(`${birth.date}T12:00:00`))} />
        <Row
          label="Time"
          value={birth.unknownTime ? 'noon (placeholder)' : (birth.time ?? '—')}
        />
        <Row label="Place" value={birth.place} />
        <Row
          label="Offset used"
          value={`${formatOffset(birth.tzOffsetMinutes)}${tzId ? ` · ${tzId}` : ''}`}
        />
        <button type="button" className="settings-row" onClick={() => go({ kind: 'onboarding' })}>
          <span>Edit birth details</span>
          <ChevronRight size={16} className="court-chevron" aria-hidden />
        </button>
        <p className="t-duration-note settings-note">
          Editing these rebuilds your chart. Every date in the app moves with it.
        </p>
      </Section>

      <Section label="How exact is your birth time?">
        <div className="stack" style={{ gap: 8 }}>
          {CONFIDENCES.map((c) => (
            <Pressable
              key={c}
              className="choice"
              aria-pressed={confidence === c}
              onClick={() => setConfidence(c)}
            >
              <span className="choice-radio" data-on={confidence === c} aria-hidden />
              <span className="choice-label">{CONFIDENCE_LABEL[c]}</span>
            </Pressable>
          ))}
        </div>
        <Inset soft className="effect-note">
          <p className="t-sub" style={{ margin: 0 }}>{CONFIDENCE_EFFECT[confidence]}</p>
        </Inset>
        {/* The arithmetic, stated plainly, so the setting reads as a fact and not caution. */}
        <table className="drift-table">
          <caption className="t-duration-note">
            How far every boundary in your chart moves per minute of birth-time error
          </caption>
          <tbody>
            {[
              ['± 1 minute', '± 5 days'],
              ['± 15 minutes', '± 75 days'],
              ['± 1 hour', '± 10 months'],
            ].map(([k, v]) => (
              <tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="t-duration-note settings-note">
          Deepest ruler we'll state as fact: <strong>{deepestTrustworthy(confidence).label}</strong>.
        </p>
      </Section>

      {chart && (
        <Section label="Your chart">
          <Row label="Moon nakṣatra" value={nak ? `${nak.name} · pada ${chart.moonPada}` : '—'} />
          <Row label="Moon sign" value={SIGN_NAMES[chart.moonSign] ?? '—'} />
          <Row label="Ascendant" value={SIGN_NAMES[chart.lagnaSign] ?? '—'} />
          <Row label="Ayanāṁśa" value={`Lahiri · ${chart.ayanamsa.toFixed(4)}°`} />
          <Row
            label="Precision"
            value={chart.precision === 'full' ? 'full (timed chart)' : 'solar (no birth time)'}
          />
        </Section>
      )}

      <Section label="Display">
        <label className="settings-row" htmlFor="sanskrit-toggle">
          <span>Show Sanskrit terms</span>
          <input
            id="sanskrit-toggle"
            type="checkbox"
            className="switch"
            checked={prefs.showSanskrit}
            onChange={(e) => setPrefs({ showSanskrit: e.target.checked })}
          />
        </label>
        <p className="t-duration-note settings-note">
          Reduce motion follows your system setting.
        </p>
      </Section>

      <Section label="Account">
        {authStatus === 'authed' && user ? (
          <>
            <Row label="Signed in as" value={user.email} />
            <button type="button" className="settings-row" onClick={logout}>
              <span>Sign out</span>
              <ChevronRight size={16} className="court-chevron" aria-hidden />
            </button>
          </>
        ) : (
          <>
            <p className="t-sub settings-note">
              This chart lives only on this device. An account keeps it if you change phones.
            </p>
            <button type="button" className="settings-row" onClick={showSignIn}>
              <span>Save my chart to an account</span>
              <ChevronRight size={16} className="court-chevron" aria-hidden />
            </button>
          </>
        )}
        <Inset className="field" style={{ marginTop: 10 }}>
          <input
            className="field-input"
            type="url"
            value={server}
            onChange={(e) => setServer(e.target.value)}
            onBlur={() => setApiBase(server)}
            aria-label="Server address"
            placeholder={DEFAULT_API_BASE}
          />
        </Inset>
        <p className="t-duration-note settings-note">
          Server address. A phone can't reach “localhost” — point this at your computer's
          address on the same network.
        </p>
      </Section>

      <Section label="Data">
        {!confirmDelete ? (
          <button type="button" className="settings-row danger" onClick={() => setConfirmDelete(true)}>
            <span>Delete everything</span>
            <ChevronRight size={16} className="court-chevron" aria-hidden />
          </button>
        ) : (
          <Inset soft className="effect-note">
            <p className="t-sub" style={{ margin: 0 }}>
              This removes your birth details and your chart from this device
              {authStatus === 'authed' ? ' and deletes your account on the server' : ''}. It
              can't be undone.
            </p>
            <div className="row-actions">
              <Pressable variant="flat" onClick={() => setConfirmDelete(false)}>Cancel</Pressable>
              <Pressable className="danger-btn" onClick={deleteEverything}>Delete</Pressable>
            </div>
          </Inset>
        )}
        <p className="t-duration-note settings-note">
          Your birth date, time and place are never sent to analytics or crash reporting.
        </p>
      </Section>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="settings-section deferred">
      <h2 className="t-section-label">{label}</h2>
      <div className="neu-raised settings-card">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="settings-row">
      <span className="settings-key">{label}</span>
      <span className="settings-val">{value}</span>
    </div>
  );
}
