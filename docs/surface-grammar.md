# Surface Grammar

**Status:** Ratified 2026-09-10 in Figma (Deyan · Vasco · Alex), published to the Beam + Sunlight
libraries; synced to this repo as a theme-level change. Product-neutral — this doc + the theme diff are
the communication artifact for the official Beam/Sunlight repos.
**Companions:** `detail-page-grammar.md`, `state-rendering-grammar.md`, `drill-down-grammar.md`.

Surfaces are an **elevation ramp**: one oklch lightness scale (chroma + hue pass through, so surfaces
stay faintly branded, not flat grey), stepped from a per-product anchor. Every surface in the estate
sits on exactly one level; the level, not a hand-picked color, is what a surface declares.

## The levels

| Level | Ramp | What sits here |
|---|---|---|
| **page** | `−1` | `background.default` — the page behind everything. The floor. |
| **paper0** | `0` | `Paper elevation={0}` — a recessed working surface (flat sub-panels). |
| **paper** | `1` | `Paper elevation={1}` and `variant="outlined"` — **the default working surface**: cards, grids, panels, filter bars, detail sections. Where most content lives. |
| **overlay** | `2` | **All menus & popovers** — `Menu`, `Popover`, `Select` dropdowns, autocomplete. The one level that floats above content. |
| *(headroom)* | `3` | **Deliberately unused.** See "Dialogs" — the ramp tops out at overlay so anything above a dialog still has a level to live on. |

Aliases resolve through one anchor + step; a live anchor change re-derives the whole chain. Consumers
name the level (`background.paper`, `background.overlay`, `background.paper0`) — never a hex, never a
raw `--beam-surface-N`.

## Dialogs sit at `paper`, not above overlay

A dialog renders at **`paper` (ramp 1)**, the same level as the working surface — **not** at the top of
the ramp. Its **backdrop** (the scrim) provides the separation from the page, so it doesn't need to
climb the ramp to read as "above." Keeping it at `paper` leaves **overlay (2) as headroom above it**:
a menu, select, or popover opened *from inside* a dialog renders at overlay and so still reads as
lifted above the dialog. If the dialog itself took the top level, its own menus would have nowhere
higher to go and would read as flush with — or below — the dialog. Hence **level 3 stays deliberately
unused**: the ramp tops at overlay, preserving one step of headroom for the from-dialog case.

## MUI elevation veil — disabled (recorded decision)

MUI's dark theme lightens `Paper` as elevation rises by layering a **procedural white `background-image`
veil** (`--Paper-overlay`). That is a *second*, uncontrolled elevation signal fighting this ramp. It is
**disabled** estate-wide (`MuiPaper.styleOverrides.root: { backgroundImage: 'none' }`); the ramp's
`backgroundColor` per level is the **only** elevation signal. Elevation `0/1/2` map to
`paper0/paper/overlay` via `MuiPaper` style overrides; `Menu`/`Popover` → `overlay`; `Dialog` → `paper`.

## Rules

- **Elevation > 2 is not part of the system.** The ramp is three visible working levels (paper0, paper,
  overlay) plus the page floor. Nothing in the estate uses elevation > 2; a value above 2 is a review
  finding, not a supported surface (no runtime clamp — it simply isn't used).
- **Components inherit; don't hardcode surfaces.** A surface color never appears as a literal in a
  component — it comes from `background.*` (or the elevation the Paper declares). Explicit background
  fixes are only for a component that already hardcodes one.
- **Chrome wears the page's backdrop — literally, via fixed-attachment copies of the shared backdrop
  source — not a flat color.** A pinned surface that stands in for the *page* background — the
  sticky-chrome ceiling/floor outers (BeamDataTable) — **paints a copy of the page backdrop** (the shared
  `pageBackdropSx`: `background.default` base + mesh, `background-attachment: fixed`), NOT a flat
  `background.default`, and NOT transparency. One source, two consumers: `body::before` and the bands spread
  the same object, so the band samples the same viewport-fixed mesh and reads seamlessly with the backdrop
  around it. Opaque-by-composition (the base kills ghosting — rows transit the band as they scroll off and
  must be occluded), seamless-by-construction (fixed attachment draws the same function of viewport
  position). Transparency was tried first and **falsified** (rows ghosted through the transparent bands);
  a flat color would impersonate the page and mismatch the gradient. (The Betty star is a mask, not a
  fixed-attachable image layer, so it's absent from the bands — imperceptible at band height; plan B if
  fixed-attachment ever misbehaves is a simplified gradient. — 2026-09-11.)

## Open question — light mode (Vasco)

Today's agreement fixed the **dark** ramp. A light ramp exists (a light anchor + a much smaller step),
and the level *mapping* is structural — the same aliases apply — so light inherits the re-map (page →
−1, dialog → paper, etc.) automatically. **But** light's step is ~0.01 L, so the four levels are barely
separable, and whether light-mode's page should also sink to −1 (vs. staying at the anchor) is **open
for Vasco**. Recorded, not decided here — no light ramp was invented; light simply follows the dark
structure until he rules.
