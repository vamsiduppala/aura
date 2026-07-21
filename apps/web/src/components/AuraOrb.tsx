import { orbVars } from '../ui';

/** The signature two-tone aura orb (SPEC §9). Colors = the two active energies. */
export function AuraOrb({ e1, e2, size = 186 }: { e1: string; e2: string; size?: number }) {
  return (
    <div className="orb-wrap">
      <div className="orb" style={orbVars(e1, e2, size)} />
    </div>
  );
}

export function OrbChip({ e1, e2, size = 44 }: { e1: string; e2: string; size?: number }) {
  return <div className="orb-chip" style={orbVars(e1, e2, size)} />;
}
