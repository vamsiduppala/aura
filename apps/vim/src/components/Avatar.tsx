// The account avatar: a monogram, not an upload.
//
// It is tinted with the colour of whoever currently holds the King. That is deliberate on
// three counts: it needs no storage, no CDN and no moderation queue; it is always present so
// there is no empty-state to design; and it *changes when the King changes*, which teaches
// the core idea of the app without a word of copy.

import { PLANET } from '../theme/tokens';
import type { Graha } from '@aura/engine';

/** Up to two initials from a display name. Falls back to a neutral mark, never to "?" */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

interface AvatarProps {
  name: string;
  /** The current King. Undefined before a chart exists — the mark stays brass then. */
  king?: Graha | undefined;
  size?: number;
}

export function Avatar({ name, king, size = 38 }: AvatarProps) {
  const tint = king ? PLANET[king].ring : 'var(--brass-base)';
  const ink = king ? PLANET[king].tabInk : 'var(--brass-bright)';
  const fill = king ? PLANET[king].tabFill : 'var(--brass-well)';
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        background: fill,
        color: ink,
        borderColor: tint,
        fontSize: Math.round(size * 0.38),
      }}
      aria-hidden
    >
      {initialsOf(name)}
    </span>
  );
}
