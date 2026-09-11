# BeamAppShell — organism build-notes

Decisions and additive changes to the shell, newest first.

## Content gutter retune — estate-wide *(2026-09-12)*

Deliberate rhythm retune, applied through the shared tokens (no magic numbers reintroduced):
- **`padding-inline` 7 → 5** (`CONTENT_INLINE`, `{ xs: 2, sm: 4, md: 5 }`) — `DEFAULT_CONTENT_GUTTER`
  now sources it.
- **`padding-bottom` 10 → 3** (`CONTENT_BOTTOM`, `{ xs: 2, md: 3 }`).
- **`padding-top` STAYS 10** (`CONTENT_TOP`, `{ xs: 2, md: 10 }`) — preserves the nav dock/undock visual
  shift.
- The former single `CONTENT_VERTICAL` **differentiated** into `CONTENT_TOP` / `CONTENT_BOTTOM` /
  `CONTENT_INLINE` in `theme/tokens.ts` — one source per edge; the shell (`main` padding) and the sticky
  footer floor (`CONTENT_BOTTOM`) still read the same value each, so they can't drift.
- **Estate-wide:** every app on the default gutter reshapes — **Sunlight and Midnight included** — which
  is intended (one rhythm across the estate), not a Gaspar-only change.

## Sticky-chrome contract — `main` yields its top + bottom padding *(2026-09-12)*

`main` is the page's **scroll owner** (`overflow-y: auto`), and it owns the page's vertical rhythm
(`CONTENT_TOP`/`CONTENT_BOTTOM` as `pt`/`pb`). A grid using `BeamDataTable`'s `stickyChrome` turns its
footer into the **page floor** and its header into the **page ceiling**, taking over BOTH edges — so the
shell gives up both:

```
main:has([data-beam-sticky-chrome]) { padding-top: 0; padding-bottom: 0 }
```

- **`data-beam-sticky-chrome` is the CONTRACT** — a documented attribute a sticky-chrome grid publishes
  on its root `Paper`. This shell watches for it and drops its **top + bottom** padding (side rhythm
  untouched). **Why donate at all:** padding on the SCROLL OWNER is *fixed* under a sticky element — a
  `top: 0` bucket would pin `CONTENT_TOP` (~80px) below the viewport, an ugly shelf; donating the spacing
  to the page Stack (which scrolls with the content) lets the bucket pin **flush at the true viewport top**
  and the footer flush at the bottom. Released-state geometry is unchanged — the spacing changed owners.
- **The two halves.** FLOOR (bottom): the footer floor carries `CONTENT_BOTTOM` as its `padding-bottom`.
  CEILING (top): the page's **section container** (not the shell) re-adopts `CONTENT_TOP` as `padding-top`
  via `BeamDataTable`'s exported **`stickyChromeGapSx`** (`:has`-gated on the same attr, which also
  collapses the section gap and donates the pre-grid seam to the bucket ceiling). Same declarative `:has`
  posture; the top spacing lives on the Stack so it *scrolls away*, the bottom on the footer. See
  **BeamDataTable-notes** → the ceiling/floor.
- **`:has()` posture:** Baseline across engines — no fallback needed. Stated explicitly so a future
  reader doesn't add a redundant JS path; if a grid ever needs this on a non-`:has` engine, that's a new
  decision, not a gap here.
- **Shared values, no drift:** `CONTENT_TOP` / `CONTENT_BOTTOM` (`theme/tokens.ts`) — the shell padding,
  the footer floor, and the Stack's ceiling padding each read one source per edge.
- **Scope note:** the contract is page-level — if a page held both a sticky-chrome grid and other content
  around it, the shell still drops its top/bottom padding (the sticky grid claims both edges). Acceptable
  for the intended one-primary-grid page; revisit if a real layout stacks them.
