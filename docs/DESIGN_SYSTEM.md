# aura — Design System (platform-agnostic)

Abstracted from the reference screenshots. This is the **source of truth** for all four
targets (desktop web, responsive mobile web, native Android, native iOS). The reference
images were a *design language*, not a layout to copy — no device frames, no locked aspect
ratios. Each platform adapts these primitives natively.

## 1. Brand essence
Deep-space, quiet, luminous. Generous negative space. One signature element (the two-tone
**aura orb**) carries the magic; everything else stays calm and legible. Never clip-art cosmic,
never "black + one acid accent."

## 2. Color

### Neutrals (dark, the only theme for v1)
| Token | Value | Use |
|---|---|---|
| `ink` | `#09080F` | base background |
| `ink-2` | `#0E0C17` | raised background |
| `card` | `rgba(255,255,255,.035)` | surfaces |
| `card-2` | `rgba(255,255,255,.055)` | raised surfaces |
| `line` | `rgba(255,255,255,.09)` | hairlines |
| `line-2` | `rgba(255,255,255,.14)` | stronger borders |
| `text` | `#EDEAF6` | primary text |
| `text-dim` | `#B4AFC6` | secondary text |
| `text-faint` | `#7C7791` | tertiary / labels |

Background is a layered radial+linear gradient (`#0A0813 → #09080F → #070610`) with two faint
top-corner glows and a ~5% film-grain overlay (soft-light blend).

### Energy hues (the 9 — the app's whole semantic palette)
`radiance #FFD070` (Main Character) · `tide #8FB7FF` (Big Feelings) · `forge #FF6E58` (Fired Up) ·
`signal #5FE0C0` (Busy Mind) · `bloom #7ED69B` (Green Light) · `velvet #F49CC9` (Soft Spot) ·
`slate #8E93C8` (Heavy Lifting) · `smoke #AE8FE6` (Never Enough) · `ash #A6ABB8` (Letting Go).
Each energy owns its color everywhere it appears (labels, dots, timeline bars, remedy cards).

### Beat-marker colors (fixed, independent of energy)
gift `#7ED69B` · trap `#AE8FE6` · move `#FFD070` · watch `#FF6E58`.

## 3. Typography — three faces, each with one job
- **Instrument Serif** — the "oracle voice." Headlines, the daily line, screen titles. Used
  sparingly and large. (iOS fallback: New York; Android fallback: a serif / Noto Serif.)
- **Space Grotesk** — system-readout UI. ALL-CAPS labels (`MAJOR ENERGY`, `STARTS`, `ENDS`),
  energy names, tabs, buttons, date chips. Letter-spacing .04–.2em on caps.
- **Inter** — body reading text. 13–15px, line-height ~1.6.

Type scale (fluid; scale up ~25% at ≥900px): display 26–34 · title 22–30 · lead 18–20 ·
body 14–15 · label 10.5 (caps) · micro 8–9 (caps).

## 4. Components (rules, not pixels)
- **Aura orb** — a circle with two radial gradients (energy-1 top-left, energy-2 bottom-right),
  soft outer glow, inner rim highlight, a slow "breathe" scale + faint rotating sheen. THE
  signature. Freeze all motion under reduced-motion.
- **Primary button** — full-width pill, light gradient fill (`#FFF→#E4E0F0`), dark ink text,
  Space Grotesk 600, soft violet shadow. Ghost variant = transparent, dim text.
- **Chips** — rounded 11px, hairline border, `card` fill; selected = violet tint + brighter border.
- **Field row** — label (caps, faint) left, value/input right, hairline underline.
- **Card** — radius 16–24, `card` fill, `line` border, optional inset top highlight.
- **Section beat** — vertical rule with a glowing colored node, a caps label, and body copy.
- **Timeline period** — colored left bar, energy name, one-line gloss, Start→End date chips.
- **Remedy card** — energy-tinted gradient card with a ✦ label.

Spacing rhythm: 8-pt-ish. Screen gutter 20–26 (mobile) / 40–48 (desktop). Corner radii 11 (chips)
→ 16 (cards) → 22 (modals/hero). Motion: restrained — page settle, tab underline slide, tap
feedback; nothing that screams "generated."

## 5. Layout adaptation per platform
- **Desktop web:** left sidebar nav; wide fluid content; Today = 2-column hero (orb | reading);
  Forecast = centered timeline; Blueprint = centered card. No width lock.
- **Mobile web:** single fluid column filling the viewport; top bar + bottom tab nav; expanded
  reading = full-screen sheet. No fake border.
- **Android (Material 3):** `NavigationBar` (bottom) on compact, `NavigationRail` on expanded;
  `ModalBottomSheet` for check-in; `Scaffold` + `LargeTopAppBar`; Material `Card`/`FilledButton`
  restyled to the tokens; dynamic-color OFF (brand palette is fixed).
- **iOS (HIG):** `TabView` (Today/Forecast/Blueprint) + `NavigationStack` for pushed reading/
  expanded; check-in as a `.sheet`; large serif titles; `.ultraThinMaterial` only where it suits
  the deep-space look. Respect Dynamic Type + Reduce Motion.

## 6. Accessibility
Contrast: energy hues on `ink` all exceed 4.5:1 for text-size use. Honor reduced-motion (freeze
orb) and Dynamic Type. Every interactive element has a label; the crisis-support path is never
gated behind motion or color alone.
