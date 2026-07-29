import { CircleUser, MessageCircle, Route, Target } from 'lucide-react';
import type { Tab } from '../store/useVim';

const TABS: { tab: Tab; label: string; Icon: typeof Route }[] = [
  // A route line, not a calendar — calendars imply appointments; this is direction.
  { tab: 'planner', label: 'Planner', Icon: Route },
  { tab: 'timeline', label: 'Timeline', Icon: Target },
  // A speech mark, not a robot.
  { tab: 'mentor', label: 'Mentor', Icon: MessageCircle },
  { tab: 'you', label: 'You', Icon: CircleUser },
];

interface TabBarProps {
  active: Tab;
  onSelect: (tab: Tab) => void;
}

export function TabBar({ active, onSelect }: TabBarProps) {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map(({ tab, label, Icon }) => (
        <button
          key={tab}
          type="button"
          className="tabbar-item"
          aria-current={active === tab ? 'page' : undefined}
          onClick={() => onSelect(tab)}
        >
          <Icon size={20} strokeWidth={active === tab ? 2.2 : 1.7} aria-hidden />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
