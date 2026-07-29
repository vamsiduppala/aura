/// Vimshottari daśā engine.
///
/// Ported from ref/vimshottari_ref.py after invariant verification.
/// Pure Dart, zero dependencies, zero I/O. Do not add any.
///
/// The only astronomical input is the Moon's **sidereal** longitude at birth.
/// No ephemeris runs on device — the server supplies moonLongitude once, and
/// everything below is arithmetic. See docs/build-spec.md §2.
library;

/// Client and server MUST use this identical value. A mismatch drifts level-1
/// boundaries by days and level-5 boundaries by hours.
const double kDaysPerYear = 365.2425;

const double kNakshatraArc = 40.0 / 3.0; // 13°20'
const int kTotalYears = 120;

enum Lord { ketu, venus, sun, moon, mars, rahu, jupiter, saturn, mercury }

/// Fixed cycle order. Never reorder this.
const List<Lord> kOrder = [
  Lord.ketu, Lord.venus, Lord.sun, Lord.moon, Lord.mars,
  Lord.rahu, Lord.jupiter, Lord.saturn, Lord.mercury,
];

const Map<Lord, int> kLordYears = {
  Lord.ketu: 7, Lord.venus: 20, Lord.sun: 6, Lord.moon: 10, Lord.mars: 7,
  Lord.rahu: 18, Lord.jupiter: 16, Lord.saturn: 19, Lord.mercury: 17,
}; // sums to 120

/// Court offices. Level 1 is the slowest and innermost ring; level 5 is the
/// fastest and outermost. See docs/copy-spec.md §1.
enum Office { king, primeMinister, governor, magistrate, messenger }

const Map<int, Office> kOfficeByLevel = {
  1: Office.king,
  2: Office.primeMinister,
  3: Office.governor,
  4: Office.magistrate,
  5: Office.messenger,
};

const List<String> kNakshatras = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni',
  'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha',
  'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana',
  'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada',
  'Revati',
];

// ---------------------------------------------------------------------------
// Birth-time confidence gating
// ---------------------------------------------------------------------------

/// One minute of birth-time error offsets EVERY boundary in the tree by up to
/// five days, and the error never averages out. See docs/build-spec.md §1.1.
enum BirthTimeConfidence { exact, within15Min, within1Hour, unknown }

enum RingVisibility { solid, approximate, hidden }

/// What each office is allowed to claim, given how well we know the birth time.
/// Enforce this in the UI, in notifications, and in the Mentor system prompt.
RingVisibility visibilityFor(Office office, BirthTimeConfidence c) {
  final level = kOfficeByLevel.entries.firstWhere((e) => e.value == office).key;
  switch (c) {
    case BirthTimeConfidence.exact:
      return level <= 4 ? RingVisibility.solid : RingVisibility.approximate;
    case BirthTimeConfidence.within15Min:
      if (level <= 3) return RingVisibility.solid;
      if (level == 4) return RingVisibility.approximate;
      return RingVisibility.hidden;
    case BirthTimeConfidence.within1Hour:
      if (level <= 2) return RingVisibility.solid;
      if (level == 3) return RingVisibility.approximate;
      return RingVisibility.hidden;
    case BirthTimeConfidence.unknown:
      if (level == 1) return RingVisibility.solid;
      if (level == 2) return RingVisibility.approximate;
      return RingVisibility.hidden;
  }
}

/// Deepest office we may state as fact.
Office deepestTrustworthy(BirthTimeConfidence c) => switch (c) {
      BirthTimeConfidence.exact => Office.magistrate,
      BirthTimeConfidence.within15Min => Office.governor,
      BirthTimeConfidence.within1Hour => Office.primeMinister,
      BirthTimeConfidence.unknown => Office.king,
    };

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

class NakshatraPosition {
  final int index;
  final String name;
  final Lord lord;

  /// 0.0–1.0 of the nakṣatra already traversed at birth.
  final double fractionTraversed;

  const NakshatraPosition(
      this.index, this.name, this.lord, this.fractionTraversed);

  /// Years of the first mahādaśā remaining at birth.
  double get balanceYears => (1 - fractionTraversed) * kLordYears[lord]!;

  int get pada => (fractionTraversed * 4).floor() + 1;
}

class DashaPeriod {
  final Lord lord;
  final int level; // 1..5
  final DateTime startUtc;
  final DateTime endUtc;
  final double years;

  const DashaPeriod({
    required this.lord,
    required this.level,
    required this.startUtc,
    required this.endUtc,
    required this.years,
  });

  Office get office => kOfficeByLevel[level]!;
  Duration get total => endUtc.difference(startUtc);

  bool contains(DateTime at) =>
      !at.isBefore(startUtc) && at.isBefore(endUtc);

  Duration remainingAt(DateTime at) {
    final d = endUtc.difference(at);
    return d.isNegative ? Duration.zero : d;
  }

  /// 0.0–1.0 elapsed. This is the ring fill fraction.
  double progressAt(DateTime at) {
    final t = total.inMicroseconds;
    if (t <= 0) return 0;
    final e = at.difference(startUtc).inMicroseconds;
    return (e / t).clamp(0.0, 1.0);
  }
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

Duration _yearsToDuration(double years) =>
    Duration(microseconds: (years * kDaysPerYear * 86400 * 1e6).round());

NakshatraPosition nakshatraOf(double moonSiderealLongitude) {
  final lon = moonSiderealLongitude % 360.0;
  final index = (lon / kNakshatraArc).floor();
  final frac = (lon % kNakshatraArc) / kNakshatraArc;
  return NakshatraPosition(
      index, kNakshatras[index], kOrder[index % 9], frac);
}

/// Level-1 periods. The first is partial — only [NakshatraPosition.balanceYears]
/// of it remains at birth, so its start lies before the birth instant.
List<DashaPeriod> mahadashas({
  required DateTime birthUtc,
  required double moonSiderealLongitude,
  int cycles = 2,
}) {
  final nak = nakshatraOf(moonSiderealLongitude);
  final startIndex = kOrder.indexOf(nak.lord);
  var cursor = birthUtc
      .subtract(_yearsToDuration(nak.fractionTraversed * kLordYears[nak.lord]!));

  final out = <DashaPeriod>[];
  for (var k = 0; k < 9 * cycles; k++) {
    final lord = kOrder[(startIndex + k) % 9];
    final years = kLordYears[lord]!.toDouble();
    final end = cursor.add(_yearsToDuration(years));
    out.add(DashaPeriod(
        lord: lord, level: 1, startUtc: cursor, endUtc: end, years: years));
    cursor = end;
  }
  return out;
}

/// Sub-periods of [parent]. Always opens with the parent's own lord, then
/// follows [kOrder] cyclically. duration(child) = duration(parent) × yrs/120.
List<DashaPeriod> subPeriods(DashaPeriod parent) {
  final startIndex = kOrder.indexOf(parent.lord);
  var cursor = parent.startUtc;
  final out = <DashaPeriod>[];
  for (var k = 0; k < 9; k++) {
    final lord = kOrder[(startIndex + k) % 9];
    final years = parent.years * kLordYears[lord]! / kTotalYears;
    final end = cursor.add(_yearsToDuration(years));
    out.add(DashaPeriod(
      lord: lord,
      level: parent.level + 1,
      startUtc: cursor,
      endUtc: end,
      years: years,
    ));
    cursor = end;
  }
  // Absorb rounding into the last child so boundaries close exactly.
  final last = out.removeLast();
  out.add(DashaPeriod(
    lord: last.lord,
    level: last.level,
    startUtc: last.startUtc,
    endUtc: parent.endUtc,
    years: last.years,
  ));
  return out;
}

/// The hot path. Returns the chain of rulers holding each office at [at],
/// outermost-last (index 0 = King, index 4 = Messenger).
///
/// Five arithmetic descents. Never materialise the 9^5 = 59,049 leaf nodes.
List<DashaPeriod> courtAt({
  required DateTime birthUtc,
  required double moonSiderealLongitude,
  required DateTime at,
  int depth = 5,
}) {
  final l1 = mahadashas(
    birthUtc: birthUtc,
    moonSiderealLongitude: moonSiderealLongitude,
    cycles: 2,
  );
  var node = l1.where((p) => p.contains(at)).firstOrNull;
  if (node == null) return const [];

  final chain = <DashaPeriod>[node];
  for (var level = 2; level <= depth; level++) {
    final kids = subPeriods(node!);
    node = kids.where((k) => k.contains(at)).firstOrNull ?? kids.last;
    chain.add(node);
  }
  return chain;
}

/// Court ordered for display: fastest first (Messenger → King), matching the
/// rings read outside-in. See docs/copy-spec.md §5.2.
List<DashaPeriod> courtFastestFirst({
  required DateTime birthUtc,
  required double moonSiderealLongitude,
  required DateTime at,
}) =>
    courtAt(
      birthUtc: birthUtc,
      moonSiderealLongitude: moonSiderealLongitude,
      at: at,
    ).reversed.toList();

/// Next boundary at [level] after [at] — powers "Biggest Change Ahead".
/// Pass level 2 for the Prime Minister handover.
DashaPeriod? nextTurnAt({
  required DateTime birthUtc,
  required double moonSiderealLongitude,
  required DateTime at,
  int level = 2,
}) {
  final chain = courtAt(
    birthUtc: birthUtc,
    moonSiderealLongitude: moonSiderealLongitude,
    at: at,
    depth: level,
  );
  if (chain.length < level) return null;
  final current = chain[level - 1];
  return courtAt(
    birthUtc: birthUtc,
    moonSiderealLongitude: moonSiderealLongitude,
    at: current.endUtc.add(const Duration(seconds: 1)),
    depth: level,
  ).elementAtOrNull(level - 1);
}

/// Periods at [level] overlapping [from, to] — this is what cuts a plan into
/// stages. Stage count is whatever this returns: 2 to 9, never padded.
/// See docs/copy-spec.md §4.4.
List<DashaPeriod> periodsBetween({
  required DateTime birthUtc,
  required double moonSiderealLongitude,
  required DateTime from,
  required DateTime to,
  required int level,
}) {
  final out = <DashaPeriod>[];
  var cursor = from;
  var guard = 0;
  while (cursor.isBefore(to) && guard++ < 200) {
    final chain = courtAt(
      birthUtc: birthUtc,
      moonSiderealLongitude: moonSiderealLongitude,
      at: cursor,
      depth: level,
    );
    if (chain.length < level) break;
    final p = chain[level - 1];
    out.add(p);
    cursor = p.endUtc.add(const Duration(seconds: 1));
  }
  return out;
}

/// Picks the daśā level that cuts [from, to] into 3–6 stages, so the pipeline
/// reads well. Falls back to the closest available.
int chooseCutLevel({
  required DateTime birthUtc,
  required double moonSiderealLongitude,
  required DateTime from,
  required DateTime to,
}) {
  var best = 3;
  var bestScore = 1 << 30;
  for (var level = 2; level <= 4; level++) {
    final n = periodsBetween(
      birthUtc: birthUtc,
      moonSiderealLongitude: moonSiderealLongitude,
      from: from,
      to: to,
      level: level,
    ).length;
    final score = n < 3 ? (3 - n) * 2 : (n > 6 ? n - 6 : 0);
    if (score < bestScore) {
      bestScore = score;
      best = level;
    }
  }
  return best;
}
