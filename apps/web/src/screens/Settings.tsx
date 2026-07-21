import { DISCLAIMER } from '@aura/engine';
import { StatusBar } from '../components/Chrome';

/** About / privacy / delete (SPEC §11.1, §11.6). */
export function Settings({ place, onDelete, onBack }: {
  place: string; onDelete: () => void; onBack: () => void;
}) {
  return (
    <>
      <StatusBar />
      <div className="view" style={{ padding: '10px 26px 26px' }}>
        <div className="s3-top" style={{ padding: 0, marginBottom: 20 }}>
          <button className="back" onClick={onBack}>‹</button>
          <span className="ttl">Settings</span>
          <span style={{ width: 22 }} />
        </div>

        <div className="qh" style={{ marginBottom: 10 }}>What aura is</div>
        <p className="body" style={{ marginBottom: 26 }}>{DISCLAIMER}</p>

        <div className="qh" style={{ marginBottom: 10 }}>Your data</div>
        <p className="body" style={{ marginBottom: 8 }}>
          Your birth details ({place}) live only on this device. We never sell or share them,
          and nothing sensitive leaves your phone.
        </p>
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
