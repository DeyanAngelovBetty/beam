# Shell Grammar — the frame every product wears

*The BeamAppShell doctrine: navigation, chrome, and branding for all Beam
products. Sibling to the page grammars; broader jurisdiction — every screen of
every product wears the shell, so shell decisions are estate-wide by
definition. Visual companion: the Gaspar shell exploration in the Sunlight
Figma file (section 259-16652). v1 · 2026-07-28.*

---

## 1. State model: locked | closed — overlay is not a mode

The shell has exactly two persistent states. **Locked**: the sidebar is
in-flow, flush, full-height; content reflows beside it. **Closed**: the
sidebar is absent; only the brand strip (§3) remains. There is no configured
"overlay mode" — **overlay is how the closed state answers hover**: hovering
the strip (or the left edge) slides the sidebar in as a floating panel (the
*peek*); mouse-away or Esc dismisses it. Locking from within a peek promotes
it to the locked state.

- Toggle: the panel chevrons, and **⌘\ / Ctrl+\** (the convention our
  audience already knows from their other tools).
- **Default for new users: closed.** The novelty is the point; discovery of
  the lock is one hover away.
- **Narrow viewports: locked is unavailable.** Below the breakpoint the peek
  becomes a standard temporary drawer (scrim, focus-managed). No third model —
  the drawer is the peek wearing mobile clothes.
- Lock preference persists per user (localStorage tier).

## 2. Surface grammar: one skeleton, two natures

The panel's **content skeleton is constant** across locked and peek — same
nav, same width, same internal layout (the skeleton-constancy family:
hidden-but-space-preserved checkbox, constant border, now the shell). What
changes is the **container's nature**:

- **Locked** = part of the page: flush top and bottom, full height, quiet
  border-right, no shadow, no radius.
- **Peek** = above the page: inset from the top (below the brand strip — the
  strip stays visible; the panel does not cover it), rounded, elevated
  shadow.

Border presence follows the constant-geometry doctrine (detail grammar §1):
the panel carries its border in both natures; nature changes pigment and
elevation, never geometry.

## 3. Branding doctrine: the mark never leaves the screen

Unlike single-product tools that can afford logolessness, a Beam product in
its closed state must still say which product it is. Therefore:

- **Closed**: a brand strip in the content's top-left — hamburger + the
  product's **color logo**. Nothing else; no bar behind it. The strip is the
  entire closed-state chrome.
- **Peek**: the panel carries a **ghost logo** — the mono variant at heavy
  subdual (watermark opacity) — in its header, beside the lock chevrons. The
  ghost is a *destination marker*: it shows where the brand will land if you
  lock. It must never compete with the strip's color mark above it; at rest
  it reads as texture, not as a second logo.
- **Locked**: the panel header carries the **color logo** + close chevrons,
  occupying the strip's former position. The strip is gone; the promise is
  fulfilled.
- Logo variants are surface-dependent (color on content-adjacent chrome, mono
  for the ghost) and are supplied per product by the consuming app.

## 4. Motion doctrine — the ignition (intent; values tuned on the bench)

The lock gesture is the shell's signature moment: the panel grows flush and
full-height, the ghost logo rides up into alignment with the strip's color
mark, and at coincidence the **ignition** fires — mono resolves into
gradient, hamburger crossfades into chevrons. Promise → fulfillment, as one
continuous movement. Unlock reverses it.

- Easings and durations for this pass become **Beam's first motion tokens**
  (two or three named duration/easing pairs); no one-off cubic-beziers.
- Locked expand/collapse animates the shell grid itself
  (grid-template-columns), so content genuinely reflows.
- Peek entry/exit: transform + @starting-style; hover intent delay (~250ms)
  and a close grace period so edge-passes don't flicker.
- `prefers-reduced-motion`: all of the above collapses to instant state
  changes; the ignition becomes a crossfade or nothing.

## 5. The header subtraction

There is no persistent app-header bar. The page owns its top edge;
**BeamPageHeader** (breadcrumb / title / actions / subtitle) is the page's
first row and needs no bar above it. Whatever lived in the old app bar
(product switcher, user menu, etc.) migrates per-product into the sidebar's
header or footer zone — audited per app, not assumed.

## 6. Input & accessibility

- Esc dismisses a peek. ⌘\ / Ctrl+\ toggles lock from anywhere.
- The peek is a non-modal overlay: no focus trap; focus behavior and ARIA
  follow the disclosure pattern; the strip's hamburger is the accessible
  trigger with correct expanded state.
- The narrow-viewport drawer IS modal: scrim, focus containment, restore on
  close.
- Keyboard parity: everything hover does, focus does.

## Open

- Per-app audit results of §5 migrations.
- Motion token values (bench).
- Whether the ghost appears in the narrow-viewport drawer (probably not —
  the drawer has no lock to promise).
- **Content vertical rhythm migrates to BeamPageHeader.** The `contentGutter`
  prop owns the horizontal gutter only; top/bottom rhythm is parked on the
  shell provisionally (`CONTENT_VERTICAL`) until BeamPageHeader leaves
  placeholder and owns the rhythm above the page's first row.
- **Content max-width, not a wider gutter, is the ultrawide answer.** The
  gutter's top step is pinned at `md` (the drawer boundary); beyond that,
  readable line length is a content-width concern the shell may later cap,
  separate from the edge gutter.
