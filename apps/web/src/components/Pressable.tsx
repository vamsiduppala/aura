import type { ReactNode } from 'react';

/** A visually-unchanged element that is keyboard-operable (Enter/Space) + a toggle role.
 *  Used for the chips/tiles that were click-only spans. */
export function Pressable({ className, active, onPress, children }: {
  className?: string;
  active?: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className={className}
      role="button"
      tabIndex={0}
      aria-pressed={active}
      onClick={onPress}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPress(); }
      }}
    >
      {children}
    </div>
  );
}
