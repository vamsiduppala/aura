"""
Vimshottari dasha engine — reference implementation.

Purpose: verify the arithmetic before porting to Dart, and serve as the
server-side reference so client and backend cannot drift.

Pure function of (birth_utc, moon_sidereal_longitude). No ephemeris here —
the caller supplies the Moon's sidereal longitude, which is the only
astronomical input the dasha tree needs.
"""
from datetime import datetime, timedelta, timezone

# Consistency constant. Client and server MUST use the identical value or
# boundaries drift by days at level 1 and hours at level 5.
DAYS_PER_YEAR = 365.2425

ORDER = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
YEARS = {"Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7,
         "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17}
TOTAL_YEARS = 120

NAKSHATRA_ARC = 40.0 / 3.0  # 13 deg 20 min

NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashirsha", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
    "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha",
    "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana",
    "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada",
    "Revati",
]

ROLES = {1: "King", 2: "Prime Minister", 3: "Governor", 4: "Magistrate", 5: "Messenger"}


def nakshatra_of(moon_lon):
    """Sidereal longitude (deg) -> (index, name, lord, fraction traversed)."""
    lon = moon_lon % 360.0
    idx = int(lon // NAKSHATRA_ARC)
    frac = (lon % NAKSHATRA_ARC) / NAKSHATRA_ARC
    return idx, NAKSHATRAS[idx], ORDER[idx % 9], frac


def _years_to_delta(years):
    return timedelta(days=years * DAYS_PER_YEAR)


def sub_periods(lord, start, duration_years):
    """
    Sub-periods of a period ruled by `lord`.
    Always begins with the parent's own lord, then follows ORDER cyclically.
    duration(child) = duration(parent) * years(child) / 120
    """
    out = []
    i = ORDER.index(lord)
    cursor = start
    for k in range(9):
        sub = ORDER[(i + k) % 9]
        yrs = duration_years * YEARS[sub] / TOTAL_YEARS
        end = cursor + _years_to_delta(yrs)
        out.append({"lord": sub, "start": cursor, "end": end, "years": yrs})
        cursor = end
    return out


def mahadashas(birth_utc, moon_lon, cycles=1):
    """Level-1 periods. The first is partial: only its balance remains at birth."""
    _, _, lord, frac = nakshatra_of(moon_lon)
    i = ORDER.index(lord)
    # Virtual start of the first mahadasha, before birth
    cursor = birth_utc - _years_to_delta(frac * YEARS[lord])
    out = []
    for k in range(9 * cycles):
        L = ORDER[(i + k) % 9]
        yrs = YEARS[L]
        end = cursor + _years_to_delta(yrs)
        out.append({"lord": L, "start": cursor, "end": end, "years": yrs, "level": 1})
        cursor = end
    return out


def walk(birth_utc, moon_lon, at, depth=5):
    """
    The hot path: which ruler holds each office at instant `at`.
    Five arithmetic descents. No table of 59k leaf nodes required.
    """
    periods = mahadashas(birth_utc, moon_lon, cycles=2)
    node = next((p for p in periods if p["start"] <= at < p["end"]), None)
    if node is None:
        return []
    chain = [dict(node, level=1, role=ROLES[1])]
    for level in range(2, depth + 1):
        kids = sub_periods(node["lord"], node["start"], node["years"])
        node = next((k for k in kids if k["start"] <= at < k["end"]), kids[-1])
        chain.append(dict(node, level=level, role=ROLES[level]))
    return chain


def fmt(td):
    s = td.total_seconds()
    d, rem = divmod(s, 86400)
    h, rem = divmod(rem, 3600)
    m, _ = divmod(rem, 60)
    if d >= 365:
        y, dd = divmod(int(d), 365)
        return f"{y}y {dd // 30}m"
    if d >= 1:
        return f"{int(d)}d {int(h)}h"
    if h >= 1:
        return f"{int(h)}h {int(m)}m"
    return f"{int(m)}m"


# ---------------------------------------------------------------- invariants
def check():
    fails = []

    def ok(cond, label):
        if not cond:
            fails.append(label)

    ok(sum(YEARS.values()) == 120, "planet years sum to 120")
    ok(len(ORDER) == 9 and len(set(ORDER)) == 9, "9 distinct lords")
    ok(len(NAKSHATRAS) == 27, "27 nakshatras")

    birth = datetime(1994, 3, 14, 0, 42, tzinfo=timezone.utc)  # 06:12 IST
    moon_lon = 41.7  # arbitrary but fixed for the test

    idx, name, lord, frac = nakshatra_of(moon_lon)
    ok(idx == 3 and lord == "Moon", f"nakshatra lookup (got {idx}, {name}, {lord})")

    mds = mahadashas(birth, moon_lon, cycles=1)
    ok(len(mds) == 9, "9 mahadashas per cycle")
    ok(mds[0]["lord"] == lord, "first mahadasha is the nakshatra lord")
    ok(mds[0]["start"] <= birth < mds[0]["end"], "birth falls inside the first mahadasha")
    span = (mds[-1]["end"] - mds[0]["start"]).total_seconds() / 86400 / DAYS_PER_YEAR
    ok(abs(span - 120) < 1e-6, f"one full cycle spans 120 years (got {span:.9f})")

    # contiguity: no gaps, no overlaps, at every level
    for lvl_name, seq in [("L1", mds)]:
        for a, b in zip(seq, seq[1:]):
            ok(a["end"] == b["start"], f"{lvl_name} contiguous")

    # sub-periods sum exactly to the parent
    for p in mds:
        kids = sub_periods(p["lord"], p["start"], p["years"])
        ok(len(kids) == 9, "9 sub-periods")
        ok(kids[0]["lord"] == p["lord"], f"{p['lord']} sub-periods open with own lord")
        ok(kids[-1]["end"] == p["end"], f"{p['lord']} sub-periods close on parent end")
        ok(abs(sum(k["years"] for k in kids) - p["years"]) < 1e-9,
           f"{p['lord']} sub-period years sum to parent")
        for a, b in zip(kids, kids[1:]):
            ok(a["end"] == b["start"], "L2 contiguous")
        # recurse one more level on the first child
        g = sub_periods(kids[0]["lord"], kids[0]["start"], kids[0]["years"])
        ok(g[-1]["end"] == kids[0]["end"], "L3 closes on L2 end")

    # walk returns a properly nested chain
    at = datetime(2026, 7, 29, 14, 22, tzinfo=timezone.utc)
    chain = walk(birth, moon_lon, at, depth=5)
    ok(len(chain) == 5, "walk returns 5 levels")
    for a, b in zip(chain, chain[1:]):
        ok(a["start"] <= b["start"] and b["end"] <= a["end"], "child nested inside parent")
        ok(b["start"] <= at < b["end"], "instant inside every level")

    # level durations land in the documented ranges
    ranges = {1: (6, 20), 2: (0.3, 3.34), 3: (0.0166, 0.5556),
              4: (0.00092, 0.0926), 5: (0.00005, 0.0155)}
    for c in chain:
        lo, hi = ranges[c["level"]]
        ok(lo * 0.9 <= c["years"] <= hi * 1.1,
           f"L{c['level']} duration {c['years']*DAYS_PER_YEAR:.3f}d in range")

    return fails, chain, (idx, name, lord, frac)


if __name__ == "__main__":
    fails, chain, nak = check()
    print(f"nakshatra: #{nak[0]} {nak[1]}, lord {nak[2]}, {nak[3]*100:.2f}% traversed")
    print(f"balance at birth: {(1-nak[3])*YEARS[nak[2]]:.4f} years\n")
    print(f"{'office':<16}{'lord':<9}{'start':<12}{'end':<12}{'left':>10}")
    print("-" * 60)
    now = datetime(2026, 7, 29, 14, 22, tzinfo=timezone.utc)
    for c in chain:
        print(f"{c['role']:<16}{c['lord']:<9}{c['start']:%Y-%m-%d}  "
              f"{c['end']:%Y-%m-%d}  {fmt(c['end']-now):>10}")
    print()
    if fails:
        print(f"FAILED {len(fails)}:")
        for f in dict.fromkeys(fails):
            print("  -", f)
    else:
        print("all invariants pass")
