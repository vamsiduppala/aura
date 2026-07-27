// Downloadable chart report. Builds one self-contained HTML document holding the user's whole
// kundali — identity, birth data, every house with its occupants and readings, planet strengths,
// the Jaimini karakas, chart shape, born gifts, timing systems and the Tajaka year ahead.
// Self-contained (inline CSS, no network) so it opens and prints anywhere, forever.
import type { Aura, BirthData, Chart } from '@aura/engine';
import { buildHouses, dignityChip } from '../kundali';
import { computeYearAhead } from './yearAhead';
import { loadChartDashas } from './liveData';
import { buildPortrait, buildTechnicalFacts } from './portrait';
import { readEmptyHouse } from './emptyHouse';
import { grahaLabel, grahaColor, fmtFull } from '../ui';

const ORD = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

const esc = (s: unknown): string => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface ReportInput {
  aura: Aura;
  chart: Chart;
  birth: BirthData;
  displayName: string;
  goalName: string;
  now: Date;
}

/** Build the full report as a standalone HTML string. */
export async function buildReportHtml({ aura, chart, birth, displayName, goalName, now }: ReportInput): Promise<string> {
  const k = buildHouses(chart);
  const who = displayName.trim() || 'Your';
  const title = `${who === 'Your' ? 'Your' : `${who}’s`} aura chart`;

  let yearAhead: ReturnType<typeof computeYearAhead> | null = null;
  try { yearAhead = computeYearAhead(aura, chart, now); } catch { yearAhead = null; }
  const dashas = await loadChartDashas(chart).catch(() => null);
  const yogas = aura.yogas(chart);
  const portrait = buildPortrait(chart);
  const technical = buildTechnicalFacts(chart);

  const strengths = k.strengths.map((s) =>
    `<div class="chip"><span class="dot" style="background:${grahaColor(s.graha)}"></span>${esc(grahaLabel(s.graha))}<b>${s.pct}%</b></div>`).join('');

  const houses = k.houses.map((h) => {
    const eh = h.occupants.length === 0 ? readEmptyHouse(chart, h.house) : null;
    const occ = eh
      ? `<p class="empty">${esc(eh.headline)}</p><p class="empty">${esc(eh.playsOut)}</p>
         <div class="dep"><b>What it depends on</b><p>${esc(eh.dependsOn)}</p></div>`
      : h.occupants.map((o) => {
        const chip = dignityChip(o.dignity);
        const flags = [
          chip ? `<span class="flag">${esc(chip)}</span>` : '',
          o.vargottama ? '<span class="flag">vargottama</span>' : '',
          o.retrograde ? '<span class="flag">retrograde</span>' : '',
        ].join('');
        return `<div class="occ">
            <div class="occ-h"><span class="dot" style="background:${grahaColor(o.graha)}"></span>
              <b style="color:${grahaColor(o.graha)}">${esc(grahaLabel(o.graha))}</b>
              <span class="pct">${o.strength}%</span>${flags}</div>
            <p>${esc(o.text)}</p>
          </div>`;
      }).join('');
    return `<section class="house">
        <div class="house-h"><span class="num">${ORD[h.house]}</span>
          <div><div class="hname">${esc(h.name)}</div><div class="hsign">${esc(h.signName)} · ruled by ${esc(grahaLabel(h.lord))}</div></div></div>
        <div class="governs">Shapes your ${esc(h.governs)}.</div>
        ${occ}
      </section>`;
  }).join('');

  const giftRows = yogas.length
    ? yogas.map((y) => `<div class="gift"><b>${esc(y.name)}</b><p>${esc(y.blurb)}</p></div>`).join('')
    : '<p class="empty">No rare classical combinations stand out — your chart works through its placements rather than a headline yoga.</p>';

  const timing = dashas ? `
    <div class="kv"><span>Vimshottari (120-yr cycle)</span><b>${esc(grahaLabel(dashas.vimshottariNow.lord))} mahadasha — ${Math.round(dashas.vimshottariNow.pct)}% through</b></div>
    <div class="kv"><span>Ashtottari (108-yr cycle)</span><b>${esc(grahaLabel(dashas.ashtottariNow.lord))} — ${Math.round(dashas.ashtottariNow.pct)}% through</b></div>
    <div class="kv"><span>Narayana rasi order</span><b>${esc(dashas.narayanaNames.slice(0, 6).join(' → '))} →…</b></div>
    <div class="kv"><span>Born in</span><b>${esc(grahaLabel(dashas.vimshottari.lord))} mahadasha, ${dashas.vimshottari.yearsLeft.toFixed(1)} yrs remaining at birth</b></div>` : '';

  const year = yearAhead ? `
    <div class="kv"><span>Solar-return year</span><b>${yearAhead.year}</b></div>
    <div class="kv"><span>Muntha</span><b>${yearAhead.munthaHouse}th house (${esc(yearAhead.munthaSignName)}) — ${esc(yearAhead.munthaMeaning)}</b></div>
    <div class="kv"><span>Strongest planet this year</span><b>${esc(grahaLabel(yearAhead.strongestPlanet))} (Harsha bala ${yearAhead.strongestUnits}/20)</b></div>
    <div class="kv"><span>Fortune point (Punya saham)</span><b>${esc(yearAhead.punyaSahamSign)}</b></div>` : '';

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(title)}</title>
<style>
  :root{--ink:#141420;--soft:#5b5b71;--faint:#8b8ba3;--line:#e6e6ef;--bg:#fbfbfd;--card:#fff;--accent:#6c5ce7}
  *{box-sizing:border-box}
  body{margin:0;padding:40px 24px 72px;background:var(--bg);color:var(--ink);
    font:15px/1.6 ui-sans-serif,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}
  .wrap{max-width:820px;margin:0 auto}
  header{border-bottom:2px solid var(--ink);padding-bottom:22px;margin-bottom:30px}
  .brand{font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:var(--accent);font-weight:700}
  h1{font-size:34px;line-height:1.1;margin:10px 0 6px;letter-spacing:-.02em}
  .sub{color:var(--soft);font-size:14px}
  h2{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--faint);
    margin:36px 0 14px;padding-bottom:7px;border-bottom:1px solid var(--line)}
  .kv{display:flex;justify-content:space-between;gap:18px;padding:8px 0;border-bottom:1px solid var(--line);font-size:14px}
  .kv span{color:var(--soft)} .kv b{text-align:right;font-weight:600}
  .chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
  .chip{display:flex;align-items:center;gap:6px;border:1px solid var(--line);background:var(--card);
    border-radius:999px;padding:5px 11px;font-size:12.5px;color:var(--soft)}
  .chip b{color:var(--ink)} .dot{width:9px;height:9px;border-radius:50%;display:inline-block;flex:none}
  .house{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px 18px;margin-bottom:12px;
    break-inside:avoid;page-break-inside:avoid}
  .house-h{display:flex;align-items:center;gap:12px;margin-bottom:8px}
  .num{font-size:11px;font-weight:700;letter-spacing:.06em;color:var(--soft);border:1px solid var(--line);border-radius:7px;padding:3px 8px;flex:none}
  .hname{font-weight:700;font-size:16px} .hsign{font-size:12.5px;color:var(--faint)}
  .governs{font-size:13px;color:var(--soft);margin-bottom:12px}
  .occ{border-top:1px solid var(--line);padding-top:11px;margin-top:11px}
  .occ:first-of-type{border-top:none;padding-top:0;margin-top:0}
  .occ-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:5px;font-size:14px}
  .pct{font-weight:700;font-size:12.5px;color:var(--soft)}
  .flag{font-size:10.5px;letter-spacing:.04em;text-transform:uppercase;color:var(--faint);
    border:1px solid var(--line);border-radius:999px;padding:2px 8px}
  .occ p,.gift p{margin:0;font-size:13.5px;color:var(--soft)}
  .gift{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:13px 15px;margin-bottom:9px}
  .gift b{display:block;margin-bottom:3px}
  .empty{font-size:13.5px;color:var(--soft);margin:0 0 8px}
  .dep{border-left:3px solid var(--accent);padding:2px 0 2px 11px;margin-top:8px}
  .dep b{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}
  .dep p{margin:3px 0 0;font-size:13px;color:var(--soft)}
  .por{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin-bottom:10px;break-inside:avoid}
  .por h3{font-size:15px;margin:0 0 6px}
  .por p{margin:0;font-size:13.5px;color:var(--soft)}
  .kv-block{border-bottom:1px solid var(--line);padding:11px 0;break-inside:avoid}
  .kv-block b{display:block;font-size:13px;margin-bottom:4px}
  .kv-block p{margin:0;font-size:13px;color:var(--soft)}
  footer{margin-top:44px;padding-top:18px;border-top:1px solid var(--line);font-size:12px;color:var(--faint)}
  @media print{body{padding:0;background:#fff}.house,.gift,.chip{break-inside:avoid}}
</style></head>
<body><div class="wrap">
  <header>
    <div class="brand">aura · vedic chart report</div>
    <h1>${esc(title)}</h1>
    <div class="sub">Prepared ${esc(fmtFull(now))}${goalName.trim() ? ` · focus: ${esc(goalName)}` : ''}</div>
  </header>

  <h2>Birth data</h2>
  <div class="kv"><span>Name</span><b>${esc(displayName.trim() || '—')}</b></div>
  <div class="kv"><span>Date of birth</span><b>${esc(birth.date)}</b></div>
  <div class="kv"><span>Time of birth</span><b>${birth.unknownTime ? 'Unknown — read by day' : esc(birth.time ?? '—')}</b></div>
  <div class="kv"><span>Place</span><b>${esc(birth.place)}</b></div>
  <div class="kv"><span>Coordinates</span><b>${birth.lat.toFixed(2)}°, ${birth.lng.toFixed(2)}°</b></div>
  <div class="kv"><span>UTC offset</span><b>${(birth.tzOffsetMinutes / 60).toFixed(2)} h</b></div>

  <h2>Foundations</h2>
  <div class="kv"><span>Ascendant (lagna)</span><b>${esc(k.lagnaSignName)}</b></div>
  <div class="kv"><span>Chart ruler (lagnadhipathi)</span><b>${esc(grahaLabel(k.lagnaLord))} — ${k.lagnaLordStrength}% strength</b></div>
  <div class="kv"><span>Soul planet (Atmakaraka)</span><b>${esc(grahaLabel(k.atmakaraka))}</b></div>
  <div class="kv"><span>Partner planet (Darakaraka)</span><b>${esc(grahaLabel(k.darakaraka))}</b></div>
  <div class="kv"><span>Chart shape</span><b>${esc(k.shape.name)} (${esc(k.shape.means)})</b></div>
  <p class="empty" style="margin-top:10px">${esc(k.lagnaLordText)}</p>
  <p class="empty" style="margin-top:8px">${esc(k.shape.effect)}</p>

  <h2>Planet strengths</h2>
  <div class="chips">${strengths}</div>

  <h2>Who this chart describes</h2>
  ${portrait.map((s) => `<section class="por"><h3>${esc(s.title)}</h3><p>${esc(s.body)}</p></section>`).join('')}

  <h2>Your life, house by house</h2>
  ${houses}

  <h2>Deeper in the chart</h2>
  ${technical.map((f) => `<div class="kv-block"><b>${esc(f.label)}</b><p>${esc(f.value)}</p></div>`).join('')}

  <h2>Born gifts</h2>
  ${giftRows}

  ${timing ? `<h2>Timing systems</h2>${timing}` : ''}
  ${year ? `<h2>The year ahead (Tajaka)</h2>${year}` : ''}

  <footer>
    Generated by aura from your own birth data, using classical Vedic rules (Parasara/Jaimini).
    For reflection and self-understanding — not medical, legal or financial advice.
  </footer>
</div></body></html>`;
}

/** Build the report and trigger a browser download. */
export async function downloadReport(input: ReportInput): Promise<void> {
  const html = await buildReportHtml(input);
  const slug = (input.displayName.trim() || 'aura').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug || 'aura'}-chart-${input.now.toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
