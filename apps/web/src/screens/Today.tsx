import type { ReadingInput } from '@aura/engine';
import { generateTodayLine, generateRemedyShort } from '@aura/engine';
import { StatusBar, Wordmark } from '../components/Chrome';
import { AuraOrb } from '../components/AuraOrb';
import { energyColor, energyLabel, energyGloss, fmtDow, isoDay } from '../ui';

export function Today({ input, now, chartSeed, streak, onOpenReading, onCheckin }: {
  input: ReadingInput;
  now: Date;
  chartSeed: number;
  streak: number;
  onOpenReading: () => void;
  onCheckin: () => void;
}) {
  const iso = isoDay(now);
  const major = input.majorEnergy;
  const passing = input.passingEnergy;
  const todayLine = generateTodayLine(input, iso, chartSeed);
  const remedy = generateRemedyShort(input, iso, chartSeed);

  return (
    <>
      <StatusBar />
      <Wordmark right={<>
        <span className="streak">🔥 <b>{streak}</b></span>
        <span>{fmtDow(now)}</span>
      </>} />
      <div className="view s2">
        <AuraOrb e1={energyColor(major)} e2={energyColor(passing)} size={186} />
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
        <div className="today">{todayLine}</div>
        <div className="remedy-pill" onClick={onCheckin} role="button" title="Tune today's reading">
          <span className="ring" />
          <div className="txt">
            <div className="rl">Today’s remedy</div>
            <div className="rv">{remedy}</div>
          </div>
        </div>
        <div className="cta-zone">
          <button className="btn" onClick={onOpenReading}>Open today’s reading <span>→</span></button>
        </div>
      </div>
    </>
  );
}
