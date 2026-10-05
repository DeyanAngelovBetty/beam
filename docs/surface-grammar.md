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

## The canvas is expressive because content is contained (bento) — 2026-09-29

Beam is a **containment language**: content lives in boxes (Paper, Section, cards), each on its own
opaque ramp surface. Because everything readable sits on a box, the **canvas** behind them — base
(`background.default`, the sunk `−1` floor above) + mesh + Betty-star mask + stars — is free to be
**expressive**. This is *why* the page sinks to `−1` and the mesh can carry real intensity: nothing but a
closed list reads directly against it.

**Only these float directly on the canvas, and canvas contrast is audited for this list ALONE:**

- the **page header** — title, subtitle, breadcrumb, primary CTA (`BeamPage`);
- the **nav toggle** (the `AppShell` collapsed strip);
- **page-level collapse/expand headers** (e.g. Users, Roles).

**Adding to this list is a design decision** — it widens the canvas-contrast audit. Everything else MUST
live in a box; a readable element placed straight on the canvas (a bare validation line, a naked
empty-state) is a review finding, not a supported surface. Corollary: the page-sink and mesh intensity are
tunable precisely *because* only this list reads against them.

**App background** = the canvas: base + page mesh + stars, painted globally by the theme
(`body::before` / `body::after`). Same name in Figma, Storybook (`Foundations/App Background`), and here.
**Not a component** (2026-09-30): it's a fixed body-level layer at `z −1`, sampled by stickyChrome's bands
— extracting an `<AppBackground>` would fight that. Promote to a component only on a second *in-flow* use
(§2).

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
  sticky-chrome ceiling/floor outers (Table) — **paints a copy of the page backdrop** (the shared
  `pageBackdropSx`: `background.default` base + mesh, `background-attachment: fixed`), NOT a flat
  `background.default`, and NOT transparency. One source, two consumers: `body::before` and the bands spread
  the same object, so the band samples the same viewport-fixed mesh and reads seamlessly with the backdrop
  around it. Opaque-by-composition (the base kills ghosting — rows transit the band as they scroll off and
  must be occluded), seamless-by-construction (fixed attachment draws the same function of viewport
  position). Transparency was tried first and **falsified** (rows ghosted through the transparent bands);
  a flat color would impersonate the page and mismatch the gradient. (The Betty star is a mask, not a
  fixed-attachable image layer, so it's absent from the bands — imperceptible at band height; plan B if
  fixed-attachment ever misbehaves is a simplified gradient. — 2026-09-11.)
  **Amendment (2026-09-13): the exit animation is the treatment; the band is page, not glass.** BOTH edges
  wear the opaque backdrop (rows must never ghost — the grid's containment story wins), and a page section
  exiting under the ceiling simply fades under it (a `view()` exit animation, `stickyChromeExitSx`). Frost was
  tried TWICE — first a fully-translucent ceiling, then a glass sheen `::before` over the opaque base — and
  retired both times by the containment ruling: the ceiling never exposes rows, so it is page. The ceiling
  pins at `top: 0` ALWAYS (sticky's contract is constant geometry — no jump); logo clearance is the CONSTANT
  band height (`CHROME_CEILING_BAND`, the ceiling `padding-top`), and the extra over the section gap is
  absorbed at rest by the pre-grid section's negative margin (against `PAGE_SECTION_GAP`). The band paints
  transparent at rest (it overlaps that section) and opaque only when stuck, via a fixed-attachment
  `::before` whose opacity fades in — an identical-pixel dissolve.

## Open question — light mode (Vasco)

Today's agreement fixed the **dark** ramp. A light ramp exists (a light anchor + a much smaller step),
and the level *mapping* is structural — the same aliases apply — so light inherits the re-map (page →
−1, dialog → paper, etc.) automatically. **But** light's step is ~0.01 L, so the four levels are barely
separable, and whether light-mode's page should also sink to −1 (vs. staying at the anchor) is **open
for Vasco**. Recorded, not decided here — no light ramp was invented; light simply follows the dark
structure until he rules.

## Open question — contrast marks the working plane, not proximity (Deyan, 2026-10-05)

**Principle.** Text contrast should mark the surface **in constant use**, not the one nearest the viewer.
The working plane — bentos / content — gets the **HIGHEST** text contrast; **chrome** above it (the nav) is
deliberately **lower** contrast so it doesn't compete; **overlays** above that are lower still. This
deliberately **inverts** the photographic "closest = most contrast" convention: here the thing you read all
day wins, and the frame recedes.

**The stack is semantic and fixed:** `canvas → content → chrome → overlay`.

**Mapping that satisfies the principle** (contrast = how far a surface sits from the text colour):
- **DARK** — content is **darkest** (max contrast with light ink); chrome lighter; overlay lighter still.
  In today's tokens that is **nav = paper / bentos = paper0** — i.e. the swap Deyan circled (content drops
  below chrome).
- **LIGHT** — content is **lightest / white** (max contrast with dark ink); chrome greyer; overlay greyer
  still. That is **nav = paper0 / bentos = paper** — the CURRENT assignment.

⚠️ **Conflict to resolve first — it's a ramp-DIRECTION question per mode, not just a reassignment.** Our
ramp ascends in lightness in **both** modes. In LIGHT that means the overlay step (ramp 2) is the *lightest*
= **highest** contrast with dark ink — which **breaks the rule** for menus and dialogs (they'd out-contrast
content). To satisfy the principle, levels **above** content in light must step **back toward grey**, not
further toward white. So light can't just re-map the existing ascending ramp; its ramp above content has to
reverse direction.

**Naming.** `paper0` literally implies "below paper", which contradicts the stack once content sits lower
than chrome. Candidate role names that match the stack: **`canvas` / `content` / `chrome` / `overlay`**.
Open: keep MUI's `background.paper` contract (consumers still name a level, §"The levels"), and **check
official Beam's names first** — the superset rule means we adopt theirs if they've named these roles.

**Caveat on headroom.** Light's ramp step (~0.01 L) is roughly **7× smaller** than dark's (~0.07), so in
light the four levels are barely separable **either way** — whatever direction light's ramp takes, it has
little contrast budget to spend. (Ties into the open light-ramp question above.)

**Undecided — parked for a dedicated surfaces pass.** Recorded here as the principle + the conflict to
resolve; no tokens changed. Related: this is why the nav's inactive items were quieted to `text.secondary`
(shell-grammar) as a stopgap — the real fix is the plane-contrast re-map, once ruled.
