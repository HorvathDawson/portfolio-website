"""
Generate engineering plots for the A40 build blog.

Outputs PNG files to public/assets/projects/a40-austin/blog/plots/
Run from the repo root:  python3 scripts/plot_geometry_reference.py
The run also prints a summary of every number the posts quote
(see print_summary()), so the posts can be checked against it.

Working inputs (all "working" values -- verify on the car):
  - Front: NA Miata double wishbone, every pickup translated 95 mm/side
    inboard.  Hub face 750 -> 655 mm from CL.  ET38 wheel -> 1234 mm
    track (~1230 nominal; vehicle-level ratios use 1230).
  - Rear: NA Miata IRS narrowed to a 1340 mm track, RX-8 diff (sprung).
    Rear RC and rear MR are NOT known yet: they are parameterised
    (rear RC 80-150 mm, rear MR shown as a sensitivity range).
  - Tire 205/65R15 (OD 647.5 mm).  Donor tire 185/60R14 (OD 577 mm).
  - Sprung mass ~825 kg; sprung corners 231 kg F / 181 kg R; 55/45 F/R.
  - CG 575 +/- 50 mm.
  - Front motion ratio from the front-view instant centre (four-bar
    perturbation), not from the LCA pivot.
  - Springs are specified as WHEEL rates (1.4 Hz front, 1.5 Hz rear).
"""

import os
import numpy as np
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Arc
from matplotlib.ticker import MultipleLocator

# ── Palette (matches blog CSS vars) ──────────────────────────
BG = "#0f172a"
TEXT = "#fcf7f0"
GOLD = "#f3de40"
PINK = "#f65e79"
PURPLE = "#8a3ab9"
BLUE = "#4978f4"
GRID = "#1e293b"
GRID2 = "#334155"
MIATA_C = "#3898ec"
A40_C = PINK
GREEN = "#34d399"

OUT_DIR = os.path.join(
    os.path.dirname(__file__),
    "..",
    "public",
    "assets",
    "projects",
    "a40-austin",
    "blog",
    "plots",
)
os.makedirs(OUT_DIR, exist_ok=True)

DPI = 250


def styled_fig(nrows=1, ncols=1, figsize=(7, 4.5)):
    fig, axes = plt.subplots(nrows, ncols, figsize=figsize)
    fig.patch.set_facecolor(BG)
    for ax in axes.flat if hasattr(axes, "flat") else [axes]:
        ax.set_facecolor(BG)
        ax.tick_params(colors=TEXT, labelsize=9)
        ax.xaxis.label.set_color(TEXT)
        ax.yaxis.label.set_color(TEXT)
        ax.title.set_color(TEXT)
        for spine in ax.spines.values():
            spine.set_color(GRID2)
        ax.grid(True, color=GRID, linewidth=0.5, alpha=0.6)
    return fig, axes


def save(fig, name):
    path = os.path.join(OUT_DIR, name)
    fig.savefig(path, dpi=DPI, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close(fig)
    print(f"  saved {path}")


# ── Shared constants ─────────────────────────────────────────
# Donor: NA Miata front.
T_MIATA = 1420  # front track (mm).  Published 1405-1425; 1420 matches the
#                 scanned subframe + ET40 hub geometry.  Unverified: measure
#                 the donor hub-face width.
ET_MIATA = 40  # NA Miata wheel offset (mm).  Hub FACE sits ET outboard of wheel CL.
#               All `*_from_hub` offsets in SUSP are measured from the hub face.
HUB_FACE_MIATA = T_MIATA / 2 + ET_MIATA  # 750 mm from car CL
TIRE_OD_MIATA = 577.0  # 185/60R14
TIRE_W_MIATA = 185
WB_MIATA = 2265
H_CG_MIATA = 460

# A40 build, front.  Lock the pickups / hub-face position, not the track.
NARROW_PER_SIDE = 95  # mm, locked
ET_A40 = 38
HUB_FACE_A40 = HUB_FACE_MIATA - NARROW_PER_SIDE  # 655 mm from CL
HT_A40 = HUB_FACE_A40 - ET_A40  # 617 mm: exact wheel-CL half-track at ET38
T_A40_EXACT = 2 * HT_A40  # 1234 mm
T_A40 = 1230  # nominal front track used for vehicle-level ratios
TIRE_OD_A40 = 647.5  # 205/65R15
TIRE_W_A40 = 205
WB_A40 = 2350

# A40 build, rear: narrowed NA Miata IRS.
T_REAR = 1340  # mm, locked
H_RC_REAR_LO = 80.0  # mm  -- rear RC unknown until the narrowed Miata rear
H_RC_REAR_HI = 150.0  # mm     is measured/modelled; carry the range.
H_RC_REAR_NOM = 100.0  # mm  -- mid value used where one number is needed
MR_REAR_CASES = (0.65, 0.75, 0.85)  # rear MR unknown: sensitivity only

# Mass (working).
H_CG_A40 = 575  # +/- 50 mm
M_TOTAL = 950  # operating mass, driver + fuel
M_S_A40 = 825  # sprung mass
M_CORNER_F = 231  # sprung corner mass, front
M_CORNER_R = 181  # sprung corner mass, rear
FRONT_FRAC = 0.55  # static front weight fraction
G_ACC = 9.81
AY = 0.8

# Ride: wheel rates from target frequencies (independent of MR).
FREQ_F = 1.4  # Hz
FREQ_R = 1.5  # Hz (0.1 Hz above front)
KW_FRONT = (2 * np.pi * FREQ_F) ** 2 * M_CORNER_F  # N/m  ~17,900
KW_REAR = (2 * np.pi * FREQ_R) ** 2 * M_CORNER_R  # N/m  ~16,100
K_PHI_FRONT_SPRING = KW_FRONT * (T_A40 / 1000) ** 2 / 2  # N-m/rad ~13.5k
K_PHI_REAR_SPRING = KW_REAR * (T_REAR / 1000) ** 2 / 2  # N-m/rad ~14.4k
K_PHI_SPRING = K_PHI_FRONT_SPRING + K_PHI_REAR_SPRING  # ~28k

# Shock (front).
SHOCK_STROKE_MM = 5 * 25.4  # 127 mm
SHOCK_ALPHA_DEG = 80.0  # shock angle to the LCA at the lower mount (working)
SHOCK_LEN_RIDE = 330.0  # eye-to-eye at ride height (assumed; only affects
#                         how MR drifts through travel, not the static MR)
BUMP_FRACTION = 0.45  # share of the stroke available in bump at ride height
#                       (assumption: same ~45/55 split as the stock Miata)

# ARB (placeholder installation ratio -- measure).
G_SHEAR = 80e9
L_EFF = 400  # mm ARB effective torsional length
# Installation ratio back-calculated from "stock 19 mm front bar adds
# ~10,000 N-m/rad" on the Miata: IR = sqrt(10000 / K_bar(19)) = 1.977.
# IR scales with track (same end-link point on the LCA, smaller wheel
# travel per degree of roll), so the A40 value is 1.977 * 1230/1420.
IR_BAR_MIATA = 1.977
IR_BAR = IR_BAR_MIATA * T_A40 / T_MIATA  # ~1.71

# ── Miata NA front suspension geometry (all in mm) ────────────────
# Source: photogrammetric scan of the donor front subframe (Einstar 2).
# The original numbers came from forum-published CAD (frontcontrolarms.pdf
# + frontcontrolpickups.pdf) but produced ~11.5° static caster — implausible
# for a street-car Miata, so the donor was scanned.  Scan corrected UCA
# pickup positions and LCA inner-pivot width; LCA arm geometry (fa span,
# BJ offset, z rise) was correct in the forum CAD and is retained.
# Coordinate convention: +x outboard, +y forward, +z up. Origin at hub/BJ.
SUSP = dict(
    # ── Knuckle / heights (front view) ──
    hub_z_ground=265,  # hub centre height above ground at ride height
    # KPI / caster are DERIVED from lbj_from_hub and ubj_from_hub — see
    # KPI_DEG / CASTER_DEG below.  Do not duplicate them here.
    # ── Knuckle BJ and steering arm positions relative to hub centre ──────────
    # Convention: (lat, fa, h) — lat outboard+, fa forward+, h up+, all mm.
    # Source: donor subframe scan (Einstar 2).
    lbj_from_hub=(-84.25, -3.75, -86.0),
    ubj_from_hub=(-132.0, -17.9, +137.75),
    steer_from_hub=(-65.990, +97.216, -75.697),  # [SCAN-TBD] steering arm not yet re-measured
    # ── LCA inner pivot positions (LCA arm geometry confirmed by scan) ─────────
    # Lateral: from car CL.  Fore-aft origin: LCA front pivot.
    # BJ is lca_bj_fa mm FORWARD of the LCA front pivot.
    lca_from_cl=329.5,  # scan: 659/2 mm from CL (both front & rear pivots)
    lca_fa_span=322.5,  # scan: front-to-rear pivot c-to-c
    lca_bj_fa=25.0,  # BJ is 25 mm forward of LCA front pivot — scan-confirmed
    lca_z_rise=25.0,  # LCA inner pivot is 25 mm ABOVE LBJ height — scan-confirmed
    # Coilover and ARB mounts: explicit (perp_from_pivot_line, fore-aft in arm frame)
    # Both lie on horizontal lines (constant y) between BJ and the pivot line.
    lca_coilover_perp=240.0,  # coilover: mm outboard from pivot line
    lca_coilover_fa=+25.0,  # coilover: fore-aft = +25mm (forward of BJ)
    lca_arb_perp=185.0,  # ARB end-link: mm outboard from pivot line
    lca_arb_fa=+35.0,  # ARB end-link: fore-aft = +35mm (forward of BJ)
    # ── UCA inner pivot positions (donor scan — symmetric arm) ────────────────
    # UCA is SYMMETRIC: front and rear pivots 220mm apart c-to-c, BJ centred.
    # Lateral arm length (UBJ-to-pivot line) = 250 mm.
    uca_hub_to_pivot=382.0,  # lateral: hub centre to UCA inner pivot line (mm)
    uca_fa_front=110.0,  # UCA front pivot: +110 mm forward of BJ (symmetric)
    uca_fa_rear=110.0,   # UCA rear pivot:  110 mm rearward of BJ (symmetric)
    uca_z_front=181.78,  # UCA front pivot height above LCA pivot
    uca_z_rear=168.22,  # UCA rear pivot height above LCA pivot
    uca_z_drop=23.75,  # UCA inner pivot is 23.75 mm below UBJ height
    # ── Pivot bushing dimensions (fore-aft length, mm) ──────────────────
    lca_f_bushing=71.0,  # scan: LCA front pivot bushing length
    lca_r_bushing=60.0,  # scan: LCA rear pivot bushing length
    uca_bushing=57.0,  # scan: UCA pivot bushing length (both pivots)
    pivot_width=10.0,  # visual width for all pivot rectangles (mm)
    # ── Tire (for RC construction) ──
    tire_w=185,  # tire section width mm
    tire_od=577,  # 185/60R14 outer diameter mm
)


def susp_geometry():
    """Return derived suspension pickup positions in car-frame coordinates.

    All positions are (lat, fa, z) tuples:
      lat: mm from car CL         (+outboard)
      fa:  mm from LCA front pivot (+forward, −rearward)
      z:   mm from LCA inner pivot height (+up)

    Call this from any plot that needs pickup coordinates. Updating SUSP
    propagates to every consumer automatically.
    """
    HT = T_MIATA / 2  # 710 mm wheel-CL half-track
    HUB_FACE = HT + ET_MIATA  # 750 mm — BJ measurements live in this frame
    uca_lat_cl = HUB_FACE - SUSP["uca_hub_to_pivot"]  # UCA pivot lateral from CL
    return dict(
        half_track=HT,
        hub_face_from_cl=HUB_FACE,
        lca_hub_to_pivot=HUB_FACE - SUSP["lca_from_cl"],  # hub face to inner pivot
        # Inner pivot positions (lat from CL, fa from LCA-F pivot, z from LCA pivot)
        lca_f=(SUSP["lca_from_cl"], 0.0, 0.0),
        lca_r=(SUSP["lca_from_cl"], -SUSP["lca_fa_span"], 0.0),
        uca_f=(
            uca_lat_cl,
            SUSP["lca_bj_fa"] + SUSP["uca_fa_front"],
            SUSP["uca_z_front"],
        ),
        uca_r=(uca_lat_cl, SUSP["lca_bj_fa"] - SUSP["uca_fa_rear"], SUSP["uca_z_rear"]),
        # Coilover and ARB mounts on LCA (lateral from CL, fa from LCA-F pivot, z=0)
        coilover=(
            SUSP["lca_from_cl"] + SUSP["lca_coilover_perp"],
            SUSP["lca_coilover_fa"],
            0.0,
        ),
        arb=(SUSP["lca_from_cl"] + SUSP["lca_arb_perp"], SUSP["lca_arb_fa"], 0.0),
    )


# ── Steering-axis derived numbers (KPI, caster, scrub, trail) ─────────
# All measured from the scan, expressed in the car-CL/ground frame
# (donor configuration: ET40, 577 mm tire, hub 265 mm above ground).
_HUB_FACE_X = HUB_FACE_MIATA  # 750
_LBJ_X = _HUB_FACE_X + SUSP["lbj_from_hub"][0]  # 665.75
_LBJ_FA = SUSP["lbj_from_hub"][1]  # -3.75
_LBJ_Z = SUSP["hub_z_ground"] + SUSP["lbj_from_hub"][2]  # 179.0
_UBJ_X = _HUB_FACE_X + SUSP["ubj_from_hub"][0]  # 618.0
_UBJ_FA = SUSP["ubj_from_hub"][1]  # -17.9
_UBJ_Z = SUSP["hub_z_ground"] + SUSP["ubj_from_hub"][2]  # 402.75
_KP_DZ = _UBJ_Z - _LBJ_Z
KPI_DEG = np.degrees(np.arctan2(_LBJ_X - _UBJ_X, _KP_DZ))  # 12.05
CASTER_DEG = np.degrees(np.arctan2(_LBJ_FA - _UBJ_FA, _KP_DZ))  # 3.62
# Kingpin axis pierces ground at t = -_LBJ_Z / _KP_DZ from LBJ.
_T_GND = -_LBJ_Z / _KP_DZ
_KP_GND_X = _LBJ_X + _T_GND * (_UBJ_X - _LBJ_X)
_KP_GND_FA = _LBJ_FA + _T_GND * (_UBJ_FA - _LBJ_FA)
# Scrub: contact patch is at hub centerline = T_MIATA/2 from CL.
SCRUB_MM = (T_MIATA / 2) - _KP_GND_X  # +ve = pierces inboard of CP  (~6.05)
TRAIL_MM = _KP_GND_FA - 0.0  # +ve = pierces ahead of CP  (~7.57)

# A40 build: taller tire raises the hub; ET38 moves the CP 2 mm outboard.
HUB_Z_A40 = SUSP["hub_z_ground"] + (TIRE_OD_A40 - TIRE_OD_MIATA) / 2  # 300.25
_DH = HUB_Z_A40 - SUSP["hub_z_ground"]
SCRUB_A40_MM = (
    SCRUB_MM - _DH * np.tan(np.radians(KPI_DEG)) + (ET_MIATA - ET_A40)
)  # ~+0.5
TRAIL_A40_MM = TRAIL_MM + _DH * np.tan(np.radians(CASTER_DEG))  # ~9.8
# LBJ lateral offset inboard of the wheel centreline (top-view kingpin).
KPI_OFFSET_MIATA = -SUSP["lbj_from_hub"][0] - ET_MIATA  # 44.25
KPI_OFFSET_A40 = -SUSP["lbj_from_hub"][0] - ET_A40  # 46.25


def arb_K_bar(d_mm):
    """Torsional stiffness of a solid round bar (N-m/rad)."""
    return G_SHEAR * np.pi * (d_mm / 1000) ** 4 / (32 * L_EFF / 1000)


def arb_roll_stiffness(d_mm):
    """Roll stiffness from one ARB at the A40 front track (N-m/rad).
    IR_BAR is a placeholder -- measure the end-link geometry."""
    return arb_K_bar(d_mm) * IR_BAR**2


def roll_axis_height(h_rc_rear=H_RC_REAR_NOM, h_rc_front=None):
    """Roll-axis height under the CG (mm).  CG sits (1 - FRONT_FRAC) of
    the wheelbase behind the front axle."""
    if h_rc_front is None:
        h_rc_front = H_RC_A40
    return h_rc_front + (h_rc_rear - h_rc_front) * (1 - FRONT_FRAC)


def roll_angle_deg(cg_mm, K_phi_total, m_s=M_S_A40, h_rc_rear=H_RC_REAR_NOM):
    """Steady-state roll at AY with the gravity (overturning) term."""
    arm = (cg_mm - roll_axis_height(h_rc_rear)) / 1000
    moment = m_s * AY * G_ACC * arm
    grav = m_s * G_ACC * arm
    denom = np.where(K_phi_total - grav > 0, K_phi_total - grav, np.nan)
    return np.degrees(moment / denom)


def k_phi_required(roll_deg, cg_mm=H_CG_A40, h_rc_rear=H_RC_REAR_NOM, m_s=M_S_A40):
    """Total roll stiffness (N-m/rad) needed for a target roll angle."""
    arm = (cg_mm - roll_axis_height(h_rc_rear)) / 1000
    return m_s * AY * G_ACC * arm / np.radians(roll_deg) + m_s * G_ACC * arm


# ====================================================================
# 1. Roll angle vs CG height, by added ARB roll stiffness
#    Bands = rear RC 80-150 mm (unknown until the narrowed Miata rear
#    is measured).
# ====================================================================
def plot_roll_vs_cg():
    fig, ax = styled_fig(figsize=(7, 5.2))
    cg = np.linspace(450, 700, 300)

    adds = [0, 16_000, 24_000, 33_000]
    colors = [TEXT, BLUE, GREEN, GOLD]
    for k_add, c in zip(adds, colors):
        K = K_PHI_SPRING + k_add
        r_lo = roll_angle_deg(cg, K, h_rc_rear=H_RC_REAR_HI)
        r_hi = roll_angle_deg(cg, K, h_rc_rear=H_RC_REAR_LO)
        r_nom = roll_angle_deg(cg, K, h_rc_rear=H_RC_REAR_NOM)
        lbl = (
            f"Springs only ({K_PHI_SPRING/1000:.1f} kN-m/rad)"
            if k_add == 0
            else f"+ {k_add/1000:.0f} kN-m/rad of ARB ({K/1000:.0f} total)"
        )
        ax.fill_between(cg, r_lo, r_hi, color=c, alpha=0.12, linewidth=0)
        ax.plot(cg, r_nom, color=c, linewidth=1.8,
                linestyle="--" if k_add == 0 else "-",
                alpha=0.8 if k_add == 0 else 1.0, label=lbl)

    ax.axhspan(3.0, 4.0, color=PINK, alpha=0.08)
    ax.axhline(3.5, color=PINK, linestyle=":", linewidth=1, alpha=0.7,
               label="3-4° target")
    ax.axvline(H_CG_A40, color=TEXT, linestyle=":", linewidth=0.6, alpha=0.4)
    ax.axvspan(H_CG_A40 - 50, H_CG_A40 + 50, color=TEXT, alpha=0.04)
    ax.text(H_CG_A40 + 3, 11.3, "est. CG\n575 ± 50", color=TEXT,
            fontsize=7, alpha=0.6)

    for cg_val in (525, 575, 625):
        r = roll_angle_deg(np.array([cg_val]), K_PHI_SPRING)[0]
        ax.plot(cg_val, r, "s", color=TEXT, markersize=4, alpha=0.7, zorder=5)
        ax.annotate(f"{r:.1f}°", xy=(cg_val, r), xytext=(cg_val - 4, r + 0.6),
                    fontsize=6.5, color=TEXT, alpha=0.75, ha="right")

    ax.text(0.99, 0.02,
            "Lines: rear RC 100 mm.  Bands: rear RC 150 (lower edge) to 80 mm.\n"
            f"Front RC {H_RC_A40:.0f} mm (kinematic), sprung mass {M_S_A40} kg, "
            f"springs {KW_FRONT/1000:.1f} / {KW_REAR/1000:.1f} N/mm wheel rate.",
            transform=ax.transAxes, fontsize=6.3, color=TEXT, alpha=0.65,
            ha="right", va="bottom")
    ax.set_xlabel("CG height (mm)")
    ax.set_ylabel("Body roll at 0.8 G (°)")
    ax.set_title("Body roll vs CG height and added ARB stiffness")
    ax.legend(fontsize=7, facecolor=BG, edgecolor=GRID2, labelcolor=TEXT,
              loc="upper left")
    ax.set_xlim(450, 700)
    ax.set_ylim(0, 12)
    ax.xaxis.set_major_locator(MultipleLocator(25))
    save(fig, "roll_vs_cg.png")


# ====================================================================
# 1b. Front-view roll centre construction
#
#     x = 0 at vehicle centreline, y = 0 at the ground plane.
#     The whole linkage translates with the hub face; pickups come from
#     SUSP (donor scan).  IC, RC, tire rectangle and construction lines
#     are all computed from those inputs.
# ====================================================================
def _build_suspension(half_track, *, hub_z_ground=None, tire_od=None,
                      et=ET_MIATA, tire_w=None):
    """Derive front-view suspension positions for one (right) side.

    half_track   -- wheel-CL (= contact patch) distance from car CL.
    et           -- wheel offset; hub face sits `et` outboard of wheel CL.
    hub_z_ground -- hub centre height above ground (default: SUSP value).
    tire_od/w    -- tire size for drawing.

    The inner pivots translate inboard by the same amount as the hub
    face (HUB_FACE_MIATA - hub_face), so the local linkage is identical
    to the donor.

    Returns absolute positions: lbj, ubj, lca_inner, uca_inner, cp, ic,
    rc -- numpy [x, y]  (x = lateral from CL, y = height above ground).
    """
    ht = half_track
    hub_face = ht + et
    hz = hub_z_ground if hub_z_ground is not None else SUSP["hub_z_ground"]
    tod = tire_od if tire_od is not None else SUSP["tire_od"]
    tw = tire_w if tire_w is not None else SUSP["tire_w"]

    lbj = np.array([hub_face + SUSP["lbj_from_hub"][0], hz + SUSP["lbj_from_hub"][2]])
    ubj = np.array([hub_face + SUSP["ubj_from_hub"][0], hz + SUSP["ubj_from_hub"][2]])

    inboard = HUB_FACE_MIATA - hub_face
    lca_inner = np.array([SUSP["lca_from_cl"] - inboard, lbj[1] + SUSP["lca_z_rise"]])
    uca_inner = np.array(
        [hub_face - SUSP["uca_hub_to_pivot"], ubj[1] - SUSP["uca_z_drop"]]
    )
    cp = np.array([ht, 0.0])

    # Instant centre: intersection of the two arm lines extended
    d_low = lbj - lca_inner
    d_up = ubj - uca_inner
    A_mat = np.array([[d_low[0], -d_up[0]], [d_low[1], -d_up[1]]])
    ts = np.linalg.solve(A_mat, uca_inner - lca_inner)
    ic = lca_inner + ts[0] * d_low

    # RC: line from contact patch through IC to the centreline (x = 0)
    d_rc = ic - cp
    rc = cp + (-cp[0] / d_rc[0]) * d_rc

    return dict(half_track=ht, tire_w=tw, tire_od=tod, hub_z=hz, et=et,
                lbj=lbj, ubj=ubj, lca_inner=lca_inner, uca_inner=uca_inner,
                cp=cp, ic=ic, rc=rc)


# Standard configurations: (half_track, hub_z, tire_od, et, tire_w)
CFG_MIATA = dict(half_track=T_MIATA / 2, hub_z_ground=SUSP["hub_z_ground"],
                 tire_od=TIRE_OD_MIATA, et=ET_MIATA, tire_w=TIRE_W_MIATA)
CFG_A40 = dict(half_track=HT_A40, hub_z_ground=HUB_Z_A40,
               tire_od=TIRE_OD_A40, et=ET_A40, tire_w=TIRE_W_A40)
# A40 pickups with the donor tire/ET (isolates the narrowing effect)
CFG_A40_MIATA_TIRE = dict(half_track=HUB_FACE_A40 - ET_MIATA,
                          hub_z_ground=SUSP["hub_z_ground"],
                          tire_od=TIRE_OD_MIATA, et=ET_MIATA, tire_w=TIRE_W_MIATA)

_RC_MIATA_SUSP = _build_suspension(**CFG_MIATA)
_RC_A40_SUSP = _build_suspension(**CFG_A40)
H_RC_MIATA = _RC_MIATA_SUSP["rc"][1]  # ~142 mm
H_RC_A40 = _RC_A40_SUSP["rc"][1]  # ~139 mm
H_RC_A40_MIATA_TIRE = _build_suspension(**CFG_A40_MIATA_TIRE)["rc"][1]  # ~123 mm


def _plot_rc_pair(configs, fname, title, info_lines):
    """Front-view RC construction for two configurations, overlaid.

    configs: list of (label, cfg_dict, color, alpha).
    """
    from matplotlib.lines import Line2D

    fig, ax = styled_fig(figsize=(8, 8))
    ax.set_aspect("equal")

    def mx(pt, s):
        return np.array([s * pt[0], pt[1]])

    rc_results = []
    all_x, all_y = [0.0], [0.0]
    for idx, (label, cfg, color, alpha) in enumerate(configs):
        p = _build_suspension(**cfg)
        for s in (1, -1):
            lbj, ubj = mx(p["lbj"], s), mx(p["ubj"], s)
            lca_in, uca_in = mx(p["lca_inner"], s), mx(p["uca_inner"], s)
            cp, ic = mx(p["cp"], s), mx(p["ic"], s)
            htx, tw, th = s * p["half_track"], p["tire_w"], p["tire_od"]
            ax.add_patch(plt.Rectangle((htx - tw / 2, 0), tw, th, linewidth=1.0,
                                       edgecolor=color, facecolor=color,
                                       alpha=alpha * 0.08, zorder=2))
            ax.plot([htx - tw / 2, htx + tw / 2, htx + tw / 2, htx - tw / 2,
                     htx - tw / 2], [0, 0, th, th, 0], color=color,
                    linewidth=0.9, alpha=alpha * 0.4, zorder=3)
            for a, b, lw in ((lca_in, lbj, 2.2), (uca_in, ubj, 2.2), (lbj, ubj, 2.6)):
                ax.plot([a[0], b[0]], [a[1], b[1]], color=color, linewidth=lw,
                        alpha=alpha, solid_capstyle="round")
            for pt in (lca_in, uca_in, lbj, ubj):
                ax.plot(pt[0], pt[1], "o", color=color, markersize=3.5,
                        alpha=alpha, zorder=5)
            for a in (lca_in, uca_in):
                ax.plot([a[0], ic[0]], [a[1], ic[1]], color=color, linewidth=0.7,
                        alpha=alpha * 0.35, linestyle="--")
            ax.plot(ic[0], ic[1], "D", color=color, markersize=4.5, alpha=alpha,
                    zorder=5)
            ax.plot([cp[0], ic[0], 0], [cp[1], ic[1], p["rc"][1]], color=color,
                    linewidth=1.0, alpha=alpha * 0.6, linestyle="-.", zorder=4)
            all_x.extend([ic[0], htx + s * tw])
            all_y.extend([ic[1], th])
        rc_y = p["rc"][1]
        rc_results.append((label, rc_y, color, alpha))
        ax.plot(0, rc_y, "s", color=color, markersize=7,
                alpha=min(alpha + 0.15, 1.0), zorder=6)
        dx = 120 if idx == 0 else -120
        ax.annotate(f"RC = {rc_y:.1f} mm", xy=(0, rc_y),
                    xytext=(dx, rc_y + (55 if idx == 0 else -55)),
                    fontsize=8, color=color, fontweight="bold",
                    ha="left" if idx == 0 else "right",
                    arrowprops=dict(arrowstyle="->", color=color, lw=0.7))

    ax.axhline(0, color=TEXT, linewidth=1, alpha=0.3)
    ax.axvline(0, color=TEXT, linewidth=0.5, alpha=0.2, linestyle=":")
    ax.text(5, -30, "CL", color=TEXT, fontsize=7, alpha=0.3, ha="left")
    ax.text(0.02, 0.97, "\n".join(info_lines), fontsize=7.5, color=TEXT,
            alpha=0.85, transform=ax.transAxes, va="top", ha="left",
            bbox=dict(boxstyle="round,pad=0.4", fc=BG, ec=GRID2, alpha=0.9))
    ax.set_xlabel("Front view position (mm)")
    ax.set_ylabel("Height (mm)")
    ax.set_title(title)
    x_abs = max(abs(v) for v in all_x) + 120
    ax.set_xlim(-x_abs, x_abs)
    ax.set_ylim(-200, max(all_y) + 380)
    ax.legend(handles=[Line2D([0], [0], color=c, linewidth=2.2, alpha=a, label=l)
                       for l, _, c, a in rc_results],
              fontsize=7.5, facecolor=BG, edgecolor=GRID2, labelcolor=TEXT,
              loc="upper right")
    save(fig, fname)
    return [r[1] for r in rc_results]


def plot_rc_construction():
    """Narrowing only: donor tire at both tracks."""
    a = _build_suspension(**CFG_MIATA)["rc"][1]
    b = H_RC_A40_MIATA_TIRE
    _plot_rc_pair(
        [(f"Donor track ({T_MIATA} mm), 185/60R14", CFG_MIATA, MIATA_C, 0.45),
         (f"A40 pickups ({2*CFG_A40_MIATA_TIRE['half_track']:.0f} mm), 185/60R14",
          CFG_A40_MIATA_TIRE, A40_C, 0.9)],
        "rc_construction.png",
        "Roll centre construction: narrowing only (same tire)",
        [f"Same linkage shifted {NARROW_PER_SIDE} mm/side inboard.",
         f"RC {a:.1f} -> {b:.1f} mm ({b - a:+.1f} mm, x{b / a:.3f})",
         f"Track ratio {2*CFG_A40_MIATA_TIRE['half_track']/T_MIATA:.3f}: "
         "RC scales with track."])


def plot_rc_tire_comparison():
    """Tire height only: A40 pickups, donor tire vs 205/65R15."""
    a = H_RC_A40_MIATA_TIRE
    b = H_RC_A40
    _plot_rc_pair(
        [("185/60R14, ET40 (577 mm OD)", CFG_A40_MIATA_TIRE, MIATA_C, 0.45),
         (f"205/65R15, ET38 ({TIRE_OD_A40} mm OD)", CFG_A40, A40_C, 0.9)],
        "rc_tire_comparison.png",
        "Roll centre construction: tire height at the A40 pickups",
        [f"Taller tire lifts the whole linkage {HUB_Z_A40 - SUSP['hub_z_ground']:.2f} mm",
         "(pickups move up with it on the custom frame).",
         f"RC {a:.1f} -> {b:.1f} mm ({b - a:+.1f} mm): the IC rises,",
         "the contact patch does not."])


def plot_rc_combined():
    """Stock Miata vs the actual A40 build (narrowing + taller tire)."""
    a, b = H_RC_MIATA, H_RC_A40
    pm, pa = _RC_MIATA_SUSP, _RC_A40_SUSP
    _plot_rc_pair(
        [(f"Stock Miata ({T_MIATA} mm, 185/60R14 ET40)", CFG_MIATA, MIATA_C, 0.45),
         (f"A40 build ({T_A40_EXACT} mm, 205/65R15 ET38)", CFG_A40, A40_C, 0.9)],
        "rc_combined.png",
        "Roll centre construction: stock Miata vs A40 build",
        [f"Miata: RC {a:.1f} mm, IC {pm['cp'][0] - pm['ic'][0]:.0f} mm inboard "
         f"of CP, {pm['ic'][1]:.0f} mm up",
         f"A40:   RC {b:.1f} mm, IC {pa['cp'][0] - pa['ic'][0]:.0f} mm inboard "
         f"of CP, {pa['ic'][1]:.0f} mm up",
         f"Narrowing {H_RC_A40_MIATA_TIRE - a:+.0f} mm, taller tire "
         f"{b - H_RC_A40_MIATA_TIRE:+.0f} mm, net {b - a:+.1f} mm"])


# ====================================================================
# 1d. RC migration polygon
#
#     Sweep both wheels' LCA angles independently across bump/droop
#     and trace the area in the front view that the RC can occupy.
#
#     Travel: 5 in (127 mm) shock stroke through the four-bar MR
#     (~0.68 at 80 deg), 45 % of the stroke in bump at ride height
#     -> ~84 mm bump / ~102 mm droop at the wheel (front_wheel_travel()).
#
#     Kinematic model (planar front view):
#       1. LCA inner pivot fixed; LBJ on circle of radius R_lca.
#       2. UBJ = circle-circle intersection (knuckle from LBJ +
#          UCA from UCA inner).  Take the upper solution.
#       3. Hub is rigid relative to the knuckle: pre-compute its
#          position in the LBJ→UBJ frame at ride height, transform
#          through the current knuckle orientation.
#       4. Contact patch = hub projected to z = 0.
#       5. FVIC = intersection of LCA line and UCA line.
#       6. RC = intersection of (CP_R → FVIC_R) and (CP_L → FVIC_L).
#          Symmetric vehicle assumed; left side mirrors right.
# ====================================================================
def _solve_4bar(theta, lca_inner, R_lca, uca_inner, R_uca, knuckle_len, hub_local):
    """Solve front-view 4-bar at LCA angle theta."""
    lbj = lca_inner + R_lca * np.array([np.cos(theta), np.sin(theta)])
    d_vec = uca_inner - lbj
    d = np.linalg.norm(d_vec)
    if d > knuckle_len + R_uca or d < abs(knuckle_len - R_uca) or d < 1e-9:
        return None
    a = (knuckle_len**2 - R_uca**2 + d**2) / (2 * d)
    h_sq = knuckle_len**2 - a**2
    if h_sq < 0:
        return None
    h = np.sqrt(h_sq)
    p_mid = lbj + a * d_vec / d
    n_perp = np.array([-d_vec[1], d_vec[0]]) / d
    ubj_a = p_mid + h * n_perp
    ubj_b = p_mid - h * n_perp
    ubj = ubj_a if ubj_a[1] > ubj_b[1] else ubj_b

    d_low = lbj - lca_inner
    d_up = ubj - uca_inner
    A_mat = np.array([[d_low[0], -d_up[0]], [d_low[1], -d_up[1]]])
    if abs(np.linalg.det(A_mat)) < 1e-9:
        return None
    b_vec = uca_inner - lca_inner
    ts = np.linalg.solve(A_mat, b_vec)
    ic = lca_inner + ts[0] * d_low

    knuckle_dir = (ubj - lbj) / knuckle_len
    knuckle_perp = np.array([-knuckle_dir[1], knuckle_dir[0]])
    hub = lbj + hub_local[0] * knuckle_dir + hub_local[1] * knuckle_perp
    cp = np.array([hub[0], 0.0])
    return dict(lbj=lbj, ubj=ubj, ic=ic, cp=cp, hub=hub)


def _rc_from_sides(state_r, state_l):
    """RC = intersection of (CP_r → IC_r) and (CP_l → IC_l)."""
    cp_r, ic_r = state_r["cp"], state_r["ic"]
    cp_l, ic_l = state_l["cp"], state_l["ic"]
    d_r = ic_r - cp_r
    d_l = ic_l - cp_l
    A_mat = np.array([[d_r[0], -d_l[0]], [d_r[1], -d_l[1]]])
    if abs(np.linalg.det(A_mat)) < 1e-9:
        return None
    b_vec = cp_l - cp_r
    ts = np.linalg.solve(A_mat, b_vec)
    return cp_r + ts[0] * d_r


def _build_kinematic_params(half_track, hub_z_ground, tire_od, *, et=ET_MIATA,
                            tire_w=None):
    """Pre-compute fixed kinematic parameters for one (right) side."""
    p = _build_suspension(half_track, hub_z_ground=hub_z_ground, tire_od=tire_od,
                          et=et, tire_w=tire_w)
    lca_inner = p["lca_inner"]
    uca_inner = p["uca_inner"]
    lbj_ride = p["lbj"]
    ubj_ride = p["ubj"]
    hub_ride = np.array([p["half_track"], hub_z_ground])

    R_lca = np.linalg.norm(lbj_ride - lca_inner)
    R_uca = np.linalg.norm(ubj_ride - uca_inner)
    knuckle_len = np.linalg.norm(ubj_ride - lbj_ride)

    knuckle_dir = (ubj_ride - lbj_ride) / knuckle_len
    knuckle_perp = np.array([-knuckle_dir[1], knuckle_dir[0]])
    rel = hub_ride - lbj_ride
    hub_local = np.array([rel @ knuckle_dir, rel @ knuckle_perp])

    theta_ride = np.arctan2(
        lbj_ride[1] - lca_inner[1], lbj_ride[0] - lca_inner[0]
    )
    ride = _solve_4bar(
        theta_ride, lca_inner, R_lca, uca_inner, R_uca, knuckle_len, hub_local
    )
    return dict(
        lca_inner=lca_inner, uca_inner=uca_inner,
        lbj_ride=lbj_ride, ubj_ride=ubj_ride, hub_ride=hub_ride,
        R_lca=R_lca, R_uca=R_uca, knuckle_len=knuckle_len,
        hub_local=hub_local, theta_ride=theta_ride, ride=ride,
        tire_w=p["tire_w"],
    )


def _theta_for_lbj_y(target_y, params):
    """LCA angle that puts LBJ at the given height (ride-height branch)."""
    sin_arg = (target_y - params["lca_inner"][1]) / params["R_lca"]
    sin_arg = np.clip(sin_arg, -1.0, 1.0)
    th_a = np.arcsin(sin_arg)
    th_b = np.pi - th_a
    th_ref = params["theta_ride"]
    return th_a if abs(th_a - th_ref) < abs(th_b - th_ref) else th_b


def _solve_state(theta, params):
    return _solve_4bar(
        theta, params["lca_inner"], params["R_lca"], params["uca_inner"],
        params["R_uca"], params["knuckle_len"], params["hub_local"],
    )


def _rotate(p, phi):
    c, s = np.cos(phi), np.sin(phi)
    return np.array([c * p[0] - s * p[1], s * p[0] + c * p[1]])


def _solve_side_body_pose(params, side, body_h, body_phi, tire_radius):
    """Solve the front-view 4-bar for one side under a given body pose.

    The tire is pinned to ground (cp.y = 0 ⇔ hub.y = tire_radius in the
    GROUND frame).  The body (and its inner pivots) translates by
    body_h (vertical) and rotates by body_phi about the ground at
    car CL.  Returns a state dict {lbj, ubj, ic, cp, hub,
    lca_inner_g, uca_inner_g, alpha} in GROUND coordinates, or None
    if no valid solution exists for this side.
    """
    lca_in_b = np.array([side * params["lca_inner"][0], params["lca_inner"][1]])
    uca_in_b = np.array([side * params["uca_inner"][0], params["uca_inner"][1]])
    lca_in_g = _rotate(lca_in_b, body_phi) + np.array([0.0, body_h])
    uca_in_g = _rotate(uca_in_b, body_phi) + np.array([0.0, body_h])

    hub_local = params["hub_local"].copy()
    if side == -1:  # mirror perp component for the left knuckle
        hub_local = np.array([hub_local[0], -hub_local[1]])

    R_lca = params["R_lca"]
    R_uca = params["R_uca"]
    knuckle_len = params["knuckle_len"]

    def hub_err(alpha):
        st = _solve_4bar(alpha, lca_in_g, R_lca, uca_in_g, R_uca,
                         knuckle_len, hub_local)
        if st is None:
            return None, None
        return st, st["hub"][1] - tire_radius

    if side == 1:
        alpha_static = params["theta_ride"]
    else:
        lbj_left = np.array([-params["lbj_ride"][0], params["lbj_ride"][1]])
        lca_in_left = np.array([-params["lca_inner"][0], params["lca_inner"][1]])
        diff = lbj_left - lca_in_left
        alpha_static = np.arctan2(diff[1], diff[0])

    alphas = np.linspace(alpha_static - 0.7, alpha_static + 0.7, 81)
    states, errs = [], []
    for a in alphas:
        st, e = hub_err(a)
        states.append(st)
        errs.append(e if e is not None else np.nan)
    errs = np.array(errs)

    # Find sign-change closest to alpha_static
    best_k = -1
    best_d = np.inf
    for k in range(len(alphas) - 1):
        if np.isnan(errs[k]) or np.isnan(errs[k + 1]):
            continue
        if errs[k] * errs[k + 1] <= 0:
            d = abs(0.5 * (alphas[k] + alphas[k + 1]) - alpha_static)
            if d < best_d:
                best_d = d
                best_k = k
    if best_k < 0:
        return None

    a_lo, a_hi = alphas[best_k], alphas[best_k + 1]
    e_lo = errs[best_k]
    for _ in range(50):
        a_mid = 0.5 * (a_lo + a_hi)
        st_mid, e_mid = hub_err(a_mid)
        if e_mid is None:
            return None
        if e_mid * e_lo <= 0:
            a_hi = a_mid
        else:
            a_lo, e_lo = a_mid, e_mid
    a_final = 0.5 * (a_lo + a_hi)
    st, _ = hub_err(a_final)
    if st is None:
        return None
    st = dict(st)
    st["lca_inner_g"] = lca_in_g
    st["uca_inner_g"] = uca_in_g
    st["alpha"] = a_final
    return st


def _body_pose_compression(state_g, body_h, body_phi, tire_radius):
    """Body-frame suspension compression Δ for one side.

    Δ > 0 → bump (suspension compressed)
    Δ < 0 → droop (suspension extended)
    """
    hub = state_g["hub"]
    s, c = np.sin(body_phi), np.cos(body_phi)
    hub_y_body = -s * hub[0] + c * (hub[1] - body_h)
    return hub_y_body - tire_radius


def _draw_body_assembly(ax, params, st_r, st_l, color,
                        *, tire_od, alpha=1.0, lw_arm=2.2,
                        lw_knuckle=2.6, draw_tire=True,
                        draw_ic_lines=False, body_phi=0.0):
    """Draw both sides of the body-posed assembly using already-solved
    ground-frame states.  Includes cambered tire rectangles."""
    tw = params.get("tire_w") or SUSP["tire_w"]
    for st_side, side_sign in ((st_r, 1), (st_l, -1)):
        lbj = st_side["lbj"]; ubj = st_side["ubj"]
        lca_in = st_side["lca_inner_g"]; uca_in = st_side["uca_inner_g"]
        hub = st_side["hub"]; cp = st_side["cp"]; ic = st_side["ic"]

        if draw_tire:
            # Camber: rotate tire about cp by body_phi (wheel cambers
            # with body when sticking to ground).
            tr = tire_od / 2
            corners = np.array([
                [-tw / 2, 0], [tw / 2, 0],
                [tw / 2, tire_od], [-tw / 2, tire_od],
            ])
            c, s = np.cos(body_phi), np.sin(body_phi)
            R = np.array([[c, -s], [s, c]])
            rotated = (corners @ R.T) + np.array([cp[0], 0])
            ax.fill(rotated[:, 0], rotated[:, 1], color=color,
                    alpha=0.05 * alpha, zorder=2,
                    edgecolor=color, linewidth=0.8)
            ax.plot(np.append(rotated[:, 0], rotated[0, 0]),
                    np.append(rotated[:, 1], rotated[0, 1]),
                    color=color, linewidth=0.8, alpha=0.35 * alpha, zorder=3)

        ax.plot([lca_in[0], lbj[0]], [lca_in[1], lbj[1]],
                color=color, linewidth=lw_arm, alpha=alpha,
                solid_capstyle="round", zorder=4)
        ax.plot([uca_in[0], ubj[0]], [uca_in[1], ubj[1]],
                color=color, linewidth=lw_arm, alpha=alpha,
                solid_capstyle="round", zorder=4)
        ax.plot([lbj[0], ubj[0]], [lbj[1], ubj[1]],
                color=color, linewidth=lw_knuckle, alpha=alpha,
                solid_capstyle="round", zorder=4)
        for pt in (lca_in, uca_in, lbj, ubj):
            ax.plot(pt[0], pt[1], "o", color=color, markersize=3.5,
                    alpha=alpha, zorder=5)
        if draw_ic_lines:
            ax.plot([cp[0], ic[0]], [cp[1], ic[1]],
                    color=color, linewidth=0.8, alpha=0.55 * alpha,
                    linestyle="-.", zorder=4)
            ax.plot(ic[0], ic[1], "D", color=color, markersize=4,
                    alpha=alpha, zorder=5)


def _draw_body_cross(ax, params, body_h, body_phi, color, *,
                     alpha=0.45, lw=1.2, zorder=4.0):
    """Body-frame cross: vertical centerline + a single horizontal
    line at the mid-height between the LBJ and UBJ rows.  Translates
    and rotates with the body to indicate roll."""
    half_w = max(params["lca_inner"][0], params["uca_inner"][0]) + 60.0
    y_mid = 0.5 * (params["lbj_ride"][1] + params["ubj_ride"][1])
    y_top = params["uca_inner"][1] + 220.0
    y_bot = params["lca_inner"][1] - 80.0

    segs_b = [
        np.array([[0.0, y_bot], [0.0, y_top]]),                # CL
        np.array([[-half_w, y_mid], [+half_w, y_mid]]),        # mid-BJ row
    ]
    c, s = np.cos(body_phi), np.sin(body_phi)
    R = np.array([[c, -s], [s, c]])
    for seg_b in segs_b:
        seg_g = (seg_b @ R.T) + np.array([0.0, body_h])
        ax.plot(seg_g[:, 0], seg_g[:, 1], color=color, linewidth=lw,
                alpha=alpha, zorder=zorder, solid_capstyle="round")


def _plot_rc_migration_panel(half_track, hub_z, tire_od, color, title, fname,
                             bump, droop, n_h=41, n_phi=41, *, et=ET_MIATA,
                             tire_w=None):
    """Render a single full-page RC migration figure for one
    configuration.

    Body has 2 DOF: heave (h) and roll (φ).  Each (h, φ) pair is
    accepted only if both wheels' shock-compression Δ stays inside
    [-droop, +bump].  Inner pivots translate and rotate with the
    body; tires stay in ground contact.
    """
    params = _build_kinematic_params(half_track, hub_z, tire_od, et=et,
                                     tire_w=tire_w)
    tire_radius = hub_z  # hub centre = tire radius above ground at static

    # Sweep range: enough to cover any pose the shocks could reach.
    h_max = max(bump, droop) + 10
    phi_max = np.deg2rad(np.degrees(np.arcsin(min(bump, droop) / half_track)) + 6)
    hs = np.linspace(-h_max, h_max, n_h)
    phis = np.linspace(-phi_max, phi_max, n_phi)

    pts_xy = []
    n_total = 0
    n_singular = 0
    n_clipped = 0
    x_clip = 1.5 * half_track
    y_clip = 700.0
    sing_cos_thresh = np.cos(np.deg2rad(5.0))  # angle < 5° → reject
    for h in hs:
        for phi in phis:
            sR = _solve_side_body_pose(params, +1, h, phi, tire_radius)
            sL = _solve_side_body_pose(params, -1, h, phi, tire_radius)
            if sR is None or sL is None:
                continue
            cR = _body_pose_compression(sR, h, phi, tire_radius)
            cL = _body_pose_compression(sL, h, phi, tire_radius)
            if not (-droop <= cR <= bump and -droop <= cL <= bump):
                continue
            n_total += 1
            # Singularity test: angle between (CP_R→IC_R) and (CP_L→IC_L).
            dR = sR["ic"] - sR["cp"]
            dL = sL["ic"] - sL["cp"]
            nR = np.linalg.norm(dR); nL = np.linalg.norm(dL)
            if nR < 1e-9 or nL < 1e-9:
                n_singular += 1
                continue
            cos_ang = abs(dR @ dL) / (nR * nL)
            if cos_ang > sing_cos_thresh:
                n_singular += 1
                continue
            rc = _rc_from_sides(sR, sL)
            if rc is None or not np.all(np.isfinite(rc)):
                n_singular += 1
                continue
            if abs(rc[0]) > x_clip or abs(rc[1]) > y_clip or rc[1] < -300:
                n_clipped += 1
                continue
            pts_xy.append(rc)
    pts = np.array(pts_xy) if pts_xy else np.zeros((0, 2))

    fig, ax = styled_fig(figsize=(11, 8))
    ax.set_aspect(1.0)

    # Static state: body cross + suspension assembly.
    sR0 = _solve_side_body_pose(params, +1, 0.0, 0.0, tire_radius)
    sL0 = _solve_side_body_pose(params, -1, 0.0, 0.0, tire_radius)
    _draw_body_cross(ax, params, 0.0, 0.0, color, alpha=0.45, lw=1.2,
                     zorder=4.0)
    _draw_body_assembly(ax, params, sR0, sL0, color, tire_od=tire_od,
                        alpha=0.95, draw_ic_lines=True, body_phi=0.0)
    rc_static = _rc_from_sides(sR0, sL0)
    ax.plot(0, rc_static[1], "s", color=color, markersize=9,
            zorder=7, markeredgecolor=TEXT, markeredgewidth=0.6,
            label="Static RC")

    # Migration distribution: 2D histogram heatmap, contoured.
    if len(pts) >= 10:
        # Symmetrize about x = 0 (vehicle is L↔R symmetric); any
        # asymmetry in the cloud is purely a sampling artifact.
        pts_sym = np.vstack([pts, np.column_stack([-pts[:, 0], pts[:, 1]])])

        x_pad = 80.0
        y_pad = 40.0
        x_abs = max(abs(pts_sym[:, 0].min()), abs(pts_sym[:, 0].max())) + x_pad
        y_lo = pts_sym[:, 1].min() - y_pad
        y_hi = pts_sym[:, 1].max() + y_pad
        x_lo, x_hi = -x_abs, +x_abs
        nb_x = 60
        nb_y = max(24, int(nb_x * (y_hi - y_lo) / max(1.0, (x_hi - x_lo))))
        H, xedges, yedges = np.histogram2d(
            pts_sym[:, 0], pts_sym[:, 1], bins=[nb_x, nb_y],
            range=[[x_lo, x_hi], [y_lo, y_hi]],
        )
        # Smooth the 2D histogram with several box blur passes for a
        # cleaner density gradient.
        Hs = H.copy()
        for _ in range(4):
            Hs = (
                Hs
                + np.roll(Hs, 1, 0) + np.roll(Hs, -1, 0)
                + np.roll(Hs, 1, 1) + np.roll(Hs, -1, 1)
            ) / 5.0
        from matplotlib.colors import LinearSegmentedColormap
        cmap = LinearSegmentedColormap.from_list(
            "rcmig", [(0, 0, 0, 0), color], N=256,
        )
        ax.imshow(
            Hs.T, origin="lower",
            extent=[x_lo, x_hi, y_lo, y_hi],
            cmap=cmap, alpha=0.55, aspect="auto",
            interpolation="bilinear", zorder=6.5,
        )
        # Single soft envelope contour at low density.
        H_max = Hs.max() if Hs.max() > 0 else 1.0
        Xc = 0.5 * (xedges[:-1] + xedges[1:])
        Yc = 0.5 * (yedges[:-1] + yedges[1:])
        ax.contour(
            Xc, Yc, Hs.T, levels=[0.10 * H_max],
            colors=[color], alpha=0.55, linewidths=[0.9], zorder=6.7,
        )
        # Raw scatter samples on top.
        ax.scatter(
            pts[:, 0], pts[:, 1], s=4.0, color=color,
            alpha=0.55, zorder=6.8, linewidths=0,
            label=f"RC cloud ({len(pts)} poses)",
        )

    # Overlay states: corners of the (h, φ) admissible region.
    # Solve the parallelogram: cR = -h*cosφ + ...  ≈ -h - φ·ht (small angles)
    # The four corners are pure heave bump/droop and the two
    # max-roll states (one wheel at +bump, the other at −droop).
    # Look one block above for the parallelogram derivation.
    # phi_max_roll, h_at_max_roll, phi_static_max are computed there.

    # Overlay states at admissible-region corners + a static-heave roll
    # to make the heave⇔roll coupling explicit:
    #   At h = 0 the available roll is limited by min(B, D)/half_track
    #   (the wheel that goes into droop runs out of room first).
    #   Heaving into bump (h<0) gives more droop room → more roll possible.
    #   Heaving into droop (h>0) gives less droop room → less roll possible.
    # Maximum roll achievable, (B+D)/(2·half_track), occurs at
    # h = (D-B)/2 where one wheel hits +B and the other hits −D simultaneously.
    phi_max_roll = np.arcsin((bump + droop) / (2 * half_track))
    h_at_max_roll = (np.sin(phi_max_roll) * half_track) - bump  # negative
    phi_static_max = min(bump, droop) / half_track

    overlays = [
        dict(name="Pure heave bump", h=-bump, phi=0.0,
             color=GOLD, marker="^", ms=11),
        dict(name="Pure heave droop", h=+droop, phi=0.0,
             color="#7be0a4", marker="v", ms=11),
        dict(name="Max roll @ static heave", h=0.0,
             phi=+phi_static_max, color="#5cd9d9", marker="D", ms=9),
        dict(name="Max roll right (optimal heave)",
             h=h_at_max_roll, phi=-phi_max_roll,
             color="#f3a050", marker=">", ms=11),
        dict(name="Max roll left  (optimal heave)",
             h=h_at_max_roll, phi=+phi_max_roll,
             color="#c79bff", marker="<", ms=11),
    ]
    for ov in overlays:
        sR = _solve_side_body_pose(params, +1, ov["h"], ov["phi"], tire_radius)
        sL = _solve_side_body_pose(params, -1, ov["h"], ov["phi"], tire_radius)
        if sR is None or sL is None:
            continue
        cR = _body_pose_compression(sR, ov["h"], ov["phi"], tire_radius)
        cL = _body_pose_compression(sL, ov["h"], ov["phi"], tire_radius)
        rc = _rc_from_sides(sR, sL)
        if rc is None:
            continue
        oc = ov["color"]
        _draw_body_cross(ax, params, ov["h"], ov["phi"], oc,
                         alpha=0.45, lw=1.0, zorder=5.2)
        for st_side in (sR, sL):
            lbj = st_side["lbj"]; ubj = st_side["ubj"]
            lca_in = st_side["lca_inner_g"]; uca_in = st_side["uca_inner_g"]
            ax.plot([lca_in[0], lbj[0]], [lca_in[1], lbj[1]],
                    color=oc, linewidth=1.4, alpha=0.85, zorder=5.5)
            ax.plot([uca_in[0], ubj[0]], [uca_in[1], ubj[1]],
                    color=oc, linewidth=1.4, alpha=0.85, zorder=5.5)
            ax.plot([lbj[0], ubj[0]], [lbj[1], ubj[1]],
                    color=oc, linewidth=1.6, alpha=0.85, zorder=5.5)
            ax.plot(lca_in[0], lca_in[1], "o", color=oc, markersize=3,
                    alpha=0.9, zorder=6)
            ax.plot(uca_in[0], uca_in[1], "o", color=oc, markersize=3,
                    alpha=0.9, zorder=6)
        ax.plot(rc[0], rc[1], ov["marker"], color=oc,
                markersize=ov["ms"],
                markeredgecolor=TEXT, markeredgewidth=0.6, zorder=8,
                label=ov["name"])

    # Diagnostics.
    dx = params["lbj_ride"][0] - params["lca_inner"][0]
    dz = params["lbj_ride"][1] - params["lca_inner"][1]
    tilt_deg = np.degrees(np.arctan2(dz, dx))
    n_valid = len(pts)
    diag = (
        f"LCA static tilt: {tilt_deg:+.2f}°  "
        f"(LBJ {abs(dz):.0f} mm "
        f"{'below' if dz < 0 else 'above'} inner pivot, "
        f"span {dx:.0f} mm)\n"
        f"shock travel: {bump:.0f} mm bump / {droop:.0f} mm droop  "
        f"(per wheel; body Δ ∈ [-droop, +bump])\n"
        f"available roll is heave-coupled:\n"
        f"  h = 0       → ±{np.degrees(phi_static_max):.2f}°  (limited by smaller stroke)\n"
        f"  h = {h_at_max_roll:+.0f} mm → ±{np.degrees(phi_max_roll):.2f}°  (max; both wheels at limits)\n"
        f"  h = {-bump:+.0f} mm →   0°   (no room; both wheels at +bump)\n"
        f"  h = {+droop:+.0f} mm →   0°   (no room; both wheels at −droop)\n"
        f"sweep: {n_h} heave × {n_phi} roll → {n_total} feasible → {n_valid} plotted\n"
        f"rejected: {n_singular} singular (CP→IC angle < 5°, RC → ±∞),  "
        f"{n_clipped} clipped (|x| > {x_clip:.0f} mm)\n"
        f"static RC = {rc_static[1]:.0f} mm above ground"
    )
    ax.text(0.02, 0.98, diag, transform=ax.transAxes,
            fontsize=8, color=TEXT, va="top", ha="left",
            bbox=dict(facecolor="#1a2438", edgecolor=color,
                      alpha=0.85, boxstyle="round,pad=0.5"))

    ax.axhline(0, color=TEXT, linewidth=1, alpha=0.3)
    ax.axvline(0, color=TEXT, linewidth=0.5, alpha=0.2, linestyle=":")
    ax.set_title(title, color=TEXT, fontsize=11)
    ax.set_xlabel("Lateral position (mm)")
    ax.set_ylabel("Height above ground (mm)")
    ax.set_xlim(-1100, 1100)
    ax.set_ylim(-50, 900)
    ax.legend(loc="upper right", fontsize=8.0, framealpha=0.85,
              facecolor="#1a2438", edgecolor=color, labelcolor=TEXT,
              handlelength=1.4, borderpad=0.5)
    fig.tight_layout()
    save(fig, fname)


def plot_rc_migration():
    """Two separate figures (Miata, A40) — body has heave + roll DOFs,
    tires pinned to ground.  Sweeps every (h, φ) admissible under the
    wheel-travel limits set by the shock stroke and the four-bar MR."""
    bump, droop = front_wheel_travel()
    for cfg, color, name, fname in (
        (CFG_MIATA, MIATA_C,
         f"Stock Miata  ({T_MIATA} mm track, 185/60R14)", "rc_migration_miata.png"),
        (CFG_A40, A40_C,
         f"A40 build  ({T_A40_EXACT} mm track, 205/65R15 ET38)", "rc_migration_a40.png"),
    ):
        _plot_rc_migration_panel(
            cfg["half_track"], cfg["hub_z_ground"], cfg["tire_od"], color,
            f"RC migration — {name}", fname, bump, droop, n_h=41, n_phi=41,
            et=cfg["et"], tire_w=cfg["tire_w"],
        )


# ====================================================================
# Front motion ratio, from the four-bar
#
#   The knuckle (and the wheel) rotates about the front-view instant
#   centre, not about the LCA pivot.  So the wheel-side lever is NOT
#   (half-track - LCA pivot).  The script perturbs the four-bar and
#   measures shock-length change per unit hub vertical travel directly.
#
#   Closed-form check:  MR = D_spring * sin(alpha) / D_wheel_eff
#     D_wheel_eff = (x_LBJ - x_pivot) * (x_hub - x_IC) / (x_LBJ - x_IC)
# ====================================================================
def _kin_params(cfg):
    return _build_kinematic_params(cfg["half_track"], cfg["hub_z_ground"],
                                   cfg["tire_od"], et=cfg["et"],
                                   tire_w=cfg["tire_w"])


def _shock_lower_mount(params, theta):
    """Coilover lower mount: lca_coilover_perp from the LCA pivot axis,
    level with the pivot at ride height, rotating with the arm."""
    d = theta - params["theta_ride"]
    return params["lca_inner"] + SUSP["lca_coilover_perp"] * np.array(
        [np.cos(d), np.sin(d)]
    )


def front_shock_curve(cfg=None, alpha_deg=SHOCK_ALPHA_DEG, n=601, span=0.42):
    """Sweep the LCA and return wheel travel, shock compression and MR.

    Upper shock mount is fixed to the body, SHOCK_LEN_RIDE from the lower
    mount at ride height, leaning inboard at alpha_deg to the arm radius.
    Returns dict(wheel_z, comp, mr) with wheel_z = hub rise from ride
    (mm, +bump) and comp = shock shortening (mm, +bump).
    """
    if cfg is None:
        cfg = CFG_A40
    params = _kin_params(cfg)
    a = np.radians(alpha_deg)
    low0 = _shock_lower_mount(params, params["theta_ride"])
    upper = low0 + SHOCK_LEN_RIDE * np.array([-np.cos(a), np.sin(a)])
    hub0 = params["ride"]["hub"][1]
    thetas = params["theta_ride"] + np.linspace(-span, span, n)
    wz, comp = [], []
    for th in thetas:
        st = _solve_state(th, params)
        if st is None:
            continue
        wz.append(st["hub"][1] - hub0)
        comp.append(SHOCK_LEN_RIDE - np.linalg.norm(upper - _shock_lower_mount(params, th)))
    wz, comp = np.array(wz), np.array(comp)
    order = np.argsort(wz)
    wz, comp = wz[order], comp[order]
    mr = np.gradient(comp, wz)
    return dict(wheel_z=wz, comp=comp, mr=mr)


def front_mr(cfg=None, alpha_deg=SHOCK_ALPHA_DEG):
    """Motion ratio at ride height (shock travel / wheel travel)."""
    if cfg is None:
        cfg = CFG_A40
    params = _kin_params(cfg)
    e = 1e-5
    th0 = params["theta_ride"]
    a_, b_ = _solve_state(th0 - e, params), _solve_state(th0 + e, params)
    dhub = (b_["hub"][1] - a_["hub"][1]) / (2 * e)
    return SUSP["lca_coilover_perp"] * np.sin(np.radians(alpha_deg)) / dhub


def front_mr_closed_form(cfg=None, alpha_deg=SHOCK_ALPHA_DEG):
    if cfg is None:
        cfg = CFG_A40
    p = _build_suspension(**cfg)
    x_ic = p["ic"][0]
    d_eff = (p["lbj"][0] - p["lca_inner"][0]) * (p["cp"][0] - x_ic) / (p["lbj"][0] - x_ic)
    return SUSP["lca_coilover_perp"] * np.sin(np.radians(alpha_deg)) / d_eff, d_eff


def front_wheel_travel(alpha_deg=SHOCK_ALPHA_DEG):
    """Wheel bump / droop (mm) available from the shock stroke."""
    c = front_shock_curve(alpha_deg=alpha_deg)
    bump_stroke = BUMP_FRACTION * SHOCK_STROKE_MM
    droop_stroke = (1 - BUMP_FRACTION) * SHOCK_STROKE_MM
    bump = np.interp(bump_stroke, c["comp"], c["wheel_z"])
    droop = -np.interp(-droop_stroke, c["comp"], c["wheel_z"])
    return bump, droop


# ====================================================================
# 2. Track width effects (ratios vs track)
# ====================================================================
def plot_track_effects():
    fig, ax = styled_fig()
    tracks = np.linspace(1000, 1500, 200)
    ratio = tracks / T_MIATA

    ax.plot(tracks, ratio, color=BLUE, linewidth=2,
            label="RC height ratio (same tire)")
    ax.plot(tracks, ratio**2, color=PURPLE, linewidth=2,
            label="Roll stiffness ratio (same wheel rate)")
    ax.plot(tracks, 1 / ratio, color=PINK, linewidth=2,
            label="Lateral weight transfer ratio (same CG)")

    r = T_A40 / T_MIATA
    for val, c in ((r, BLUE), (r**2, PURPLE), (1 / r, PINK)):
        ax.plot(T_A40, val, "o", color=c, markersize=5, zorder=5)
        ax.text(T_A40 - 10, val + 0.03, f"{val:.3f}", color=c, fontsize=7.5,
                ha="right")
    ax.axvline(T_MIATA, color=MIATA_C, linestyle="--", linewidth=1, alpha=0.6)
    ax.axvline(T_A40, color=A40_C, linestyle="--", linewidth=1, alpha=0.6)
    ax.text(T_MIATA + 8, 1.5, f"Miata\n{T_MIATA}", color=MIATA_C, fontsize=8, alpha=0.8)
    ax.text(T_A40 + 8, 1.5, f"A40\n~{T_A40}", color=A40_C, fontsize=8, alpha=0.8)
    ax.axhline(1.0, color=TEXT, linestyle=":", linewidth=0.5, alpha=0.3)

    ax.set_xlabel("Front track width (mm)")
    ax.set_ylabel("Ratio relative to stock Miata")
    ax.set_title("How track width affects key parameters")
    ax.legend(fontsize=8, facecolor=BG, edgecolor=GRID2, labelcolor=TEXT,
              loc="lower right")
    ax.set_xlim(1000, 1500)
    ax.set_ylim(0.4, 1.65)
    save(fig, "track_effects.png")


# ====================================================================
# 3. ARB sizing: ARB roll stiffness needed vs target roll angle
# ====================================================================
def plot_arb_sizing():
    fig, ax = styled_fig()
    target = np.linspace(2.5, 6.0, 200)

    need = lambda cg, rr: (k_phi_required(target, cg, rr) - K_PHI_SPRING) / 1000
    ax.fill_between(target, need(H_CG_A40, H_RC_REAR_HI), need(H_CG_A40, H_RC_REAR_LO),
                    color=TEXT, alpha=0.12, linewidth=0,
                    label="CG 575, rear RC 80-150 mm")
    ax.plot(target, need(H_CG_A40, H_RC_REAR_NOM), color=TEXT, linewidth=2,
            label="CG 575, rear RC 100 mm")
    for cg_edge, ls in ((525, ":"), (625, "--")):
        ax.plot(target, need(cg_edge, H_RC_REAR_NOM), color=TEXT, linewidth=0.9,
                linestyle=ls, alpha=0.6, label=f"CG {cg_edge}, rear RC 100 mm")

    ax.axvspan(3.0, 4.0, color=PINK, alpha=0.07)
    for rd in (3.0, 3.5, 4.0):
        v = need(H_CG_A40, H_RC_REAR_NOM)[np.argmin(abs(target - rd))]
        ax.plot(rd, v, "o", color=PINK, markersize=5, zorder=5)
        ax.text(rd + 0.05, v + 1.2, f"{v:.0f}", color=PINK, fontsize=7.5)

    diameters = [19, 22, 25, 28]
    colors = [PURPLE, BLUE, GREEN, GOLD]
    for d, c in zip(diameters, colors):
        k = arb_roll_stiffness(d) / 1000
        ax.axhline(k, color=c, linestyle="--", linewidth=1.0, alpha=0.7,
                   label=f"{d} mm front bar alone ({k:.1f}, IR {IR_BAR:.2f} assumed)")

    ax.set_xlabel("Target body roll at 0.8 G (°)")
    ax.set_ylabel("ARB roll stiffness to add, front + rear (kN-m/rad)")
    ax.set_title(f"ARB requirement on top of the springs ({K_PHI_SPRING/1000:.1f} kN-m/rad)")
    ax.legend(fontsize=7, facecolor=BG, edgecolor=GRID2, labelcolor=TEXT,
              loc="upper right")
    ax.set_xlim(2.5, 6)
    ax.set_ylim(0, 60)
    save(fig, "arb_sizing.png")


# ====================================================================
# 4. Motion ratio through wheel travel (four-bar, A40 build)
# ====================================================================
def plot_motion_ratio():
    fig, ax = styled_fig(figsize=(7.2, 4.6))
    bump, droop = front_wheel_travel()
    for a_deg, c, lw in ((70, BLUE, 1.2), (80, A40_C, 2.4), (90, GOLD, 1.2)):
        cur = front_shock_curve(alpha_deg=a_deg)
        m = (cur["wheel_z"] > -droop - 15) & (cur["wheel_z"] < bump + 15)
        ax.plot(cur["wheel_z"][m], cur["mr"][m], color=c, linewidth=lw,
                label=f"α = {a_deg}°  (MR at ride {front_mr(alpha_deg=a_deg):.3f})")
    ax.axvline(0, color=TEXT, linewidth=0.6, alpha=0.4)
    ax.axvline(bump, color=GREEN, linestyle="--", linewidth=1, alpha=0.7)
    ax.axvline(-droop, color=GREEN, linestyle="--", linewidth=1, alpha=0.7)
    ax.text(bump - 3, 0.575, f"full bump\n+{bump:.0f} mm", color=GREEN,
            fontsize=7, ha="right")
    ax.text(-droop + 3, 0.575, f"full droop\n−{droop:.0f} mm", color=GREEN,
            fontsize=7, ha="left")
    ax.text(0.99, 0.97,
            f"{SHOCK_STROKE_MM:.0f} mm stroke, {BUMP_FRACTION*100:.0f}% in bump at ride\n"
            f"shock {SHOCK_LEN_RIDE:.0f} mm eye-to-eye at ride (assumed)",
            transform=ax.transAxes, fontsize=7, color=TEXT, alpha=0.7,
            ha="right", va="top")
    ax.set_xlabel("Wheel travel from ride height (mm, + = bump)")
    ax.set_ylabel("Motion ratio (shock / wheel)")
    ax.set_title("Front motion ratio through travel (four-bar, A40 build)")
    ax.legend(fontsize=7.5, facecolor=BG, edgecolor=GRID2, labelcolor=TEXT,
              loc="lower left")
    ax.set_ylim(0.55, 0.78)
    save(fig, "motion_ratio.png")


# ====================================================================
# 4b. Motion ratio vs shock angle at ride height
# ====================================================================
def plot_motion_ratio_vs_angle():
    fig, ax = styled_fig(figsize=(7.4, 5.0))
    alpha_deg = np.linspace(50, 90, 200)
    mr = np.array([front_mr(alpha_deg=a) for a in alpha_deg])

    # Wheel-offset band: hub face fixed, ET +/-15 moves the contact patch.
    d_et = 15
    bands = []
    for et in (ET_A40 - d_et, ET_A40 + d_et):
        cfg = dict(CFG_A40, half_track=HUB_FACE_A40 - et, et=et)
        bands.append(np.array([front_mr(cfg, a) for a in alpha_deg]))
    ax.fill_between(alpha_deg, bands[0], bands[1], color=A40_C, alpha=0.15,
                    linewidth=0, label=f"ET{ET_A40} ± {d_et} mm")
    ax.plot(alpha_deg, mr, color=A40_C, linewidth=2.4,
            label=f"MR = {front_mr(alpha_deg=90):.3f} · sin(α)  (IC-based)")

    # Old (wrong) LCA-pivot lever, for reference.
    old = SUSP["lca_coilover_perp"] / (T_MIATA / 2 - SUSP["lca_from_cl"])
    ax.plot(alpha_deg, old * np.sin(np.radians(alpha_deg)), color=TEXT,
            linewidth=1, linestyle=":", alpha=0.6,
            label=f"old LCA-pivot lever {old:.3f} · sin(α) (wrong)")

    ax.axvspan(65, 85, color=GREEN, alpha=0.07)
    ax.text(75, 0.505, "practical shock-tower range", color=GREEN, fontsize=7,
            ha="center", alpha=0.85)
    for a in (65, 75, 80, 85):
        v = front_mr(alpha_deg=a)
        ax.plot(a, v, "o", color=A40_C, markersize=5, zorder=5)
        ax.annotate(f"{a}°: {v:.3f}", xy=(a, v), xytext=(a - 1, v + 0.018),
                    fontsize=7, color=TEXT, ha="right", alpha=0.85)

    ax.set_xlabel("Shock angle to LCA at lower mount, α (°)")
    ax.set_ylabel("Motion ratio at ride height")
    ax.set_title("Front motion ratio vs shock angle (A40 build)")
    ax.legend(fontsize=7.5, facecolor=BG, edgecolor=GRID2, labelcolor=TEXT,
              loc="lower right")
    ax.set_xlim(50, 90)
    ax.set_ylim(0.5, 0.75)
    ax.xaxis.set_major_locator(MultipleLocator(5))
    save(fig, "motion_ratio_vs_angle.png")


# ====================================================================
# 5. Ride frequency vs WHEEL rate (independent of MR)
# ====================================================================
def plot_ride_frequency():
    fig, ax = styled_fig(figsize=(7.2, 4.8))
    kw = np.linspace(5, 35, 300)  # N/mm wheel rate

    for m, c, lbl, band in ((M_CORNER_F, A40_C, "front", (1.2, 1.6)),
                            (M_CORNER_R, BLUE, "rear", (1.3, 1.7))):
        fn = np.sqrt(kw * 1000 / m) / (2 * np.pi)
        ax.plot(kw, fn, color=c, linewidth=2,
                label=f"{lbl}: {m} kg sprung corner")
        for mm, ls in ((m * 0.9, ":"), (m * 1.1, ":")):
            ax.plot(kw, np.sqrt(kw * 1000 / mm) / (2 * np.pi), color=c,
                    linewidth=0.8, linestyle=ls, alpha=0.6)
    ax.axhspan(1.2, 1.6, color=GOLD, alpha=0.07)
    ax.text(5.5, 1.62, "1.2-1.6 Hz street front / 1.3-1.7 Hz rear", color=GOLD,
            fontsize=7, alpha=0.8)

    ks_f = KW_FRONT / front_mr() ** 2 / 1000
    pts = ((KW_FRONT / 1000, FREQ_F, A40_C,
            f"front {KW_FRONT/1000:.1f} N/mm @ {FREQ_F} Hz\n"
            f"spring {ks_f:.1f} N/mm ({ks_f*5.71:.0f} lb/in) at MR {front_mr():.3f}"),
           (KW_REAR / 1000, FREQ_R, BLUE,
            f"rear {KW_REAR/1000:.1f} N/mm @ {FREQ_R} Hz\n"
            "spring = " + ", ".join(f"{KW_REAR/1000/m**2:.0f}" for m in MR_REAR_CASES)
            + " N/mm\nat MR " + "/".join(f"{m:.2f}" for m in MR_REAR_CASES)
            + " (measure)"))
    for x, y, c, t in pts:
        ax.plot(x, y, "o", color=c, markersize=7, zorder=5,
                markeredgecolor=TEXT, markeredgewidth=0.6)
    ax.annotate(pts[0][3], xy=pts[0][:2], xytext=(21, 1.05), fontsize=7,
                color=A40_C, arrowprops=dict(arrowstyle="->", color=A40_C, lw=0.6))
    ax.annotate(pts[1][3], xy=pts[1][:2], xytext=(6, 2.0), fontsize=7,
                color=BLUE, arrowprops=dict(arrowstyle="->", color=BLUE, lw=0.6))

    ax.set_xlabel("Wheel rate (N/mm)  -- spring = wheel rate / MR²")
    ax.set_ylabel("Ride frequency (Hz)")
    ax.set_title("Ride frequency vs wheel rate (dotted: corner mass ±10%)")
    ax.legend(fontsize=7.5, facecolor=BG, edgecolor=GRID2, labelcolor=TEXT,
              loc="lower right")
    ax.set_xlim(5, 35)
    ax.set_ylim(0.6, 2.6)
    save(fig, "ride_frequency.png")


# ====================================================================
# 6. Ackermann geometry helpers and plots
#
#    All pickup points are parameterised so real values can be swapped
#    in later.  Coordinate convention (top view):
#      x = lateral (positive = driver-right)
#      y = longitudinal (positive = forward, 0 = front axle line)
# ====================================================================
# (WB_MIATA / WB_A40 are defined with the shared constants.)
# Fixed Miata NA knuckle convergence angle (hardware): atan(710/2265)
THETA_KNUCKLE = np.arctan((T_MIATA / 2) / WB_MIATA)  # 17.40 deg

# Schematic dimensions (mm) — replace with measured values when available
RACK_FWD = 100  # rack centre-line, mm ahead of front-axle line
STEER_ARM_L = 120  # steering arm length (tie-rod end to kingpin axis)
# Kingpin (LBJ) lateral offset inboard of the wheel centreline comes from
# the scan: KPI_OFFSET_MIATA = 44.25 (ET40), KPI_OFFSET_A40 = 46.25 (ET38).
TIRE_W_TOP = TIRE_W_A40  # tire section width (top-view rectangle)
TIRE_L_TOP = 500  # tyre footprint-to-rim visual length (schematic)


def _ideal_inside(d_out_deg, track_mm, wb_mm):
    """Ideal Ackermann inside-wheel angle for a given outside angle."""
    d_out = np.radians(d_out_deg)
    r_outer = wb_mm / np.tan(d_out)
    r_inner = r_outer - track_mm
    return np.degrees(np.arctan(wb_mm / r_inner))


def _draw_angled_rect(
    ax, cx, cy, w, h, angle_deg, color, alpha, lw=1.5, fill_alpha=None
):
    """Draw a filled+outlined rectangle centred at (cx, cy), rotated."""
    corners = np.array(
        [
            [-w / 2, -h / 2],
            [w / 2, -h / 2],
            [w / 2, h / 2],
            [-w / 2, h / 2],
            [-w / 2, -h / 2],
        ]
    )
    rad = np.radians(angle_deg)
    rot = np.array([[np.cos(rad), -np.sin(rad)], [np.sin(rad), np.cos(rad)]])
    pts = corners @ rot.T + np.array([cx, cy])
    if fill_alpha is not None:
        from matplotlib.patches import Polygon

        ax.add_patch(
            Polygon(pts[:4], closed=True, facecolor=color, alpha=fill_alpha, zorder=2)
        )
    ax.plot(
        pts[:, 0],
        pts[:, 1],
        color=color,
        linewidth=lw,
        alpha=alpha,
        solid_capstyle="round",
        zorder=3,
    )


# ────────────────────────────────────────────────────────────────────
# 6a.  Static top-view: rack, steering arms, kingpin, tires,
#      convergence lines for Miata stock and A40 narrowed.
# ────────────────────────────────────────────────────────────────────
def plot_ackermann_topview():
    fig, ax = styled_fig(figsize=(10, 9))
    ax.set_aspect("equal")
    from matplotlib.lines import Line2D

    configs = [
        # (label, track, wb, color, alpha, lw, kingpin offset)
        ("Miata stock", T_MIATA, WB_MIATA, MIATA_C, 0.35, 1.2, KPI_OFFSET_MIATA),
        ("A40 narrowed", T_A40, WB_A40, A40_C, 0.9, 2.0, KPI_OFFSET_A40),
    ]

    convergence_pts = {}

    for label, track, wb, color, alpha, lw, KPI_OFFSET in configs:
        ht = track / 2
        # Convergence distance of the *Miata knuckle* at this track
        d_conv = ht / np.tan(THETA_KNUCKLE)
        convergence_pts[label] = d_conv

        for side in [-1, 1]:
            # ── Tire rectangle (top view, 0 deg steer for static) ──
            _draw_angled_rect(
                ax,
                side * ht,
                0,
                TIRE_W_TOP,
                TIRE_L_TOP,
                0,
                color,
                alpha * 0.6,
                lw=lw * 0.6,
                fill_alpha=alpha * 0.08,
            )

            # ── Kingpin axis ──
            kp_x = side * (ht - KPI_OFFSET)
            ax.plot(
                kp_x,
                0,
                "x",
                color=color,
                markersize=7,
                markeredgewidth=lw,
                alpha=alpha,
                zorder=5,
            )

            # ── Steering arm: from kingpin FORWARD toward the rack ──
            # The convergence line runs from (0, -d_conv) through the
            # kingpin and onward forward.  The steering arm is the short
            # segment from the kingpin forward to the tie-rod ball joint.
            # Direction from convergence point to kingpin (forward):
            dx = kp_x - 0  # lateral: kingpin x
            dy = 0 - (-d_conv)  # longitudinal: 0 - (-d_conv) = +d_conv
            arm_len_norm = np.hypot(dx, dy)
            arm_end_x = kp_x + STEER_ARM_L * (dx / arm_len_norm)
            arm_end_y = 0 + STEER_ARM_L * (dy / arm_len_norm)
            ax.plot(
                [kp_x, arm_end_x],
                [0, arm_end_y],
                color=GOLD if label.startswith("A40") else color,
                linewidth=lw * 1.2,
                alpha=alpha,
                solid_capstyle="round",
                zorder=4,
            )

            # Tie-rod end dot
            ax.plot(
                arm_end_x,
                arm_end_y,
                "o",
                color=GOLD if label.startswith("A40") else color,
                markersize=4,
                alpha=alpha,
                zorder=5,
            )

            # ── Convergence line: from kingpin to convergence point ──
            ax.plot(
                [kp_x, 0],
                [0, -d_conv],
                color=GOLD if label.startswith("A40") else color,
                linewidth=lw,
                alpha=alpha * 0.7,
                linestyle="--",
            )

        # ── Front axle line ──
        ax.plot([-ht, ht], [0, 0], color=color, linewidth=lw, alpha=alpha)

        # ── Rack (horizontal bar ahead of front axle) ──
        rack_half = ht - KPI_OFFSET - 20  # rough: rack end near tie-rod end
        ax.plot(
            [-rack_half, rack_half],
            [RACK_FWD, RACK_FWD],
            color=color,
            linewidth=lw * 1.5,
            alpha=alpha * 0.7,
            solid_capstyle="round",
        )
        if label.startswith("A40"):
            ax.text(
                0,
                RACK_FWD + 25,
                "rack",
                color=color,
                fontsize=7,
                alpha=0.6,
                ha="center",
            )

        # ── Rear axle line ──
        ax.plot(
            [-ht - 80, ht + 80],
            [-wb, -wb],
            color=color,
            linewidth=lw * 0.8,
            alpha=alpha * 0.5,
        )

        # Convergence point marker
        ax.plot(
            0,
            -d_conv,
            "o",
            color=GOLD if label.startswith("A40") else color,
            markersize=7 if label.startswith("A40") else 5,
            alpha=alpha,
            zorder=5,
        )

    # ── Ideal convergence for A40 (green dotted to rear axle) ──
    ht_a = T_A40 / 2
    for side in [-1, 1]:
        kp_x_ideal = side * (ht_a - KPI_OFFSET_A40)  # through the kingpin
        ax.plot(
            [kp_x_ideal, 0],
            [0, -WB_A40],
            color=GREEN,
            linewidth=1.2,
            alpha=0.4,
            linestyle=":",
        )
    ax.plot(0, -WB_A40, "o", color=GREEN, markersize=6, alpha=0.5, zorder=5)

    # ── Annotate the mismatch ──
    d_actual = convergence_pts["A40 narrowed"]
    gap = WB_A40 - d_actual
    ax.annotate(
        "",
        xy=(50, -WB_A40),
        xytext=(50, -d_actual),
        arrowprops=dict(arrowstyle="<->", color=TEXT, lw=1.5),
    )
    ax.text(
        70,
        -(d_actual + gap / 2),
        f"{gap:.0f} mm gap",
        color=TEXT,
        fontsize=8,
        va="center",
        alpha=0.8,
    )

    # Label convergence points
    ax.text(
        -120,
        -d_actual + 40,
        f"Knuckle converges at {d_actual:.0f} mm",
        color=GOLD,
        fontsize=7.5,
        ha="right",
        alpha=0.9,
    )
    ax.text(
        -120,
        -WB_A40 - 50,
        f"Ideal: rear axle at {WB_A40} mm",
        color=GREEN,
        fontsize=7.5,
        ha="right",
        alpha=0.7,
    )

    # Angle annotations
    angle_knuckle_deg = np.degrees(THETA_KNUCKLE)
    angle_ideal_deg = np.degrees(np.arctan(ht_a / WB_A40))
    ax.annotate(
        f"Knuckle: {angle_knuckle_deg:.1f}\u00b0 (fixed)",
        xy=(ht_a, 0),
        xytext=(ht_a + 130, -300),
        fontsize=8,
        color=GOLD,
        arrowprops=dict(arrowstyle="->", color=GOLD, lw=0.8),
    )
    ax.annotate(
        f"Ideal: {angle_ideal_deg:.1f}\u00b0",
        xy=(ht_a, 0),
        xytext=(ht_a + 130, -500),
        fontsize=8,
        color=GREEN,
        alpha=0.7,
        arrowprops=dict(arrowstyle="->", color=GREEN, lw=0.6, alpha=0.5),
    )

    # Axle labels
    ax.text(
        ht_a + 120,
        -WB_A40,
        "A40 rear axle",
        color=A40_C,
        fontsize=7.5,
        va="center",
        alpha=0.8,
    )
    ax.text(
        T_MIATA / 2 + 120,
        -WB_MIATA,
        "Miata rear axle",
        color=MIATA_C,
        fontsize=7.5,
        va="center",
        alpha=0.4,
    )

    # Centerline
    ax.axvline(0, color=TEXT, linewidth=0.5, alpha=0.15, linestyle=":")

    ax.set_xlabel("Lateral position (mm)")
    ax.set_ylabel("Longitudinal position (mm)")
    ax.set_title("Top view: rack, steering arms, and knuckle convergence")
    ax.set_xlim(-800, 1000)
    ax.set_ylim(-2600, 450)

    legend_elements = [
        Line2D(
            [0],
            [0],
            color=MIATA_C,
            linewidth=1.5,
            alpha=0.4,
            label=f"Miata stock (T={T_MIATA}, WB={WB_MIATA})",
        ),
        Line2D(
            [0], [0], color=A40_C, linewidth=2, label=f"A40 layout (T~{T_A40}, WB={WB_A40})"
        ),
        Line2D([0], [0], color=GOLD, linewidth=2, label="Miata knuckle convergence"),
        Line2D(
            [0],
            [0],
            color=GREEN,
            linewidth=1.2,
            linestyle=":",
            label="Ideal A40 convergence (to rear axle)",
        ),
    ]
    ax.legend(
        handles=legend_elements,
        fontsize=7,
        facecolor=BG,
        edgecolor=GRID2,
        labelcolor=TEXT,
        loc="upper left",
    )

    save(fig, "ackermann_topview.png")


# ────────────────────────────────────────────────────────────────────
# 6b.  ICR geometry: Miata knuckle vs ideal for the A40.
#      Single panel at 35 deg outer lock — large enough that both
#      ICRs fit within the plot area while the tires remain readable.
#      The Ackermann gap is the same conceptually at any lock angle.
# ────────────────────────────────────────────────────────────────────
def plot_ackermann_turn():
    from matplotlib.lines import Line2D

    fig, ax = styled_fig(figsize=(9, 7))
    ax.set_aspect("equal")

    track = T_A40  # ~1230 nominal
    wb = WB_A40  # 2350
    ht = track / 2  # 615
    d_actual_wb = ht / np.tan(THETA_KNUCKLE)  # ~1962 mm

    d_out_deg = 35
    d_out = np.radians(d_out_deg)
    d_in_ideal_deg = _ideal_inside(d_out_deg, T_A40, WB_A40)
    d_in_ideal = np.radians(d_in_ideal_deg)
    d_in_actual_deg = _ideal_inside(d_out_deg, T_A40, d_actual_wb)
    d_in_actual = np.radians(d_in_actual_deg)
    error_deg = d_in_actual_deg - d_in_ideal_deg

    # ── ICR via line-line intersection ──
    # Left turn: both wheels steer LEFT (positive CCW angle in _draw_angled_rect).
    # Wheel heading after CCW rotation θ: (-sin θ, cos θ).
    # Wheel axle (perp to heading, toward ICR on the left): (-cos θ, -sin θ).
    # Outer at (+ht,0): P(t) = (ht - t·cos(d_out),  -t·sin(d_out))
    # Inner at (-ht,0): Q(s) = (-ht - s·cos(d_in), -s·sin(d_in))
    # Solving x,y equal:
    #   t = 2·ht·sin(d_in) / sin(d_in - d_out)
    #   ICR = (ht - t·cos(d_out),  -t·sin(d_out))
    def _icr(d_in_r):
        t = 2 * ht * np.sin(d_in_r) / np.sin(d_in_r - d_out)
        return ht - t * np.cos(d_out), -t * np.sin(d_out)

    icr_i = _icr(d_in_ideal)  # ideal  ICR — should be at y ≈ -2350 (rear axle)
    icr_a = _icr(d_in_actual)  # actual ICR — ahead of the rear axle

    # ── Rear axle: bold, separate horizontal ──
    ax.axhline(-wb, color=TEXT, linewidth=2.2, alpha=0.55, zorder=3)
    ax.text(
        ht + 85,
        -wb + 42,
        f"A40 rear axle ({wb} mm)",
        fontsize=8,
        color=TEXT,
        alpha=0.65,
    )

    # ── Front axle ──
    ax.plot([-ht - 70, ht + 70], [0, 0], color=A40_C, linewidth=1.2, alpha=0.5)

    # ── Wheel rectangles ──
    _draw_angled_rect(
        ax,
        ht,
        0,
        TIRE_W_TOP,
        TIRE_L_TOP,
        d_out_deg,
        A40_C,
        0.85,
        lw=2.0,
        fill_alpha=0.10,
    )
    _draw_angled_rect(
        ax,
        -ht,
        0,
        TIRE_W_TOP,
        TIRE_L_TOP,
        d_in_ideal_deg,
        GREEN,
        0.60,
        lw=1.5,
        fill_alpha=0.07,
    )
    _draw_angled_rect(
        ax,
        -ht,
        0,
        TIRE_W_TOP,
        TIRE_L_TOP,
        d_in_actual_deg,
        GOLD,
        0.90,
        lw=2.0,
        fill_alpha=0.10,
    )

    # ── Perpendicular lines from each wheel centre toward its ICR ──
    # Both ICRs lie on the outer wheel's ray (same d_out).
    # Draw outer to the ideal (further) ICR — it passes through actual ICR too.
    ax.plot(
        [ht, icr_i[0]],
        [0, icr_i[1]],
        color=A40_C,
        linewidth=1.0,
        alpha=0.45,
        linestyle="--",
    )
    # Inner ideal → ideal ICR
    ax.plot(
        [-ht, icr_i[0]],
        [0, icr_i[1]],
        color=GREEN,
        linewidth=1.3,
        alpha=0.65,
        linestyle=":",
    )
    # Inner actual → actual ICR (hits outer ray at a different, closer point)
    ax.plot(
        [-ht, icr_a[0]],
        [0, icr_a[1]],
        color=GOLD,
        linewidth=1.6,
        alpha=0.80,
        linestyle="--",
    )

    # ── ICR dots ──
    ax.plot(*icr_i, "o", color=GREEN, markersize=10, zorder=5)
    ax.plot(*icr_a, "o", color=GOLD, markersize=10, zorder=5)

    # ── Horizontal dashed lines at each ICR y-level ──
    ax.axhline(icr_i[1], color=GREEN, linewidth=1.0, alpha=0.35, linestyle="--")
    ax.axhline(icr_a[1], color=GOLD, linewidth=1.2, alpha=0.50, linestyle="--")

    # ── ICR labels ──
    ax.text(
        icr_i[0] - 60,
        icr_i[1] - 70,
        f"Ideal ICR\n({-icr_i[1]:.0f} mm = rear axle)",
        color=GREEN,
        fontsize=7.5,
        ha="right",
        alpha=0.85,
    )
    ax.text(
        icr_a[0] - 60,
        icr_a[1] + 65,
        f"Miata knuckle ICR\n({-icr_a[1]:.0f} mm)",
        color=GOLD,
        fontsize=7.5,
        ha="right",
        alpha=0.90,
    )

    # ── Gap: actual ICR to rear axle ──
    gap_mm = abs(-wb - icr_a[1])
    arr_x = ht + 210
    ax.annotate(
        "",
        xy=(arr_x, -wb),
        xytext=(arr_x, icr_a[1]),
        arrowprops=dict(arrowstyle="<->", color=TEXT, lw=1.5, shrinkA=0, shrinkB=0),
    )
    ax.text(
        arr_x + 25,
        (-wb + icr_a[1]) / 2,
        f"{gap_mm:.0f} mm\nahead of\nrear axle",
        fontsize=8.5,
        color=TEXT,
        va="center",
        alpha=0.9,
        fontweight="bold",
    )

    # ── Info box (top-left) ──
    info = (
        f"Outer: {d_out_deg}\u00b0   Ideal inner: {d_in_ideal_deg:.1f}\u00b0\n"
        f"Actual inner: {d_in_actual_deg:.1f}\u00b0   Excess: +{error_deg:.2f}\u00b0"
    )
    ax.text(
        0.02,
        0.98,
        info,
        color=TEXT,
        fontsize=8.5,
        ha="left",
        va="top",
        transform=ax.transAxes,
        bbox=dict(boxstyle="round,pad=0.4", fc=BG, ec=GRID2, alpha=0.9),
    )

    ax.axvline(0, color=TEXT, linewidth=0.5, alpha=0.1, linestyle=":")
    ax.set_xlabel("Lateral position (mm)")
    ax.set_ylabel("Longitudinal position (mm)")
    ax.set_title(
        f"ICR at {d_out_deg}\u00b0 outer lock: Miata stock knuckle vs ideal\n"
        f"A40 track ~{T_A40} mm  x  wheelbase {WB_A40} mm",
        fontsize=10,
    )

    ax.set_xlim(min(icr_i[0], icr_a[0]) - 280, ht + 420)
    ax.set_ylim(-wb - 160, TIRE_L_TOP / 2 + 120)

    legend_elements = [
        Line2D([0], [0], color=A40_C, linewidth=2.0, label="Outer wheel"),
        Line2D(
            [0],
            [0],
            color=GREEN,
            linewidth=1.5,
            linestyle=":",
            label=f"Ideal inner ({d_in_ideal_deg:.1f}\u00b0) — ICR on rear axle",
        ),
        Line2D(
            [0],
            [0],
            color=GOLD,
            linewidth=2.0,
            linestyle="--",
            label=f"Actual inner ({d_in_actual_deg:.1f}\u00b0) — ICR ahead",
        ),
        Line2D(
            [0],
            [0],
            color=TEXT,
            linewidth=2.2,
            alpha=0.55,
            label=f"A40 rear axle ({wb} mm)",
        ),
    ]
    ax.legend(
        handles=legend_elements,
        fontsize=7.5,
        facecolor=BG,
        edgecolor=GRID2,
        labelcolor=TEXT,
        loc="lower left",
    )

    fig.tight_layout()
    save(fig, "ackermann_turn.png")


# ────────────────────────────────────────────────────────────────────
# 6c.  Ackermann error assessment: is the stock knuckle acceptable?
#      Top: error curve with driving scenarios and turn radii.
#      Bottom: context bars comparing error to other steering variations.
# ────────────────────────────────────────────────────────────────────
def plot_ackermann():
    fig, (ax_top, ax_bot) = styled_fig(nrows=2, ncols=1, figsize=(8, 7.5))

    delta_out = np.linspace(0.5, 30, 500)

    a40_ideal = _ideal_inside(delta_out, T_A40, WB_A40)
    d_actual = (T_A40 / 2) / np.tan(THETA_KNUCKLE)
    a40_actual = _ideal_inside(delta_out, T_A40, d_actual)
    total_error = a40_actual - a40_ideal

    # ── Top panel: error curve with scenario regions ──
    # Scenario bands: colour-coded, with turn radius included in label.
    # R = WB / tan(delta_out) gives the approximate turn radius.
    scenarios = [
        (1.5, 5, "Highway\nlane change\nR > 27 m", BLUE, 0.06),
        (5, 10, "Circuit\nsweeper\nR 13-27 m", PURPLE, 0.06),
        (10, 18, "Autox\ncorner\nR 7-13 m", GREEN, 0.07),
        (18, 25, "Autox\nslalom/\nhairpin\nR 5-7 m", GOLD, 0.07),
        (25, 30, "Parking\nR < 5 m", PINK, 0.05),
    ]
    for lo, hi, label, c, a in scenarios:
        ax_top.axvspan(lo, hi, color=c, alpha=a)
        ax_top.text(
            (lo + hi) / 2,
            2.65,
            label,
            color=c,
            fontsize=6.5,
            ha="center",
            va="top",
            alpha=0.8,
            linespacing=1.15,
        )

    # Error curve
    ax_top.plot(delta_out, total_error, color=TEXT, linewidth=2.5, zorder=4)
    ax_top.fill_between(delta_out, 0, total_error, color=TEXT, alpha=0.06)

    # Tire slip angle reference line
    ax_top.axhline(4.0, color=GREEN, linestyle="--", linewidth=1, alpha=0.35)
    ax_top.text(
        0.8,
        4.15,
        "Tire slip angle at 0.8 G (~4\u00b0)",
        color=GREEN,
        fontsize=6.5,
        alpha=0.6,
    )

    # Mark key driving points on the curve with scenario context
    callouts = [
        (3, "Highway", BLUE, (0.6, 0.18)),
        (8, "Fast circuit", PURPLE, (1.0, 0.15)),
        (15, "Autox sweeper", GREEN, (-5.0, 0.25)),
        (20, "Autox slalom", GOLD, (-5.5, 0.20)),
        (25, "Tight hairpin", PINK, (-5.5, -0.35)),
    ]
    for angle, label, c, (dx, dy) in callouts:
        idx = np.argmin(np.abs(delta_out - angle))
        err = total_error[idx]
        ax_top.plot(
            angle,
            err,
            "o",
            color=c,
            markersize=6,
            zorder=5,
            markeredgecolor=TEXT,
            markeredgewidth=0.5,
        )
        ax_top.annotate(
            f"{label}\n{err:.2f}\u00b0 error",
            xy=(angle, err),
            xytext=(angle + dx, err + dy),
            fontsize=7,
            color=c,
            fontweight="bold",
            arrowprops=dict(arrowstyle="->", color=c, lw=0.8),
            zorder=6,
        )

    ax_top.set_xlabel("Outside wheel angle (\u00b0)")
    ax_top.set_ylabel("Excess Ackermann (\u00b0)")
    ax_top.set_title(
        f"Ackermann error: Miata stock knuckle ({np.degrees(THETA_KNUCKLE):.2f}\u00b0) on A40\n"
        f"Track ~{T_A40} mm, wheelbase {WB_A40} mm",
        fontsize=10,
    )
    ax_top.set_xlim(0, 30)
    ax_top.set_ylim(-0.05, 5.0)

    # Secondary x-axis: approximate turn radius
    ax_r = ax_top.secondary_xaxis(
        "top",
        functions=(
            lambda d: WB_A40 / 1000 / np.tan(np.radians(np.clip(d, 0.5, 89))),
            lambda r: np.degrees(np.arctan(WB_A40 / 1000 / np.clip(r, 0.1, 999))),
        ),
    )
    ax_r.set_xlabel("Approximate turn radius (m)", color=TEXT, fontsize=8)
    ax_r.tick_params(colors=TEXT, labelsize=8)
    r_ticks = [5, 7, 10, 15, 25, 50]
    ax_r.set_xticks(r_ticks)
    ax_r.set_xticklabels([f"{r} m" for r in r_ticks])

    # ── Bottom panel: context comparison bars ──
    # Use 20 deg (autocross slalom) as the reference point
    err_20 = total_error[np.argmin(np.abs(delta_out - 20))]
    err_15 = total_error[np.argmin(np.abs(delta_out - 15))]
    sources = [
        (f"Ackermann error\nat 15\u00b0 (autox corner)", err_15, GREEN),
        (f"Ackermann error\nat 20\u00b0 (autox slalom)", err_20, GOLD),
        ("Tire pressure\n\u00b11 psi variation", 0.3, PURPLE),
        ("Bushing compliance\nsteer (typical)", 0.7, BLUE),
        ("Driver steering\ninput noise", 0.5, MIATA_C),
        ("Tire slip angle\nat 0.8 G", 4.0, GREEN),
    ]
    labels = [s[0] for s in sources]
    values = [s[1] for s in sources]
    bcolors = [s[2] for s in sources]

    bars = ax_bot.barh(
        labels,
        values,
        color=bcolors,
        alpha=0.7,
        height=0.6,
        edgecolor=bcolors,
        linewidth=1.2,
    )
    for bar, val in zip(bars, values):
        ax_bot.text(
            val + 0.08,
            bar.get_y() + bar.get_height() / 2,
            f"{val:.2f}\u00b0" if val < 1.0 else f"{val:.1f}\u00b0",
            color=TEXT,
            fontsize=8,
            va="center",
            alpha=0.9,
        )

    ax_bot.set_xlabel("Steering angle variation (\u00b0)")
    ax_bot.set_title(
        "Context: error at autocross lock vs other steering variations", fontsize=9
    )
    ax_bot.set_xlim(0, 5.0)
    ax_bot.invert_yaxis()

    fig.tight_layout(h_pad=2.5)
    save(fig, "ackermann.png")


# ====================================================================
# 8. Weight transfer: CG bands for each track width
# ====================================================================
def plot_weight_transfer():
    fig, ax = styled_fig()
    ay_range = np.linspace(0.1, 1.2, 200)
    cg_lo, cg_hi = 525, 625  # CG uncertainty band: 575 +/- 50mm

    wt_miata = M_TOTAL * ay_range * G_ACC * (H_CG_MIATA / 1000) / (T_MIATA / 1000)
    ax.plot(
        ay_range, wt_miata, color=MIATA_C, linewidth=2, label=f"Miata (T={T_MIATA}, CG={H_CG_MIATA})"
    )

    wt_a40_lo = M_TOTAL * ay_range * G_ACC * (cg_lo / 1000) / (T_A40 / 1000)
    wt_a40_hi = M_TOTAL * ay_range * G_ACC * (cg_hi / 1000) / (T_A40 / 1000)
    ax.fill_between(
        ay_range,
        wt_a40_lo,
        wt_a40_hi,
        alpha=0.25,
        color=PINK,
        label=f"A40 T~{T_A40}, CG={cg_lo}-{cg_hi}",
    )

    wt_stock_lo = M_TOTAL * ay_range * G_ACC * (cg_lo / 1000) / (T_MIATA / 1000)
    wt_stock_hi = M_TOTAL * ay_range * G_ACC * (cg_hi / 1000) / (T_MIATA / 1000)
    ax.fill_between(
        ay_range,
        wt_stock_lo,
        wt_stock_hi,
        alpha=0.15,
        color=PURPLE,
        label=f"A40 CG at Miata track (T={T_MIATA})",
    )

    ax.axvline(0.8, color=TEXT, linestyle=":", linewidth=0.5, alpha=0.3)
    ax.text(0.82, 500, "0.8 G", color=TEXT, fontsize=7, alpha=0.5)

    ax.set_xlabel("Lateral acceleration (G)")
    ax.set_ylabel("Lateral weight transfer (N)")
    ax.set_title("Weight transfer: track width + CG height effects")
    ax.legend(
        fontsize=7.5, facecolor=BG, edgecolor=GRID2, labelcolor=TEXT, loc="upper left"
    )
    ax.set_xlim(0.1, 1.2)
    ax.set_ylim(0, 6000)
    save(fig, "weight_transfer.png")


# ====================================================================
# 9. Jacking: RC vs tire size (ride height shifts RC)
# ====================================================================
def plot_jacking():
    fig, ax = styled_fig()

    rc = np.linspace(0, 180, 400)
    half_t = HT_A40
    jack_pct = rc / half_t * 100
    # Front axle lateral force at 0.8 G (front share of operating mass)
    jack_force = FRONT_FRAC * M_TOTAL * AY * G_ACC * (rc / half_t)

    ax.plot(
        rc, jack_pct, color=BLUE, linewidth=2, label=f"Jacking ratio (T = {T_A40_EXACT} mm)"
    )

    ax.axvspan(0, 60, color=GREEN, alpha=0.06)
    ax.axvspan(60, 120, color=GOLD, alpha=0.06)
    ax.axvspan(120, 180, color=PINK, alpha=0.06)
    ax.text(
        30,
        27,
        "low jacking\n(race / formula)",
        color=GREEN,
        fontsize=7,
        ha="center",
        alpha=0.7,
    )
    ax.text(
        90, 27, "moderate\n(sports car)", color=GOLD, fontsize=7, ha="center", alpha=0.7
    )
    ax.text(
        150,
        27,
        "high\n(production DWB)",
        color=PINK,
        fontsize=7,
        ha="center",
        alpha=0.7,
    )

    # RC from the geometry model for the three key configs
    markers = [
        ("Stock Miata (1420 mm track)", H_RC_MIATA, T_MIATA / 2, MIATA_C),
        ("A40 pickups, Miata tire", H_RC_A40_MIATA_TIRE,
         CFG_A40_MIATA_TIRE["half_track"], BLUE),
        ("A40 build, 205/65R15 ET38", H_RC_A40, HT_A40, A40_C),
    ]
    label_positions = [(40, 24), (40, 21.5), (40, 19)]
    for (lbl, rc_val, ht_val, col), (tx, ty) in zip(markers, label_positions):
        jp = rc_val / ht_val * 100
        ax.plot(rc_val, jp, "o", color=col, markersize=8, zorder=5)
        ax.annotate(
            f"{lbl}\nRC={rc_val:.1f} mm, {jp:.1f}%",
            xy=(rc_val, jp),
            xytext=(tx, ty),
            fontsize=6.5,
            color=col,
            arrowprops=dict(arrowstyle="->", color=col, lw=0.6),
        )

    ax2 = ax.twinx()
    ax2.set_facecolor(BG)
    ax2.tick_params(colors=TEXT, labelsize=9)
    ax2.plot(rc, jack_force, color=PINK, linewidth=1.2, linestyle="--", alpha=0.5)
    ax2.set_ylabel("Front-axle jacking force at 0.8 G (N)", color=PINK)
    ax2.yaxis.label.set_color(PINK)
    for spine in ax2.spines.values():
        spine.set_color(GRID2)

    ax.set_xlabel("Roll center height (mm)")
    ax.set_ylabel("Jacking ratio (%)")
    ax.set_title(f"Jacking vs roll center height  (T = {T_A40_EXACT} mm)")
    ax.legend(
        fontsize=7, facecolor=BG, edgecolor=GRID2, labelcolor=TEXT, loc="upper left"
    )
    ax.set_xlim(0, 180)
    ax.set_ylim(0, 30)
    ax2.set_ylim(0, jack_force[-1] * 1.05)
    save(fig, "jacking.png")


# ====================================================================
# 10. Rack narrowing vs track width (replaces both tables)
# ====================================================================
def plot_rack_narrowing():
    fig, ax = styled_fig(figsize=(7, 5))

    track = np.linspace(1100, 1450, 300)
    # The rack narrows by the same amount as the track (both sides move
    # in together): rack narrowing = T_MIATA - track.  At ~1230 -> 190 mm.
    rack_narrowing = T_MIATA - track

    ax.plot(track, rack_narrowing, color=BLUE, linewidth=2.5)

    # Difficulty zones
    ax.axhspan(0, 152, color=GREEN, alpha=0.10)
    ax.axhspan(152, 203, color=GOLD, alpha=0.08)
    ax.axhspan(203, 254, color=PURPLE, alpha=0.08)
    ax.axhspan(254, 310, color=PINK, alpha=0.10)

    ax.text(
        1420, 76, 'Routine (<6"/152mm)', color=GREEN, fontsize=8, ha="right", alpha=0.8
    )
    ax.text(
        1420,
        177,
        'Moderate (6-8"/203mm)',
        color=GOLD,
        fontsize=8,
        ha="right",
        alpha=0.8,
    )
    ax.text(
        1420,
        228,
        'Difficult (8-10"/254mm)',
        color=PURPLE,
        fontsize=8,
        ha="right",
        alpha=0.8,
    )
    ax.text(1420, 268, 'Limit (>10")', color=PINK, fontsize=8, ha="right", alpha=0.8)

    # OO = outer-to-outer tire width = track + 205 mm section width.
    # Stock A40 OO is 1365 mm.
    scenarios = [
        (1365 - TIRE_W_A40, "OO = stock A40 (1365)", PINK, (-60, 45)),
        (1400 - TIRE_W_A40, "OO 1400 (+17/side)", PURPLE, (-70, 40)),
        (T_A40, f"build: OO {T_A40 + TIRE_W_A40} (+35/side)", GREEN, (40, 45)),
    ]
    for t, lbl, c, (dx, dy) in scenarios:
        n = T_MIATA - t
        ax.plot(t, n, "o", color=c, markersize=9, zorder=5)
        ax.annotate(
            f'{lbl}\n{n:.0f}mm ({n/25.4:.1f}")',
            xy=(t, n),
            xytext=(t + dx, n + dy),
            fontsize=7.5,
            color=c,
            ha="center",
            arrowprops=dict(arrowstyle="->", color=c, lw=0.7),
            bbox=dict(boxstyle="round,pad=0.2", fc=BG, ec=c, alpha=0.8),
        )

    ax.set_xlabel("Front track width (mm)")
    ax.set_ylabel("Rack narrowing required (mm)")
    ax.set_title("Miata NA rack: narrowing required vs track width")
    ax.set_xlim(1100, 1450)
    ax.set_ylim(0, 310)

    ax_in = ax.secondary_yaxis(
        "right", functions=(lambda x: x / 25.4, lambda x: x * 25.4)
    )
    ax_in.set_ylabel("Rack narrowing (inches)")
    ax_in.tick_params(colors=TEXT, labelsize=9)
    ax_in.yaxis.label.set_color(TEXT)

    save(fig, "rack_narrowing.png")


# ====================================================================
# 13. Control arm geometry reference — plan-view schematic
# ====================================================================
# Shared helper used by all 4 control-arm plots
# ── coordinate convention ──────────────────────────────────────────
#   +x = outboard (toward wheel)   +y = forward (toward nose)
# ── geometry origin ────────────────────────────────────────────────
#   BJ at (0, 0) for all plan-view plots; pivots are at (-lat, ±fa)
# ══════════════════════════════════════════════════════════════════


def _draw_arm_core(
    ax,
    inner_f,
    inner_r,
    bj,
    mounts=None,
    color=GOLD,
    label="",
    show_annotations=True,
    bushing_lengths=None,
):
    """Draw an A-arm in plan view.  inner_f/inner_r/bj are np.array([x, y]).
    BJ at origin by convention; pivots at negative x (inboard).
    bushing_lengths: (front_len, rear_len) in mm for pivot rectangles."""
    inner_f = np.array(inner_f, dtype=float)
    inner_r = np.array(inner_r, dtype=float)
    bj = np.array(bj, dtype=float)

    # Arm blades
    for ip in (inner_f, inner_r):
        ax.plot(
            [ip[0], bj[0]],
            [ip[1], bj[1]],
            color=color,
            lw=2.5,
            solid_capstyle="round",
            zorder=3,
        )

    # Cross-brace between inner pivots
    ax.plot(
        [inner_f[0], inner_r[0]],
        [inner_f[1], inner_r[1]],
        color=color,
        lw=1.5,
        linestyle="--",
        alpha=0.45,
        zorder=3,
    )

    # Inner pivot markers — rectangles representing bushing extents
    pw = SUSP["pivot_width"]  # visual lateral width for all pivots
    for ip, tag, y_off, bush_len in zip(
        (inner_f, inner_r),
        ("Front pivot", "Rear pivot"),
        (20, -28),
        (bushing_lengths or (0, 0)),
    ):
        if bush_len > 0:
            rect = plt.Rectangle(
                (ip[0] - pw / 2, ip[1] - bush_len / 2),
                pw,
                bush_len,
                edgecolor=color,
                facecolor=color,
                alpha=0.18,
                lw=1.2,
                zorder=2,
            )
            ax.add_patch(rect)
        ax.plot(*ip, "s", color=color, markersize=7, zorder=5)
        ax.text(
            ip[0],
            ip[1] + y_off,
            tag,
            fontsize=6.5,
            color=color,
            alpha=0.85,
            ha="center",
        )

    # BJ marker
    ax.plot(*bj, "o", color=color, markersize=11, zorder=5)
    ax.text(bj[0] + 6, bj[1] - 18, "BJ", fontsize=7, color=color, alpha=0.9)

    # Extra mount points
    if mounts:
        for (mx, my), mlabel in mounts:
            ax.plot(mx, my, "^", color=GREEN, markersize=8, zorder=5)
            ax.text(mx + 6, my + 12, mlabel, fontsize=6.5, color=GREEN, alpha=0.9)

    mid = (inner_f + inner_r) / 2.0
    if show_annotations:
        span = np.linalg.norm(bj - mid)
        ax.annotate(
            "",
            xy=tuple(bj),
            xytext=tuple(mid),
            arrowprops=dict(arrowstyle="<->", color=TEXT, lw=0.8, alpha=0.6),
        )
        ax.text(
            (mid[0] + bj[0]) / 2,
            (mid[1] + bj[1]) / 2 + 12,
            f"≈{span:.0f} mm",
            fontsize=7,
            color=TEXT,
            ha="center",
            alpha=0.75,
        )

    if label:
        ax.set_title(label, color=TEXT, fontsize=9, pad=7)


def _note(ax):
    """Small 'verify against donor' reminder."""
    ax.text(
        0.01,
        0.01,
        "Dimensions from donor subframe scan (Einstar 2).",
        transform=ax.transAxes,
        fontsize=6,
        color=TEXT,
        alpha=0.4,
        va="bottom",
    )


# ── derive all LCA arm-local coordinates from SUSP ──────────────────────────
# BJ at origin (0, 0).  +x outboard, +y forward.
# Both pivots at the scanned LCA pivot lateral from CL (lca_from_cl).
# BJ is lca_bj_fa = 25 mm forward of LCA-front-pivot
#   → front pivot at y = -25, rear pivot at y = -(25 + 322.5) = -347.5.
# Coilover and ARB lie on horizontal lines (constant y) between BJ and the pivot line.
def _lca_coords():
    # BJ at origin (plan view).  LCA pivot line sits at lca_from_cl from car
    # CL; LBJ sits at (hub_face + lbj_from_hub[0]) from CL.  Hub face is at
    # T_MIATA/2 + ET_MIATA from CL.  Pivot-to-BJ lateral = (LBJ_x_from_CL) −
    # lca_from_cl.
    hub_face = T_MIATA / 2 + ET_MIATA
    lbj_from_cl = hub_face + SUSP["lbj_from_hub"][0]
    lca_lat = lbj_from_cl - SUSP["lca_from_cl"]  # true BJ→pivot lateral
    bj = np.array([0.0, 0.0])
    f = np.array([-lca_lat, -SUSP["lca_bj_fa"]], dtype=float)
    r = np.array(
        [-lca_lat, -(SUSP["lca_bj_fa"] + SUSP["lca_fa_span"])], dtype=float
    )
    cov = np.array(
        [-lca_lat + SUSP["lca_coilover_perp"], SUSP["lca_coilover_fa"]]
    )
    arb = np.array(
        [-lca_lat + SUSP["lca_arb_perp"], SUSP["lca_arb_fa"]]
    )
    return bj, f, r, cov, arb


def _uca_coords():
    # BJ at origin, +x outboard, +y forward.  UBJ sits at
    # (hub_face + ubj_from_hub[0]) from CL; UCA pivot line is
    # uca_hub_to_pivot mm inboard of the hub face.  So BJ→pivot lateral
    # = uca_hub_to_pivot − |ubj_from_hub[0]|.
    bj_to_pivot = SUSP["uca_hub_to_pivot"] - abs(SUSP["ubj_from_hub"][0])
    bj = np.array([0.0, 0.0])
    f = np.array(
        [-bj_to_pivot, SUSP["uca_fa_front"]], dtype=float
    )
    r = np.array(
        [-bj_to_pivot, -SUSP["uca_fa_rear"]], dtype=float
    )
    return bj, f, r


# ====================================================================
# 13a. LCA plan view
# ====================================================================
def plot_lca_plan():
    """Top-down view of the Miata NA front lower control arm.

    Geometry (BJ at origin, +x outboard, +y forward):
      Both pivots: x = -(LBJ_from_CL - lca_from_cl) = -336.25 mm inboard of the BJ
      Front pivot: y = -lca_bj_fa           = -25.0 mm  (rearward of BJ)
      Rear  pivot: y = -(lca_bj_fa+lca_fa_span) = -347.5 mm  (rearward of BJ)
      Fore-aft span = lca_fa_span = 322.5 mm
      Coilover: lca_coilover_perp = 240 mm outboard from pivot line.
    """
    fig, ax = styled_fig(figsize=(9, 7))

    bj, lca_f, lca_r, cov_pt, arb_pt = _lca_coords()

    _draw_arm_core(
        ax,
        lca_f,
        lca_r,
        bj,
        mounts=[
            (
                cov_pt,
                f"Coilover\n({SUSP['lca_coilover_perp']:.0f}mm out, {SUSP['lca_coilover_fa']:.0f}mm)",
            ),
            (
                arb_pt,
                f"ARB link\n({SUSP['lca_arb_perp']:.0f}mm out, {SUSP['lca_arb_fa']:.0f}mm)",
            ),
        ],
        color=GOLD,
        label="LCA — plan view (top-down)",
        show_annotations=False,
        bushing_lengths=(SUSP["lca_f_bushing"], SUSP["lca_r_bushing"]),
    )

    # ── dimension callouts ──────────────────────────────────────────
    lca_lat = abs(lca_f[0])  # 336.25 mm
    # Lateral: both pivots → BJ  (both at same inboard distance)
    y_bot = lca_r[1] - 30  # below rear pivot
    ax.annotate(
        "",
        xy=(bj[0], y_bot),
        xytext=(lca_r[0], y_bot),
        arrowprops=dict(arrowstyle="<->", color=TEXT, lw=1.0, alpha=0.7),
    )
    ax.text(
        (bj[0] + lca_r[0]) / 2,
        y_bot - 14,
        f"{lca_lat:.0f} mm  (inner pivots → BJ, lateral — both equal)",
        fontsize=7,
        color=TEXT,
        ha="center",
        alpha=0.85,
    )

    # Fore-aft: front pivot rearward of BJ (−25 mm)
    ax.annotate(
        "",
        xy=(lca_f[0] - 15, bj[1]),
        xytext=(lca_f[0] - 15, lca_f[1]),
        arrowprops=dict(arrowstyle="<->", color=TEXT, lw=0.8, alpha=0.6),
    )
    ax.text(
        lca_f[0] - 28,
        lca_f[1] / 2,
        f"−{SUSP['lca_bj_fa']:.0f} mm\nrear",
        fontsize=6.5,
        color=TEXT,
        ha="right",
        va="center",
        alpha=0.8,
    )

    # Fore-aft: rear pivot rearward of BJ (−348.5 mm)
    rear_fa_total = SUSP["lca_bj_fa"] + SUSP["lca_fa_span"]
    ax.annotate(
        "",
        xy=(lca_r[0] - 40, bj[1]),
        xytext=(lca_r[0] - 40, lca_r[1]),
        arrowprops=dict(arrowstyle="<->", color=TEXT, lw=0.8, alpha=0.6),
    )
    ax.text(
        lca_r[0] - 53,
        lca_r[1] / 2,
        f"−{rear_fa_total:.0f} mm\nrear",
        fontsize=6.5,
        color=TEXT,
        ha="right",
        va="center",
        alpha=0.8,
    )

    # Fore-aft span between pivots (= lca_fa_span = 322.5 mm)
    mid_x = lca_r[0] - 70
    ax.annotate(
        "",
        xy=(mid_x, lca_f[1]),
        xytext=(mid_x, lca_r[1]),
        arrowprops=dict(arrowstyle="<->", color=GOLD, lw=0.9, alpha=0.55),
    )
    ax.text(
        mid_x - 8,
        (lca_f[1] + lca_r[1]) / 2,
        f"{SUSP['lca_fa_span']:.0f} mm\nspan",
        fontsize=6.5,
        color=GOLD,
        ha="right",
        va="center",
        alpha=0.8,
    )

    # BJ reference lines
    ax.axhline(bj[1], color=GRID2, lw=0.9, alpha=0.55, linestyle=":")
    ax.text(
        bj[0] + 8, bj[1] + 4, "BJ (fore-aft ref)", fontsize=6, color=TEXT, alpha=0.4
    )
    ax.axvline(bj[0], color=GRID2, lw=0.6, alpha=0.3, linestyle=":")

    ax.set_xlabel("+x outboard (BJ at 0) →  (mm)")
    ax.set_ylabel("← Rear    +y forward →  (mm)")
    ax.set_aspect("equal")
    pad = 40
    left_pad = 110  # extra room for inboard-side fa-offset labels
    all_x = [bj[0], lca_f[0], lca_r[0], cov_pt[0], arb_pt[0]]
    all_y = [bj[1] + 20, lca_f[1], lca_r[1], y_bot - 28]
    ax.set_xlim(min(all_x) - left_pad, max(all_x) + pad)
    ax.set_ylim(min(all_y) - pad, max(all_y) + pad)
    _note(ax)
    save(fig, "lca_plan.png")


# ====================================================================
# 13b. UCA plan view
# ====================================================================
def plot_uca_plan():
    """Top-down view of the Miata NA front upper control arm."""
    fig, ax = styled_fig(figsize=(8, 6))

    bj, uca_f, uca_r = _uca_coords()

    _draw_arm_core(
        ax,
        uca_f,
        uca_r,
        bj,
        color=BLUE,
        label="UCA — plan view (top-down)",
        show_annotations=False,
        bushing_lengths=(SUSP["uca_bushing"], SUSP["uca_bushing"]),
    )

    uca_lat = abs(uca_f[0])  # 324.5 mm
    spread = uca_f[1] - uca_r[1]  # 113.5 + 143.5 = 257 mm
    y_bot = uca_r[1] - 25

    # Lateral: pivot → BJ
    ax.annotate(
        "",
        xy=(bj[0], y_bot),
        xytext=(uca_f[0], y_bot),
        arrowprops=dict(arrowstyle="<->", color=TEXT, lw=1.0, alpha=0.7),
    )
    ax.text(
        (bj[0] + uca_f[0]) / 2,
        y_bot - 14,
        f"{uca_lat:.0f} mm  (inner pivot → BJ, lateral)",
        fontsize=7,
        color=TEXT,
        ha="center",
        alpha=0.85,
    )

    # Fore-aft offsets (relative to BJ)
    for ip, label in [
        (uca_f, f"+{uca_f[1]:.0f} mm\nfwd"),
        (uca_r, f"−{abs(uca_r[1]):.0f} mm\nrear"),
    ]:
        ax.annotate(
            "",
            xy=(ip[0] - 18, bj[1]),
            xytext=(ip[0] - 18, ip[1]),
            arrowprops=dict(arrowstyle="<->", color=TEXT, lw=0.8, alpha=0.6),
        )
        ax.text(
            ip[0] - 30,
            ip[1] / 2,
            label,
            fontsize=6.5,
            color=TEXT,
            ha="right",
            va="center",
            alpha=0.8,
        )

    # Spread
    mid_x = (uca_f[0] + uca_r[0]) / 2 + 25
    ax.annotate(
        "",
        xy=(mid_x, uca_f[1]),
        xytext=(mid_x, uca_r[1]),
        arrowprops=dict(arrowstyle="<->", color=BLUE, lw=0.9, alpha=0.55),
    )
    ax.text(
        mid_x + 8,
        (uca_f[1] + uca_r[1]) / 2,
        f"{spread:.0f} mm\nspan",
        fontsize=6.5,
        color=BLUE,
        ha="left",
        va="center",
        alpha=0.8,
    )

    ax.axhline(bj[1], color=GRID2, lw=0.9, alpha=0.55, linestyle=":")
    ax.text(bj[0] + 6, bj[1] + 4, "BJ fore-aft ref", fontsize=6, color=TEXT, alpha=0.4)
    ax.axvline(bj[0], color=GRID2, lw=0.6, alpha=0.3, linestyle=":")

    ax.set_xlabel("+x outboard (BJ at 0) →  (mm)")
    ax.set_ylabel("← Rear    +y forward →  (mm)")
    ax.set_aspect("equal")
    pad = 36
    left_pad = 110  # extra room for inboard-side fa-offset labels
    all_x = [bj[0], uca_f[0], uca_r[0]]
    all_y = [bj[1], uca_f[1], uca_r[1], y_bot - 28]
    ax.set_xlim(min(all_x) - left_pad, max(all_x) + pad)
    ax.set_ylim(min(all_y) - pad, max(all_y) + pad)
    _note(ax)
    save(fig, "uca_plan.png")


# ====================================================================
# 13c. Knuckle / spindle front view
# ====================================================================
def plot_knuckle_3view():
    """Three-view knuckle/spindle schematic (front, side, plan).

    All positions relative to hub centre (hub = 0, 0, 0).
    Coordinates: lat = outboard+, fa = forward+, h = up+ (mm).
    Source: photogrammetric scan CAD model — treat as estimated.
    """
    from matplotlib.gridspec import GridSpec

    # ── knuckle geometry ───────────────────────────────────────────
    lbj_lat, lbj_fa, lbj_h = SUSP["lbj_from_hub"]
    ubj_lat, ubj_fa, ubj_h = SUSP["ubj_from_hub"]
    steer_lat, steer_fa, steer_h = SUSP["steer_from_hub"]
    # KPI calculated from actual LBJ/UBJ positions (front view: lat × h plane)
    kpi_rad = np.arctan2(abs(ubj_lat - lbj_lat), ubj_h - lbj_h)
    kpi_deg = np.degrees(kpi_rad)
    # Caster calculated from actual LBJ/UBJ fore-aft offset (side view: fa × h plane)
    caster_rad = np.arctan2(abs(ubj_fa - lbj_fa), ubj_h - lbj_h)
    caster_deg = np.degrees(caster_rad)
    span = ubj_h - lbj_h  # total BJ vertical span ≈233mm
    HUB_R = 38  # hub bearing circle display radius (mm)

    # ── axis limits ────────────────────────────────────────────────
    # Computed to clear: hub rect/circle + HUB_R=38, all BJ/steer points,
    # span arrows, height labels, KPI arc text, dimension annotations.
    lat_min, lat_max = -185, 110  # span = 295
    fa_min, fa_max = -55, 140  # span = 195 (was -35 — clipped hub at -38)
    h_min, h_max = -140, 185  # span = 325
    lat_span = lat_max - lat_min
    fa_span = fa_max - fa_min
    h_span = h_max - h_min

    # ── figure layout: 2×2, plan view spans both columns ────────────────
    # Height ratios derived so all three panels are equal-aspect.
    h1 = fa_span * (lat_span + fa_span) / lat_span
    FIG_W = 9.0
    fig_h = FIG_W * (h_span / (lat_span + fa_span) + fa_span / lat_span)
    fig_h = max(fig_h, 10.0)

    fig = plt.figure(figsize=(FIG_W, fig_h), facecolor=BG)
    gs = GridSpec(
        2,
        2,
        figure=fig,
        height_ratios=[h_span, h1],
        width_ratios=[lat_span, fa_span],
        hspace=0.50,
        wspace=0.44,
    )
    ax_frt = fig.add_subplot(gs[0, 0])
    ax_sid = fig.add_subplot(gs[0, 1])
    ax_plan = fig.add_subplot(gs[1, :])

    for ax in (ax_frt, ax_sid, ax_plan):
        ax.set_facecolor(BG)
        ax.tick_params(colors=TEXT, labelsize=8)
        ax.xaxis.label.set_color(TEXT)
        ax.yaxis.label.set_color(TEXT)
        ax.title.set_color(TEXT)
        for spine in ax.spines.values():
            spine.set_color(GRID2)
        ax.grid(True, color=GRID, linewidth=0.5, alpha=0.6)

    def hub_circle(ax, cx, cy):
        ax.add_patch(
            plt.Circle(
                (cx, cy), HUB_R, color=TEXT, fill=False, lw=1.5, alpha=0.28, zorder=3
            )
        )
        ax.plot(cx, cy, "+", color=TEXT, ms=10, mew=1.5, alpha=0.45, zorder=4)

    def hub_rect(ax, cx, cy, w, h):
        """Edge-on hub outline as a rectangle centred on (cx, cy).

        w = full extent along x-axis of this panel.
        h = full extent along y-axis of this panel.
        Side view (fa × height): w=barrel_depth, h=diameter.
        Plan view (lat × fa):    w=diameter,      h=barrel_depth.
        """
        rect = plt.Rectangle(
            (cx - w / 2, cy - h / 2),
            w,
            h,
            edgecolor=TEXT,
            facecolor="none",
            lw=1.5,
            alpha=0.28,
            zorder=3,
        )
        ax.add_patch(rect)
        ax.plot(cx, cy, "+", color=TEXT, ms=10, mew=1.5, alpha=0.45, zorder=4)

    def arr_v(ax, x, y0, y1, label, color=TEXT, xoff=10, ha="left"):
        """Vertical dimension arrow with side label."""
        ax.annotate(
            "",
            xy=(x, y1),
            xytext=(x, y0),
            arrowprops=dict(arrowstyle="<->", color=color, lw=0.9, alpha=0.75),
        )
        ax.text(
            x + xoff,
            (y0 + y1) / 2,
            label,
            fontsize=7,
            color=color,
            ha=ha,
            va="center",
            alpha=0.9,
        )

    def arr_h(ax, x0, x1, y, label, color=TEXT, yoff=8, ha="center"):
        """Horizontal dimension arrow with label above/below."""
        ax.annotate(
            "",
            xy=(x1, y),
            xytext=(x0, y),
            arrowprops=dict(arrowstyle="<->", color=color, lw=0.9, alpha=0.75),
        )
        ax.text(
            (x0 + x1) / 2,
            y + yoff,
            label,
            fontsize=7,
            color=color,
            ha=ha,
            va="bottom" if yoff > 0 else "top",
            alpha=0.9,
        )

    # ═══════════════════════════════════════
    # FRONT VIEW  (lat × h)
    # ═══════════════════════════════════════
    # Faint cross-view guides at key heights and laterals
    for h_val, col in [(lbj_h, GOLD), (ubj_h, BLUE), (steer_h, GREEN)]:
        ax_frt.axhline(h_val, color=col, lw=0.8, ls=":", alpha=0.22)
    for lat_val, col in [(lbj_lat, GOLD), (ubj_lat, BLUE), (steer_lat, GREEN)]:
        ax_frt.axvline(lat_val, color=col, lw=0.7, ls=":", alpha=0.18)

    hub_rect(
        ax_frt, 0, 0, w=28, h=HUB_R * 2
    )  # barrel edge: narrow in lat, tall as diameter
    ax_frt.axhline(0, color=TEXT, lw=0.7, alpha=0.22)
    ax_frt.axvline(0, color=TEXT, lw=0.7, alpha=0.22)

    ax_frt.plot(
        [lbj_lat, ubj_lat],
        [lbj_h, ubj_h],
        color=PINK,
        lw=2.5,
        solid_capstyle="round",
        zorder=3,
        label=f"Kingpin axis  KPI {kpi_deg:.1f}°",
    )
    ax_frt.plot(lbj_lat, lbj_h, "o", color=GOLD, ms=10, zorder=5, label="LBJ")
    ax_frt.plot(ubj_lat, ubj_h, "o", color=BLUE, ms=10, zorder=5, label="UBJ")
    ax_frt.plot(
        steer_lat, steer_h, "D", color=GREEN, ms=9, zorder=5, label="Steering arm"
    )

    # ── KPI angle annotation ──
    # Vertical reference line from LBJ upward — shows what 0° would look like
    arc_r = 60
    ax_frt.plot(
        [lbj_lat, lbj_lat],
        [lbj_h, lbj_h + arc_r + 10],
        color=TEXT,
        lw=0.9,
        ls="--",
        alpha=0.35,
        zorder=2,
    )
    # Filled wedge between vertical and kingpin axis
    theta_base = np.pi / 2  # straight up
    theta_kpi = np.pi / 2 + kpi_rad  # kingpin direction (inboard lean)
    theta_fill = np.linspace(theta_base, theta_kpi, 60)
    fill_x = lbj_lat + arc_r * np.cos(theta_fill)
    fill_y = lbj_h + arc_r * np.sin(theta_fill)
    ax_frt.fill(
        np.concatenate([[lbj_lat], fill_x, [lbj_lat]]),
        np.concatenate([[lbj_h], fill_y, [lbj_h]]),
        color=PINK,
        alpha=0.12,
        zorder=2,
    )
    # Arc outline
    ax_frt.plot(fill_x, fill_y, color=PINK, lw=1.6, alpha=0.85, zorder=4)
    # Angle label inside arc with background box
    mid_theta = (theta_base + theta_kpi) / 2
    label_r = arc_r + 18
    ax_frt.text(
        lbj_lat + label_r * np.cos(mid_theta),
        lbj_h + label_r * np.sin(mid_theta),
        f"KPI\n{kpi_deg:.1f}°",
        fontsize=8.5,
        color=PINK,
        fontweight="bold",
        ha="right",
        va="bottom",
        bbox=dict(boxstyle="round,pad=0.25", fc=BG, ec=PINK, alpha=0.85, lw=0.8),
    )

    # Height labels on right side — push further right so they don't crowd the span arrow
    lbl_lat = 55
    for h_val, lbl, col in [
        (ubj_h, f"UBJ  {ubj_h:+.1f} mm", BLUE),
        (0, "Hub CL  0 (ref)", TEXT),
        (steer_h, f"Steer {steer_h:+.1f} mm", GREEN),
        (lbj_h, f"LBJ  {lbj_h:+.1f} mm", GOLD),
    ]:
        ax_frt.axhline(h_val, color=col, lw=0.5, ls=":", alpha=0.18)
        ax_frt.text(
            lbl_lat, h_val + 4, lbl, fontsize=7, color=col, alpha=0.82, va="bottom"
        )

    # KPI lateral spread dim (at bottom)
    arr_h(
        ax_frt,
        ubj_lat,
        lbj_lat,
        h_min + 22,
        f"{abs(ubj_lat - lbj_lat):.1f} mm lateral",
        PINK,
        yoff=10,
    )
    # Span dim (left of the kingpin line)
    arr_v(
        ax_frt,
        ubj_lat - 20,
        lbj_h,
        ubj_h,
        f"{span:.1f} mm span",
        PINK,
        xoff=-4,
        ha="right",
    )

    ax_frt.set_xlim(lat_min, lat_max)
    ax_frt.set_ylim(h_min, h_max)
    ax_frt.set_aspect("equal", adjustable="box")
    ax_frt.set_xlabel("Lateral from hub CL (mm, outboard = +)", fontsize=8)
    ax_frt.set_ylabel("Height from hub CL (mm, up = +)", fontsize=8)
    ax_frt.set_title("Front view", color=TEXT, fontsize=9, pad=6)
    ax_frt.legend(
        fontsize=7, facecolor=BG, edgecolor=GRID2, labelcolor=TEXT, loc="lower right"
    )

    # ═══════════════════════════════════════
    # SIDE VIEW  (fa × h) — shares h axis with front view
    # ═══════════════════════════════════════
    for h_val, col in [(lbj_h, GOLD), (ubj_h, BLUE), (steer_h, GREEN)]:
        ax_sid.axhline(h_val, color=col, lw=0.8, ls=":", alpha=0.22)
    for fa_val, col in [(lbj_fa, GOLD), (steer_fa, GREEN)]:
        ax_sid.axvline(fa_val, color=col, lw=0.7, ls=":", alpha=0.18)

    hub_circle(ax_sid, 0, 0)  # face-on: looking along lateral axis at hub bearing face
    ax_sid.axhline(0, color=TEXT, lw=0.7, alpha=0.22)
    ax_sid.axvline(0, color=TEXT, lw=0.7, alpha=0.22)

    # Kingpin in side view: LBJ and UBJ share same fa → vertical line
    ax_sid.plot(
        [lbj_fa, ubj_fa],
        [lbj_h, ubj_h],
        color=PINK,
        lw=2.5,
        solid_capstyle="round",
        zorder=3,
    )
    ax_sid.plot(lbj_fa, lbj_h, "o", color=GOLD, ms=10, zorder=5)
    ax_sid.plot(ubj_fa, ubj_h, "o", color=BLUE, ms=10, zorder=5)
    ax_sid.plot(steer_fa, steer_h, "D", color=GREEN, ms=9, zorder=5)

    # ── Caster angle (= offset of kingpin axis from vertical in fa×h plane) ──
    # LBJ and UBJ share the same fa in this scan, so caster from knuckle ≈ 0°.
    # Draw the arc regardless to make this explicit.
    arc_r_cas = 55
    vertical_ref_y1 = lbj_h + arc_r_cas + 10
    ax_sid.plot(
        [lbj_fa, lbj_fa],
        [lbj_h, vertical_ref_y1],
        color=TEXT,
        lw=0.9,
        ls="--",
        alpha=0.35,
        zorder=2,
    )
    theta_cas_base = np.pi / 2
    # Direction: UBJ is rearward (more negative fa) → clockwise from vertical
    cas_sign = 1 if (ubj_fa - lbj_fa) >= 0 else -1
    theta_cas_kpi = theta_cas_base - cas_sign * caster_rad
    theta_cas_arr = np.linspace(theta_cas_base, theta_cas_kpi, 40)
    cas_arc_x = lbj_fa + arc_r_cas * np.cos(theta_cas_arr)
    cas_arc_y = lbj_h + arc_r_cas * np.sin(theta_cas_arr)
    ax_sid.fill(
        np.concatenate([[lbj_fa], cas_arc_x, [lbj_fa]]),
        np.concatenate([[lbj_h], cas_arc_y, [lbj_h]]),
        color=PINK,
        alpha=0.10,
        zorder=2,
    )
    ax_sid.plot(cas_arc_x, cas_arc_y, color=PINK, lw=1.6, alpha=0.8, zorder=4)
    mid_cas = (theta_cas_base + theta_cas_kpi) / 2
    label_r_cas = arc_r_cas + 16
    ax_sid.text(
        lbj_fa + label_r_cas * np.cos(mid_cas),
        lbj_h + label_r_cas * np.sin(mid_cas),
        f"Caster\n{caster_deg:.1f}°",
        fontsize=8.5,
        color=PINK,
        fontweight="bold",
        ha="left",
        va="bottom",
        bbox=dict(boxstyle="round,pad=0.25", fc=BG, ec=PINK, alpha=0.85, lw=0.8),
    )

    # Span label beside kingpin
    arr_v(ax_sid, lbj_fa + 18, lbj_h, ubj_h, f"{span:.1f} mm", PINK)
    # Steer arm forward reach
    arr_h(ax_sid, 0, steer_fa, steer_h - 22, f"{steer_fa:.1f} mm fwd", GREEN, yoff=-13)
    # Steer arm height label
    ax_sid.text(
        steer_fa + 5,
        steer_h + 4,
        f"{steer_h:+.1f} mm",
        fontsize=7,
        color=GREEN,
        alpha=0.82,
    )

    # Note: LBJ and UBJ share the same fore-aft position → caster is set
    # by the inner pickup geometry, not the knuckle casting.
    ax_sid.text(
        0.02,
        0.98,
        f"LBJ fa: {lbj_fa:+.1f} mm │ UBJ fa: {ubj_fa:+.1f} mm │ Δ = {ubj_fa - lbj_fa:+.1f} mm",
        fontsize=6.5,
        color=TEXT,
        alpha=0.5,
        transform=ax_sid.transAxes,
        va="top",
        ha="left",
    )

    ax_sid.set_xlim(fa_min, fa_max)
    ax_sid.set_ylim(h_min, h_max)
    ax_sid.set_aspect("equal", adjustable="box")
    ax_sid.set_xlabel("Fore-aft from hub CL (mm, fwd = +)", fontsize=8)
    ax_sid.set_ylabel("Height from hub CL (mm, up = +)", fontsize=8)
    ax_sid.set_title("Side view (outboard)", color=TEXT, fontsize=9, pad=6)

    # ═══════════════════════════════════════
    # PLAN VIEW  (lat × fa) — shares lat axis with front, fa axis with side
    # ═══════════════════════════════════════
    for fa_val, col in [(lbj_fa, GOLD), (steer_fa, GREEN)]:
        ax_plan.axhline(fa_val, color=col, lw=0.8, ls=":", alpha=0.22)
    for lat_val, col in [(lbj_lat, GOLD), (ubj_lat, BLUE), (steer_lat, GREEN)]:
        ax_plan.axvline(lat_val, color=col, lw=0.7, ls=":", alpha=0.18)

    hub_rect(
        ax_plan, 0, 0, w=28, h=HUB_R * 2
    )  # barrel top: narrow in lat, wide as diameter in fa
    ax_plan.axhline(0, color=TEXT, lw=0.7, alpha=0.22)
    ax_plan.axvline(0, color=TEXT, lw=0.7, alpha=0.22)

    ax_plan.plot(lbj_lat, lbj_fa, "o", color=GOLD, ms=10, zorder=5, label="LBJ")
    ax_plan.plot(ubj_lat, ubj_fa, "o", color=BLUE, ms=10, zorder=5, label="UBJ")
    ax_plan.plot(
        steer_lat, steer_fa, "D", color=GREEN, ms=9, zorder=5, label="Steer arm"
    )
    # KPI line in plan — shows lateral spread between LBJ and UBJ from above
    ax_plan.plot(
        [lbj_lat, ubj_lat],
        [lbj_fa, ubj_fa],
        color=PINK,
        lw=2.5,
        solid_capstyle="round",
        zorder=3,
        label="Kingpin axis",
    )

    # LBJ lateral from hub
    arr_h(
        ax_plan, lbj_lat, 0, lbj_fa + 16, f"{abs(lbj_lat):.1f} mm inboard", GOLD, yoff=9
    )
    # UBJ additional inboard vs LBJ
    arr_h(
        ax_plan,
        ubj_lat,
        lbj_lat,
        ubj_fa - 14,
        f"{abs(ubj_lat - lbj_lat):.1f} mm more",
        PINK,
        yoff=-13,
    )
    # Steer arm forward reach
    arr_v(
        ax_plan,
        steer_lat - 22,
        0,
        steer_fa,
        f"{steer_fa:.1f} mm fwd",
        GREEN,
        xoff=-4,
        ha="right",
    )

    # Point labels
    for lat, fa, lbl, col, ha in [
        (lbj_lat, lbj_fa, f"LBJ ({lbj_lat:.1f}, {lbj_fa:.1f})", GOLD, "left"),
        (ubj_lat, ubj_fa, f"UBJ ({ubj_lat:.1f}, {ubj_fa:.1f})", BLUE, "left"),
        (
            steer_lat,
            steer_fa,
            f"Steer ({steer_lat:.1f}, {steer_fa:.1f})",
            GREEN,
            "right",
        ),
    ]:
        xoff = 7 if ha == "left" else -7
        ax_plan.text(
            lat + xoff,
            fa + 5,
            lbl,
            fontsize=7,
            color=col,
            ha=ha,
            va="bottom",
            alpha=0.85,
        )

    ax_plan.set_xlim(lat_min, lat_max)
    ax_plan.set_ylim(fa_min, fa_max)
    ax_plan.set_aspect("equal", adjustable="box")
    ax_plan.set_xlabel("Lateral from hub CL (mm, outboard = +)", fontsize=8)
    ax_plan.set_ylabel("Fore-aft from hub CL (mm, fwd = +)", fontsize=8)
    ax_plan.set_title("Plan view (top-down)", color=TEXT, fontsize=9, pad=6)
    ax_plan.legend(
        fontsize=7.5, facecolor=BG, edgecolor=GRID2, labelcolor=TEXT, loc="upper right"
    )

    fig.suptitle(
        "Miata NA front knuckle / spindle — 3-view schematic\n"
        "All positions relative to hub centre (0, 0, 0)  |  "
        "Donor subframe scan (Einstar 2) — measured at ride height.",
        color=TEXT,
        fontsize=8.5,
        y=1.01,
    )
    _note(ax_plan)
    save(fig, "knuckle_3view.png")


# ====================================================================
# 13d. Pickup point — 3-view schematic (front / plan / side)
# ====================================================================
def plot_pickups_3view():
    """Three-view schematic of confirmed inner pivot pickup positions.

    Both sides of the car are shown in the front and plan views.
    Panels are stacked vertically: front view / plan view / side view.
    Lateral from car CL is on the bottom (X) axis for both front and plan views.

    Reference frame:
      Lateral:  from car CL (+right / outboard).
      Fore-aft: from LCA front pivot (+forward, −rearward).
      Height:   from LCA pivot height (+up).
    """
    from matplotlib.gridspec import GridSpec
    from matplotlib.lines import Line2D

    # ── confirmed pivot coordinates ──────────────────────────────────
    g = susp_geometry()
    LCA_lat = g["lca_f"][0]  # 329.5 mm from car CL (donor)
    UCA_lat = g["uca_f"][0]  # 368.0 mm from car CL (donor)
    LCAF_fa = g["lca_f"][1]
    LCAF_z = g["lca_f"][2]  # 0, 0
    LCAR_fa = g["lca_r"][1]
    LCAR_z = g["lca_r"][2]  # −322.5, 0
    UCAF_fa = g["uca_f"][1]
    UCAF_z = g["uca_f"][2]  # +135, +181.78
    UCAR_fa = g["uca_r"][1]
    UCAR_z = g["uca_r"][2]  # −85, +168.22
    HT_MIATA = g["half_track"]  # 710 mm

    # ── axis ranges ──────────────────────────────────────────────────
    lat_pad = 130
    lat_lim = UCA_lat + lat_pad
    fa_min, fa_max = LCAR_fa - 80, UCAF_fa + 140
    z_min, z_max = -80, 290

    # ── figure sizing — equal aspect requires height ratios to match data extents ──
    # X span for front/plan panels: 2 * lat_lim
    # Y span for front:  z_max - z_min
    # Y span for plan:   fa_max - fa_min
    # X span for side:   fa_max - fa_min  (same as plan Y)
    # Y span for side:   z_max - z_min    (same as front Y)
    # All panels have the same allocated figure width (GridSpec 1 col).
    # To minimise whitespace, allocated height ∝ data-Y / data-X × panel-width.
    # panel-width is equal for all; data-X for front/plan = 2*lat_lim,
    # for side = fa_max - fa_min.
    lat_span = 2 * lat_lim
    fa_span = fa_max - fa_min
    z_span = z_max - z_min
    hr_front = z_span / lat_span  # front: z over lateral
    hr_plan = fa_span / lat_span  # plan:  fa  over lateral
    hr_side = z_span / fa_span  # side:  z   over fa (narrower X span)
    # side panel's effective height in the figure = hr_side × (fa_span/lat_span)
    # because its content only fills fa_span/lat_span of the width
    hr_side_fig = z_span / lat_span  # same physics — z and lateral share denominator
    FIG_W = 16.0
    MARGIN = 0.82  # fraction of figure height used by axes (rest = margins/labels)
    fig_h = (hr_front + hr_plan + hr_side_fig) * FIG_W * MARGIN
    fig_h = max(fig_h, 14.0)  # floor so labels don't get crushed

    fig = plt.figure(figsize=(FIG_W, fig_h), facecolor=BG)
    gs = GridSpec(
        3, 1, figure=fig, height_ratios=[hr_front, hr_plan, hr_side_fig], hspace=0.55
    )
    ax_front = fig.add_subplot(gs[0])
    ax_plan = fig.add_subplot(gs[1])
    ax_side = fig.add_subplot(gs[2])

    for ax in (ax_front, ax_plan, ax_side):
        ax.set_facecolor(BG)
        ax.tick_params(colors=TEXT, labelsize=8)
        ax.xaxis.label.set_color(TEXT)
        ax.yaxis.label.set_color(TEXT)
        ax.title.set_color(TEXT)
        for spine in ax.spines.values():
            spine.set_color(GRID2)
        ax.grid(True, color=GRID, linewidth=0.5, alpha=0.6)

    def dim(ax, p1, p2, label, color=TEXT, xoff=0, yoff=7, ha="center"):
        ax.annotate(
            "",
            xy=p2,
            xytext=p1,
            arrowprops=dict(arrowstyle="<->", color=color, lw=0.9, alpha=0.75),
        )
        mid = ((p1[0] + p2[0]) / 2 + xoff, (p1[1] + p2[1]) / 2 + yoff)
        ax.text(*mid, label, fontsize=6.5, color=color, ha=ha, va="bottom", alpha=0.9)

    legend_handles = [
        Line2D(
            [0],
            [0],
            color=GOLD,
            lw=2.5,
            marker="s",
            markersize=7,
            label="LCA inner pivots",
        ),
        Line2D(
            [0],
            [0],
            color=BLUE,
            lw=2.5,
            marker="^",
            markersize=7,
            label="UCA inner pivots",
        ),
    ]

    # ═══════════════════════════════════════════════════════════════════
    # TOP: Front view — both sides
    # X = lateral from car CL (+right / outboard),  Y = height from LCA pivot
    # ═══════════════════════════════════════════════════════════════════
    # Faint horizontal guide lines connecting matching left/right pivots
    ax_front.axhline(UCAF_z, color=BLUE, lw=0.9, ls=":", alpha=0.25, zorder=1)
    ax_front.axhline(UCAR_z, color=BLUE, lw=0.9, ls=":", alpha=0.25, zorder=1)

    pw = SUSP["pivot_width"]
    rpw = 26  # display width for pivot rectangles (wider than physical pw)

    for side in (+1, -1):
        lca_x = side * LCA_lat
        uca_x = side * UCA_lat

        # Pivot bushing rectangles (front view: rpw × rpw squares)
        for px, pz, col in [
            (lca_x, LCAF_z, GOLD),
            (uca_x, UCAF_z, BLUE),
            (uca_x, UCAR_z, BLUE),
        ]:
            rect = plt.Rectangle(
                (px - rpw / 2, pz - rpw / 2),
                rpw,
                rpw,
                edgecolor=col,
                facecolor=col,
                alpha=0.22,
                lw=1.2,
                zorder=2,
            )
            ax_front.add_patch(rect)

        ax_front.plot(lca_x, LCAF_z, "s", color=GOLD, markersize=10, zorder=5)
        ax_front.plot(uca_x, UCAF_z, "^", color=BLUE, markersize=9, zorder=5)
        ax_front.plot(uca_x, UCAR_z, "^", color=BLUE, markersize=9, zorder=5)
        ax_front.axvline(lca_x, color=GOLD, lw=0.4, alpha=0.18, linestyle=":")
        ax_front.axvline(uca_x, color=BLUE, lw=0.4, alpha=0.18, linestyle=":")

        if side == 1:
            ax_front.text(
                lca_x - 10,
                LCAF_z - 24,
                f"LCA ±{LCA_lat:.1f}mm",
                fontsize=6.5,
                color=GOLD,
                ha="right",
            )
            ax_front.text(
                uca_x + 10,
                UCAF_z + 16,
                f"UCA-F +{UCAF_z:.1f}mm",
                fontsize=6.5,
                color=BLUE,
            )
            ax_front.text(
                uca_x + 10,
                UCAR_z - 28,
                f"UCA-R +{UCAR_z:.1f}mm",
                fontsize=6.5,
                color=BLUE,
            )
            dim(
                ax_front,
                (lca_x, z_min + 18),
                (uca_x, z_min + 18),
                f"{UCA_lat - LCA_lat:.1f}mm",
                TEXT,
                yoff=10,
                ha="center",
            )
            dim(
                ax_front,
                (uca_x + 30, 0),
                (uca_x + 30, UCAF_z),
                f"+{UCAF_z:.1f}mm",
                BLUE,
                ha="left",
            )

    ax_front.axvline(0, color=GRID2, lw=1.0, alpha=0.55, linestyle="--")
    ax_front.text(2, z_max - 20, "Car CL", fontsize=6.5, color=GRID2, alpha=0.7)
    ax_front.axhline(0, color=GOLD, lw=0.5, alpha=0.3, linestyle=":")
    ax_front.text(
        -lat_lim + 4, 4, "LCA pivot height (ref)", fontsize=5.5, color=GOLD, alpha=0.5
    )
    ax_front.set_xlim(-lat_lim, lat_lim)
    ax_front.set_ylim(z_min, z_max)
    ax_front.set_aspect("equal", adjustable="box")
    ax_front.set_xlabel(
        "← left side car          Lateral from car CL (mm)          right side car →"
    )
    ax_front.set_ylabel("Height from LCA pivot (mm)")
    ax_front.set_title("Front view — both sides", color=TEXT, fontsize=9, pad=6)
    ax_front.legend(
        handles=legend_handles,
        fontsize=7,
        facecolor=BG,
        edgecolor=GRID2,
        labelcolor=TEXT,
        loc="upper center",
        ncol=2,
        bbox_to_anchor=(0.5, 0.98),
    )

    # ═══════════════════════════════════════════════════════════════════
    # MIDDLE: Plan view — both sides
    # X = lateral from car CL (+right / outboard),  Y = fore-aft from LCA-front pivot (+fwd)
    # ═══════════════════════════════════════════════════════════════════
    ax_plan.axhline(LCAR_fa, color=GOLD, lw=0.9, ls=":", alpha=0.25, zorder=1)
    ax_plan.axhline(UCAF_fa, color=BLUE, lw=0.9, ls=":", alpha=0.25, zorder=1)
    ax_plan.axhline(UCAR_fa, color=BLUE, lw=0.9, ls=":", alpha=0.25, zorder=1)

    for side in (+1, -1):
        lca_x = side * LCA_lat
        uca_x = side * UCA_lat

        # Pivot bushing rectangles (plan view: rpw lateral × bushing fore-aft)
        for px, py, bush, col in [
            (lca_x, LCAF_fa, SUSP["lca_f_bushing"], GOLD),
            (lca_x, LCAR_fa, SUSP["lca_r_bushing"], GOLD),
            (uca_x, UCAF_fa, SUSP["uca_bushing"], BLUE),
            (uca_x, UCAR_fa, SUSP["uca_bushing"], BLUE),
        ]:
            rect = plt.Rectangle(
                (px - rpw / 2, py - bush / 2),
                rpw,
                bush,
                edgecolor=col,
                facecolor=col,
                alpha=0.22,
                lw=1.2,
                zorder=2,
            )
            ax_plan.add_patch(rect)

        # LCA arm line
        ax_plan.plot(
            [lca_x, lca_x],
            [LCAF_fa, LCAR_fa],
            color=GOLD,
            lw=2.5,
            solid_capstyle="round",
            zorder=3,
        )
        ax_plan.plot(lca_x, LCAF_fa, "s", color=GOLD, markersize=9, zorder=5)
        ax_plan.plot(lca_x, LCAR_fa, "s", color=GOLD, markersize=9, zorder=5)

        # UCA arm line
        ax_plan.plot(
            [uca_x, uca_x],
            [UCAF_fa, UCAR_fa],
            color=BLUE,
            lw=2.5,
            solid_capstyle="round",
            zorder=3,
        )
        ax_plan.plot(uca_x, UCAF_fa, "^", color=BLUE, markersize=9, zorder=5)
        ax_plan.plot(uca_x, UCAR_fa, "^", color=BLUE, markersize=9, zorder=5)

        ax_plan.axvline(lca_x, color=GOLD, lw=0.4, alpha=0.18, linestyle=":")
        ax_plan.axvline(uca_x, color=BLUE, lw=0.4, alpha=0.18, linestyle=":")

        if side == 1:
            # LCA labels: inboard (left) of arm so they don't collide with UCA labels
            ax_plan.text(
                lca_x - 10,
                LCAF_fa + 14,
                f"LCA-front ({lca_x:.1f}, 0)",
                fontsize=6.5,
                color=GOLD,
                ha="right",
            )
            ax_plan.text(
                lca_x - 10,
                LCAR_fa - 22,
                f"LCA-rear ({lca_x:.1f}, {LCAR_fa:.1f})",
                fontsize=6.5,
                color=GOLD,
                ha="right",
            )
            # UCA labels: outboard (right) of arm
            ax_plan.text(
                uca_x + 10,
                UCAF_fa + 14,
                f"UCA-F ({uca_x:.1f}, +{UCAF_fa:.1f})",
                fontsize=6.5,
                color=BLUE,
            )
            ax_plan.text(
                uca_x + 10,
                UCAR_fa - 22,
                f"UCA-R ({uca_x:.1f}, {UCAR_fa:.1f})",
                fontsize=6.5,
                color=BLUE,
            )
            # LCA fore-aft span dim: left of LCA column
            dim(
                ax_plan,
                (lca_x - 35, LCAF_fa),
                (lca_x - 35, LCAR_fa),
                f"{abs(LCAR_fa):.1f}mm",
                GOLD,
                xoff=0,
                yoff=0,
                ha="right",
            )
            # UCA fore-aft span dim: right of UCA column
            dim(
                ax_plan,
                (uca_x + 35, UCAF_fa),
                (uca_x + 35, UCAR_fa),
                f"{UCAF_fa - UCAR_fa:.1f}mm",
                BLUE,
                xoff=0,
                yoff=0,
                ha="left",
            )
            # LCA→UCA lateral dim at bottom
            dim(
                ax_plan,
                (lca_x, fa_min + 20),
                (uca_x, fa_min + 20),
                f"{UCA_lat - LCA_lat:.1f}mm",
                TEXT,
                yoff=10,
                ha="center",
            )

    ax_plan.axhline(0, color=GOLD, lw=0.5, alpha=0.3, linestyle=":")
    ax_plan.text(
        -lat_lim + 4, 5, "LCA-front pivot (FA ref)", fontsize=5.5, color=GOLD, alpha=0.5
    )
    ax_plan.axvline(0, color=GRID2, lw=1.0, alpha=0.55, linestyle="--")
    ax_plan.text(4, fa_max - 14, "Car CL", fontsize=6.5, color=GRID2, alpha=0.7)
    ax_plan.set_xlim(-lat_lim, lat_lim)
    ax_plan.set_ylim(fa_min, fa_max)
    ax_plan.set_aspect("equal", adjustable="box")
    ax_plan.set_xlabel(
        "← left side car          Lateral from car CL (mm)          right side car →"
    )
    ax_plan.set_ylabel(
        "← back          Fore-aft from LCA-front pivot (mm)          front →"
    )
    ax_plan.set_title(
        "Plan view (top-down) — both sides", color=TEXT, fontsize=9, pad=6
    )

    # ═══════════════════════════════════════════════════════════════════
    # BOTTOM: Side view — single side (fore-aft × height)
    # X = fore-aft from LCA-front pivot (+fwd),  Y = height
    # ═══════════════════════════════════════════════════════════════════
    # Pivot bushing rectangles (side view: bushing fore-aft × rpw height)
    for px, pz, bush, col in [
        (LCAF_fa, LCAF_z, SUSP["lca_f_bushing"], GOLD),
        (LCAR_fa, LCAR_z, SUSP["lca_r_bushing"], GOLD),
        (UCAF_fa, UCAF_z, SUSP["uca_bushing"], BLUE),
        (UCAR_fa, UCAR_z, SUSP["uca_bushing"], BLUE),
    ]:
        rect = plt.Rectangle(
            (px - bush / 2, pz - rpw / 2),
            bush,
            rpw,
            edgecolor=col,
            facecolor=col,
            alpha=0.22,
            lw=1.2,
            zorder=2,
        )
        ax_side.add_patch(rect)

    ax_side.plot(
        [LCAF_fa, LCAR_fa],
        [LCAF_z, LCAR_z],
        color=GOLD,
        lw=2.5,
        solid_capstyle="round",
        zorder=3,
    )
    ax_side.plot(LCAF_fa, LCAF_z, "s", color=GOLD, markersize=9, zorder=5)
    ax_side.plot(LCAR_fa, LCAR_z, "s", color=GOLD, markersize=9, zorder=5)

    ax_side.plot(
        [UCAF_fa, UCAR_fa],
        [UCAF_z, UCAR_z],
        color=BLUE,
        lw=2.5,
        solid_capstyle="round",
        zorder=3,
    )
    ax_side.plot(UCAF_fa, UCAF_z, "^", color=BLUE, markersize=9, zorder=5)
    ax_side.plot(UCAR_fa, UCAR_z, "^", color=BLUE, markersize=9, zorder=5)

    ax_side.plot(
        [LCAF_fa, UCAF_fa],
        [LCAF_z, UCAF_z],
        color=TEXT,
        lw=0.7,
        alpha=0.18,
        linestyle=":",
        zorder=2,
    )
    ax_side.plot(
        [LCAR_fa, UCAR_fa],
        [LCAR_z, UCAR_z],
        color=TEXT,
        lw=0.7,
        alpha=0.18,
        linestyle=":",
        zorder=2,
    )

    # LCA labels below points, UCA labels above — well separated
    ax_side.text(
        LCAF_fa + 10, LCAF_z - 26, "LCA-front (0, 0)", fontsize=6.5, color=GOLD
    )
    ax_side.text(
        LCAR_fa + 10,
        LCAR_z - 26,
        f"LCA-rear ({LCAR_fa:.1f}, 0)",
        fontsize=6.5,
        color=GOLD,
    )
    ax_side.text(
        UCAF_fa + 10,
        UCAF_z + 18,
        f"UCA-front (+{UCAF_fa:.1f}, +{UCAF_z:.1f})",
        fontsize=6.5,
        color=BLUE,
    )
    ax_side.text(
        UCAR_fa + 10,
        UCAR_z + 18,
        f"UCA-rear ({UCAR_fa:.1f}, +{UCAR_z:.1f})",
        fontsize=6.5,
        color=BLUE,
    )

    dim(
        ax_side,
        (LCAF_fa, z_min + 18),
        (LCAR_fa, z_min + 18),
        f"{abs(LCAR_fa):.1f}mm",
        GOLD,
        yoff=-18,
        ha="center",
    )
    dim(
        ax_side,
        (UCAF_fa + 30, 0),
        (UCAF_fa + 30, UCAF_z),
        f"+{UCAF_z:.1f}mm",
        BLUE,
        ha="left",
    )
    dim(
        ax_side,
        (UCAR_fa - 30, 0),
        (UCAR_fa - 30, UCAR_z),
        f"+{UCAR_z:.1f}mm",
        BLUE,
        ha="right",
    )

    ax_side.axhline(0, color=GOLD, lw=0.5, alpha=0.3, linestyle=":")
    ax_side.axvline(0, color=GOLD, lw=0.5, alpha=0.3, linestyle=":")
    ax_side.text(3, 4, "LCA-front pivot (ref)", fontsize=5.5, color=GOLD, alpha=0.5)
    ax_side.set_xlim(fa_min, fa_max)
    ax_side.set_ylim(z_min, z_max)
    ax_side.set_aspect("equal", adjustable="box")
    ax_side.set_xlabel(
        "← back          Fore-aft from LCA-front pivot (mm)          front →"
    )
    ax_side.set_ylabel("Height from LCA pivot (mm)")
    ax_side.set_title("Side view", color=TEXT, fontsize=9, pad=6)

    fig.suptitle(
        "Miata NA front suspension — inner pivot pickup positions\n"
        "Lateral from car CL  /  Fore-aft from LCA-front pivot  /  Height from LCA pivot",
        color=TEXT,
        fontsize=9,
        y=1.01,
    )
    _note(ax_side)
    save(fig, "pickups_3view.png")


# ====================================================================
# Driveshaft geometry (rear-suspension post)
#   Engine/trans sit 3 deg TAIL-DOWN (output lower at the rear).  The RX-8
#   diff is chassis-mounted, pinion set parallel to the trans (3 deg
#   nose-up), so both joint angles are equal and do NOT change with
#   suspension travel.  Driveshaft 3.5" drop over 37" = 5.4 deg.
# ====================================================================
TRANS_ANGLE_DEG = 3.0  # trans output, tail-down, degrees
DS_DROP_IN = 3.5  # driveshaft vertical drop, inches
DS_LENGTH_IN = 37.0  # driveshaft horizontal run, inches
PINION_ANGLE_DEG = 3.0  # pinion nose-up (axis parallel to the trans), degrees

DS_ANGLE_DEG = np.degrees(np.arctan2(DS_DROP_IN, DS_LENGTH_IN))
FRONT_UJ_DEG = DS_ANGLE_DEG - TRANS_ANGLE_DEG
REAR_UJ_DEG = DS_ANGLE_DEG - PINION_ANGLE_DEG


def plot_driveshaft_angles():
    fig, ax = styled_fig(figsize=(10, 5.5))
    ax.set_aspect("equal")
    ax.grid(False)

    x_trans = 0.0
    y_trans = 0.0
    trans_rad = np.radians(-TRANS_ANGLE_DEG)
    ds_rad = np.radians(-DS_ANGLE_DEG)
    pin_rad = np.radians(-PINION_ANGLE_DEG)

    trans_stub = 8.0
    tx0 = x_trans - trans_stub * np.cos(trans_rad)
    ty0 = y_trans - trans_stub * np.sin(trans_rad)

    ds_x1 = x_trans + DS_LENGTH_IN * np.cos(ds_rad)
    ds_y1 = y_trans + DS_LENGTH_IN * np.sin(ds_rad)

    pin_stub = 6.0
    px1 = ds_x1 + pin_stub * np.cos(pin_rad)
    py1 = ds_y1 + pin_stub * np.sin(pin_rad)

    lw_main = 2.5
    ax.plot(
        [tx0, x_trans],
        [ty0, y_trans],
        color=BLUE,
        lw=lw_main,
        solid_capstyle="round",
        label=f"Trans output ({TRANS_ANGLE_DEG:.0f}\u00b0 tail-down)",
    )
    ax.plot(
        [x_trans, ds_x1],
        [y_trans, ds_y1],
        color=GOLD,
        lw=lw_main,
        solid_capstyle="round",
        label=f"Driveshaft ({DS_ANGLE_DEG:.1f}\u00b0 down to the rear)",
    )
    ax.plot(
        [ds_x1, px1],
        [ds_y1, py1],
        color=A40_C,
        lw=lw_main,
        solid_capstyle="round",
        label=f"Pinion ({PINION_ANGLE_DEG:.0f}\u00b0 nose-up, parallel to trans)",
    )

    ax.axhline(0, color=TEXT, lw=0.6, ls=":", alpha=0.3)
    ax.plot(
        [ds_x1 - 6, ds_x1 + 8], [ds_y1, ds_y1], color=TEXT, lw=0.6, ls=":", alpha=0.3
    )

    for ux, uy in [(x_trans, y_trans), (ds_x1, ds_y1)]:
        ax.plot(ux, uy, "o", color=GREEN, markersize=10, zorder=10)
        ax.plot(ux, uy, "o", color=BG, markersize=5, zorder=11)

    arc_r = 6.0
    front_arc = Arc(
        (x_trans, y_trans),
        2 * arc_r,
        2 * arc_r,
        angle=0,
        theta1=-DS_ANGLE_DEG,
        theta2=-TRANS_ANGLE_DEG,
        color=GREEN,
        lw=2,
        zorder=8,
    )
    ax.add_patch(front_arc)
    mid_f = np.radians(-(TRANS_ANGLE_DEG + DS_ANGLE_DEG) / 2)
    ax.text(
        x_trans + (arc_r + 1.5) * np.cos(mid_f),
        y_trans + (arc_r + 1.5) * np.sin(mid_f),
        f"{FRONT_UJ_DEG:.1f}\u00b0",
        color=GREEN,
        fontsize=11,
        fontweight="bold",
        ha="center",
        va="center",
        zorder=12,
    )

    rear_arc_r = 5.0
    rear_arc = Arc(
        (ds_x1, ds_y1),
        2 * rear_arc_r,
        2 * rear_arc_r,
        angle=0,
        theta1=180 - PINION_ANGLE_DEG,
        theta2=180 - DS_ANGLE_DEG,
        color=GREEN,
        lw=2,
        zorder=8,
    )
    ax.add_patch(rear_arc)
    mid_r = np.radians(180 - (PINION_ANGLE_DEG + DS_ANGLE_DEG) / 2)
    ax.text(
        ds_x1 + (rear_arc_r + 1.5) * np.cos(mid_r),
        ds_y1 + (rear_arc_r + 1.5) * np.sin(mid_r),
        f"{REAR_UJ_DEG:.1f}\u00b0",
        color=GREEN,
        fontsize=11,
        fontweight="bold",
        ha="center",
        va="center",
        zorder=12,
    )

    dim_x = ds_x1 + 2.5
    ax.annotate(
        "",
        xy=(dim_x, ds_y1),
        xytext=(dim_x, y_trans),
        arrowprops=dict(arrowstyle="<->", color=TEXT, lw=1),
    )
    ax.text(
        dim_x + 0.8,
        (y_trans + ds_y1) / 2,
        f'{DS_DROP_IN}" drop',
        color=TEXT,
        fontsize=8,
        ha="left",
        va="center",
    )

    dim_y = min(ds_y1, ty0) - 1.8
    ax.annotate(
        "",
        xy=(x_trans, dim_y),
        xytext=(ds_x1, dim_y),
        arrowprops=dict(arrowstyle="<->", color=TEXT, lw=1),
    )
    ax.text(
        (x_trans + ds_x1) / 2,
        dim_y - 0.6,
        f'{DS_LENGTH_IN}" center-to-center',
        color=TEXT,
        fontsize=8,
        ha="center",
        va="top",
    )

    ax.text(
        tx0 + 1.0,
        ty0 + 1.2,
        "SR20DET / Trans",
        color=BLUE,
        fontsize=9,
        ha="left",
        va="bottom",
    )
    ax.text(
        px1 - 0.5,
        py1 + 1.2,
        "RX-8 diff pinion\n(chassis-mounted)",
        color=A40_C,
        fontsize=9,
        ha="right",
        va="bottom",
    )
    ax.text(
        x_trans + 0.8,
        y_trans - 1.2,
        "Front\nU-joint",
        color=GREEN,
        fontsize=7.5,
        ha="center",
        va="top",
    )
    ax.text(
        ds_x1 - 0.8,
        ds_y1 - 1.2,
        "Rear\nU-joint",
        color=GREEN,
        fontsize=7.5,
        ha="center",
        va="top",
    )

    ax.set_title("Driveshaft angles (side view; constant through travel, sprung diff)")
    ax.set_xlabel("Horizontal distance (in)")
    ax.set_ylabel("Vertical (in)")
    ax.legend(
        fontsize=7.5, facecolor=BG, edgecolor=GRID2, labelcolor=TEXT, loc="lower left"
    )
    pad = 3
    ax.set_xlim(tx0 - pad, px1 + pad + 3)
    ax.set_ylim(min(ds_y1, ty0) - pad - 1, max(ty0, py1) + pad)
    ax.xaxis.set_major_locator(MultipleLocator(5))
    ax.yaxis.set_major_locator(MultipleLocator(2))
    save(fig, "driveshaft_angles.png")


def plot_ujoint_life():
    """U-joint life vs operating angle (inverse proportional model)."""
    fig, ax = styled_fig(figsize=(7, 4.5))

    L_REF = 5000
    THETA_REF = 3.0
    theta = np.linspace(0.5, 15, 500)
    life = L_REF * (THETA_REF / theta)

    ax.plot(
        theta, life, color=GOLD, lw=2.5, label="U-joint life (3000 RPM, rated load)"
    )
    ax.fill_between(theta, life, alpha=0.08, color=GOLD)

    ax.axvspan(0.5, 3, color=GREEN, alpha=0.06)
    ax.axvspan(3, 5, color=GOLD, alpha=0.06)
    ax.axvspan(5, 15, color=PINK, alpha=0.06)
    ax.text(
        1.75,
        13000,
        "ideal\n(1-3\u00b0)",
        color=GREEN,
        fontsize=7,
        ha="center",
        alpha=0.7,
    )
    ax.text(
        4.0,
        13000,
        "acceptable\n(3-5\u00b0)",
        color=GOLD,
        fontsize=7,
        ha="center",
        alpha=0.7,
    )
    ax.text(
        10.0,
        13000,
        "service life concern\n(>5\u00b0)",
        color=PINK,
        fontsize=7,
        ha="center",
        alpha=0.7,
    )

    markers = [
        (FRONT_UJ_DEG, f"A40 build, both joints ({FRONT_UJ_DEG:.1f}\u00b0)", GREEN),
        (3.0, "Rated (3.0\u00b0)", BLUE),
        (6.0, "Double angle (6.0\u00b0)", PINK),
    ]
    label_ys = [9500, 7000, 4500]
    for (ang, lbl, col), ly in zip(markers, label_ys):
        lf = L_REF * THETA_REF / ang
        ax.plot(ang, lf, "o", color=col, markersize=8, zorder=5)
        ax.annotate(
            f"{lbl}\n{lf:.0f} hrs",
            xy=(ang, lf),
            xytext=(ang + 1.8, ly),
            fontsize=7,
            color=col,
            arrowprops=dict(arrowstyle="->", color=col, lw=0.6),
        )

    ax.axhline(L_REF, color=TEXT, ls=":", lw=0.8, alpha=0.4)
    ax.text(
        14.5,
        L_REF + 300,
        "5000 hrs\n(rated)",
        color=TEXT,
        fontsize=6.5,
        ha="right",
        va="bottom",
        alpha=0.5,
    )

    ax.set_xlabel("U-joint operating angle (\u00b0)")
    ax.set_ylabel("Life expectancy (hours at 3000 RPM)")
    ax.set_title("U-joint life vs operating angle (constant load)")
    ax.set_xlim(0.5, 15)
    ax.set_ylim(0, 15000)
    ax.xaxis.set_major_locator(MultipleLocator(1))
    ax.yaxis.set_major_locator(MultipleLocator(2500))
    ax.legend(
        fontsize=7, facecolor=BG, edgecolor=GRID2, labelcolor=TEXT, loc="upper right"
    )
    save(fig, "ujoint_life.png")


# ====================================================================
# Summary of every number the posts quote
# ====================================================================
def print_summary():
    mr80, mr90 = front_mr(), front_mr(alpha_deg=90)
    mr_cf, d_eff = front_mr_closed_form()
    bump, droop = front_wheel_travel()
    pm, pa = _RC_MIATA_SUSP, _RC_A40_SUSP
    ks_f = KW_FRONT / mr80**2
    r = T_A40 / T_MIATA
    print("\n── Summary (quote these in the posts) ──")
    print(f"Track: Miata {T_MIATA}, A40 {T_A40_EXACT} exact at ET{ET_A40} (~{T_A40} nominal); "
          f"narrower by {(1 - r) * 100:.1f}%  roll stiffness x{r**2:.3f} "
          f"({(1 - r**2) * 100:.0f}% drop)  weight transfer x{1 / r:.3f} (+{(1 / r - 1) * 100:.1f}%)")
    print(f"Hub height: Miata {SUSP['hub_z_ground']}, A40 {HUB_Z_A40:.2f} (+{_DH:.2f})")
    for n, p in (("Miata", pm), ("A40", pa)):
        print(f"{n}: RC {p['rc'][1]:.1f} mm, IC {p['cp'][0] - p['ic'][0]:.0f} mm inboard of CP, "
              f"{p['ic'][1]:.0f} mm up; FVSA {p['cp'][0] - p['ic'][0]:.0f} mm = "
              f"{(p['cp'][0] - p['ic'][0]) / p['cp'][0]:.2f} x half-track; "
              f"jacking ratio {p['rc'][1] / p['cp'][0] * 100:.1f}%")
    print(f"A40 pickups with Miata tire: RC {H_RC_A40_MIATA_TIRE:.1f} "
          f"(narrowing {H_RC_A40_MIATA_TIRE - H_RC_MIATA:+.1f}, tire {H_RC_A40 - H_RC_A40_MIATA_TIRE:+.1f})")
    print(f"Pivots from CL: LCA {pa['lca_inner'][0]:.1f}, UCA {pa['uca_inner'][0]:.1f} "
          f"(donor {pm['lca_inner'][0]:.1f}/{pm['uca_inner'][0]:.1f})")
    print(f"MR front: {mr90:.3f} at 90 deg, {mr80:.3f} at {SHOCK_ALPHA_DEG:.0f} deg "
          f"(closed form {mr_cf:.3f}, effective wheel lever {d_eff:.1f} mm); "
          f"old LCA-pivot value {240 / 380.5 * np.sin(np.radians(80)):.3f}")
    print(f"Wheel rates: front {KW_FRONT / 1000:.1f} N/mm ({FREQ_F} Hz), rear {KW_REAR / 1000:.1f} N/mm ({FREQ_R} Hz)")
    print(f"Front spring at MR {mr80:.3f}: {ks_f / 1000:.1f} N/mm ({ks_f / 1000 * 5.71:.0f} lb/in)")
    print("Rear spring: " + ", ".join(f"MR {m}: {KW_REAR / m**2 / 1000:.1f} N/mm" for m in MR_REAR_CASES))
    print(f"Wheel travel ({SHOCK_STROKE_MM:.0f} mm stroke, {BUMP_FRACTION:.0%} bump): "
          f"bump {bump:.0f}, droop {droop:.0f}, total {bump + droop:.0f} mm")
    print(f"Roll per 3.5 deg at the wheel: {T_A40 / 2 * np.tan(np.radians(3.5)):.0f} mm")
    print(f"Spring roll stiffness: front {K_PHI_FRONT_SPRING / 1000:.1f}, rear {K_PHI_REAR_SPRING / 1000:.1f}, "
          f"total {K_PHI_SPRING / 1000:.1f} kN-m/rad")
    for rr in (H_RC_REAR_HI, H_RC_REAR_NOM, H_RC_REAR_LO):
        need = [(k_phi_required(t, h_rc_rear=rr) - K_PHI_SPRING) / 1000 for t in (3.0, 3.5, 4.0)]
        print(f"rear RC {rr:.0f}: roll axis {roll_axis_height(rr):.0f} mm, springs-only roll "
              f"{float(roll_angle_deg(H_CG_A40, K_PHI_SPRING, h_rc_rear=rr)):.2f} deg; "
              f"ARB to add for 3/3.5/4 deg: " + "/".join(f"{v:.1f}" for v in need))
    for cg in (525, 625):
        print(f"CG {cg} (rear RC 100): springs-only {float(roll_angle_deg(cg, K_PHI_SPRING)):.2f} deg, "
              f"ARB for 3.5 deg {(k_phi_required(3.5, cg) - K_PHI_SPRING) / 1000:.1f}")
    print("Front bar alone (IR %.2f assumed): " % IR_BAR
          + ", ".join(f"{d} mm {arb_roll_stiffness(d) / 1000:.1f}" for d in (19, 22, 25, 28)))
    zc_f = 2 * np.sqrt(KW_FRONT * M_CORNER_F)
    zc_r = 2 * np.sqrt(KW_REAR * M_CORNER_R)
    print(f"Critical damping at wheel: front {zc_f / 1000:.1f}, rear {zc_r / 1000:.1f} kN-s/m")
    print(f"KPI {KPI_DEG:.2f}, caster {CASTER_DEG:.2f}; scrub Miata {SCRUB_MM:.2f} -> A40 {SCRUB_A40_MM:.2f} mm; "
          f"trail {TRAIL_MM:.2f} -> {TRAIL_A40_MM:.2f} mm")
    print(f"Knuckle Ackermann angle {np.degrees(THETA_KNUCKLE):.2f} deg; rack narrowing {T_MIATA - T_A40} mm")
    wt = lambda m, h, t: m * AY * G_ACC * h / t
    print(f"Lateral WT at 0.8 G, {M_TOTAL} kg: Miata CG460 {wt(M_TOTAL, .46, 1.42):.0f} N, "
          f"A40 CG575 {wt(M_TOTAL, .575, T_A40 / 1000):.0f} N "
          f"(+{(wt(M_TOTAL, .575, T_A40 / 1000) / wt(M_TOTAL, .46, 1.42) - 1) * 100:.0f}%)")
    print(f"Driveshaft {DS_ANGLE_DEG:.1f} deg; joints {FRONT_UJ_DEG:.1f} / {REAR_UJ_DEG:.1f} deg")
    # Lock loss -> turning circle (kerb-to-kerb ~ 2 x WB / sin(outer lock))
    d_miata = np.degrees(np.arcsin(WB_MIATA / 4700))
    for loss in (12, 18):
        d = d_miata - loss
        print(f"Lock {d_miata:.1f} - {loss} = {d:.1f} deg -> turning circle "
              f"~{2 * WB_A40 / np.sin(np.radians(d)) / 1000:.1f} m")


# ====================================================================
def main():
    print("Generating plots...")
    plot_roll_vs_cg()
    plot_rc_construction()
    plot_rc_tire_comparison()
    plot_rc_combined()
    plot_rc_migration()
    plot_track_effects()
    plot_arb_sizing()
    plot_ride_frequency()
    plot_ackermann()
    plot_ackermann_topview()
    plot_ackermann_turn()
    plot_motion_ratio()
    plot_motion_ratio_vs_angle()
    plot_weight_transfer()
    plot_jacking()
    plot_rack_narrowing()
    plot_lca_plan()
    plot_uca_plan()
    plot_knuckle_3view()
    plot_pickups_3view()
    plot_driveshaft_angles()
    plot_ujoint_life()
    print_summary()
    print("Done.")


if __name__ == "__main__":
    main()
