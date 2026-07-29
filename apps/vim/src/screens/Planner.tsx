// Planner — plans, timed against the chart and cut into stages by real daśā boundaries.
//
// Plans are stored as their INPUTS only (category, situation, horizon), never as computed
// dates. Stages are re-derived from the tree on every render, so an engine fix can never
// leave behind stale rows that look indistinguishable from good ones.

import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Pressable } from '../components/neu';
import { courtAt } from '../core/court';
import { useNow } from '../hooks/useNow';
import { PLANET } from '../theme/tokens';
import { useVim } from '../store/useVim';

export function Planner() {
  const { chart, confidence, setTab } = useVim();
  const now = useNow(60_000);
  const seats = useMemo(
    () => (chart ? courtAt(chart, now, confidence) : []),
    [chart, now, confidence],
  );
  const king = seats[0];
  const pm = seats[1];

  return (
    <div className="screen-scroll">
      <header className="screen-head screen-head-row">
        <div>
          <h1 className="t-page-title">Plans</h1>
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
        </div>
        <Pressable aria-label="New plan" className="head-add" disabled>
          <Plus size={20} aria-hidden />
        </Pressable>
      </header>

      <div className="empty-state neu-raised">
        <h2 className="t-plan-title">Nothing planned yet.</h2>
        <p className="t-body">
          A plan takes something you want to move on and cuts it into stages along your own
          daśā boundaries — so you know which stretch rewards pushing and which one doesn't.
        </p>
        <p className="t-duration-note">
          Plan creation is the next thing being built. Until then, the Timeline is complete
          and works offline.
        </p>
        <Pressable variant="primary" onClick={() => setTab('timeline')}>
          See my timeline
        </Pressable>
      </div>
    </div>
  );
}
