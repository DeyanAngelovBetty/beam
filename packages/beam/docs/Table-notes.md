# Table — organism build-notes

Decisions and additive changes to the organism, newest first. (Column-manager capability has its own
spec: `SPEC-table-column-manager.md`.)

## Footer toolbar height — finishing the density pass *(2026-09-14)*

The density pass pinned `.beam-footer-inner` to `FIELD_TWIN_HEIGHT` but MISSED the inner MUI pagination
toolbar (`.MuiTablePagination-toolbar`), which kept its 52px base min-height PLUS the Toolbar variant's
breakpoint media queries (48 landscape, 64 up-sm) — so the footer measured ~54, not 44.
- **Toolbar → 44 across all breakpoints (theme, `MuiTablePagination.styleOverrides.toolbar`):** `&&` doubles
  the slot class (0,2,0) so it beats MUI's single-class (`.MuiToolbar-root`, 0,1,0) min-heights inside every
  media query — no mirroring, no `!important`, no literal (uses `FIELD_TWIN_HEIGHT`).
- **The remaining ~2px = the inner's border stacking ON TOP of `minHeight`.** Switched `.beam-footer-inner`
  from `minHeight` to `height: FIELD_TWIN_HEIGHT` (fixed, border-box) so its 1px bottom card-edge border sits
  INSIDE the 44 — identical to how a body row is `height: 44` with its border included. Footer now lands at
  exactly 44 alongside the 44 rows.

## Pagination persistence + deterministic re-anchor *(2026-09-14)*

- **ROOT CAUSE of the "nav toggle resets rowsPerPage 50→10" symptom (shell remount — reported, fix deferred
  as structural).** `AppShell`'s `frameContent` is a ternary on `effectiveLocked` producing two
  structurally different trees: locked = `<Box display:grid>{nav}{main}</Box>`, closed = a Fragment
  `<>{strip}{hoverZone}{main}{peek}</>`. When the nav toggles, the appFrame's child changes root TYPE
  (grid `<div>` ↔ Fragment, which flattens to a different child list), so React can't reconcile `{main}` to
  the same position — it UNMOUNTS and remounts the whole content subtree. That wipes grid state (pageSize,
  selection, expanded rows) and re-fires data fetches, then compounds into the scroll jump (remount → default
  pageSize → clamp → reachability flip → re-snap). **Not cheaply fixable:** unifying the two branches so
  `main`'s instance is preserved means making both a shared grid root with `main` at a stable index and the
  closed chrome absolute/out-of-grid-flow — a shell restructure touching the view-transition morph +
  absolute positioning + pointer-events, unverifiable headless. Reported for a decision; the persistence
  below makes the pagination symptom survivable regardless (state re-derives from the URL after any remount).
- **URL is the source of truth for pagination (transactions page).** New CONTROLLED `pagination` +
  `onPaginationChange` props on the organism (TanStack's `PaginationState` / `OnChangeFn`, passed straight
  through; omit both = the old uncontrolled `defaultPageSize` behavior, byte-identical). The page reads
  `pageSize`/`page` (1-based) from `useSearchParams` and writes them back on change (push, so back/forward
  step through pages); defaults stay OUT of the URL (clean at 10 / page 1). Survives the remount + refresh;
  links share state.
- **Deterministic re-anchor on page/size change (organism, `useLayoutEffect` keyed on pageIndex + pageSize,
  skips first mount).** After the new layout commits, the page scroller is scrolled INSTANTLY (never smooth)
  to a calm landing: the grid's snap-2 pinned position when the chrome will engage for the NEW rows-on-page,
  else page top. Reachability is recomputed SYNCHRONOUSLY from rows-on-page via the SAME arithmetic as the
  gate (never the async `pinUnreachable` state, never measured height). The pinned target subtracts the
  Paper's active scroll-margin-top so it lands exactly where proximity-snap rests (else proximity would fight
  the jump) — inheriting whichever snap-2 offset constant is live (`CHROME_CEILING_BAND`, or 0 once the
  ceiling collapses at tier 2). **Snap-2 offset decision still pending — the anchor inherits it.**

## Sticky chrome — pinned bucket + footer (`stickyChrome`) *(2026-09-12, BENCH)*

The PAGE stays the scroll owner; the grid grows to content height; its chrome pins to the scrollport
edges only while crossing them (sticky's natural content-height-when-short for free). No `maxBodyHeight`,
no internal scroll region, no virtualization. Opt-in (`stickyChrome`); absent = byte-identical. **Story
`Components/Table → StickyChromeBench` (1,200 rows / page 500) is the bench** — eyeballed before
Gaspar wiring.

- **The one overflow trap:** the grid `Paper`'s `overflow: hidden` → **`overflow: clip`** when
  `stickyChrome` (clips to the radius, does NOT create a scroll container, so the bucket escapes to the
  real scroll owner — AppShell `main` / the document). Nothing else in the organism traps (the wrapper is
  `overflow: visible`; the `TableContainer` stays the horizontal scroller — and the reason the real thead
  can't page-stick, hence the clone).
- **Header clone (measured widths — the anti-drift guarantee):** the bucket carries an `aria-hidden`
  presentation clone of the header, rendered from the same `leafColumns`. It **owns no width** — a
  `ResizeObserver` + structural effect (columnOrder / visibility / pageSize / row-count) measures the
  REAL header cells and the clone copies those px (the rail-width precedent: measure the layout, never
  hold a parallel belief). Shown only while stuck. The real thead keeps semantics + sort controls.
- **Clone horizontal sync — CSS scroll-driven where supported (amendment 2026-09-12):** a **named
  scroll-timeline** (`--beam-body-scroll`, inline axis) on the `TableContainer`, `timeline-scope` on the
  **Paper** (the common ancestor of the scroller and the clone — the clone lives in the bucket, NOT
  inside the affordance wrapper, so the wrapper can't be the scope host), and the clone track animates
  `translateX(0 → calc(-100% + 100cqw))` along it (`container-type: inline-size` on the clone outer makes
  `100cqw` the visible width). The measured-width design makes both endpoints exact: `-100%` = the track's
  measured column-sum width, `100cqw` = the visible width, so the far end is `-(fullWidth − visibleWidth)`
  = the scroll range. **Progressive:** gated in `@supports (animation-timeline: scroll())`; JS detects the
  same via `CSS.supports('animation-timeline','scroll()')` and **skips the clone transform** (an inline
  transform would freeze the animation). Elsewhere the existing **rAF `translateX(-scrollLeft)` mirror**
  stands. The rAF listener keeps its other jobs (the overflow attrs) on every engine. A column-width
  re-measure changes the track width, so `-100%`'s basis and the timeline range **recompute natively** —
  no JS realignment. *(Verify on the bench: sync fidelity at fast flick + rubber-band extremes; and that
  the re-measure and the animation don't fight on column show/hide/reorder.)*
- **Rejected for this:** `scroll-target-group` / `:target-current` — that's **scrollspy** (tracking which
  target is in view), not position coupling; it can't drive a continuous translate. **Scroll-driven
  animation** is the right primitive here.

### Footer as the page floor (amendment 2, 2026-09-12)

When pinned, the footer becomes the page floor rather than floating with an offset:
- The footer's **outer** box pins flush (`bottom: 0`), painted in the **page background**
  (`background.default`, ramp −1), and carries the page's bottom spacing as its own `padding-bottom`
  (**`CONTENT_VERTICAL`**). The **inner** box stays the bordered paper footer (opaque `background.paper` +
  the stuck up-band). Rows scroll under and sink into the page surface; released at scroll-end the
  footer sits where it does today — **the spacing merely changed owners** (from the shell's `pb` to the
  footer floor's).
- **`data-beam-sticky-chrome` is a documented CONTRACT** (published on the grid `Paper` when
  `stickyChrome`): the page's scroll owner drops its bottom padding for it. See **AppShell-notes**.
- **The shared spacing value:** `CONTENT_VERTICAL` (`{ xs: 2, md: 10 }`) now lives in `theme/tokens.ts`
  and is read by BOTH `AppShell` (its `main` padding) and this footer floor — one source, no drift.
  It was a magic const in the shell; promoted to a token so the two sides can't disagree.

*Eyeball nuance (bench):* at rest the page-floor padding + the `Paper`'s bottom border/radius now sit
BELOW the footer inside the card (the footer's POSITION is pixel-equal to today; the card's bottom edge
shifts down by `CONTENT_VERTICAL`). If that reads wrong, the follow-up is dropping the `Paper` bottom
border+radius when sticky so the card dissolves into the floor — flagged, not built.

*Mirrored treatment for the top bucket (page-ceiling) is the likely NEXT amendment — NOT built here;
Deyan is iterating the top separately.*

### Border deconstruction (amendment 3, 2026-09-12) — sticky mode only

Non-sticky grids keep today's single-`Paper` outlined frame, **byte-identical** (everything below is
gated on `stickyChrome`). In sticky mode the **Paper drops border + radius** and the frame is redrawn by
the three regions that travel with the pins:
- **Bucket** (top): top + side borders + **top-radius** — the card's ceiling edge, traveling with the
  pin (FINALIZED in the header pass, 2026-09-12: opaque paper always + border-top width/style longhands,
  the same fixes the footer took).
- **Rows region** (the affordance wrapper): **side borders only**.
- **Footer inner** (the card floor edge): side + bottom borders + **bottom-radius** — rounds into the
  page floor, traveling with the pin.

- **Seam guarantee (not hoped):** all three apply the identical `SIDE_BORDER` (`1px solid`, `divider`),
  and all three are **full-bleed children of the now-frame-less Paper**, so their left/right borders sit
  at the same x (0 and full width) — one continuous vertical line at every scroll position. At a region
  junction neither side adds a horizontal border, so **no double-line and no gap**, pinned or released.
  `CARD_RADIUS` (24) + `corner-shape: squircle` mirror the `MuiPaper.rounded` override so the
  deconstructed corners match the card (kept in step by a comment, not a second literal).
- **No overflow-clip on the regions:** border-radius clips each region's OWN background, and the region
  content is inset, so the corners read clean **without** `overflow: clip` — which is deliberate, because
  the stuck bands (`::after` down-band, `::before` up-band) must extend *beyond* their region.
- **Paper `overflow: clip` RETIRED for the mode → `visible`:** with the radius gone from the Paper its
  only job (corner-clipping) is gone; sticky still escapes to the scroll owner (neither `clip` nor
  `visible` creates a scroll container), the `TableContainer` clips its own horizontal scroll, and the
  bands stay within their regions — nothing overflows the Paper needing a clip. Not left as a mystery.
- `data-beam-sticky-chrome` stays on the Paper — the shell contract is untouched.
- **Chrome wears the page backdrop — via fixed-attachment copies of the shared source, not a color, not
  transparency (2026-09-11).** The ceiling/floor outers **paint a copy of the page backdrop**: the shared
  `pageBackdropSx` (base `background.default` + mesh, `background-attachment: fixed`), the same object
  `body::before` spreads — one source, two consumers. Because the mesh is viewport-fixed, the band draws the
  same function of viewport position as the body backdrop around it, so it reads **seamlessly** (band
  indistinguishable from the section gaps), while the opaque base makes it **occlude** rows.
  - **Transparency was tried and falsified.** Route (a) made the outers transparent to reveal the fixed
    backdrop directly — but a pinned band sits OVER content that transits it: as a row scrolls off, it
    passes through the band region (between the paper inner and the viewport edge) and **ghosted through**
    the transparent band. The fix is opaque-by-composition (paint the backdrop base) + seamless-by-
    construction (fixed attachment). The **StickyChromeFancyBackdrop** story exists as the proof surface for
    exactly this: bands indistinguishable from the gaps AND no ghosting.
  - This still **completes the surface-ownership deconstruction**: the Paper ceded its BORDER to the three
    regions and its BACKGROUND too (`transparent` in sticky mode — pure structure, positioning context +
    `timeline-scope` host). The **rows region (wrapper) owns `background.paper`**; the bucket/footer
    **inners stay opaque paper**. The bands now carry their OWN paint (the backdrop copy) rather than
    relying on transparency past the Paper.
  - **Star finding + plan B.** The Betty star (`body::after`) is a **mask** (`fill='%23000'`, recolored at
    runtime via `--beam-star-color`), not a fixed-attachable background image — it can't be replicated as a
    fixed layer in the bands, so `pageBackdropSx` is base + mesh only. Imperceptible at band height (~a
    section gap). `background-attachment: fixed` has historic mobile-Safari quirks; fine for the desktop
    back-office target. If it ever misbehaves, plan B is a **simplified gradient** (solid center, gradient at
    the margins) — no redesign. See surface-grammar.md.

*Eyeball nuance (bench): verify the side lines are continuous while pinned mid-scroll and at both
extremes; the bucket + footer corners round into the page ceiling/floor; and at rest the three owners
read as ONE coherent card.*

**Two footer fixes (2026-09-12):**
1. The footer inner carries `background.paper` **always** (not stuck-gated) — paper-on-paper at rest
   (invisible), the opacity that stops rows ghosting through when pinned. The stuck-gated bg it
   superseded was removed from `footerStuckSx` (now the up-band only).
2. **White 1px bottom line — root cause: a `border-{edge}: 1px solid` SHORTHAND resets that edge's COLOR
   to `currentColor`** (white on dark) because it lands *after* `SIDE_BORDER`'s `border-color: divider`.
   It was NOT the squircle (hypothesis a — ruled out: colouring the border changed it). Fix uses the
   existing token: **width/style longhands** (`borderBottomStyle`/`borderBottomWidth`) so `divider` stands.
   *Platform edge for the next partial-corner element:* declare the top/bottom edge with longhands, never
   the `border-top`/`border-bottom` shorthand. **The bucket's top edge took the identical fix in the
   header pass (2026-09-12).***
- **Layering:** the scroll-affordance wrapper already establishes a stacking context (`container-type:
  inline-size`), so every rail/accent/edge/expanded z-index is sealed inside it. The pinned bucket +
  footer sit at the Paper level with `z-index: 2` — above the whole wrapper context, no z-index war.
- **Stuck detection + dressing:** JS base (`IntersectionObserver` on 0-height sentinels bracketing the
  chrome → `data-stuck` attr; scroll root found by walking to the nearest `overflow-y: auto` ancestor) +
  a Chrome `@container scroll-state(stuck: top/bottom)` enhancement — same progressive posture as the
  edge gradients, both driving the same dressing. Dressing = paper surface + an occlusion band reusing
  the edge-affordance recipe (`EDGE_TINT` + `EDGE_WIDTH`), rotated horizontal (bucket casts down, footer
  up) — no new token; promote to `derived` if a distinct stuck-elevation recipe emerges.

**Clone type parity — RESOLVED (header pass, 2026-09-12):** the approximation (`13px/600`) is gone. One
exported **`headerCellSx`** (mirrors MUI's `TableCell` head — body2 type + head weight/line-height/color
+ small padding, `nowrap`) is consumed by BOTH the real `th` (in sticky mode) AND the clone cells — a
SHARED SOURCE, so face/baseline/line-breaking match and the measured widths land text on the same line
(no clone-only wraps). Non-sticky grids keep MUI's head defaults (byte-identical).

**Eyeball-tuning candidates (flagged for the bench):** (1) the stuck→unstuck **crossover smoothness**
(clone lands where the real header scrolls under — the #1 thing to watch); (2) the paint-flashing pass
(DevTools) given the Collapse-hover history.

### Header pass (2026-09-12) — ceiling, clone rail, z-index

- **Bucket becomes the page CEILING** (mirror of the footer floor): pins flush at `top: 0`, outer painted
  `background.default`, carrying the donated section gap as its own `padding-top` (`PAGE_SECTION_GAP`);
  inner stays the bordered paper bucket. `STICKY_OFFSET` retired — both edges pin flush now.
- **Gap surgery — the CEILING contract (`stickyChromeGapSx`, exported).** The page's section `Stack` gets
  `spacing={PAGE_SECTION_GAP}` + `sx={stickyChromeGapSx}`. When it directly holds a
  `[data-beam-sticky-chrome]` grid, `:has` collapses the `gap` to 0 and every section except the pre-grid
  one (donated to the ceiling) and the last re-gains it as `margin-bottom` → rest is pixel-identical,
  pinned the bucket sits flush with its ceiling. **Home = the section container's own sx** (a documented
  page pattern via the shared const), NOT a global CSS rule: it mirrors the floor's `main:has(...)` and
  wins on **natural specificity** (the container's own class + `:has` beats its `spacing` gap, no
  `!important` — a global CssBaseline rule loses to the Stack's emotion class at equal specificity).
  `PAGE_SECTION_GAP` (tokens.ts) is the one shared value — Stack spacing, the re-added margin, and the
  bucket ceiling padding all read it. First consumers: the bench + Gaspar transactions (inert until Gaspar
  opts into `stickyChrome`).
- **Top-padding delegation (2026-09-12).** The shell's `main:has(...)` now zeroes its **top** padding too
  (was bottom only), and `stickyChromeGapSx` **re-adopts `CONTENT_TOP` as the Stack's `padding-top`**.
  Padding on the SCROLL OWNER is fixed under a sticky element (an ~80px shelf); moved onto the Stack it
  *scrolls with the content*, so the bucket pins flush at the true viewport top. At rest the top space is
  identical (incl. the nav dock/undock shift) — it just changed owners. (`CONTENT_TOP` = the same shared
  token the shell reads; the bucket's own ceiling padding stays `PAGE_SECTION_GAP` — a distinct gap.)
- **Clone rail — layered (task 3).** `position: sticky` can't hold a rail inside the transform-animated
  track, so the rail is split: a **transparent spacer** in the track (keeps column x-offsets equal to the
  body — both from the same measured widths) + a **static overlay** absolutely pinned at the clone's left
  (opaque paper + the body rail's divider/gradient dressing), columns sliding beneath it. Width = measured
  `cloneWidths[0]` (re-measures on control-composition changes). Its scroll-conditional dressing reads
  `data-overflow-start`, **propagated onto the bucket** by the existing rAF listener (the clone isn't a
  wrapper descendant). The offset is exact by the spacer construction, not tuned.
- **Clone rail — anatomy + parity (last polish, 2026-09-12).**
  - *Geometry:* the overlay is scoped to the CLONE region, not the bucket — `position: relative` on
    `.beam-header-clone` makes it the containing block, so the actions strip (a sibling above) never enters
    the overlay's coordinate space. No strip-height measuring.
  - *Contents:* the overlay mirrors the real HEADER rail cell — the **select-all checkbox** (when
    `selectable`) at the rail's left inset, **wired for real** (`table.getToggle/IsAll…`) so ops gets
    genuine select-all from the pinned header. It's **pointer-only**: `aria-hidden` (the clone is
    presentational; the real thead keeps the semantic control) + non-focusable, so it never duplicates the
    real select-all in the a11y/tab tree; keyboard/AT scroll up to the real header.
  - *Height parity:* the real header row is taller than its text cells (the checkbox drives it), so the
    clone measures the real row **height** too (`cloneHeight`) and matches it (centered cells) — the
    crossover doesn't jump vertically.
- **Style-parity sweep — the caps/meta text layer (closed 2026-09-12).** The real header text is the
  estate's **`meta`** caps voice (uppercase + `0.1em` + `12px`/`300` + `text.secondary`, `lineHeight 1`),
  applied by the theme's `MuiTableCell.head` override (`{ ...meta, paddingTop/Bottom: 12 }`) — NOT MUI
  body2. An earlier `headerCellSx` re-declared body2-ish values (title case, 14px/500) and, worse, was
  spread onto the real `th` in sticky mode, degrading it. **Fixed:** `headerCellSx = { ...meta, py: 1.5,
  px: 2 }` — sourced from the same `meta` (one source, two consumers: the theme override + the clone), so
  "LAST UPDATED" reads identically; and the `th` no longer carries any per-cell override (the theme's
  `meta` stands). Padding mirrors the real head cell (12px vertical + 16px size-small horizontal);
  white-space left at the table default (the `th` doesn't force nowrap), so line-breaking matches at equal
  widths; alignment via `textAlign` (incl. right-aligned Amount). Header-row background (`background.paper`)
  + bottom divider (1px `divider` = `derived.tableBorder`) and the rail overlay's divider/gradient match
  the body.
- **Sort parity (last clone item, 2026-09-12).** Both headers consume ONE shared composition
  (`sortableHeaderContent`) — same `TableSortLabel`, same table state (`column.getIsSorted()`), so icon +
  active/inactive treatment match. **Wired for real** (`getToggleSortingHandler`), **pointer-only** on the
  clone (`tabIndex: -1` under `aria-hidden`), so it never duplicates the real sort control in the a11y/tab
  tree; non-sortable columns stay plain text, no cursor.
  - *Icon SIDE (the residue):* `TableSortLabel` has `flex-direction: inherit`, so a right-aligned column's
    arrow flips to **icon-first** ONLY because the cell sets `flex-direction: row-reverse` — MUI's
    `TableCell align="right"` does that for the th; the clone cell **mirrors it** (`flexDirection:
    'row-reverse'` when `align === 'right'`). So "↓ AMOUNT" reads the same in both. The composition is
    shared; the side is inherited from the cell, matched on both.
  - *Live-sync:* clicking sort in the clone updates the real header's indicator the same frame — the
    header is rendered inline (no `React.memo`), so the sort state change re-renders both. (If it were
    memoised, `sorting` would need to be in its deps — it isn't memoised, so nothing to add.)
  - *Measurement:* `table.getState().sorting` is a re-measure dep, so a width shift from an indicator is
    tracked (belt-and-suspenders — MUI reserves the arrow's space, so width is usually constant).
- **z-index — named, not adjacent magic.** `Z_ACCENT 1 · Z_RAIL_BODY/Z_EDGE/Z_CLONE_RAIL 2 · Z_RAIL_HEADER
  3 · Z_CHROME 4`. The rail/accent/edge live inside the wrapper's stacking context (its `container-type`
  seals them); the pinned chrome sits at the Paper level and is bumped to `Z_CHROME 4` — **above** the
  rail's own z (defense-in-depth if containment ever fails to seal), verified against the expanded-panel
  (no z, sealed in the wrapper) and edge-gradient (`Z_EDGE`, in the wrapper) layers.

**Known caveat (recorded):** on a tall grid mid-scroll, the horizontal **drag-scrollbar** (bottom of the
`TableContainer`) is off-screen below — trackpad/wheel horizontal works throughout, and the clone keeps
orientation; the scrollbar is reachable (adjacent to the released footer) at the true bottom, no overlap.
**Amended 2026-09-13 (Task C):** on sticky grids the bar is now HIDDEN outright, not merely off-screen —
see the cherry batch below.

**NAMED ENDGAME (not built):** restructure so the sticky bucket IS the horizontal scroller (header/body
split, or a CSS-grid table) — retires the clone AND fixes the mid-scroll horizontal-scrollbar reach. The
clone is the bridge to it; this is the parked table-layout question. (Applied-filters summary in the
bucket: also parked, a later installment.)

### stickyChrome hardening pass 2 — pin reachability + snap origin *(2026-09-14)*

- **Snap point 1 → the TRUE page top (scroll 0), not the first section.** The old target was the Stack's
  first child, which sits `CONTENT_TOP` below scroll 0 — so on a hard refresh, proximity yanked the page down
  to it (an initial-snap-on-load jump). `scroll-snap-align: start` now lives on the Stack ITSELF: the shell
  donates its `pt` (`main` pt:0) so the Stack's border-box top is at scroll 0, making 0 a snap position — at
  rest the page is already there, nothing moves without input. Verify: hard refresh at 1440×900, no motion.
- **PIN_REACHABLE — a new engagement term.** A grid shorter than the viewport never scrolls, so its chrome
  pin is never reached; firing exit/snap/thin-scrollbar on it is theatre on a card that behaves plain. So:
  `PIN_REACHABLE ⇔ FIELD_TWIN_HEIGHT·(3 + rowsOnPage) + CONTENT_BOTTOM.md·8 + CHROME_CEILING_BAND ≥ viewport`
  (3 = strip + header + footer). Computed ARITHMETICALLY from **rows-on-page** (`visibleRows.length`), NEVER
  measured element height — so **expanding a row can't toggle engagement** (same row count → same threshold →
  no boundary flicker). Pure px (the `theme.spacing` NaN-under-`cssVariables` gotcha again — `CONTENT_BOTTOM.md·8`,
  not `theme.spacing`); `aboveHeightQuery` (min-height + ε) detects the strict-`>` unreachable case, re-subscribed
  when rows-on-page changes (page-size flip / filter re-evaluate). **`effectiveSticky = stickyChrome && !tooShort
  && !pinReachable`'s negation** — unreachable behaves EXACTLY like tier 3: the attr drops and the `:has()`
  cascade retires exit + snap + scrollbar treatment → plain card, no new layout. (10 → calm card; 500 → engages.)
- **Doctrine dual:** *chrome whose pin is unreachable forfeits its transitions* — the reachability twin of the
  tier doctrine below.

---

### stickyChrome hardening — scroll-snap + tiered disengagement *(2026-09-14)*

Two corner-case passes. **Doctrine:** *chrome that can't leave `MIN_MEANINGFUL_ROWS` (4) rows visible
forfeits its pins, cheapest first.* No literal pixels anywhere — every threshold/offset composes from
existing constants (`CHROME_CEILING_BAND`, `FIELD_TWIN_HEIGHT`, `PAGE_SECTION_GAP`, `CONTENT_BOTTOM`) plus
the one tunable `MIN_MEANINGFUL_ROWS`. Media queries can't read JS, so thresholds are computed in JS and
interpolated into the query strings (`belowHeightQuery`, one strict-`<` −0.02px convention, three consumers).

- **(A) Scroll-snap over the transition zone.** `scroll-snap-type: y proximity` on the page scroller —
  NEVER mandatory (two snap points on a 500-row page would trap mid-row). Scoped via the existing
  `main:has([data-beam-sticky-chrome])` shell contract (and the bench owner), so non-sticky pages are
  untouched. Two targets: snap point 1 = the page's first section (`stickyChromeGapSx` `&>*:first-child`,
  snap-align start); snap point 2 = the grid Paper (snap-align start + `scroll-margin-top:
  CHROME_CEILING_BAND`, collapsing to 0 at tier 2 in step with the ceiling). **Known limitation (recorded,
  not fixed):** proximity's capture radius is UA-defined; if the filter-panel exit range exceeds it, the
  in-between stays reachable — the lever is shortening the exit range, a separate decision. **Bench decision
  rule:** snap-2 must land pixel-identical to a slow-scroll pin; if `scroll-margin-top: 0` wins instead, also
  delete the tier-2 collapse-in-step on the Paper AND the bucket coupling stays (dead sync otherwise).
- **(B) Tiered disengagement — viewport-height tiers, cheapest-pin-first.** Each fires when the viewport
  can no longer fit [what the previous tier keeps pinned] + `MIN_MEANINGFUL_ROWS` rows:
  - T1 = `CHROME_CEILING_BAND + FIELD_TWIN_HEIGHT×(3 + MIN_MEANINGFUL_ROWS) + floor` = **396** → footer
    unsticks (pure CSS on the footer OUTER — the sticky-declaring node, not the inner). Floor =
    `CONTENT_BOTTOM.md · 8` (the MUI spacing base, the same units→px idiom the absorb-margin uses). It is a
    **pure-px module constant** (`SHORT_VP_TIER1`), NOT an in-component `theme.spacing()` computation: under
    this theme's `cssVariables`, `spacing(3)` returns `calc(3 * var(--mui-spacing, 8px))`, so
    `parseFloat` → NaN → `@media (max-height: NaNpx)` — a rule that emits but never matches, which is why the
    first cut of T1 never unstuck the footer (fixed 2026-09-14).
  - T2 = `CHROME_CEILING_BAND + FIELD_TWIN_HEIGHT×(2 + MIN_MEANINGFUL_ROWS)` = **328** → ceiling band
    collapses to 0 (bucket `pt:0`); the pre-grid negative margin reverts to `PAGE_SECTION_GAP` and the snap
    offset collapses in step (pure CSS).
  - T3 = `FIELD_TWIN_HEIGHT×(2 + MIN_MEANINGFUL_ROWS)` = **264** → stickyChrome disengages: a `matchMedia`
    listener (initial state read SYNCHRONOUSLY so a squashed first paint never flashes sticky) sets
    `effectiveSticky = stickyChrome && !tooShort`, which drops `data-beam-sticky-chrome`. That one attr
    removal cascades through the existing `:has()` contracts (shell padding restores, `stickyChromeGapSx`
    deactivates, snap goes with it) → the existing non-sticky path IS the fallback, no new layout.
  - **Why the thresholds can't be per-grid (and the bucket is conservatively strip + header = 2×FIELD_TWIN_HEIGHT):**
    T2 has TWO consumers that must agree — the organism's ceiling collapse AND `stickyChromeGapSx`'s
    margin-collapse (applied by the page). A per-grid T2 (accounting for whether a grid actually has a bulk
    strip) couldn't be matched by the page-level `stickyChromeGapSx` const. So thresholds are shared module
    constants, and the bucket assumes a strip (conservative): a strip-less grid disengages ~44px early —
    only an earlier fall-back to the plain card, safe.
  - **Not state-dependent padding:** growing/shrinking `pt` on a breakpoint would animate a BREACH of
    sticky's constant-geometry contract; the tiers switch *which pins exist*, never the pinned geometry.
- **Bench:** `StickyChromeShortViewport` — three real `<iframe>`s (own viewports; the tiers are
  viewport-based and this Storybook has no viewport addon), 360/300/240px, one per tier, loading the sticky
  bench; verify at page size 10 and 500. **Parked (fence):** the fast-scroll fade hiccup — observe whether
  snap incidentally softens it, report, don't tune.

### Cherry batch — frosted ceiling, exit animation, scrollbars *(2026-09-13, BENCH for A)*

Three cosmetic passes. **A** (frosted ceiling + filter-panel exit) is BENCH-gated — the taste calls
(frost density, exit curve) are eyeballed in Storybook before Gaspar. **B**/**C** (scrollbars) build direct.

- **Logo clearance — the CONSTANT band height, pinned at top: 0 (A1, final 2026-09-14).** The bucket pins at
  `top: 0` ALWAYS — sticky's contract is CONSTANT geometry through the pin, so the card sits a fixed distance
  below the bucket top at every scroll position: **no jump**. Logo clearance is the BAND HEIGHT, not a pin
  offset: the ceiling `pt` is a constant `CHROME_CEILING_BAND` (tokens.ts = `LOGO_BAR_HEIGHT 56` + an 8px
  breath = 64), so the card clears the floating brand strip. The extra height over the section gap is
  absorbed AT REST by the pre-grid section's **negative margin** in `stickyChromeGapSx` (`PAGE_SECTION_GAP −
  CHROME_CEILING_BAND` = −40px → visible rest gap = −40 + 64 = 24, pixel-identical). The budget is
  `PAGE_SECTION_GAP`, NOT `CONTENT_TOP` (whose nav dock/undock duty disqualifies it; and md's 80 < the 88
  it'd need). `LOGO_BAR_HEIGHT` is the ONE source with the shell's `STRIP_HEIGHT` (AppShell imports it).
  Sentinel `rootMargin` is plain `0px` again (flush pin). *Edge case:* a sticky grid with NO preceding
  section has no negative margin to absorb the extra 40px, so its top gap is ~40px larger — acceptable, no
  preceding seam to preserve there.
  - *Why a constant band + negative margin, not state-dependent padding:* growing `pt` on `data-stuck` would
    settle the card (and the header clone) down 40px on every pin — animating a BREACH of sticky's constant-
    geometry contract. The constant band keeps the card continuous; only the PAINT toggles (below).
- **Ceiling paint — opaque page, stuck-gated opacity FADE (A2, final 2026-09-14).** The band is opaque page,
  NOT glass — rows can NEVER ghost through (the grid's containment story wins), and the EXIT ANIMATION alone
  carries the effect (the exiting section fades under an opaque page band). But because the constant band
  overlaps the pre-grid section at rest (the negative margin), it can't paint opaque there — so `ceilingPaintSx`
  is a `::before` carrying `pageBackdropSx` at `opacity: 0`, fading to `1` only when stuck (`data-stuck` +
  `@container scroll-state(stuck: top)`). Since it paints the FIXED-attachment backdrop, the fade lands on
  identical pixels wherever only backdrop is behind; where the exiting panel is still behind, it cross-
  dissolves with the panel's exit — a paint transition, never a layout shift. The outer is `pointer-events:
  none` (so the transparent-at-rest band doesn't eat clicks on the overlapped section); the inner re-enables
  `auto`. **Frost was tried twice and RETIRED** (transparent ceiling → rows ghosted; then a glass sheen over
  an opaque base → the containment ruling: the ceiling never exposes rows). `ceilingFrostSx`, `CHROME_TOP_OFFSET`,
  and the `--beam-chrome-frost-*` tokens are all gone — `CHROME_TOP_OFFSET` repurposed as `CHROME_CEILING_BAND`.
- **Filter-panel exit (A3).** New exported `stickyChromeExitSx` (mirror of `stickyChromeGapSx`), spread onto
  a page section above the grid: it scales (0.96) + fades + lifts (-8px) as it slides under the bucket. A
  `view()` scroll-progress timeline over `animation-range: exit`, inset by `view(block var(--beam-bucket-height) auto)`
  so the exit line is the CHROME edge, not the viewport top. The grid PUBLISHES `--beam-bucket-height` (RO-
  measured, never assumed — the rail-width precedent) onto the SCROLL PARENT, where the sibling panel reads
  it. Keyframes `beam-panel-exit` live in the theme. **Progressive + reduced-motion:** the helper is
  `@supports (animation-timeline: view())`-gated (Chrome-family; elsewhere the panel just scrolls under) and
  nested under `prefers-reduced-motion: no-preference` (reduced motion disables the scale/fade; the frost,
  being static, stays). A4/A5 satisfied by construction.
- **Scrollbar theming, estate-wide (B).** createBeamTheme MuiCssBaseline: the `*::-webkit-scrollbar` suite
  (radius, a padding-box inset for a floating-pill thumb) for Chromium + a GATED standard `scrollbar-color`
  on `body` for Firefox (see the gotcha). Resting thumb/track vars mix `text-primary`, so they're
  scheme-invariant (light thumb on dark, dark on light); `--beam-scrollbar-track` is transparent (reads as
  the surface, not a rail) and resolves on `:root` in every scope (app `main` AND the Storybook preview —
  both render `<CssBaseline/>` and establish `data-beam-mode`). All four apps inherit; no per-app overrides.
- **GOTCHA — standard scrollbar props and webkit scrollbar pseudos are MUTUALLY EXCLUSIVE per scroller in
  Chromium ≥121 (never ship both unguarded; alongside the `theme.spacing`-NaN gotcha).** Chromium ≥121
  disables ALL `::-webkit-scrollbar-*` styling on any scroller whose *computed* (inheritance counts!)
  `scrollbar-color`/`scrollbar-width` is non-auto. We shipped both: the standard `scrollbar-color` on `body`
  cascaded to `main` and killed the logo-gradient thumb on the app (the bench looked fine — a red herring;
  both scopes actually load CssBaseline, so both were affected, the gate is what makes it reliable). **Fix:**
  wrap the standard props in `@supports not selector(::-webkit-scrollbar) { … }` — they apply ONLY where the
  webkit pseudos don't exist (Firefox); Chromium fails the `@supports`, never sees them, and uses the webkit
  suite exclusively. Webkit pseudos stay ungated (they just don't match on Firefox). One model per engine, by
  construction. Same gate on the grid `TableContainer`'s `scrollbar-width` (thin / none). Firefox smoke: a
  flat themed scrollbar via the gated standard props — that path must survive.
- **Thumb hover/active states (B, 2026-09-13; ref: DigitalOcean's scrollbar hover pattern).** The webkit
  thumb gains `:hover` = the brand LOGO GRADIENT and `:active` = a step brighter (that gradient under a white
  wash). Parity doctrine: the gradient is consumed from its ONE source — `logoGradient()` → the
  `--beam-logo-stop-*` slots (already per-product, per-scheme via `logoStopVars`/`gradientSeeds`) — not a
  re-declared approximation, so the thumb lights up in each product's own gradient (mechanism = the token,
  value = the product's). `logoGradient(direction?)` gained a direction param: the DEFAULT (115deg) is
  byte-identical so the logo's own rendering is untouched, and the vertical thumb passes `to bottom` so the
  stops sweep ALONG its long axis (visible at ~8px width; the 115deg diagonal would barely read). A future
  horizontal thumb passes `to right`. `background` shorthand resets background-clip, so the padding-box inset
  is re-declared on each state. **Graceful asymmetry:** Firefox's `scrollbar-color` can't take a gradient and
  has no hover state, so there it holds the solid resting tone — noted, not fought.
- **Hidden horizontal bar on sticky grids — DELIBERATE INTERIM (C).** On `stickyChrome` grids the
  `TableContainer`'s bar is hidden (`scrollbar-width: none` + `::-webkit-scrollbar { display:none }`), gated
  on `stickyChrome` only. Rationale: the grid grows to content height, so the horizontal bar would float
  mid-page, detached from any card edge — worse than absent. Affordance carried by the edge gradients + the
  header clone's live tracking + trackpad/keyboard gestures. **Keyboard panning survives** (hiding the visual
  bar doesn't remove scroll behavior — focus a cell + arrow keys still pan). The footer-proxy scrollbar (or
  the NAMED ENDGAME above) remains the real fix.

## Column manager — pointer drag-and-drop reorder *(2026-09-10)*

The manager's reorder gained a **pointer drag handle** alongside the existing ▲/▼ arrows (which stay —
they're the keyboard/AT path). Deferred at v1 deliberately (no dependency); live meeting usage
(reordering with stakeholders) now justifies it.

- **Hand-rolled on Pointer Events, no dnd-kit.** A simple ~14-row vertical list doesn't earn a
  ~10–13 KB-gz dependency added to the shared system, and dnd-kit's headline value — its a11y
  (keyboard sensor + live-region announcer) — we already have in the arrows. So the drag is a pure
  pointer enhancement.
- **Honest a11y:** the handle (`DragIndicator`) is pointer-only — `aria-hidden`, non-focusable,
  `touch-action: none`. AT users reorder with the arrows (`aria-label="Move X up/down"`); we don't
  ship a half-built ARIA drag.
- **No path divergence:** the drag commits through a new `onReorder(id, toIndex)` → `reorderColumn`
  in the organism, which does an array-move and calls the SAME `onColumnOrderChange` the arrows'
  `moveColumn` uses. Persist / merge / ≥1-visible rules are untouched (order ≠ visibility, ≠ input
  method). Catalog ("awaiting data") rows are non-draggable, in their own list below the divider.
- **Drop indicator:** a 2px `primary.main` insertion line, absolutely positioned within the
  (`position: relative`) reorderable list at the target boundary's `offsetTop` — no layout shift, no
  reflow of the rows under the pointer. The dragged row dims to 0.4.

## Menu (options-bearing) actions — bulk + row *(2026-09-10)*

An action can now carry a **menu of options** (first use: Export → JSON/CSV/PDF/Excel). Additive,
back-compat, action-as-data.

- **Bulk (`BeamBulkAction.options?: BeamActionOption[]`, `{id,label}`).** With `options`, the batch
  button becomes a **menu trigger** (▾) instead of a direct fire; selecting an option fires
  `onBulkAction(actionId, selectedIds, optionId)`. The organism owns the selection, so the handler is
  **centralized** and keyed by `optionId` (the third arg is optional — existing consumers unchanged).
  Options-actions **skip the button-level confirm** — fine for export; a destructive menu option would
  want per-option confirm, a **future addition** (recorded, not built).
- **Row (`BeamRowAction` is now a DISCRIMINATED UNION).** Flat `{ onSelect, options?: never }` XOR menu
  `{ options: {id,label,onSelect}[], onSelect?: never }` — an action with neither/both is
  unrepresentable (grammar as types, the BeamBadge lesson). The row is closure-captured, so each option
  carries its **own `onSelect`** (distributed, mirroring the flat action). `ActionMenu` renders a menu
  action as a **submenu** (chevron → nested Menu); the expanded-row `RowActionBar` renders it as a small
  anchored menu — one definition, both projections, can't drift (grammar §3).
- **Asymmetry, deliberate:** bulk centralizes (`onBulkAction(…, optionId)`) because the organism owns
  selection; row distributes (per-option `onSelect`) because the page owns the row closure.

## Row severity accent — `rowAccent` *(2026-09-09)*

A thin colored bar at a row's **leading edge** (rail cell `left:0`, 3px), redundant reinforcement of the
row's status chip — the chip names the state, the accent *locates* the row (state-rendering-grammar's
spatial-accents note). Additive, opt-in.

- **API:** `rowAccent?: (row) => BeamBadgeHue | undefined` — hue-typed (grammar vocabulary); the page
  maps status → hue. Color from the theme semantic palette (`danger→error.main`, …), no literals.
  First consumer: Gaspar transactions, `failed → 'danger'`.
- **Status-truth, not scroll-conditional:** an unconditional rail-cell child, visible at every scroll
  position — deliberately does NOT ride the scroll-state divider/gradient (those are scroll-conditional
  and live at the rail's *right* edge; the accent is on the *left*, zero interplay).
- **Decorative:** `aria-hidden`, `pointer-events:none` — keyboard/AT unaffected. Byte-identical when a
  row returns `undefined` or `rowAccent` is omitted (the accent element simply isn't rendered).
- **Placement pick:** leading edge chosen by eye over a rail-right-edge variant (which coexisted with
  the scroll gradient) — leading is the conventional "locate this row" stripe, calmest, no
  mechanism-sharing. (The temporary `accentPlacement` prop used for the pick was removed.)

**Recorded limits (v1, not solved — fenced):**
- **Detail/expanded rows carry no accent** — they have no rail cell since the `ed0e71b` revert (tied to
  the parked compositing bug, see the parked-bug note). Accent continuity down an expanded row comes
  free once that's structurally fixed.
- **Rail-less grids get no accent** — the accent requires the rail in v1; a rail-less fallback is a
  future decision, not built.

> Status/state cells rendered in the grid (`BeamStatusBadge`, page-local `TxBadge`, `BeamBool`, the
> column-manager's "awaiting data" ledger) follow [/docs/state-rendering-grammar.md](../../../docs/state-rendering-grammar.md)
> (evidence: [/docs/status-grammar-audit.md](../../../docs/status-grammar-audit.md)). Phase-3
> reconciliation is separately gated — not triggered by these notes.

## PARKED BUG — stale paint on expanded rows at rail width *(2026-09-09)*

**Status: open, deliberately parked.** A structural fix was built and **reverted** (commit `ed0e71b`,
reverted by `e9f71a3`) because it caused a visual regression; we chose the known cosmetic bug over the
regression for now. This note is so the next attempt starts warm — the day this was parked belonged to
advanced filters.

**Symptom.** Expand/collapse translates the detail row's geometry while the sticky rail column overlaps
it; a region **exactly rail-width wide** at the left of the expanded panel paints stale — an
unconditional debug border proves it (border paints, then visually clips to rail width once the Collapse
settles). **Computed styles stay correct while the pixels are wrong** — a classic missed-invalidation of
the overlapped region. **Any repaint clears it** (hovering a row below, a node screenshot, devtools
paint-flash). Root cause: sticky rail layers + animated Collapse height ⇒ the compositor never
invalidates the rail-width slice of the detail cell. (Distinct from the 2026-09-08 stale-`:hover` fix,
which is real and stays — see below.)

**Fix attempted and why reverted.** Give the detail row its own rail cell (empty, same `railStickySx`)
so the rail column is a continuous sticky layer top-to-bottom, and shrink the content cell to the data
columns with the panel offset by a measured `--beam-rail-width`. It did resolve the paint bug, but the
result read as a **visual regression** vs. the full-width `100cqw` pinned panel we want for now — so it
was reverted. Current (shipped) state: detail row is a single `colSpan` cell, panel `position: sticky;
left: 0; width: 100cqw`.

**Leads for next time.**
- **`width` is ignored on `display: table-row`/`table-cell` boxes' participation** — the panel can't be
  authoritatively sized while it's part of table layout, which is why the reverted fix needed a measured
  rail-width var and still fought the layout. Sizing a pinned panel inside a `<table>` is the crux.
- **Candidate real fixes:** (a) take the detail panel **out of table layout entirely** — a positioned
  overlay (absolute/fixed to the scroll wrapper) that isn't a table descendant, so its paint layer is
  self-contained and its width is free; or (b) the grid **moves off `<table>` layout** (CSS grid /
  flex rows), which dissolves both this bug and the width-ignored constraint.
- **Simplify the two-container setup when touched next.** The `inline-size` wrapper (for `100cqw`) +
  the `scroll-state` scroller are two nested containers doing subtly different jobs; that subtlety is
  part of why the paint invalidation is fragile. Consolidating or clarifying them is worth doing
  alongside the real fix.
- **Last-resort escape hatch:** promote the detail cell to its own paint layer (`will-change: transform`
  scoped to detail rows) to make invalidation self-contained — a compositor hint, not a real fix, and
  only if the layout approaches above stall.


## Fix — stale `:hover` on rows after a Collapse animation *(2026-09-08)*

Expanding/collapsing a row translates the rows below under a stationary cursor; browsers only recompute
`:hover` on pointermove, not on layout change, so a row would latch the hover tint and keep it until the
next move. Fix: while any `renderExpanded` Collapse animates, drop `pointer-events` on the `<TableBody>`
so no row can pick up hover during the geometry change — driven by the Collapse's `onEnter`/`onExit`
(start) and `onEntered`/`onExited` (end), **not timers**. A counter (`animatingCount`), not a boolean,
so overlapping expand/collapse compose. Hover resumes correctly on the next real pointermove. (The
detail `<tr>` already carries no `hover`; left a comment making that intentional.)

## Scroll-behavior — pinned expanded panel + edge shadows *(2026-09-08, density installment #2)*

Two scroll affordances on the horizontal scroll area. No sticky headers (out of scope).

- **Expanded panel pins to the visible width, not the row.** The `renderExpanded` panel used to live in
  the `colSpan` cell and scroll sideways with the columns. It now sits in a `position: sticky; left: 0;
  width: 100cqw` wrapper. `100cqw` resolves to a new **container-query wrapper** (`container-type:
  inline-size`) around the scroll container — the *visible* scroll-area width, independent of the
  scroller's `scroll-state` support. So the timeline + its action bar never scroll sideways, at any
  scroll position or viewport. Chose container-query units over a measured width for a pure-CSS
  solution on Baseline; `ResizeObserver`-measured width stays the break-glass fallback (not needed —
  `inline-size` containment did not disturb the table layout; verified at build).
- **Scroll-aware edge shadows.** Both edges share the SAME soft gradient (shared `EDGE_WIDTH`,
  `--beam-edge-shadow` tint), fading away from the edge, so they read as siblings. The RIGHT is an
  absolute `pointer-events:none` overlay at the scroll area's right edge (leftward-fading). The LEFT
  carries TWO layers on the rail cell, doing different jobs and appearing together: a **`::before` 1px
  divider** (theme `divider` token) that defines the rail *boundary*, plus the **`::after` gradient**
  at `left: 100%` (rightward-fading) signalling the *occlusion*. Both left layers anchor to the rail's
  *actual* right edge (`right:0` / `left:100%`), tracking the rail width as controls change it — no
  hardcoded offset. Visibility unchanged:
  LEFT via `@container scroll-state(scrollable: inline-start)` + `data-overflow-start` fallback; RIGHT
  via `data-overflow-end`. Both attributes are set on the wrapper by a passive, rAF-throttled
  scroll+resize listener (un-gated so it always runs — the right overlay can't be a `scroll-state`
  descendant, so it has no pure-CSS path). Shadows appear only while scrollable in that direction and
  vanish at the edges; a grid with no horizontal overflow shows **none, ever**.
- **Compat / posture:** the pinned panel is all-modern-browser (container queries, Baseline 2023). The
  shadows are **progressive affordance** — scroll-state gives the left shadow pure-CSS on Chrome, the
  rAF listener covers every browser for both edges; graceful absence only with JS disabled, accepted.
- **Token:** both edges draw from **`derived.edgeShadow`** (emitted as `--beam-edge-shadow`) — a
  mode-agnostic `color-mix(... common.black 22% ...)`; **retired the hardcoded `RAIL_SCROLLED_SHADOW`
  literal.** Sticky headers (a later installment) will draw from the same token.

## Layout pass — bulk strip inside the surface, manager trigger to the footer *(2026-09-08)*

Two moves; blast radius is Gaspar transactions + two stories (the repo-wide inventory found **no**
Sunlight/midnight grid passes `selectable`/`columnManager`/`bulkActions`).

- **Bulk-actions strip moved INSIDE the grid's `Paper`, as the top section** (was an unboxed strip on
  the page background above the surface). Now a bordered top region (`px:2`, `minHeight:48`,
  `borderBottom`) — the Section-sectioning *pattern* (DetailsPanel/PrizeWall precedent), applied
  without adopting the component (see the future task below).
- **Column-manager trigger relocated to the FOOTER, leftmost**, with the aria-live selection count
  immediately to its right; rows-per-page + range + pagination stay right. aria-live preserved across
  the move. The footer's left cluster renders only when `selectable || columnManager`; everyone else
  keeps the **bare `paginationEl`** path → byte-identical.
- **Density installment #1 — empty-toolbar elimination.** With the trigger gone, the top toolbar
  renders only for `searchable`. A grid with `searchable=false` (Gaspar transactions) now renders **no
  top toolbar at all**, reclaiming the dense toolbar row (~48px). This is the first concrete move of
  the density topic; further density/sticky work is out of scope until picked up deliberately.

**Future doctrine task (own task, own gate):** *grid surface → a shared surface primitive, or an
always-bordered / full-bleed / multi-region Section variant.* Today the grid uses raw
`Paper variant="outlined"`. Section was **not** adopted here because its border is a semantic — the
editability border (transparent until the surface holds an input) — whereas a grid must be
always-outlined; adopting it without an API extension would ship a regression as a swap.

## Batch-actions surface — eligibility + confirm + selection-aware factory *(2026-09-08)*

Brought the bulk-actions surface up to the **ActionMenu doctrine** the row kebab already followed
(actions computed against their subject; disable-with-a-reason, never silently hide). All additive,
opt-in, back-compat — the only consumers were two stories.

- **`BeamBulkAction` gained `disabled?`, `disabledReason?`, `confirm?`.** `disabled` adds page-computed
  eligibility on top of the always-on zero-selection disable; `disabledReason` shows as a tooltip when
  disabled (the doctrine `BeamRowAction` already has). `confirm` requests a confirm for a
  **non-destructive** action (destructive already auto-confirms) — the surface confirms when
  `a.confirm || a.destructive`, so existing destructive consumers are unchanged.
- **`bulkActions` grew to `BeamBulkAction[] | ((selectedRows: Row[]) => BeamBulkAction[])`** (Option C).
  The factory mirrors `rowActions: (row) => …` — it's resolved with the actual selected `Row` objects
  (`table.getSelectedRowModel().rows.map(r => r.original)`), so a page can compute `disabled`/reason
  against the **live selection** while the organism stays the single owner of selection state. The
  rejected alternative (an `onRowSelectionChange` callback + page-mirrored selection) was the
  parallel-state smell. Back-compat: an array is used as-is.

**Queued organism decision — a styled confirm surface.** The surface still uses `window.confirm`
(reused, not a new dialog, to avoid scope creep and the estate's no-dialogs lean). The native confirm
will read **visually off-brand in live demos** — that observation is exactly what should drive (or
not drive) promoting a styled confirm surface into the organism. Not built; logged here so the
decision is made on evidence.

*Inherited behavior worth watching:* the surface calls `resetRowSelection()` after every bulk action,
so selection clears after Export too ("export-then-act re-selection"). Accepted as-is; flagged as a
usage question in the first consumer's notes (Gaspar transactions).
