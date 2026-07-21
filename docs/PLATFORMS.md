# aura — four-platform strategy

The reference screenshots are a **design language**, not a layout. One shared design system
(`DESIGN_SYSTEM.md`), adapted natively per platform. This doc covers layout strategy + how the
engine is shared.

## Sharing the engine across platforms
The engine (`packages/engine`) is TypeScript. Its **prediction core is pure arithmetic** —
Vimshottari dasha, navamsa/vargas, Shadbala-style strength, Ashtakavarga, the 108-lattice, and
synthesis are deterministic functions with no platform APIs. Two viable strategies:

1. **Port the pure core (recommended for true-native + offline, per Q-06).**
   - Port `dasha/`, `chart/{varga,shadbala,ashtakavarga,strength,aspects}`, `lattice/`,
     `synthesis/`, `content/`, `safety/` to Kotlin (Android) and Swift (iOS). These are ~pure
     math + data tables — a mechanical, testable port (reuse the same golden tests).
   - The **ephemeris** is the only platform piece: on Android use Swiss Ephemeris via JNI or a
     Kotlin Moshier port; on iOS use SwissEphemeris (SPM) or a Swift Moshier port. Both sit behind
     the same `Ephemeris` protocol/interface the TS version already defines.
   - Keep the golden fixtures shared (JSON) so all three implementations assert identical output.

2. **Reuse the TS engine as-is.** Ship it to native via a JS runtime (JavaScriptCore on iOS, a JS
   engine on Android) or adopt React Native/Expo (Hermes runs the engine directly). Fastest to
   parity, but the UI is then RN, not SwiftUI/Compose. Use this only if native UI isn't required.

The models below (`Energy`, `Reading`, `ReadingInput`, `ForecastPeriod`) mirror the TS types so a
ported core drops straight in.

## 1 & 2 — Web (desktop + responsive mobile) — DONE
`apps/web` (Vite + React). Single responsive codebase: sidebar + fluid wide layout on desktop,
top-bar + bottom-tab single column on mobile, no device frame. See `apps/web/src`.

## 3 — Android (Jetpack Compose, Material 3)
- **Navigation:** `Scaffold` with a bottom `NavigationBar` (Today/Forecast/Blueprint) on compact
  width; switch to a `NavigationRail` at `WindowWidthSizeClass.Expanded` (tablets/desktop-Chrome).
  Reading & Expanded are destinations pushed via `NavHost`. Check-in is a `ModalBottomSheet`.
- **Theme:** a fixed brand `darkColorScheme` from the tokens (dynamic color OFF). Type via
  `FontFamily` (Instrument Serif / Space Grotesk / Inter as bundled fonts).
- **Orb:** a `Canvas`/`Box` with radial `Brush.radialGradient` layers + an `infiniteTransition`
  breathe/rotate (disabled when `Settings.Global.ANIMATOR_DURATION_SCALE == 0`).
- Skeleton: `apps/android/aura/ui/` (Theme.kt, AuraOrb.kt, AuraApp.kt, screens/Today.kt).

## 4 — iOS (SwiftUI, HIG)
- **Navigation:** a `TabView` (Today/Forecast/Blueprint), each tab a `NavigationStack` that pushes
  Reading / Expanded. Check-in is a `.sheet`. On iPad/regular size class, a `NavigationSplitView`
  gives the desktop-like sidebar.
- **Theme:** `Color` extensions from the tokens; `Font.custom` for the three faces; large serif
  titles via `.navigationTitle` + custom font.
- **Orb:** a `ZStack` of `RadialGradient` circles with a repeating `.scaleEffect` animation, gated
  on `@Environment(\.accessibilityReduceMotion)`.
- Skeleton: `apps/ios/Aura/` (Theme.swift, AuraOrb.swift, AuraApp.swift, TodayView.swift, Models.swift).

Both skeletons are **structural reference** — they compile against a ported engine (strategy 1).
They demonstrate the design-system translation + native navigation; the remaining screens follow
the same component patterns as `apps/web`.
