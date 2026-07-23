import type { PhaseWindows, ReadingInput } from '@aura/engine';
import { AuraOrb } from '../components/AuraOrb';
import { PlanetTag } from '../components/PlanetTag';
import { Button } from '@/components/ui/button';
import { energyColor, energyLabel, energyGloss, fmtMonYY } from '../ui';

export function Today({ input, phases, todayLine, remedyShort, onOpenReading, onCheckin }: {
  input: ReadingInput;
  now: Date;
  phases: PhaseWindows | null;
  todayLine: string;
  remedyShort: string;
  onOpenReading: () => void;
  onCheckin: () => void;
}) {
  // Major = mahadasha, Passing = antardasha (from phases; fall back to the reading input).
  const major = phases?.major.energy ?? input.majorEnergy;
  const passing = phases?.passing.energy ?? input.passingEnergy;

  return (
    <div className="today-hero">
      <div className="today-stage">
      <div className="today-orb">
        <AuraOrb e1={energyColor(major)} e2={energyColor(passing)} size={210} />
        <div className="blend">
          <div className="en">
            <div className="label">Major energy · mahadasha</div>
            <div className="name" style={{ color: energyColor(major) }}>{energyLabel(major).toUpperCase()}</div>
            <PlanetTag energy={major} />
            <div className="gloss">{energyGloss(major).split('·')[0]!.trim()}</div>
            {phases ? (
              <div className="phase-dates">{fmtMonYY(phases.major.start)} – {fmtMonYY(phases.major.end)}</div>
            ) : null}
          </div>
          <div className="en">
            <div className="label">Passing · antardasha</div>
            <div className="name" style={{ color: energyColor(passing) }}>{energyLabel(passing).toUpperCase()}</div>
            <PlanetTag energy={passing} />
            <div className="gloss">{energyGloss(passing).split('·')[0]!.trim()}</div>
            {phases ? (
              <div className="phase-dates">{fmtMonYY(phases.passing.start)} – {fmtMonYY(phases.passing.end)}</div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="today-body">
        <div className="today-line">{todayLine}</div>
        <div className="remedy-pill" onClick={onCheckin} role="button" title="Tune today's reading">
          <span className="ring" />
          <div className="txt">
            <div className="rl">Today’s remedy</div>
            <div className="rv">{remedyShort}</div>
          </div>
        </div>
        <div className="today-cta">
          <Button onClick={onOpenReading}>Open today’s reading <span>→</span></Button>
          <Button variant="ghost" onClick={onCheckin} style={{ marginTop: 6 }}>New Challenge Again? I Can Explain!</Button>
        </div>
      </div>
      </div>
    </div>
  );
}
