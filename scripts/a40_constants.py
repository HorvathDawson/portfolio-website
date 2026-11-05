"""A40 build constants: YAML inputs -> derived values -> generated JSON.

    python3 scripts/a40_constants.py           # write src/blog/a40-constants.generated.json
    python3 scripts/a40_constants.py --check   # exit 1 if the JSON is stale
    python3 scripts/a40_constants.py --test    # self-tests against A40-000 only

Inputs live in content/a40/constants.yaml (see its header). This module
adds the values computed from them (derive()) and merges the kinematic
results written by scripts/plot_geometry_reference.py
(scripts/a40_geometry_results.json). Those results carry a hash of the
inputs they were computed from; if the inputs changed since, generation
stops and asks for the geometry script to be rerun.

Plot scripts import the values:

    from a40_constants import C
    C.front_track          # 1234.0 (number)
    C.text("front_track")  # "1234 mm" (as the posts show it)
    C.entry("front_track") # full record (value, unit, status, note, ...)
"""

import argparse
import hashlib
import json
import math
import os
import re
import sys
from decimal import ROUND_HALF_UP, Decimal

import yaml

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
YAML_PATH = os.path.join(ROOT, "content", "a40", "constants.yaml")
GEOMETRY_PATH = os.path.join(ROOT, "scripts", "a40_geometry_results.json")
GEOMETRY_SCRIPT = os.path.join(ROOT, "scripts", "plot_geometry_reference.py")
OUT_PATH = os.path.join(ROOT, "src", "blog", "a40-constants.generated.json")
STATUSES = ("locked", "working", "target", "open", "measure")
LB_IN = 0.17513  # N/mm per lb/in
G_ACC = 9.81


# ── Formatting (mirrored by formatNumber() in src/blog/a40Constants.ts) ──
def suffix_for(unit):
    if not unit:
        return ""
    return {"deg": "°", "%": "%", "in": '"'}.get(unit, " " + unit)


def format_number(value, decimals=0, round_to=None, signed=False):
    """Half-up rounding on the exact float (same as JS toFixed); U+2212 minus."""
    d = Decimal(value)
    if round_to:
        d = (d / Decimal(round_to)).quantize(Decimal(1), rounding=ROUND_HALF_UP) * Decimal(round_to)
        decimals = 0
    s = str(d.quantize(Decimal(1).scaleb(-decimals), rounding=ROUND_HALF_UP))
    if s.startswith("-"):
        s = "−" + s[1:]
        if s.strip("−0.") == "":
            s = s[1:]  # no "−0"
    elif signed and d != 0:
        s = "+" + s
    return s


def default_decimals(v):
    if isinstance(v, int) or float(v).is_integer():
        return 0
    return len(repr(float(v)).split(".")[1])


class Entry(dict):
    """value, unit, status, note, decimals (+ label, round_to, signed, kind)."""

    def raw(self, decimals=None, round_to=None):
        if isinstance(self["value"], str):
            return self["value"]
        if round_to is None and decimals is None:
            round_to = self.get("round_to")  # an explicit :N overrides the entry's rounding
        return format_number(self["value"], self["decimals"] if decimals is None else decimals,
                             round_to, self.get("signed", False))

    def text(self, decimals=None, round_to=None):
        if isinstance(self["value"], str):
            return self["value"]
        return self.raw(decimals, round_to) + suffix_for(self["unit"])


def entry(value, unit="", status="working", note="", decimals=None, **extra):
    if decimals is None:
        decimals = 0 if isinstance(value, str) else default_decimals(value)
    e = Entry(value=value, unit=unit, status=status, note=note, decimals=decimals)
    e.update({k: v for k, v in extra.items() if v is not None})
    return e


# ── Inputs ───────────────────────────────────────────────────
def load_yaml(path=YAML_PATH):
    with open(path, encoding="utf-8") as f:
        doc = yaml.safe_load(f)
    inputs = {}
    for key, spec in doc["constants"].items():
        if not re.fullmatch(r"[a-z][a-z0-9_]*", key):
            raise ValueError(f"constants.yaml: bad key {key!r} (snake_case only)")
        missing = {"value", "unit", "status", "note"} - set(spec)
        if missing:
            raise ValueError(f"constants.yaml: {key} is missing {sorted(missing)}")
        if spec["status"] not in STATUSES:
            raise ValueError(f"constants.yaml: {key} status {spec['status']!r} not in {STATUSES}")
        inputs[key] = entry(spec["value"], spec["unit"] or "", spec["status"], spec["note"] or "",
                            spec.get("decimals"), label=spec.get("label"), kind="input")
    return inputs, doc.get("tables", {})


def inputs_hash(inputs):
    """Hash of the input values only (notes and labels don't affect results)."""
    payload = json.dumps({k: [e["value"], e["unit"]] for k, e in sorted(inputs.items())},
                         sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(payload.encode()).hexdigest()[:16]


# ── Derived values ───────────────────────────────────────────
def derive(i):
    """Values computed from the inputs `i` (dict of name -> value). Pure."""
    d = {}

    def put(name, value, unit="", status="working", note="", decimals=None, **kw):
        d[name] = entry(value, unit, status, note, decimals, kind="derived", **kw)
        return value

    # Mass
    put("curb_mass", i["operating_mass"] - i["driver_mass"], "kg", note="Operating mass minus the driver.")
    ff = i["front_weight_fraction"] / 100
    put("rear_weight_fraction", 100 - i["front_weight_fraction"], "%")
    put("front_weight_ratio", ff, "", decimals=2, note="Front fraction as a ratio.")
    put("rear_weight_ratio", 1 - ff, "", decimals=2)
    put("axle_load_front", i["operating_mass"] * ff, "kg", decimals=0, note="Operating mass × front fraction.")
    put("sprung_mass", i["operating_mass"] - 2 * i["unsprung_front"] - 2 * i["unsprung_rear"], "kg",
        note="Operating mass minus four unsprung corners.")
    mcf = put("corner_mass_front", (i["operating_mass"] * ff - 2 * i["unsprung_front"]) / 2, "kg", decimals=0,
              note="(mass × front fraction − 2 × unsprung) / 2.")
    mcr = put("corner_mass_rear", (i["operating_mass"] * (1 - ff) - 2 * i["unsprung_rear"]) / 2, "kg", decimals=0,
              note="(mass × rear fraction − 2 × unsprung) / 2.")
    put("cg_height_miata_delta", i["cg_height"] - i["cg_height_miata"], "mm")
    put("cg_height_low", i["cg_height"] - i["cg_height_tol"], "mm")
    put("cg_height_high", i["cg_height"] + i["cg_height_tol"], "mm")

    # Front track from hub face and ET
    hf_m = put("front_hub_face_miata", i["front_track_miata"] / 2 + i["et_miata"], "mm", "measure",
               "Donor hub face from CL = half-track + ET.")
    hf = put("front_hub_face", hf_m - i["front_narrowing"], "mm", "locked",
             "Build reference plane: donor hub face − narrowing.")
    ht = put("front_half_track", hf - i["wheel_et"], "mm", "locked", "Hub face − ET.", decimals=0)
    t = put("front_track", 2 * ht, "mm", "locked", "2 × (hub face − ET).", decimals=0)
    tn = put("front_track_nominal", 10 * math.floor(t / 10 + 0.5), "mm", "locked",
             "Front track rounded to 10 mm; used for vehicle-level ratios.")
    put("front_track_change", i["front_track_miata"] - t, "mm", "locked")
    put("half_track_miata", i["front_track_miata"] / 2, "mm", "measure", decimals=0)
    put("rack_narrowing", 2 * i["front_narrowing"], "mm", "locked", "Same as the track change: 2 × narrowing.")
    put("rack_narrowing_in", 2 * i["front_narrowing"] / 25.4, "in", "locked", decimals=1)

    # Tyres
    od = put("tyre_od", i["wheel_diameter"] * 25.4 + 2 * i["tyre_width"] * i["tyre_aspect"] / 100, "mm", "locked",
             "Rim × 25.4 + 2 × width × aspect.", decimals=1)
    od_m = put("tyre_od_miata", i["wheel_diameter_miata"] * 25.4
               + 2 * i["tyre_width_miata"] * i["tyre_aspect_miata"] / 100, "mm", "locked", decimals=1)
    put("tyre_size", f"{i['tyre_width']:.0f}/{i['tyre_aspect']:.0f}R{i['wheel_diameter']:.0f}", status="locked")
    put("tyre_size_miata", f"{i['tyre_width_miata']:.0f}/{i['tyre_aspect_miata']:.0f}R{i['wheel_diameter_miata']:.0f}",
        status="locked")
    circ = put("tyre_circumference", math.pi * od / 1000, "m", "locked", decimals=3)
    put("hub_z", i["hub_z_miata"] + (od - od_m) / 2, "mm", "working", "Donor hub height + half the OD increase.",
        decimals=2)
    put("hub_z_delta", (od - od_m) / 2, "mm", "working", decimals=2)

    # Fitment
    a40_out = put("a40_stock_outer", i["a40_stock_track"] + i["a40_stock_tyre_width"], "mm", "locked")
    oo = put("tyre_outer_front", tn + i["tyre_width"], "mm", "working", "Nominal track + tyre width.")
    put("tyre_poke", (oo - a40_out) / 2, "mm", "working", "Per side, outside the stock A40 tyres (nominal track).",
        decimals=0)
    put("tyre_poke_exact", (t + i["tyre_width"] - a40_out) / 2, "mm", "working", decimals=0)
    put("tyre_outer_edge", ht + i["tyre_width"] / 2, "mm", "working", decimals=1)
    put("a40_stock_outer_edge", (i["a40_stock_track"] + i["a40_stock_tyre_width"]) / 2, "mm", "locked", decimals=1)
    put("tyre_inner_edge", ht - i["tyre_width"] / 2, "mm", "working", decimals=1)
    put("a40_stock_inner_edge", (i["a40_stock_track"] - i["a40_stock_tyre_width"]) / 2, "mm", "locked", decimals=1)
    put("tyre_outer_gain", oo - a40_out, "mm", "working", "Nominal outer-to-outer minus stock A40.",
        decimals=0, signed=True)
    put("tyre_outer_gain_exact", t + i["tyre_width"] - a40_out, "mm", "working",
        "Exact-track outer-to-outer minus stock A40.", decimals=0, signed=True)
    put("tyre_poke_rounding", abs(t - tn) / 2, "mm", "working",
        "Per-side poke difference between the exact and nominal track.", decimals=0)
    put("tyre_inner_shift", (i["a40_stock_track"] - i["a40_stock_tyre_width"]) / 2 - (ht - i["tyre_width"] / 2),
        "mm", "working", "How much further inboard the inner tyre edge sits than stock.", decimals=0)

    # Rear
    rht = put("rear_half_track", i["rear_track"] / 2, "mm", "locked")
    rhf = put("rear_hub_face", rht + i["wheel_et"], "mm", "locked", "Half-track + ET.")
    put("rear_hub_face_miata_lo", i["rear_track_miata"] / 2 + i["rear_et_miata_lo"], "mm", "measure")
    put("rear_hub_face_miata_hi", i["rear_track_miata"] / 2 + i["rear_et_miata_hi"], "mm", "measure")
    put("rear_narrowing_lo", i["rear_track_miata"] / 2 + i["rear_et_miata_lo"] - rhf, "mm", "measure",
        "Donor rear hub face (ET40 case) − build hub face.")
    put("rear_narrowing_hi", i["rear_track_miata"] / 2 + i["rear_et_miata_hi"] - rhf, "mm", "measure",
        "Donor rear hub face (ET45 case) − build hub face.")

    # Wheel rates from ride frequency (N/mm = N/m / 1000)
    def kw(f, m):
        return (2 * math.pi * f) ** 2 * m / 1000

    kwf = put("kw_front", kw(i["ride_freq_front"], mcf), "N/mm", note="(2π f)² × front sprung corner.", decimals=1)
    kwr = put("kw_rear", kw(i["ride_freq_rear"], mcr), "N/mm", note="(2π f)² × rear sprung corner.", decimals=1)
    put("kw_front_lo", kw(i["ride_freq_front_lo"], mcf), "N/mm", decimals=0)
    put("kw_front_hi", kw(i["ride_freq_front_hi"], mcf), "N/mm", decimals=0)
    put("kw_rear_lo", kw(i["ride_freq_rear_lo"], mcr), "N/mm", decimals=0)
    put("kw_rear_hi", kw(i["ride_freq_rear_hi"], mcr), "N/mm", decimals=0)
    for tag in ("lo", "mid", "hi"):
        put(f"spring_rear_{tag}", kwr / i[f"rear_mr_{tag}"] ** 2, "N/mm", "measure",
            "Rear wheel rate / MR² for this rear MR case.", decimals=1)

    # Roll stiffness from springs: K = Kw T² / 2 (N/mm × m² → kN·m/rad)
    kpf = put("roll_stiffness_front", kwf * (tn / 1000) ** 2 / 2, "kN·m/rad", note="Kw T²/2 at the nominal track.",
              decimals=1)
    kpr = put("roll_stiffness_rear", kwr * (i["rear_track"] / 1000) ** 2 / 2, "kN·m/rad", note="Kw T²/2.", decimals=1)
    put("roll_stiffness_total", kpf + kpr, "kN·m/rad", decimals=1)

    # Critical damping at the wheel: 2√(k m)  (k in N/m → kN·s/m)
    put("damping_crit_front", 2 * math.sqrt(kwf * 1000 * mcf) / 1000, "kN·s/m", note="2√(Kw m) at the wheel.",
        decimals=1)
    put("damping_crit_rear", 2 * math.sqrt(kwr * 1000 * mcr) / 1000, "kN·s/m", note="2√(Kw m) at the wheel.",
        decimals=1)

    # LLTD start
    put("lltd_start_lo", i["front_weight_fraction"] + i["lltd_offset_lo"], "%", "target")
    put("lltd_start_hi", i["front_weight_fraction"] + i["lltd_offset_hi"], "%", "target")

    # Drivetrain: rpm at the reference speed, U-joint angles
    wheel_rpm = put("wheel_rpm_ref", i["reference_speed"] / 3.6 / circ * 60, "rpm", decimals=0)
    for fd_key, fd_tag in (("final_drive", "fd"), ("final_drive_alt1", "alt1"), ("final_drive_alt2", "alt2")):
        for gear in ("5th", "6th", "z32_top"):
            put(f"rpm_{fd_tag}_{gear}", wheel_rpm * i[fd_key] * i[f"gear_{gear}"], "rpm",
                note=f"Engine rpm at {i['reference_speed']:.0f} km/h, {gear} gear, final drive {i[fd_key]}.",
                round_to=10)
    shaft = put("shaft_angle", math.degrees(math.atan2(i["shaft_drop"], i["shaft_length"])), "deg", "working",
                "atan(drop / length).", decimals=1)
    put("ujoint_front", shaft - i["engine_angle"], "deg", "working", "Shaft angle − gearbox angle.", decimals=1)
    put("ujoint_rear", shaft - i["pinion_angle"], "deg", "working", "Shaft angle − pinion angle.", decimals=1)

    # Steering
    put("ackermann_knuckle", math.degrees(math.atan2(i["front_track_miata"] / 2, i["wheelbase_miata"])), "deg",
        "locked", "Stock Miata arm angle atan(half-track / wheelbase).", decimals=2)
    return d


def derive_geometry(i, g):
    """Values that need both the inputs and the geometry results. Pure."""
    d = {}

    def put(name, value, unit="", status="working", note="", decimals=None, **kw):
        d[name] = entry(value, unit, status, note, decimals, kind="derived", **kw)
        return value

    base = derive(i)
    mr = g["front_mr"]["value"]
    ks = put("spring_front", base["kw_front"]["value"] / mr ** 2, "N/mm", note="Front wheel rate / MR².",
             decimals=1)
    put("spring_front_lbin", ks / LB_IN, "lb/in", decimals=0)
    put("damping_crit_front_damper", base["damping_crit_front"]["value"] / mr ** 2, "kN·s/m",
        note="Critical damping at the damper: wheel value / MR².", decimals=1)
    put("stroke_for_stock_travel_lo", i["miata_wheel_travel_lo"] * mr, "mm", decimals=0)
    put("stroke_for_stock_travel_hi", i["miata_wheel_travel_hi"] * mr, "mm", decimals=0)
    # Front bump-travel budget: roll travel plus a road input amplified at
    # resonance by 1/(2ζ) (relative motion, base excitation).
    amp_lo = put("travel_road_lo", i["road_input"] / (2 * i["damping_ride_hi"]), "mm", decimals=0,
                 note="Road input / (2ζ) at the high end of the ride damping band.")
    amp_hi = put("travel_road_hi", i["road_input"] / (2 * i["damping_ride_lo"]), "mm", decimals=0,
                 note="Road input / (2ζ) at the low end of the ride damping band.")
    put("travel_budget_lo", g["roll_travel_wheel"]["value"] + amp_lo, "mm", decimals=0,
        note="Roll travel at the nominal roll target + amplified road input.")
    put("travel_budget_hi", g["roll_travel_wheel"]["value"] + amp_hi, "mm", decimals=0,
        note="Roll travel at the nominal roll target + amplified road input.")
    half = g["uca_cant_offset"]["value"] / 2
    put("uca_cant_half", half, "mm", decimals=1,
        note="Half the plan-cant offset: each UCA pivot sits this far either side of the pivot-line midpoint.")
    put("uca_pivot_front", g["uca_pivot"]["value"] + half, "mm", decimals=0,
        note="Front UCA pivot from CL (midpoint + half the cant offset).")
    put("uca_pivot_rear", g["uca_pivot"]["value"] - half, "mm", decimals=0,
        note="Rear UCA pivot from CL (midpoint − half the cant offset).")
    put("roll_arm_lo", i["cg_height"] - g["roll_axis_rc_hi"]["value"], "mm", decimals=0,
        note="CG height − roll-axis height (rear RC high end).")
    put("roll_arm_hi", i["cg_height"] - g["roll_axis_rc_lo"]["value"], "mm", decimals=0,
        note="CG height − roll-axis height (rear RC low end).")
    return d


# ── Assemble ─────────────────────────────────────────────────
def load_geometry(inputs):
    """Geometry results, or None if missing or computed from other inputs."""
    if not os.path.exists(GEOMETRY_PATH):
        return None, "missing"
    with open(GEOMETRY_PATH, encoding="utf-8") as f:
        g = json.load(f)
    if g.get("inputs_hash") != inputs_hash(inputs):
        return None, "computed from different inputs"
    return {k: entry(v["value"], v["unit"], v["status"], v.get("note", ""), v["decimals"], kind="geometry",
                     signed=v.get("signed")) for k, v in g["results"].items()}, None


class Constants:
    """Attribute access gives the number: C.front_track. C.entry(name) gives the record."""

    def __init__(self, entries, tables, geometry_ok):
        self._e = entries
        self._tables = tables
        self.geometry_ok = geometry_ok

    def __getattr__(self, name):
        if name.startswith("_"):
            raise AttributeError(name)
        try:
            return self._e[name]["value"]
        except KeyError:
            raise AttributeError(f"no A40 constant {name!r}") from None

    def __contains__(self, name):
        return name in self._e

    def entry(self, name):
        return self._e[name]

    def text(self, name, decimals=None):
        return self._e[name].text(decimals)

    def items(self):
        return self._e.items()


def build(geometry=None):
    """Return (entries, tables_spec, geometry_error). geometry: results dict to use instead of the file."""
    inputs, tables = load_yaml()
    values = {k: e["value"] for k, e in inputs.items()}
    entries = dict(inputs)
    for k, e in derive(values).items():
        if k in entries:
            raise ValueError(f"derived value {k} clashes with an input")
        entries[k] = e
    err = None
    if geometry is None:
        geometry, err = load_geometry(inputs)
    if geometry is not None:
        for k, e in geometry.items():
            if k in entries:
                raise ValueError(f"geometry result {k} clashes with a constant")
            entries[k] = e
        for k, e in derive_geometry(values, geometry).items():
            entries[k] = e
    return entries, tables, err


_entries, _tables, _geom_err = build()
C = Constants(_entries, _tables, _geom_err is None)


# ── Templates (same syntax and modifiers as src/blog/a40Constants.ts) ──
PLACEHOLDER = re.compile(r"\{\{\s*([a-z][a-z0-9_]*)((?::[a-z0-9]+)*)\s*\}\}")


def render_placeholder(entries, name, mods, where):
    if name not in entries:
        raise KeyError(f"{where}: unknown constant {{{{{name}}}}}")
    e = entries[name]
    raw, decimals, round_to = False, None, None
    for m in mods:
        if m == "raw":
            raw = True
        elif m.isdigit():
            decimals = int(m)
        elif re.fullmatch(r"r\d+", m):
            round_to = int(m[1:])
        else:
            raise KeyError(f"{where}: unknown modifier :{m} in {{{{{name}}}}}")
    return e.raw(decimals, round_to) if raw else e.text(decimals, round_to)


def substitute(entries, text, where):
    def rep(m):
        mods = [x for x in m.group(2).split(":") if x]
        return render_placeholder(entries, m.group(1), mods, where)

    return PLACEHOLDER.sub(rep, text)


def first_status(entries, template):
    m = PLACEHOLDER.search(template)
    return entries[m.group(1)]["status"] if m and m.group(1) in entries else ""


def render_tables(entries, tables):
    out = {}
    for name, rows in tables.items():
        lines = ["| Parameter | Value | Status | Notes |", "|---|---|---|---|"]
        for r in rows:
            where = f"constants.yaml tables.{name} ({r['label']})"
            status = r.get("status") or first_status(entries, r["value"])
            cells = [substitute(entries, str(r[k] or ""), where) for k in ("label", "value")]
            cells += [status, substitute(entries, str(r.get("note") or ""), where)]
            lines.append("| " + " | ".join(c.replace("|", "\\|") for c in cells) + " |")
        out[name] = "\n".join(lines)
    return out


# ── Output ───────────────────────────────────────────────────
def source_hash():
    h = hashlib.sha256()
    for p in (YAML_PATH, os.path.abspath(__file__), GEOMETRY_PATH):
        h.update(os.path.relpath(p, ROOT).replace(os.sep, "/").encode() + b"\0")
        if os.path.exists(p):
            with open(p, "rb") as f:
                h.update(f.read())
        h.update(b"\0")
    return h.hexdigest()[:16]


def generated_json(entries, tables_spec):
    consts = {}
    for k, e in entries.items():
        rec = {
            "value": e["value"] if isinstance(e["value"], str) else round(float(e["value"]), 6),
            "unit": e["unit"],
            "text": e.text(),
            "raw": e.raw(),
            "suffix": suffix_for(e["unit"]) if not isinstance(e["value"], str) else "",
            "decimals": e["decimals"],
            "status": e["status"],
            "kind": e["kind"],
        }
        for opt in ("round_to", "signed", "label"):
            if e.get(opt):
                rec[opt] = e[opt]
        rec["note"] = e["note"]
        consts[k] = rec
    doc = {
        "_comment": "Generated by scripts/a40_constants.py from content/a40/constants.yaml. Do not edit; run `npm run constants`.",
        "source_hash": source_hash(),
        "constants": consts,
        "tables": render_tables(entries, tables_spec),
    }
    return json.dumps(doc, indent=1, ensure_ascii=False) + "\n"


def write_generated(geometry=None):
    entries, tables, err = build(geometry)
    if err:
        raise SystemExit(f"Geometry results {err}: run `python3 scripts/plot_geometry_reference.py` "
                         "(or `npm run constants`) first.")
    run_self_tests()
    text = generated_json(entries, tables)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"wrote {os.path.relpath(OUT_PATH, ROOT)} ({len(entries)} constants)")


# ── Self-tests: the formulas against A40-000 ─────────────────
A40_000_INPUTS = dict(
    operating_mass=950, driver_mass=75, front_weight_fraction=55, unsprung_front=30, unsprung_rear=33,
    cg_height=575, cg_height_tol=50, cg_height_miata=460, front_track_miata=1420, et_miata=40,
    front_narrowing=95, wheel_et=38, wheel_diameter=15, tyre_width=205, tyre_aspect=65,
    wheel_diameter_miata=14, tyre_width_miata=185, tyre_aspect_miata=60, hub_z_miata=265,
    a40_stock_track=1232, a40_stock_tyre_width=133, rear_track=1340, rear_track_miata=1420,
    rear_et_miata_lo=40, rear_et_miata_hi=45, ride_freq_front=1.4, ride_freq_rear=1.5,
    ride_freq_front_lo=1.2, ride_freq_front_hi=1.6, ride_freq_rear_lo=1.3, ride_freq_rear_hi=1.7,
    rear_mr_lo=0.65, rear_mr_mid=0.75, rear_mr_hi=0.85, lltd_offset_lo=3, lltd_offset_hi=5,
    final_drive=4.44, final_drive_alt1=4.10, final_drive_alt2=3.91, gear_5th=1.0, gear_6th=0.794,
    gear_z32_top=0.759,
    reference_speed=100, engine_angle=3, pinion_angle=3, shaft_drop=3.5, shaft_length=37,
    wheelbase_miata=2265,
)


def run_self_tests():
    d = derive(A40_000_INPUTS)
    v = lambda k: d[k]["value"]  # noqa: E731
    checks = [
        ("front track 1234", round(v("front_track")) == 1234),
        ("front track nominal 1230", v("front_track_nominal") == 1230),
        ("hub face 655", v("front_hub_face") == 655),
        ("tyre OD 647.5", abs(v("tyre_od") - 647.5) < 1e-9),
        ("corners 231/181", round(v("corner_mass_front")) == 231 and round(v("corner_mass_rear")) == 181),
        ("curb 875, sprung ~825", v("curb_mass") == 875 and abs(v("sprung_mass") - 825) <= 1),
        ("wheel rates 17.9/16.1", d["kw_front"].raw() == "17.9" and d["kw_rear"].raw() == "16.1"),
        ("roll stiffness 13.5/14.4", d["roll_stiffness_front"].raw() == "13.5"
         and d["roll_stiffness_rear"].raw() == "14.4" and d["roll_stiffness_total"].raw() == "28.0"),
        ("damping 4.1/3.4", d["damping_crit_front"].raw() == "4.1" and d["damping_crit_rear"].raw() == "3.4"),
        ("rpm 2890 in 6th at 4.44", d["rpm_fd_6th"].raw() == "2890"),
        ("rpm table 3640/3360/3200", [d[f"rpm_{t}_5th"].raw() for t in ("fd", "alt1", "alt2")]
         == ["3640", "3360", "3200"]),
        ("rear hub face 708, narrowing 42/47", v("rear_hub_face") == 708 and v("rear_narrowing_lo") == 42
         and v("rear_narrowing_hi") == 47),
        ("rack 190", v("rack_narrowing") == 190),
        ("shaft 5.4, joints 2.4", d["shaft_angle"].raw() == "5.4" and d["ujoint_front"].raw() == "2.4"),
        ("Ackermann 17.40", d["ackermann_knuckle"].raw() == "17.40"),
        ("poke 35 (37 exact)", v("tyre_poke") == 35 and v("tyre_poke_exact") == 37),
        ("outer +70 (+74 exact), rounding 2, inner shift 35",
         d["tyre_outer_gain"].raw() == "+70" and d["tyre_outer_gain_exact"].raw() == "+74"
         and v("tyre_poke_rounding") == 2 and v("tyre_inner_shift") == 35),
        ("format: half-up, minus sign", format_number(0.125, 2) == "0.13" and format_number(-19.1, 1) == "−19.1"
         and format_number(15.8, 1, signed=True) == "+15.8" and format_number(2886, round_to=10) == "2890"),
    ]
    failed = [name for name, ok in checks if not ok]
    if failed:
        raise AssertionError("a40_constants self-test failed (formulas vs A40-000): " + ", ".join(failed))
    return len(checks)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="exit 1 if the generated JSON is stale")
    ap.add_argument("--test", action="store_true", help="run the self-tests only")
    a = ap.parse_args()
    if a.test:
        print(f"ok: {run_self_tests()} self-tests")
        return
    if a.check:
        entries, tables, err = build()
        if err:
            sys.exit(f"STALE: geometry results {err}; run `npm run constants`.")
        want = generated_json(entries, tables)
        have = open(OUT_PATH, encoding="utf-8").read() if os.path.exists(OUT_PATH) else ""
        if want != have:
            sys.exit(f"STALE: {os.path.relpath(OUT_PATH, ROOT)} does not match the inputs; run `npm run constants`.")
        print("ok: generated constants are up to date")
        return
    write_generated()


if __name__ == "__main__":
    main()
