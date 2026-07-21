import { SUPPORT_MESSAGE, SUPPORT_RESOURCES } from '@aura/engine';

/** Shown instead of a reading when free text signals crisis (SPEC §11.3). */
export function Support({ onBack }: { onBack: () => void }) {
  return (
    <>
      <div className="view" style={{ paddingTop: 24 }}>
        <div className="s3-top" style={{ padding: 0, marginBottom: 20 }}>
          <button className="back" onClick={onBack}>‹</button>
          <span className="ttl">A moment</span>
          <span style={{ width: 22 }} />
        </div>
        <div className="serif-h" style={{ fontSize: 28, marginBottom: 16 }}>You’re not alone in this.</div>
        <p className="body" style={{ marginBottom: 24 }}>{SUPPORT_MESSAGE}</p>
        {SUPPORT_RESOURCES.map((r) => (
          <div key={r.region} className="field" style={{ borderBottom: '1px solid var(--line)' }}>
            <div>
              <div className="label" style={{ marginBottom: 4 }}>{r.region}</div>
              <div style={{ fontSize: 14, color: 'var(--mist)' }}>{r.label}</div>
            </div>
            <div style={{ fontFamily: 'var(--grotesk)', fontSize: 13, color: 'var(--tide)', textAlign: 'right' }}>{r.contact}</div>
          </div>
        ))}
        <div className="cta-zone" style={{ marginTop: 28 }}>
          <button className="btn" onClick={onBack}>Go back</button>
        </div>
      </div>
    </>
  );
}
