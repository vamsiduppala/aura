import { useEffect, useMemo } from 'react';
import { Avatar } from './components/Avatar';
import { Nav } from './components/Nav';
import { Mentor } from './screens/Mentor';
import { NewPlan } from './screens/NewPlan';
import { OfficeDetail } from './screens/OfficeDetail';
import { Onboarding } from './screens/Onboarding';
import { PlanDetail } from './screens/PlanDetail';
import { Planner } from './screens/Planner';
import { SignIn } from './screens/SignIn';
import { StageDetail } from './screens/StageDetail';
import { Timeline } from './screens/Timeline';
import { Welcome } from './screens/Welcome';
import { You } from './screens/You';
import { courtAt } from './core/court';
import { useNow } from './hooks/useNow';
import { useVim } from './store/useVim';

const TITLES: Record<string, string> = {
  planner: 'Plans',
  timeline: 'Timeline',
  mentor: 'Mentor',
  you: 'Account',
};

export function App() {
  const {
    route, tab, birth, chart, confidence, displayName, authStatus, initAuth, setTab, go,
  } = useVim();

  useEffect(() => { void initAuth(); }, [initAuth]);

  // Cold-launch deep links: vim://timeline/office/2 → the Governor's detail page, and the
  // web equivalent #/office/2. The most commonly broken path in any app, so it is handled in
  // one place and only ever navigates to a page the current chart can actually fill.
  useEffect(() => {
    const apply = () => {
      const m = /^#\/office\/([1-5])$/.exec(location.hash);
      if (m) go({ kind: 'office', level: Number(m[1]) });
    };
    apply();
    addEventListener('hashchange', apply);
    return () => removeEventListener('hashchange', apply);
  }, [go]);

  // The avatar is tinted by whoever currently holds the King, so it changes when the King
  // changes. One 60s clock is plenty for a monogram.
  const clock = useNow(60_000);
  const king = useMemo(
    () => (chart ? courtAt(chart, clock, confidence)[0]?.lord : undefined),
    [chart, clock, confidence],
  );

  if (authStatus === 'loading') {
    return (
      <div className="boot" role="status" aria-live="polite">
        <span className="sr-only">Loading your chart</span>
      </div>
    );
  }

  // Pre-chart routes are full-bleed: no nav, no top bar. Welcome is the website's front
  // door and Onboarding is a wizard — chrome would only offer ways to leave.
  if (route.kind === 'welcome') return <Welcome />;
  if (route.kind === 'signin') return <SignIn />;
  // No birth details means no chart, and no screen has anything real to show without one.
  // There is no sample chart to fall back to, by design.
  if (route.kind === 'onboarding' || !birth) return <Onboarding />;
  // The plan questionnaire is modal for the same reason: a half-finished plan shouldn't be
  // abandonable by a stray tap on a nav item.
  if (route.kind === 'newPlan') return <NewPlan />;

  const onAccount = tab === 'you';

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="topbar-title">{TITLES[tab] ?? 'Vimshottari'}</h1>
        <span className="topbar-spacer" />
        <button
          type="button"
          className="avatar-btn"
          aria-label={onAccount ? 'Account (current)' : 'Account'}
          aria-current={onAccount ? 'page' : undefined}
          onClick={() => setTab('you')}
        >
          <Avatar name={displayName} king={king} />
        </button>
      </header>

      <Nav active={tab} onSelect={setTab} />

      <main className="app-main">
        {route.kind === 'tabs' && tab === 'planner' && <Planner />}
        {route.kind === 'tabs' && tab === 'timeline' && <Timeline />}
        {route.kind === 'tabs' && tab === 'mentor' && <Mentor />}
        {route.kind === 'tabs' && tab === 'you' && <You />}
        {route.kind === 'office' && <OfficeDetail level={route.level} />}
        {route.kind === 'plan' && <PlanDetail id={route.id} />}
        {route.kind === 'stage' && <StageDetail id={route.id} ordinal={route.ordinal} />}
      </main>
    </div>
  );
}
