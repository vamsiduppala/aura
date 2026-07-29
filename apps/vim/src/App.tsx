import { useEffect } from 'react';
import { TabBar } from './components/TabBar';
import { Mentor } from './screens/Mentor';
import { OfficeDetail } from './screens/OfficeDetail';
import { Onboarding } from './screens/Onboarding';
import { Planner } from './screens/Planner';
import { SignIn } from './screens/SignIn';
import { Timeline } from './screens/Timeline';
import { Welcome } from './screens/Welcome';
import { You } from './screens/You';
import { useVim } from './store/useVim';

export function App() {
  const { route, tab, birth, authStatus, initAuth, setTab, go } = useVim();

  useEffect(() => { void initAuth(); }, [initAuth]);

  // Cold-launch deep links: vim://timeline/office/2 → the Governor's detail page, and the
  // web equivalent /#/office/2. The most commonly broken path in any app, so it is handled
  // in one place and only ever navigates to a page the current chart can actually fill.
  useEffect(() => {
    const apply = () => {
      const m = /^#\/office\/([1-5])$/.exec(location.hash);
      if (m) go({ kind: 'office', level: Number(m[1]) });
    };
    apply();
    addEventListener('hashchange', apply);
    return () => removeEventListener('hashchange', apply);
  }, [go]);

  if (authStatus === 'loading') {
    return (
      <div className="screen boot" role="status" aria-live="polite">
        <span className="sr-only">Loading your chart</span>
      </div>
    );
  }

  if (route.kind === 'welcome') return <Welcome />;
  if (route.kind === 'signin') return <SignIn />;
  // No birth details means no chart, and no screen in the app has anything real to show
  // without one. There is no sample chart to fall back to, by design.
  if (route.kind === 'onboarding' || !birth) return <Onboarding />;

  if (route.kind === 'office') {
    return (
      <div className="screen">
        <OfficeDetail level={route.level} />
        <TabBar active={tab} onSelect={setTab} />
      </div>
    );
  }

  return (
    <div className="screen">
      {tab === 'planner' && <Planner />}
      {tab === 'timeline' && <Timeline />}
      {tab === 'mentor' && <Mentor />}
      {tab === 'you' && <You />}
      <TabBar active={tab} onSelect={setTab} />
    </div>
  );
}
