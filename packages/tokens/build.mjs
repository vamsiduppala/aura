// Token generator: tokens.json -> CSS custom properties, TypeScript, Dart.
//
// The architecture plan names Style Dictionary for this job. This is a ~150-line
// deterministic generator instead, for three reasons: zero dependencies (so the token
// build can never break the app build), output stable enough to commit and diff, and the
// naming convention is ours rather than a plugin's. Swapping in Style Dictionary later
// means replacing this file only — `tokens.json` is the contract, not the tool.
//
// Run: npm run build --workspace @vim/tokens
// The generated files ARE committed, so a clean checkout builds without running this.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = JSON.parse(readFileSync(resolve(here, 'tokens.json'), 'utf8'));
const out = resolve(here, 'dist');
mkdirSync(out, { recursive: true });

const VERSION = src.$meta.version;
const BANNER = (lang) => {
  const c = lang === 'dart' ? '///' : lang === 'css' ? ' *' : ' *';
  const open = lang === 'dart' ? '' : '/*\n';
  const close = lang === 'dart' ? '' : ' */\n';
  return `${open}${c} GENERATED FROM packages/tokens/tokens.json — DO NOT EDIT.
${c} Change tokens.json and run: npm run build --workspace @vim/tokens
${c} tokens v${VERSION}
${close}`;
};

/** camelCase / numeric key -> kebab-case, for CSS custom property names. */
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/** Every group except metadata and inline comments. */
const groups = Object.entries(src).filter(([k]) => !k.startsWith('$'));
const entries = (obj) => Object.entries(obj).filter(([k]) => !k.startsWith('$'));

// ---------------------------------------------------------------------------
// CSS — the shape the web actually consumes
// ---------------------------------------------------------------------------

const cssLines = [];
for (const [group, values] of groups) {
  cssLines.push(`\n  /* ${group} */`);
  for (const [key, value] of entries(values)) {
    if (value && typeof value === 'object') {
      // Nested (planet.sun.ring -> --planet-sun-ring). Nulls are skipped rather than
      // emitted as the string "null", which would silently paint a border colour.
      for (const [sub, subValue] of entries(value)) {
        if (subValue == null) continue;
        cssLines.push(`  --${kebab(group)}-${kebab(key)}-${kebab(sub)}: ${subValue};`);
      }
    } else {
      cssLines.push(`  --${kebab(group)}-${kebab(key)}: ${value};`);
    }
  }
}

writeFileSync(
  resolve(out, 'tokens.css'),
  `${BANNER('css')}:root {${cssLines.join('\n')}\n\n  color-scheme: dark;\n}\n`,
  'utf8',
);

// ---------------------------------------------------------------------------
// TypeScript — for the values JS must compute with (ring geometry, breakpoints)
// ---------------------------------------------------------------------------

/** "158" -> 158, "22px" -> 22, "0.12" -> 0.12. Non-numeric strings pass through. */
const numeric = (v) => {
  if (typeof v !== 'string') return v;
  const m = /^(-?[\d.]+)(px|ms|)$/.exec(v.trim());
  return m ? Number(m[1]) : v;
};

const tsLines = [BANNER('ts').trimEnd(), ''];
for (const [group, values] of groups) {
  const body = entries(values).map(([key, value]) => {
    if (value && typeof value === 'object') {
      const inner = entries(value)
        .map(([s, sv]) => `    ${JSON.stringify(s)}: ${sv === null ? 'null' : JSON.stringify(numeric(sv))},`)
        .join('\n');
      return `  ${JSON.stringify(key)}: {\n${inner}\n  },`;
    }
    return `  ${JSON.stringify(key)}: ${JSON.stringify(numeric(value))},`;
  }).join('\n');
  tsLines.push(`export const ${group} = {\n${body}\n} as const;\n`);
}
tsLines.push(`export const tokensVersion = ${JSON.stringify(VERSION)};\n`);
writeFileSync(resolve(out, 'tokens.ts'), tsLines.join('\n'), 'utf8');

// ---------------------------------------------------------------------------
// Dart — so the future Flutter client reads the same file, not a transcription
// ---------------------------------------------------------------------------

/** #RRGGBB -> Color(0xFFRRGGBB). Anything else stays a string constant. */
const dartValue = (v) => {
  if (typeof v !== 'string') return JSON.stringify(v);
  const hex = /^#([0-9a-fA-F]{6})$/.exec(v.trim());
  if (hex) return `Color(0xFF${hex[1].toUpperCase()})`;
  const num = /^(-?[\d.]+)(px|ms|)$/.exec(v.trim());
  if (num) return num[1].includes('.') ? num[1] : `${num[1]}.0`;
  return `'${v.replace(/'/g, "\\'")}'`;
};
const dartName = (s) => (/^\d/.test(s) ? `s${s}` : s.replace(/[^A-Za-z0-9]/g, ''));

const dartLines = [
  BANNER('dart').trimEnd(),
  "library;",
  '',
  "import 'dart:ui';",
  '',
];
for (const [group, values] of groups) {
  const cls = group[0].toUpperCase() + group.slice(1);
  dartLines.push(`abstract final class ${cls} {`);
  for (const [key, value] of entries(values)) {
    if (value && typeof value === 'object') {
      for (const [sub, subValue] of entries(value)) {
        if (subValue == null) continue;
        dartLines.push(`  static const ${dartName(key)}${sub[0].toUpperCase()}${sub.slice(1)} = ${dartValue(subValue)};`);
      }
    } else {
      dartLines.push(`  static const ${dartName(key)} = ${dartValue(value)};`);
    }
  }
  dartLines.push('}', '');
}
writeFileSync(resolve(out, 'tokens.dart'), dartLines.join('\n'), 'utf8');

const count = cssLines.filter((l) => l.startsWith('  --')).length;
console.log(`tokens v${VERSION}: ${count} custom properties -> dist/tokens.{css,ts,dart}`);
