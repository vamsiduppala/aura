import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

// Loading, empty and error states.
//
// Skeletons are shaped like the content that is coming — the pattern Stripe, Linear and Notion
// use — because a placeholder that previews the layout reads as "almost there", while a spinner
// just reads as "wait" and gets more anxious the longer it spins.
//
// Empty and error states never dead-end. Each one says what happened, why, and gives exactly one
// obvious next action.

/** A single shimmering line. `w` is any CSS width. */
export function SkLine({ w = '100%', h = 11 }: { w?: string; h?: number }) {
  return <div className="sk sk-line" style={{ width: w, height: h }} aria-hidden />;
}

/** Wraps skeleton content with the right accessibility semantics. */
export function Loading({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Blueprint: planet strip, portrait cards, then the house grid — the real shape of that page. */
export function BlueprintSkeleton() {
  return (
    <Loading label="Building your chart">
      <div className="sk-card" style={{ marginBottom: 'var(--sp-6)' }}>
        <div className="sk-row" style={{ flexWrap: 'wrap', gap: 'var(--sp-4)' }}>
          {Array.from({ length: 9 }, (_, i) => <SkLine key={i} w="66px" h={13} />)}
        </div>
      </div>
      <div className="sk-grid" style={{ marginBottom: 'var(--sp-6)' }}>
        {Array.from({ length: 4 }, (_, i) => (
          <div className="sk-card" key={i}>
            <div className="sk sk-title" />
            <SkLine /><SkLine w="92%" /><SkLine w="74%" />
          </div>
        ))}
      </div>
      <div className="sk-grid">
        {Array.from({ length: 6 }, (_, i) => (
          <div className="sk-card" key={i}>
            <div className="sk-row" style={{ marginBottom: 'var(--sp-3)' }}>
              <div className="sk sk-dot" />
              <div style={{ flex: 1 }}><SkLine w="55%" /><SkLine w="35%" h={9} /></div>
            </div>
            <SkLine /><SkLine w="88%" />
          </div>
        ))}
      </div>
    </Loading>
  );
}

/** Today: the orb with the two energy blocks and the reading beside it. */
export function TodaySkeleton() {
  return (
    <Loading label="Reading your timing">
      <div style={{ display: 'flex', gap: 'var(--sp-9)', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', paddingTop: 'var(--sp-7)' }}>
        <div>
          <div className="sk sk-orb" />
          <div style={{ display: 'flex', gap: 'var(--sp-5)', marginTop: 'var(--sp-5)' }}>
            {[0, 1].map((i) => (
              <div key={i} style={{ width: 120 }}>
                <SkLine w="70%" h={9} /><SkLine w="90%" h={15} /><SkLine w="55%" h={9} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: '1 1 320px', maxWidth: 420 }}>
          <SkLine w="80%" h={30} /><SkLine w="60%" h={30} />
          <div className="sk-card" style={{ marginTop: 'var(--sp-5)' }}><SkLine w="40%" h={9} /><SkLine w="85%" /></div>
          <div className="sk" style={{ height: 52, borderRadius: 'var(--r-xl)', marginTop: 'var(--sp-4)' }} />
        </div>
      </div>
    </Loading>
  );
}

/** Forecast: the explainer block, the season card, then period paragraphs. */
export function ForecastSkeleton() {
  return (
    <Loading label="Working out your forecast">
      <div className="sk-card" style={{ marginBottom: 'var(--sp-6)' }}>
        <SkLine /><SkLine w="86%" /><SkLine w="45%" />
      </div>
      <div className="sk-card" style={{ marginBottom: 'var(--sp-6)' }}>
        <div className="sk sk-title" /><SkLine /><SkLine w="93%" /><SkLine w="70%" />
        <div className="sk" style={{ height: 5, borderRadius: 'var(--r-full)', marginTop: 'var(--sp-4)' }} />
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <div className="sk-card" key={i} style={{ marginBottom: 'var(--sp-3)' }}>
          <SkLine w="30%" h={9} /><SkLine w="50%" h={16} /><SkLine /><SkLine w="80%" />
        </div>
      ))}
    </Loading>
  );
}

/** Inline skeleton for a section that loads after the page (e.g. live timing systems). */
export function SectionSkeleton({ lines = 3, label }: { lines?: number; label: string }) {
  return (
    <Loading label={label}>
      <div style={{ paddingTop: 'var(--sp-3)' }}>
        {Array.from({ length: lines }, (_, i) => <SkLine key={i} w={`${100 - i * 12}%`} />)}
      </div>
    </Loading>
  );
}

/** A state that never dead-ends: what happened, why, and the one next action. */
export function EmptyState({ title, body, hint, actionLabel, onAction, secondaryLabel, onSecondary }: {
  title: string;
  body: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    <div className="state">
      <div className="state-icon" aria-hidden />
      <div className="state-title">{title}</div>
      <p className="state-body">{body}</p>
      {(actionLabel || secondaryLabel) ? (
        <div className="state-actions">
          {actionLabel && onAction ? <Button size="sm" onClick={onAction} className="!w-auto px-5">{actionLabel}</Button> : null}
          {secondaryLabel && onSecondary ? (
            <Button size="sm" variant="ghost" onClick={onSecondary} className="!w-auto px-5">{secondaryLabel}</Button>
          ) : null}
        </div>
      ) : null}
      {hint ? <div className="state-hint">{hint}</div> : null}
    </div>
  );
}

/** Error state — says what broke in human terms and offers a real way out. */
export function ErrorState({ title = 'That didn’t compute', detail, onRetry, onReset }: {
  title?: string; detail?: string; onRetry?: () => void; onReset?: () => void;
}) {
  return (
    <div className="state">
      <div className="state-icon" style={{ background: 'radial-gradient(circle at 35% 30%, var(--forge), #2a2c46 78%)' }} aria-hidden />
      <div className="state-title">{title}</div>
      <p className="state-body">
        Something in the calculation didn’t work. This is almost always the birth details —
        an impossible date, or a place that didn’t resolve properly.
      </p>
      <div className="state-actions">
        {onRetry ? <Button size="sm" onClick={onRetry} className="!w-auto px-5">Check my birth details</Button> : null}
        {onReset ? <Button size="sm" variant="ghost" onClick={onReset} className="!w-auto px-5">Start over</Button> : null}
      </div>
      {detail ? <div className="state-hint" style={{ wordBreak: 'break-word' }}>{detail}</div> : null}
    </div>
  );
}
