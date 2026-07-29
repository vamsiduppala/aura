/// Design tokens, extracted from the Figma source of truth.
/// Figma file: mP16YA7x9BH1Ee0qPoSwDN
///
/// Dark neumorphism. The base is deliberately mid-dark, NOT black — pure black
/// kills the effect because the light shadow has nothing to lift off.
library;

import 'dart:ui';
import 'package:flutter/material.dart';

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

abstract final class Surf {
  static const base = Color(0xFF1B1D24); // app background
  static const raised = Color(0xFF1E2129); // cards, tab bar, pills
  static const raisedHi = Color(0xFF232830); // selected / active card
  static const rowHi = Color(0xFF252A34); // highlighted list row
  static const inset = Color(0xFF17191F); // carved wells, inputs, progress bg
  static const well = Color(0xFF181A20); // the wheel's well
  static const trackDeep = Color(0xFF101217); // deepest track fill
  static const ringTrack = Color(0xFF24272F); // unfilled ring
  static const divider = Color(0xFF282C36);
  static const hairline = Color(0xFF24272F);
  static const outlineDim = Color(0xFF454B57); // hollow pipeline node
  static const connectorDim = Color(0xFF3A3F4A); // dashed connector
}

abstract final class Ink {
  static const primary = Color(0xFFEDEFF5);
  static const onAccent = Color(0xFFFFFFFF);
  static const secondary = Color(0xFF9BA1AE);
  static const muted = Color(0xFF8A90A0);
  static const tertiary = Color(0xFF7A8090);
  static const faint = Color(0xFF6E7482);
  static const label = Color(0xFF5C6270);
  static const chevron = Color(0xFF4E5462);
  static const placeholder = Color(0xFF565C6A);
  static const body = Color(0xFFA8AEBC);
  static const bodyStrong = Color(0xFFC4C9D4);
}

/// Brass is the app's colour for TIME. Used for the accent, the time-left
/// pills, and the countdown — so "brass means a clock is running" is learned
/// once. Never use it for anything that isn't temporal or a primary action.
abstract final class Brass {
  static const base = Color(0xFFD4B678);
  static const bright = Color(0xFFE8C889);
  static const dim = Color(0xFF8A6F3A);
  static const well = Color(0xFF221E16);
  static const border = Color(0xFF3D3320);
  static const labelOnWell = Color(0xFF6B5B36);
}

// ---------------------------------------------------------------------------
// Planets
// ---------------------------------------------------------------------------

enum Planet { sun, moon, mars, mercury, jupiter, venus, saturn, rahu, ketu }

/// [ring] paints the wheel. [tabFill] and [tabInk] paint Planner stage tabs:
/// the tab is its own ring colour deepened, and everything drawn ON the tab is
/// a lighter shade of the SAME hue. Never introduce a foreign colour.
/// Derivation: tabFill = hue at 18% over Surf.base; tabInk = hue at 72% L.
/// The active stage overrides fill to 34% and strokes in the pure ring colour.
class PlanetPalette {
  final Color ring;
  final Color tabFill;
  final Color tabFillActive;
  final Color tabInk;
  final Color? rim; // forced outline where contrast fails
  const PlanetPalette(this.ring, this.tabFill, this.tabFillActive, this.tabInk,
      {this.rim});
}

const Map<Planet, PlanetPalette> kPlanet = {
  Planet.sun: PlanetPalette(
      Color(0xFFFF7A18), Color(0xFF31220F), Color(0xFF3A2610), Color(0xFFE5A264)),
  // Pearl needs an outline in light contexts or it dissolves.
  Planet.moon: PlanetPalette(
      Color(0xFFF2EDE4), Color(0xFF2B2A27), Color(0xFF34322D), Color(0xFFD8D3C9),
      rim: Color(0xFFB9BCC4)),
  Planet.mars: PlanetPalette(
      Color(0xFFE2342B), Color(0xFF401512), Color(0xFF5E201B), Color(0xFFFFB3AC)),
  Planet.mercury: PlanetPalette(
      Color(0xFF2FBF71), Color(0xFF12301F), Color(0xFF164028), Color(0xFF79DDA6)),
  Planet.jupiter: PlanetPalette(
      Color(0xFFF5C518), Color(0xFF332A0D), Color(0xFF453811), Color(0xFFEBCE6B),
      rim: Color(0xFFC79A00)),
  Planet.venus: PlanetPalette(
      Color(0xFFFF6FA5), Color(0xFF321D28), Color(0xFF45242F), Color(0xFFE594B7)),
  // True Saturn is unusable as a tab fill on a dark base — it vanishes. In
  // Planner only, the tab hue derives from the RIM value. The wheel ring stays
  // true black with the drifting starfield.
  Planet.saturn: PlanetPalette(
      Color(0xFF0E0E12), Color(0xFF282C36), Color(0xFF343A46), Color(0xFFB6BCCA),
      rim: Color(0xFF3A3D45)),
  Planet.rahu: PlanetPalette(
      Color(0xFF6B6F76), Color(0xFF25272B), Color(0xFF2F3237), Color(0xFFA2A7AF)),
  Planet.ketu: PlanetPalette(
      Color(0xFF61C7F0), Color(0xFF0F2833), Color(0xFF143743), Color(0xFF96DBF5)),
};

/// Saturn's ring is near-black; Rāhu's is mid-smoke. On a 12px stroke at
/// arm's length they are the same grey. Motion is what separates them:
/// Saturn's stars drift WITH the fill, Rāhu's haze drifts AGAINST it.
/// Never let planet identity rest on hue alone — always hue + icon + motion.
abstract final class PlanetMotion {
  static const saturnStarCount = 12; // cap at 14 or the ring reads as noise
  static const saturnStarLoop = Duration(seconds: 12);
  static const rahuHazeLoop = Duration(seconds: 9); // reversed direction
}

// ---------------------------------------------------------------------------
// Neumorphic shadow recipes
// ---------------------------------------------------------------------------

/// The white component is 5–5.5%. Any more and it reads as a light theme.
/// Anything the user TAPS is raised. Anything things are PUT INTO is inset.
abstract final class Neu {
  static const raised = <BoxShadow>[
    BoxShadow(color: Color(0x99000000), offset: Offset(6, 8), blurRadius: 16),
    BoxShadow(color: Color(0x0DFFFFFF), offset: Offset(-5, -6), blurRadius: 12),
  ];

  static const raisedSoft = <BoxShadow>[
    BoxShadow(color: Color(0x8C000000), offset: Offset(4, 6), blurRadius: 12),
    BoxShadow(color: Color(0x0DFFFFFF), offset: Offset(-3, -4), blurRadius: 9),
  ];

  /// Floating panels (Mentor threads) sit much higher off the surface.
  static const overlay = <BoxShadow>[
    BoxShadow(color: Color(0xB8000000), offset: Offset(0, 16), blurRadius: 40),
    BoxShadow(color: Color(0x0FFFFFFF), offset: Offset(-4, -5), blurRadius: 12),
  ];

  /// Flutter has no native inner shadow. Implement via a CustomPainter that
  /// strokes the inverse path with a blur, or a two-layer gradient overlay.
  /// Do NOT fake it with a border — the whole design language depends on this.
  static const insetDark = Color(0xC7000000); // offset (5,6) blur 13
  static const insetLight = Color(0x0EFFFFFF); // offset (-5,-6) blur 13
  static const insetOffset = Offset(5, 6);
  static const insetBlur = 13.0;
}

abstract final class Radii {
  static const screen = 44.0;
  static const card = 26.0;
  static const cardSm = 22.0;
  static const stageTab = 16.0;
  static const panel = 32.0;
  static const pill = 999.0;
  static const icon = 7.0;
}

// ---------------------------------------------------------------------------
// Wheel geometry
// ---------------------------------------------------------------------------

/// Outermost = fastest (Messenger). Stroke TAPERS inward-to-outward so weight
/// reads inward while speed reads outward — that's what stops the King, the
/// most important fact on screen, from sitting on a hairline.
/// Rounded caps on both ends of every arc; that's what sells the Apple look.
class RingSpec {
  final int level; // 1 = King .. 5 = Messenger
  final double diameter;
  final double stroke;
  const RingSpec(this.level, this.diameter, this.stroke);
  double get innerRatio => (diameter / 2 - stroke) / (diameter / 2);
}

/// Timeline wheel: 290pt well, 108pt centre hole for the readout.
const List<RingSpec> kWheelTimeline = [
  RingSpec(5, 268, 14), // Messenger
  RingSpec(4, 230, 13), // Magistrate
  RingSpec(3, 194, 12), // Governor
  RingSpec(2, 160, 11), // Prime Minister
  RingSpec(1, 128, 10), // King
];

/// Plan detail wheel: 240pt well, tighter centre.
const List<RingSpec> kWheelPlan = [
  RingSpec(5, 218, 13),
  RingSpec(4, 182, 12),
  RingSpec(3, 148, 11),
  RingSpec(2, 116, 10),
  RingSpec(1, 86, 9),
];

abstract final class Wheel {
  static const wellTimeline = 290.0;
  static const wellPlan = 240.0;
  static const ringGap = 5.0;
  static const startAngle = -1.5707963267948966; // -pi/2, 12 o'clock
  static const glowOpacity = 0.5;
  static const glowBlur = 12.0;

  /// Adjacent rings sharing a planet blur into one fat band. Insert a 2pt
  /// background gap and drop the outer ring to 85%.
  static const sameLordGap = 2.0;
  static const sameLordOuterOpacity = 0.85;

  /// Ring fill = elapsed / total FOR THAT PERIOD, never absolute time.
  /// A 6-year Sun King and a 20-year Venus King both read 0–100%.

  /// Hit-testing: at 10–14pt strokes with 5pt gaps, exact hit-testing loses
  /// about a fifth of taps. Resolve by NEAREST RING-CENTRE DISTANCE instead.
  static const hitSlop = 11.0;
}

// ---------------------------------------------------------------------------
// Motion
// ---------------------------------------------------------------------------

abstract final class Motion {
  /// Apple-style ring load. Fires on EVERY view appear, not just first mount —
  /// re-entering the tab replays it.
  static const ringLoad = Duration(milliseconds: 1400);

  /// Stagger outward-in: Messenger first, King last.
  static const ringStagger = Duration(milliseconds: 90);

  /// Ease-out, no overshoot. A progress ring that bounces past its value
  /// reads as a lie.
  static const ringCurve = Cubic(0.33, 1.0, 0.68, 1.0);

  static const readoutFadeDelay = Duration(milliseconds: 400);
  static const readoutRise = 14.0;

  /// Current pipeline stage: ONE breathing halo. Two is a heart-rate monitor.
  static const haloBreathe = Duration(milliseconds: 2200);
  static const haloScale = (1.0, 1.12);
  static const haloOpacity = (0.40, 0.10);

  /// Dashed connector below the current stage crawls toward what's next.
  /// Same 1.2s language as the handover chevrons — one motion vocabulary
  /// for "this is heading there".
  static const connectorCrawl = Duration(milliseconds: 1400);
  static const chevronCrawl = Duration(milliseconds: 1200);

  /// Checkmark draws in on stage completion, then the connector above fills,
  /// then the next halo starts. Sequence it — never cut.
  static const checkDraw = Duration(milliseconds: 320);
  static const connectorFill = Duration(milliseconds: 400);

  /// A Turn is NOT an achievement — it's time passing. No confetti, no
  /// "You did it!". A 900ms colour bleed old→new and one line.
  static const turnBleed = Duration(milliseconds: 900);

  static const countdownTick = Duration(seconds: 1);

  /// Recompute the court every 60s while foregrounded, and on foreground.
  /// Only the Messenger arc animates sub-minute, and locally — never
  /// re-walk the tree at 1Hz.
  static const courtRefresh = Duration(seconds: 60);

  /// Under prefers-reduced-motion: kill the halo, the crawl, and the star
  /// drift; snap rings to final values; keep strokes and glows.
}

// ---------------------------------------------------------------------------
// Type
// ---------------------------------------------------------------------------

/// Inter throughout. It carries the Sanskrit diacritics (ā ś ṣ ṁ ṛ) that many
/// display faces drop — verify any substitute against 'Śani Antardaśā'.
abstract final class Type {
  static const screenTitle = TextStyle(
      fontSize: 25, fontWeight: FontWeight.w700, color: Ink.primary);
  static const pageTitle = TextStyle(
      fontSize: 30, fontWeight: FontWeight.w700, color: Ink.primary);
  static const planTitle = TextStyle(
      fontSize: 21, fontWeight: FontWeight.w700, color: Ink.primary);

  /// The "In the Kingdom" block — biggest text after the heading.
  static const kingdom = TextStyle(
      fontSize: 17, fontWeight: FontWeight.w700, color: Ink.primary, height: 1.41);

  static const eyebrow = TextStyle(
      fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.9);
  static const sectionLabel = TextStyle(
      fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.7,
      color: Ink.label);
  static const officeName = TextStyle(
      fontSize: 13.5, fontWeight: FontWeight.w600, color: Ink.primary);
  static const lordLine = TextStyle(fontSize: 9, fontWeight: FontWeight.w500);
  static const durationNote = TextStyle(
      fontSize: 10, color: Ink.tertiary, height: 1.5);
  static const timePill = TextStyle(
      fontSize: 10.5, fontWeight: FontWeight.w700, color: Brass.bright);
  static const body = TextStyle(fontSize: 13, color: Ink.body, height: 1.62);
  static const countdownDigits = TextStyle(
      fontSize: 22, fontWeight: FontWeight.w700, color: Brass.base);
  static const countdownLabel = TextStyle(
      fontSize: 7.5, fontWeight: FontWeight.w700, letterSpacing: 0.8,
      color: Brass.labelOnWell);
}

abstract final class Layout {
  static const gutter = 20.0;
  static const cardWidth = 353.0; // 393 - 2*20
  static const tabBarHeight = 66.0;
  static const tabBarInset = 24.0;
  static const tabBarTop = 762.0; // on a 852pt canvas
  static const courtRowHeight = 78.0;
  static const stageHeightIdle = 57.0;
  static const stageHeightActive = 74.0; // the current stage IS taller
}
