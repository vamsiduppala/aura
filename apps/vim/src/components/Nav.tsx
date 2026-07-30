// Navigation. ONE element, two shapes:
//   · below 1100px it is a floating bar at the bottom, where a thumb can reach it;
//   · at 1100px and above it is a labelled sidebar, where a cursor expects it.
//
// It is the same DOM in both cases. CSS decides the shape (see `.nav` in app.css), because
// two navs in the tree means two sets of focus order, two sets of aria-current, and one of
// them silently rotting.
//
// Three items only — Planner, Timeline, Mentor. Account lives behind the avatar in the top
// bar: a fourth tab would dilute the Mentor, and nobody navigates to settings by thumb.

import { MessageCircle, Route, Target } from 'lucide-react';
import { NAV_TABS } from '../theme/tokens';
import type { Tab } from '../store/useVim';

const META: Record<(typeof NAV_TABS)[number], { label: string; hint: string; Icon: typeof Route }> = {
  // A route line, not a calendar — calendars imply appointments; this is direction.
  planner: { label: 'Planner', hint: 'Your plans, timed against your chart', Icon: Route },
  timeline: { label: 'Timeline', hint: 'Who rules your chart right now', Icon: Target },
  // A speech mark, not a robot.
  mentor: { label: 'Mentor', hint: 'Ask about your timing', Icon: MessageCircle },
};

interface NavProps {
  active: Tab;
  onSelect: (tab: Tab) => void;
}

export function Nav({ active, onSelect }: NavProps) {
  return (
    <nav className="nav" aria-label="Main">
      {/* Only shown in sidebar mode; the bottom bar has no room for a wordmark. */}
      <span className="nav-brand" aria-hidden>
        <svg viewBox="0 0 32 32" className="nav-brand-mark">
          {[14, 10.5, 7].map((r, i) => (
            <circle
              key={r}
              cx="16" cy="16" r={r}
              fill="none"
              stroke="var(--brass-base)"
              strokeWidth="2"
              strokeLinecap="round"
              // Three arcs at different fills: the wordmark is the product, in miniature.
              strokeDasharray={`${2 * Math.PI * r * [0.72, 0.45, 0.6][i]!} ${2 * Math.PI * r}`}
              transform="rotate(-90 16 16)"
            />
          ))}
        </svg>
        <span className="nav-brand-text">Vimshottari</span>
      </span>

      <ul className="nav-items">
        {NAV_TABS.map((tab) => {
          const { label, hint, Icon } = META[tab];
          const on = active === tab;
          return (
            <li key={tab}>
              <button
                type="button"
                className="nav-item"
                aria-current={on ? 'page' : undefined}
                onClick={() => onSelect(tab)}
              >
                <Icon size={20} strokeWidth={on ? 2.2 : 1.7} aria-hidden />
                <span className="nav-label">{label}</span>
                {/* Sidebar mode has room to say what each destination is for. */}
                <span className="nav-hint">{hint}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="nav-foot" aria-hidden>
        Conditions, not outcomes.
      </p>
    </nav>
  );
}
