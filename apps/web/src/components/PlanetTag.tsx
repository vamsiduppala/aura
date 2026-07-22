import type { Energy, Graha } from '@aura/engine';
import { grahaColor, grahaLabel, grahaOfEnergy } from '../ui';

/** A small colour-dot + classical planet name, shown alongside an energy word.
 *  Pass either an `energy` (mapped to its ruling graha) or a `graha` directly. */
export function PlanetTag({
  energy, graha, size = 7, nameStyle,
}: { energy?: Energy; graha?: Graha; size?: number; nameStyle?: React.CSSProperties }) {
  const g: Graha = graha ?? (energy ? grahaOfEnergy(energy) : 'sun');
  const c = grahaColor(g);
  return (
    <span className="planet-tag">
      <span
        className="planet-dot"
        style={{ width: size, height: size, background: c, boxShadow: `0 0 6px -1px ${c}` }}
      />
      <span className="planet-name" style={{ color: c, ...nameStyle }}>{grahaLabel(g)}</span>
    </span>
  );
}
