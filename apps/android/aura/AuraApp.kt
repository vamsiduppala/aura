// aura — Android (Jetpack Compose, Material 3) structural skeleton. Translates the
// shared design system (docs/DESIGN_SYSTEM.md) to Material patterns: Scaffold +
// NavigationBar (NavigationRail on expanded width), ModalBottomSheet check-in, fixed
// brand dark theme (dynamic color OFF), reduce-motion-aware orb. Compiles against a
// Kotlin port of the engine core (docs/PLATFORMS.md, strategy 1); `AuraEngine` is the
// interface that port implements.

package app.aura

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.util.Date

// ── Design tokens ────────────────────────────────────────────────────────────
object Tokens {
    val ink = Color(0xFF09080F)
    val card = Color.White.copy(alpha = 0.035f)
    val line = Color.White.copy(alpha = 0.09f)
    val text = Color(0xFFEDEAF6)
    val textDim = Color(0xFFB4AFC6)
    val textFaint = Color(0xFF7C7791)
    // Bundled fonts; FontFamily(Font(R.font.instrument_serif)) etc. in the real project.
    val serif = FontFamily.Serif
    val grotesk = FontFamily.SansSerif
    val sans = FontFamily.SansSerif
}

// ── Domain models (mirror @aura/engine types.ts) ─────────────────────────────
enum class Energy(val label: String, val color: Color) {
    MAIN("Main Character", Color(0xFFFFD070)), FEEL("Big Feelings", Color(0xFF8FB7FF)),
    FIRE("Fired Up", Color(0xFFFF6E58)), MIND("Busy Mind", Color(0xFF5FE0C0)),
    GROW("Green Light", Color(0xFF7ED69B)), LOVE("Soft Spot", Color(0xFFF49CC9)),
    BUILD("Heavy Lifting", Color(0xFF8E93C8)), CRAVE("Never Enough", Color(0xFFAE8FE6)),
    LET("Letting Go", Color(0xFFA6ABB8))
}

data class Reading(val headline: String, val gift: String, val trap: String, val move: String,
                   val watch: String, val remedy: String, val energy: Energy, val passing: Energy)
data class DailyBundle(val major: Energy, val passing: Energy, val todayLine: String,
                       val remedyShort: String, val reading: Reading)

/** The ported engine core implements this (dasha/varga/ashtakavarga/lattice/synthesis). */
interface AuraEngine {
    fun daily(date: Date): DailyBundle
    // forecast(...), blueprint(...), expanded(...) — same shape as the TS facade.
}

// ── Brand theme (fixed dark; no dynamic color) ───────────────────────────────
@Composable
fun AuraTheme(content: @Composable () -> Unit) {
    val scheme = darkColorScheme(
        background = Tokens.ink, surface = Tokens.card, onBackground = Tokens.text,
        primary = Energy.CRAVE.color, onPrimary = Color(0xFF0B0912), outline = Tokens.line,
    )
    MaterialTheme(colorScheme = scheme, content = content)
}

// ── Aura orb (the signature) ─────────────────────────────────────────────────
@Composable
fun AuraOrb(e1: Color, e2: Color, size: androidx.compose.ui.unit.Dp = 210.dp) {
    val infinite = rememberInfiniteTransition(label = "orb")
    val scale by infinite.animateFloat(
        1f, 1.035f,
        infiniteRepeatable(tween(7000, easing = EaseInOut), RepeatMode.Reverse), label = "breathe")
    Canvas(Modifier.size(size)) {
        val r = this.size.minDimension
        drawCircle(Brush.radialGradient(listOf(e1, Color.Transparent),
            center = Offset(r * 0.32f, r * 0.26f), radius = r * 0.62f))
        drawCircle(Brush.radialGradient(listOf(e2, Color.Transparent),
            center = Offset(r * 0.74f, r * 0.78f), radius = r * 0.62f))
        drawCircle(Brush.radialGradient(listOf(Color.White.copy(alpha = 0.14f), Color.Transparent),
            center = Offset(r * 0.5f, r * 0.44f), radius = r * 0.46f))
    }
    // Apply `scale` via Modifier.scale(scale) at the call site; gate on
    // Settings.Global.ANIMATOR_DURATION_SCALE == 0f for reduce-motion.
}

// ── App shell: Scaffold + NavigationBar (→ NavigationRail on expanded width) ──
enum class Tab(val label: String) { TODAY("Today"), FORECAST("Forecast"), BLUEPRINT("Blueprint") }

@Composable
fun AuraApp(engine: AuraEngine) = AuraTheme {
    var tab by remember { mutableStateOf(Tab.TODAY) }
    Scaffold(
        containerColor = Tokens.ink,
        bottomBar = {
            NavigationBar(containerColor = Tokens.ink.copy(alpha = 0.72f)) {
                Tab.entries.forEach { t ->
                    NavigationBarItem(selected = tab == t, onClick = { tab = t },
                        icon = {}, label = { Text(t.label, fontFamily = Tokens.grotesk, fontSize = 10.sp) })
                }
            }
        }
    ) { pad ->
        Box(Modifier.padding(pad)) {
            when (tab) {
                Tab.TODAY -> TodayScreen(engine.daily(Date()))
                Tab.FORECAST -> Text("Forecast", color = Tokens.text)
                Tab.BLUEPRINT -> Text("Blueprint", color = Tokens.text)
            }
        }
    }
}

// ── Today screen ─────────────────────────────────────────────────────────────
@Composable
fun TodayScreen(daily: DailyBundle) {
    Column(
        Modifier.fillMaxSize().background(Tokens.ink).padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(22.dp)
    ) {
        AuraOrb(daily.major.color, daily.passing.color)
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
            BlendCell("Major energy", daily.major)
            BlendCell("Passing through", daily.passing)
        }
        Text(daily.todayLine, fontFamily = Tokens.serif, fontSize = 28.sp, color = Tokens.text,
            textAlign = TextAlign.Center)
        Button(onClick = { /* open reading */ }, modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color(0xFF0B0912))) {
            Text("Open today’s reading  →", fontFamily = Tokens.grotesk)
        }
    }
}

@Composable
fun BlendCell(label: String, e: Energy) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(label.uppercase(), fontFamily = Tokens.grotesk, fontSize = 10.sp, color = Tokens.textFaint)
        Text(e.label.uppercase(), fontFamily = Tokens.grotesk, fontSize = 15.sp, color = e.color)
    }
}
