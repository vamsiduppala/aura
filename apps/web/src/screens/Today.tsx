import type { ReadingInput } from '@aura/engine';
import { AuraOrb } from '../components/AuraOrb';
import { Button } from '@/components/ui/button';
import { energyColor, energyLabel, energyGloss } from '../ui';

export function Today({ input, todayLine, remedyShort, onOpenReading, onCheckin }: {
  input: ReadingInput;
  now: Date;
  todayLine: string;
  remedyShort: string;
  onOpenReading: () => void;
  onCheckin: () => void;
}) {
  const major = input.majorEnergy;
  const passing = input.passingEnergy;

  return (
    <div className="today-hero">
      <div className="today-orb">
        <AuraOrb e1={energyColor(major)} e2={energyColor(passing)} size={210} />
        <div className="blend">
          <div className="en">
            <div className="label">Major energy</div>
            <div className="name" style={{ color: energyColor(major) }}>{energyLabel(major).toUpperCase()}</div>
            <div className="gloss">{energyGloss(major).split('·')[0]!.trim()}</div>
          </div>
          <div className="en">
            <div className="label">Passing through</div>
            <div className="name" style={{ color: energyColor(passing) }}>{energyLabel(passing).toUpperCase()}</div>
            <div className="gloss">{energyGloss(passing).split('·')[0]!.trim()}</div>
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
          <Button variant="ghost" onClick={onCheckin} style={{ marginTop: 6 }}>new challenge again? i can explain!</Button>
        </div>
      </div>
    </div>
  );
}
