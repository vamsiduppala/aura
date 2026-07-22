// ─────────────────────────────────────────────────────────────────────────────
// Reference principles for the mostly-prose Part 5 chapters — Ch 32 (birthtime error),
// Ch 33 (rational thinking), Ch 35 (mundane), Ch 37 (ethics). Encoded as our own concise
// principle summaries (not the book's prose) so the mentor can ground guidance — especially
// the ethics of never scaring, which mirrors aura's no-doom / agency-first safety framing.
// ─────────────────────────────────────────────────────────────────────────────

/** Ch 37 — ethics of a Jyotishi. The prediction-tone rules directly back aura's guardrails. */
export const ETHICS_PRINCIPLES: string[] = [
  'Approach every reading as compassionate service, not business — with dignity and humility.',
  'Always be positive when predicting; frame anything negative in a restrained, gentle tone.',
  'Never scare a person. Only raise a hard possibility when you can also offer a preventive step or remedy.',
  'Predictions made for shock, fame or sensation value are unethical and bring the reader no good.',
  'Caution gently about difficult periods and suggest practical, healthy precautions — never doom.',
];

/** Ch 33 — rational thinking. Astrology as a rational, testable model, not blind superstition. */
export const RATIONAL_PRINCIPLES: string[] = [
  'Astrology is a systematic model of tendencies, not rigid fate — free will and effort still matter.',
  'Analysis is only as good as the birth data; garbage in, garbage out. Verify before predicting.',
  'Prefer techniques that discriminate between people born minutes apart over ones that give everyone the same result.',
  'Cross-check a conclusion from several independent tools (charts, dasas, transits) before trusting it.',
  'Do not corrupt the system with untested additions; understand the classical teachings correctly first.',
];

/** Ch 32 — birthtime rectification (concept + methods; exact computation is engine territory). */
export const BIRTHTIME_RECTIFICATION: { concept: string; methods: string[] } = {
  concept: 'Reported birth times carry error; rectification corrects the time against known life events before prediction. Sensitive points (GL, special lagnas, fast varga cusps) shift a lot per minute and help pin it.',
  methods: [
    'Event-based: adjust the time so that dasa/transit periods line up with major dated life events.',
    'Special-lagna based: constrain the time so GL / Sree lagna fall where known events imply (they move ~1.25°/min).',
    'Tattva/quantum methods exist in classics but are less reliable; prefer event-based rectification.',
  ],
};

/** Ch 35 — mundane astrology (nations/world events), in brief. */
export const MUNDANE_PRINCIPLES: string[] = [
  'Mundane astrology reads nations and the world via ingress charts, eclipses and the founding chart of a country.',
  'Compressed dasas (e.g. Shoola dasa scaled to a term of office) time events for entities like governments.',
  'A leader’s own chart and the swearing-in muhurta both colour a government’s fortunes.',
];
