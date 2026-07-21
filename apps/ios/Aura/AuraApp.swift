// aura — iOS (SwiftUI) structural skeleton. Translates the shared design system
// (docs/DESIGN_SYSTEM.md) to native HIG patterns: TabView + NavigationStack, .sheet
// check-in, large serif titles, reduce-motion-aware orb. Compiles against a Swift
// port of the engine core (see docs/PLATFORMS.md, strategy 1); `AuraEngine` is the
// protocol that port implements.

import SwiftUI

// MARK: - Design tokens

enum Theme {
    static let ink      = Color(hex: 0x09080F)
    static let card     = Color.white.opacity(0.035)
    static let line     = Color.white.opacity(0.09)
    static let text     = Color(hex: 0xEDEAF6)
    static let textDim  = Color(hex: 0xB4AFC6)
    static let textFaint = Color(hex: 0x7C7791)

    static let serif   = "InstrumentSerif-Regular"
    static let grotesk = "SpaceGrotesk-Medium"
    static let sans    = "Inter-Regular"

    static let bg = LinearGradient(
        colors: [Color(hex: 0x0A0813), Color(hex: 0x09080F), Color(hex: 0x070610)],
        startPoint: .top, endPoint: .bottom)
}

// MARK: - Domain models (mirror @aura/engine types.ts)

enum Energy: String, CaseIterable {
    case main, feel, fire, mind, grow, love, build, crave, `let`
    var label: String {
        ["main":"Main Character","feel":"Big Feelings","fire":"Fired Up","mind":"Busy Mind",
         "grow":"Green Light","love":"Soft Spot","build":"Heavy Lifting","crave":"Never Enough",
         "let":"Letting Go"][rawValue]!
    }
    var color: Color {
        [ "main":0xFFD070,"feel":0x8FB7FF,"fire":0xFF6E58,"mind":0x5FE0C0,"grow":0x7ED69B,
          "love":0xF49CC9,"build":0x8E93C8,"crave":0xAE8FE6,"let":0xA6ABB8 ][rawValue].map(Color.init(hex:))!
    }
}

struct Reading { let headline, gift, trap, move, watch, remedy: String; let energy, passing: Energy }
struct DailyBundle { let major, passing: Energy; let todayLine, remedyShort: String; let reading: Reading }

/// The ported engine core implements this (dasha/varga/ashtakavarga/lattice/synthesis).
protocol AuraEngine {
    func daily(date: Date) -> DailyBundle
    // forecast(...), blueprint(...), expanded(...) — same shape as the TS facade.
}

// MARK: - Aura orb (the signature)

struct AuraOrb: View {
    let e1: Color, e2: Color
    var size: CGFloat = 210
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var breathe = false

    var body: some View {
        ZStack {
            Circle().fill(RadialGradient(colors: [e1, .clear], center: .init(x: 0.32, y: 0.26), startRadius: 0, endRadius: size * 0.62))
            Circle().fill(RadialGradient(colors: [e2, .clear], center: .init(x: 0.74, y: 0.78), startRadius: 0, endRadius: size * 0.62))
            Circle().fill(RadialGradient(colors: [Color.white.opacity(0.14), .clear], center: .init(x: 0.5, y: 0.44), startRadius: 0, endRadius: size * 0.46))
        }
        .frame(width: size, height: size)
        .shadow(color: e2.opacity(0.5), radius: 30)
        .scaleEffect(breathe ? 1.035 : 1.0)
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.easeInOut(duration: 7).repeatForever(autoreverses: true)) { breathe = true }
        }
    }
}

// MARK: - App + navigation (TabView → NavigationStack per tab)

@main
struct AuraApp: App {
    var body: some Scene { WindowGroup { RootView() } }
}

struct RootView: View {
    // Injected: the ported engine + a cached chart. Placeholder here.
    var body: some View {
        TabView {
            NavigationStack { TodayView() }
                .tabItem { Label("Today", systemImage: "circle.hexagongrid") }
            NavigationStack { Text("Forecast").foregroundStyle(Theme.text) }
                .tabItem { Label("Forecast", systemImage: "chart.line.uptrend.xyaxis") }
            NavigationStack { Text("Blueprint").foregroundStyle(Theme.text) }
                .tabItem { Label("Blueprint", systemImage: "sparkles") }
        }
        .tint(Energy.smokeTint)
        .background(Theme.bg.ignoresSafeArea())
    }
}

// MARK: - Today screen

struct TodayView: View {
    @State private var showCheckin = false
    // Placeholder bundle; real app pulls from AuraEngine.daily(date:).
    private let major = Energy.build, passing = Energy.crave

    var body: some View {
        ScrollView {
            VStack(spacing: 22) {
                AuraOrb(e1: major.color, e2: passing.color)
                HStack(spacing: 0) {
                    blendCell("Major energy", major)
                    Divider().frame(height: 40).overlay(Theme.line)
                    blendCell("Passing through", passing)
                }
                Text("Build the brick in front of you.")
                    .font(.custom(Theme.serif, size: 30)).foregroundStyle(Theme.text)
                    .multilineTextAlignment(.center).padding(.top, 4)
                remedyPill
                Button { /* open reading */ } label: {
                    Text("Open today’s reading  →").frame(maxWidth: .infinity)
                }
                .buttonStyle(AuraPrimaryButton())
            }
            .padding(24)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("aura")
        .sheet(isPresented: $showCheckin) { Text("Check-in sheet").presentationDetents([.medium]) }
    }

    private func blendCell(_ label: String, _ e: Energy) -> some View {
        VStack(spacing: 6) {
            Text(label.uppercased()).font(.custom(Theme.grotesk, size: 10)).tracking(2).foregroundStyle(Theme.textFaint)
            Text(e.label.uppercased()).font(.custom(Theme.grotesk, size: 15)).foregroundStyle(e.color)
        }.frame(maxWidth: .infinity)
    }

    private var remedyPill: some View {
        HStack(spacing: 11) {
            Circle().strokeBorder(Energy.crave.color, lineWidth: 1.6).frame(width: 22, height: 22)
            VStack(alignment: .leading, spacing: 2) {
                Text("TODAY’S REMEDY").font(.custom(Theme.grotesk, size: 9)).tracking(2).foregroundStyle(Theme.textFaint)
                Text("Fix your sleep window — up early, down early").font(.custom(Theme.sans, size: 14)).foregroundStyle(Theme.text)
            }
            Spacer()
        }
        .padding(14).background(Theme.card).clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.line))
        .onTapGesture { showCheckin = true }
    }
}

struct AuraPrimaryButton: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.custom(Theme.grotesk, size: 15)).foregroundStyle(Color(hex: 0x0B0912))
            .padding(.vertical, 17)
            .background(LinearGradient(colors: [.white, Color(hex: 0xE4E0F0)], startPoint: .top, endPoint: .bottom))
            .clipShape(RoundedRectangle(cornerRadius: 18))
            .opacity(configuration.isPressed ? 0.85 : 1)
    }
}

// MARK: - Helpers

extension Color {
    init(hex: Int) {
        self.init(.sRGB,
                  red: Double((hex >> 16) & 0xFF) / 255,
                  green: Double((hex >> 8) & 0xFF) / 255,
                  blue: Double(hex & 0xFF) / 255)
    }
}
extension Energy { static let smokeTint = Color(hex: 0xAE8FE6) }
