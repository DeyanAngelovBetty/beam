# Detail Page Grammar — read calmly, edit deliberately

*Distilled from the User deep-page design round (2026-07-23/24), supersedes the
`detail-page-decisions.md` staging draft. Visual companion: **User – View**
([frame →](https://www.figma.com/design/9yNbolohxGitkMJKDjoyKG/Beam--MUI-v9-?node-id=12306-4677))
and **User – Edit**
([frame →](https://www.figma.com/design/9yNbolohxGitkMJKDjoyKG/Beam--MUI-v9-?node-id=12306-16819))
in the Beam file. The goal, same as the list grammar: every detail page answers
"what am I looking at, what state is it in, and how do I change it" the same way,
so deep pages become assembly, not design.*

---

## 1. Surface grammar — border = nature, not state

**"A border invites interaction; its absence promises calm."** Three clauses:

1. **Raised + read-only → borderless.** A container with a background distinct
   from the page (`Paper`) holding only non-interactive content — text, lists,
   stats — carries **no border**. Separation comes from spacing and surface
   contrast (`screen` vs `overlay`), never rules.
2. **Raised + interactive → bordered.** The same kind of container holding
   interactive content — a datagrid, form fields, a filter bar, a checklist —
   carries a **border**. Interactive *by nature* is the test, not interactive
   right now: a datagrid that sorts/selects is bordered even when its data is
   read-only.
3. **Not raised → exempt.** Elements without a distinct background (page header,
   section headers) are outside the rule entirely.

Border presence is **static per surface/mode** — it never signals dirty/pending
state. Dirty state belongs to the CTA and the page-header actions (§4).

- **Constant-geometry border for mode-switching surfaces** *(2026-07-28):* a
  surface that is bordered in ANY mode carries its border in EVERY mode; calm
  modes render it `transparent`. Border PRESENCE is constant geometry; border
  VISIBILITY is the mode signal. This refines what "borderless" means for a
  surface that flips view↔edit (ItemBox, the roles rail, the stats/form Paper):
  **invisible, not absent** — the three clauses above are unchanged. Rationale:
  auto height = content + padding + border regardless of box-sizing, so a 1px
  border appearing/disappearing shifts every child on every mode switch; a
  transparent-but-present border holds the skeleton so the flip moves zero
  pixels, only color.
- **Skeleton-constancy family.** The same principle runs through Beam: the
  hidden-but-space-preserved header checkbox, and now the constant border.
  Geometry stays put across a state/mode change; only the *fill* of a reserved
  slot changes. Reserve the space, signal with what fills it.

- ✅ This blesses shipped reality: the datagrid stays bordered.
- ⚠️ **Code amendment queued (in flight):** `BeamFilterBar` border becomes
  constant (it is an interactive surface); applied-state = filled Filter CTA only.
- 📌 **Queued refinement — border, second derived variant.** Row separators
  inside boxes want to read *quieter* than the container/header border, so the
  header row stays distinguishable. The Figma exploration does this with a
  manually detached value (container/header at `derived.tableBorder` ≈ 0.42α;
  rows ≈ 0.2α). Deliberately **not** implemented yet: code uses the single
  existing `derived.tableBorder` everywhere until we add a `tableBorderQuiet`
  (name TBD) formula in the derived lane and re-bind the Figma rows to its baked
  snapshot. Do not hardcode the detached rgba anywhere.

## 2. The spine motif

A left vertical rule as Beam's recurring mark, bridging view ↔ edit: a stat and
an input share a skeleton, so the mode switch reads as *"same thing, now
editable."*

- Division of labor: **border = the container's nature · spine = the field's
  state/severity.**
- `BeamStat` gains `severity?: 'warning' | 'error'` (`danger` retired 2026-08-25).
  Severity is **never color-alone** — spine color always pairs with a second cue
  (icon or weight), per WCAG 1.4.1.
- **Spine gets its own semantic tokens** rather than borrowing:
  `spine/default` (today: aliases the table-border seed), `spine/warning`,
  `spine/error` (from the semantic seeds), living in the derived lane with
  baked snapshots for Figma. Rationale: the day table borders get tuned, spines
  must not silently retune with them.
- The role-colored tick in the roles rail and on permission rows (§5–6) is the
  spine motif at its smallest — same pigment system as provenance.

*Amended 2026-08-25 — **field twins** (BeamStat v2, Figma-ratified).* The view↔edit skeleton is now
an explicit, shared geometry, not an accident of typography:

- **The 44px floor.** One datum (`FIELD_GEOMETRY`, tokens.ts) both twins consume, so they can't
  drift: `height 44 = padY 6 + label 12 + gap 2 + value 18 + padY 6`. A multiline value grows by
  18/line (3-line = 80). The **edit twin** (outlined field) has no internal label row — its label is
  the notch — and the outlined border is an **overlay** (not in the input box), so 1 line = padY 13
  + value 18 + padY 13 = 44, the same floor.

  *Implementation knobs (where the geometry lives — recorded so nobody re-fights it):*
  - Single-line + Select height/padding/line-height: `MuiOutlinedInput.styleOverrides.input`, the
    **ownerState function** branch (MUI v9 dropped the `inputSizeSmall`/`inputMultiline` element
    classes — a class-selector override is a silent no-op).
  - Single-line needs an explicit `height: 18` — MUI's `height: 1.4375em` (23px) on the `<input>`
    otherwise wins over line-height on a content-box element.
  - **Select's height floor lives in `MuiSelect.styleOverrides.select`, NOT MuiOutlinedInput.**
    `SelectInput` sets its own `min-height: 1.4375em`; an OutlinedInput-slot `minHeight` is equal
    specificity but injects earlier and LOSES. The `select` slot is the winning class — an
    injection-order lesson, deterministic, no specificity games.
  - Multiline line-height rides the `input` class so TextareaAutosize's hidden shadow (which shares
    the visible textarea's className) measures rows at 18, not MUI's default 23.
  - Resting/notch label Y offsets are bench-tune values (Deyan).
- **Morph in place.** The same grammatical slot morphs: **label persists** (voice + position),
  **value ↔ input swaps**, **heights equal per row** (44 floor; multiline pairs by line count).
  Caption pairs with helper text, or is omitted in morphing contexts.
- **Spine is VIEW-ONLY.** In edit mode, severity maps to the field's **native error/warning
  states**, not the spine — a field already has a state channel; the spine is the view's.
- **Boolean convention + one fill principle.** A boolean value renders an icon pair (view:
  CheckCircle filled / Cancel outlined; edit: `BeamSwitchField`). Across icon families, **fill marks
  the family's notable state** — severity (WarningAmber outlined → Error filled), boolean (true
  filled). `severity` (`'warning' | 'error'`; `danger` retired) stays the ONLY alarm channel — never
  inferred from a boolean. (v2 also dropped `tone`: there is no positive/neutral tint channel.)
  - *Extended from BeamStat to TABLE CELLS, 2026-09-01.* The ruling was written for the BeamStat
    value slot; it governs any boolean cell. Boolean **table** columns render the same pair via the
    exported `BeamBool` (not a bespoke check/cross). First applied: the Perks matrix
    (`PerksPage`) — its old green-✓ / **red-✗** cells (colour reading as alarm) became `BeamBool`:
    CheckCircle filled / Cancel outlined, colour = yes/no and fill = emphasis, **not** an alarm.
    This answers the page's parked "red-✗ question" by doctrine rather than a per-page call.

*Convergence note.* Sunlight and Gaspar currently **diverge** on view↔edit treatment; this amendment
is the estate ruling they converge to — converging existing pages is FOLLOW-UP, not the ratifying
commit. Known divergence queue: Sunlight `LoyaltyStatusEditor` main edit fields are **medium**
(≈56px), so they don't pair with the 44px view — switch them to `size="small"`. (Gaspar rule-builder
inspector already uses small fields → auto-inherits the 44px twin.)

*Amended 2026-08-26 — **the details panel** (`DetailsPanel`, Figma-ratified node 12743:68281).*
The **FIRST content region below the page header is an unlabeled boxed field panel**: a Paper of the
field twins — **stats in view, form fields in edit, morphing in place** per the field-twins rule
above. Geometry: **24px padding-block · 2-spacing padding-inline** (the spacing var literally, so it
rides ThemeLab and lands the text column on the datagrid cell-text scan line), 24px gutters, items
top-aligned, rows sized by their tallest member, booleans inline as peers.

- **It needs no title — the position IS the convention.** *One title per page:* the page title (in
  `BeamPageHeader`) is the title; the details panel never adds a heading. (This retires the
  "Status fields" / "Request details" sub-headings that led earlier panels.)
- **Container: elevated Paper, MODE-SCOPED border** *(ratified 2026-08-27; supersedes the same-day
  "no border" ruling below — the trail keeps both; fast supersession after a visual pass is the
  process working, not churn).* **View = borderless** (the spines carry the read; a frame is noise).
  **Edit = a quiet 1px divider frame** marking the active region. The strokes-inside-strokes concern
  is resolved by WEIGHT HIERARCHY: the container divider is quiet, the input outlines strong. The
  border is CONSTANT geometry — always 1px, transparent in view → `divider` in edit, colour-only
  transition — so no twin moves a pixel on the switch. Mode is STRUCTURAL, not a prop: the panel is
  *bordered when it contains fields* (`:has(.MuiInputBase-root)`). *(This restores the idea behind
  UserPage's earlier `modeBorder`, now estate-wide.)*
  - *Superseded 2026-08-27 — the original ratification:* elevated Paper, NO border in either mode,
    on the strokes-inside-strokes argument. The visual pass on the five converged pages showed edit
    wanted the active-region frame after all; weight hierarchy (not absence) is what keeps it calm.
- **The slot is POSITIONAL, its filling depends on the page.** An **editable** object fills it with
  `DetailsPanel` (the field twins). A **read-only** record page fills the same slot with its
  **reading instrument** instead (e.g. the CR detail page's `KeyValuePanel`) — do not force a reading
  panel into `DetailsPanel`. Position is the rule; the instrument follows the page's nature.
- **No buttons in the panel.** Edit / Save / Cancel stay in the header actions slot (§4); the panel
  owns layout, the page owns mode.
- **Mixed content is normal.** A non-editable value **REMAINS a stat** while its neighbours morph to
  fields — no mode-wide swap. A field that is editable but currently locked renders as a **disabled
  field** in edit (not a stat).
- **No dimming for non-editable stats among fields** *(ratified 2026-08-27).* The twin geometry IS
  the affordance — **boxed = type here, spined = read** — so a stat beside fields needs no dim/tint.
  A LEAN UNDER TEST, not a shrug: revisit only on user evidence.
- **The region slots**, top to bottom: `[page header] · [page-level alert when present] · [details
  panel] · [rest]`. The page-level alert (approval-flow) sits above the panel, below the header.
- **Subsequent sections** (rules, rows, reward tables, …) are **unchanged this round** — whether
  they keep their own titles once the details panel drops its own is an **OPEN question, noted, not
  ruled**.

*Amended 2026-09-01 — **the mode mechanic generalizes beyond view↔edit** (first non-edit use:
Loyalty Levels A/B-test config).* Everything above describes view↔edit, but the grammar is really a
**MODE** grammar, not an edit one. A **feature mode** — a page entering a distinct configuration
state that is not "editing this record" — reuses the SAME mechanics:

- **Header action swap, constant geometry.** The `BeamPageHeader` actions node swaps for the mode
  ([A/B Test] [Export] [Import] → [Cancel] [Submit for A/B Test]); the header's fixed rows mean no
  layout jump. Only the actions node changes — the mode-swap promise the edit case already makes.
- **A `DetailsPanel` in edit mode carries the mode's fields**, mode border and all — here the
  test-level fields (Parity Type, Start Date) as 44px field twins (the edit half; there is no
  view-half on this page, they exist only while configuring a test).
- **Cancel / Submit pair** closes the mode (Submit's verb depends on whether the mode acts directly
  or via maker-checker — see open item (4)).
- **The body may legitimately restructure** across a feature mode (tabs appear, Export/Import move to
  tab level) — that is the mode, not a geometry break. The constant-geometry promise is about the
  **header**, not the body.

*First applied:* `LoyaltyLevelsPage` — default mode is the one live scheme (no tabs, the 90% case);
"A/B Test" enters the mode (tabs + a test-config `DetailsPanel` above them). The A/B fields sit
**above the tabs** (they describe the TEST, not Scheme B) — a deliberate divergence from Midnight,
which buries them in the Scheme-B edit dialog.

**Open items — logged, NOT solved in this pass:**
1. **THE BIG ONE — a *submitted* A/B test is persistent state, not this ephemeral mode.** What does
   the page show while a test is RUNNING? Likely a THIRD state (tabs + read-only test fields +
   stop/promote action), distinct from both default and the config mode. Needs Radi / Alex.
2. **Test-end lifecycle.** Start Date exists; there is no end mechanism — manual stop?
   promote-winner? Needs Radi.
3. **Data model.** Are **Parity Type / Start Date** test-level fields or Scheme-B fields? Our
   placement (above the tabs) assumes **test-level**. And **which scheme is "live"** is itself
   backend-owned state — the demo hardcodes `LIVE_SCHEME = 'A'`. The whole data-model question in one
   place for Tzeno.
4. **Does 'Submit for A/B Test' go through maker-checker** (like other loyalty changes) or act
   directly? This also settles the verb: **[Submit for A/B Test]** (shipped) reads right if it goes
   through maker-checker; **[Start A/B Test]** reads truer if it acts directly.
5. **Import into a scheme while a test is running — allowed?**

## Drill-down flows — entities get pages *(ratified 2026-09-02, team buy-in Radi)*

The Prize Wall / token-campaign flow moves from Midnight's stacked dialogs to Beam-style **multi-level
drill-down PAGES**. The rulings:

- **Entities get pages, never dialogs.** Any CRUD-able noun is a ROUTE — its own URL + breadcrumb.
  **Dialogs are for CONFIRMATIONS only** (are-you-sure, per ConfirmDialog doctrine), never for editing
  an entity. (Supersedes Midnight's stacked-dialog editing for anything that ports here.)
- **Drill vs inline.** **DRILL DOWN** (a child gets its own page) when the child **contains lists of
  its own**; **edit INLINE** (rows in the parent) when the child is a **leaf**. Applied to token
  campaigns:
  - **WallStage → DRILL** (it holds `openingWindows[]` + `rewardItems[]`) — its own page.
  - **OpeningWindow → INLINE rows** (a leaf: openDate / endDate).
  - **RewardItem → INLINE** (a leaf, ~8 fields) — with a noted **fallback to a leaf ROUTE** if inline
    editing proves cramped on review.
- **Children are edited on their own pages.** A child-entity section renders **view-only (or hides)**
  in a **parent's edit mode** — you don't edit a stage's contents from inside the campaign editor, you
  drill into the stage. This scopes edit mode to ONE entity at a time (the field-twins §2 morph stays
  about THIS record's fields).

*Breadcrumbs — pending a BeamPageHeader design decision.* The drill levels want the **full path at
every level** (List / Campaign / Stage). Today each level uses `BeamPageHeader`'s single `back` link
one level up — a correct back CHAIN, not a rendered full trail. The full trail is **not scoped as an
organism**: it lives inside the header's **constant-geometry contract** (§1 — breadcrumb-row
placement, truncation at depth), so its design comes from **Figma first**.

*Transactional child views* *(2026-09-02; first instance: campaign winners).* A new page KIND: a
**view-only list page for RUNTIME data scoped under a config entity** (winners scoped to a campaign).
By nature it is **excluded from edit modes and the approval pipeline** — there is no CRUD, no edit
mode, no CRs, no row/primary actions; it just filters + reads. List-page grammar still governs its
mechanics (filter bar, datagrid, pagination). Its rows are **historical snapshots**: the granted
reward's name/type/amount are denormalized at grant time and **never rewritten by later config
edits** — the same snapshot principle the approval pipeline uses for a CR's `baseSnapshot`. Open
items for this instance: the **Player identity link** targets a Players section that is out of repo
scope (resolves to Not-found today); **`grantedAt` timezone display** convention (UTC vs ET); and a
likely **Export** action for ops (view-only for now, pending Radi).

*OPEN ITEM — CR granularity for this flow* *(pending Radi/Tzeno).* Does an approval carry a
**whole-campaign aggregate snapshot**, or **per-entity CRs** (a stage CR, a reward CR)? This decides
the **delta rendering of the nested lists** and ties directly into **approval-grammar "Presentation"
open item (a)** (positional-vs-keyed row diffs cascade). **Delete's pipeline behaviour hangs on the
same answer** (a delete is a CR too) — so Delete is a **notice-only stub** for now. Batched with the
other token-campaign shape questions (win+loss semantics, coins vs rewardAmount, finalOpenDate
derivation, lifecycle precedence) for Radi/Tzeno.

## 3. Meta text goes universal

`tableMetaText` graduates from a table-local rule to the **meta** category rule —
one caps voice for keys everywhere:

- **Applies to:** datagrid headers · `BeamStat` keys · form-field labels
  (`InputLabel`) · permission-box headers · page-section headers.
- **Boundary: keys only.** Never values, never helper text.
- **Form-label binding renders meta unscaled in the notch** *(2026-07-28):* meta
  is already the final size, so the shrunk `InputLabel` overrides MUI's
  `scale(0.75)` to `scale(1)` (with a corrected translate), and the outlined
  notch's legend font-size is coupled to meta so the gap and label agree.
- One Figma text style (**`meta`** — supersedes `table/meta`; update the BEAM.md
  Appendix B pairing and rename log), one theme recipe.
- Current spec: fontFamily token · **Light 300** · 12/12 · 7% tracking ·
  uppercase · `text/secondary`.
- ⚠️ **Known a11y watch item (accepted deliberately):** 300-weight at 12px caps
  on dark surfaces sits at the legibility floor. It looks right on the canvas;
  if it goes wispy on real back-office monitors, **weight is the one knob** —
  bump to 400 in the seed and everything follows. Decided with eyes open,
  2026-07-24.

## 4. Page header anatomy & the save model

```
page-header (fixed rows, constant geometry)
┌────────────────────────────────────────────┐
│ [ breadcrumb ] 26px — ALWAYS reserved      │
│ [ title ] 41px                 [ actions ] │
├────────────────────────────────────────────┤
│ [ subtitle ] 24px — only when present      │
└────────────────────────────────────────────┘
```

- **Fixed rows / the reservation asymmetry** *(ratified 2026-08-27; Figma node 12745:68663).*
  Breadcrumb **26px, ALWAYS present** (the back link is hidden when absent, the row is not) · title
  **41px** · subtitle **24px, rendered only when present, NOT reserved**. The asymmetry is the rule:
  **reserve for what TOGGLES across page-type transitions** (the breadcrumb — a list has none, its
  detail does), **collapse what is stable per-page identity** (the subtitle). The payoff: the title
  sits at the **same Y on every page**, so list↔detail navigation never jumps. Actions **pin to the
  title line** (not centred against the whole text column); the subtitle flows full-width beneath.
- **One sub-title slot** *(2026-08-27).* `BeamPageHeader` has a single `subtitle?: ReactNode` (text,
  a Chip, or a composed row in the description voice). It **replaces** `status` + `description`, which
  are deprecated and removed once call sites migrate. The old `summary` strip (outlined Paper) is
  removed — it violated the details-panel container ruling (§2); record stats move to a `DetailsPanel`
  below the header.
- **The title underline hugs, then dissolves** *(2026-08-26).* The decorative underline spans the
  title box up to `--beam-title-underline-max` (`~18ch` bench default, per-product geometry, tunable
  like the rest of the underline family). On a single-line title it hugs the text; on a **wrapping**
  title it stops at the cap and **DISSOLVES** — the existing fade-to-background gradient far end is
  what makes the cap read as an **accent, not a chop** (and never a ruler ruled across the whole
  block). Anchor stays left, so the scaleX reveal is unaffected. *(Exhibit: the long-title story.)*

- **State lives in the header, once** *(2026-08-14):* entity state — status,
  operation, lifecycle chips — renders in the page-header **identity zone** (the
  `status` slot under the title), and **panels below never repeat what the header
  declares.** The point is INVARIANCE: a reader finds state in the same place
  regardless of a page's anatomy. *Rejected alternative:* header-yields-to-panel
  (let a details panel own status when the page has one) — dropped, because it
  makes state location depend on page anatomy, the opposite of invariance.
  *Applied:* the CR detail page's Request-details panel drops its Status/Operation
  rows (header keeps them); ConfigDiffPanel suppresses its per-entity operation
  chip on single-entity diffs (it earns its place only in a multi-entity diff,
  where it differentiates).
- **Altitude determines alignment** *(2026-07-31):* the right edge belongs to
  the page. Page-level actions live in the `BeamPageHeader` actions slot, and
  **nothing below page altitude aligns right.** Section/organism-level actions
  (the batch strip, Add Row, Add Rule) render as a **LEFT-aligned strip directly
  above the organism** they operate on — proximity-above declares ownership, and
  left is where scanning starts. Per-item inline controls keep their own anatomy
  (the datagrid rail, a table cell, a card header's controls). Disclosure
  controls (collapse carets) are not actions and keep their anatomy.
  *(Cross-ref: list-grammar §3.)*
- **The back link is header anatomy** *(2026-07-30):* the breadcrumb row is
  owned by `BeamPageHeader` (the `back` prop: `{ label, href?, onClick? }`),
  never hand-rolled above the header. `href` gives real-anchor semantics,
  `onClick` intercepts a plain left-click for SPA nav; a callback with no `href`
  (screen-state back) renders an accessible button.
- **Save model: the page-header actions slot.** View mode: `[Edit]`. Edit mode:
  `[Cancel] [Save]`, with Save enabled by dirty state. Nothing applies live.
- **Cancel exits edit to view; the back-link exits the page** *(2026-08-13):* in an
  in-page view↔edit flip, **Cancel returns to the view of the same entity** — never
  the list — regardless of how edit was entered (kebab-Edit deep-link included). The
  **back-link** is the page exit (→ the list). The dirty guard is unchanged: a dirty
  Cancel prompts the same "Discard changes?" — a mode-flip counts as the discard
  `useBlocker` protects. Exception: `/new` (create) has no view to return to, so its
  Cancel → the list. (Route-split editors like the User page keep their `/edit`
  route's own cancel — recorded divergence, approval-flow §6.)
- **Header actions are sized by the organism, never the page** *(2026-08-13):*
  `BeamPageHeader` pins one size for its actions slot (`HEADER_ACTION_SIZE`, currently
  **medium** — the size the estate mostly wore); call sites pass **no** `size`. Per-page
  size props were the drift (Loyalty's list Export/Import, Rule Builder's header) — the
  organism owns it now, the showExpandedActions lesson applied to size.
- The separate dirty-state commit bar ("n changes · Save · Discard") is
  **deferred, not dead** — it lost the show-and-tell for now; it remains the
  candidate docking point for maker-checker if/when that lands. Revisit then.

## 5. User page: roles | permissions, side by side

- **No tabs.** Tabs hide the role→permission relationship, and the relationship
  *is* the content. Left rail: roles. Right: permission sections.
- **Roles rail, view:** borderless Paper (§1.1), quiet list of assigned roles,
  each wearing its role-color tick.
- **Roles rail, edit:** the same rail becomes a bordered surface (§1.2) showing
  the **full role catalog** with checkboxes; unassigned roles render dimmed —
  the reveal logic of the permission boxes, applied one level up.
- **Unidirectional hover/focus linking — roles → permissions** (the NextGemPanel
  pattern, scaled): hover or keyboard-focus a role in the rail → its granted
  permissions highlight, everything else dims. Permissions are dimming **targets
  only, never triggers**. Keyboard-focus parity lives on the rail — focusing a
  role links the same as hovering. Mechanism: shared state + `data-` attributes;
  no exotic CSS.
  - *Revised 2026-07-27 (was bidirectional).* Permission rows are numerous and
    small, so cursor travel across the grid fired the rail highlighting nonstop
    — a constant flash, distracting and overwhelming. The two directions also
    differ in kind: role → permissions ("what does this role grant") is a
    deliberate pointing gesture and stays kinetic; permission → roles ("why does
    he have this") is provenance and belongs to the **static** answer, not to
    hover. This makes the parked **provenance ticks** the sole "why does he have
    this" answer now — raising their priority for the next design round.
  - *a11y note (the tabIndex removal, same change):* view permission rows lost
    their `tabIndex`. They were focusable only to fire linking as triggers; with
    that gone, two reasons converge — a focus stop that does nothing is an
    anti-pattern (it clutters tab order and signals an interaction that isn't
    there), and edit mode is already covered by each row's checkbox. The
    interaction's keyboard parity now lives entirely on the roles rail.

## 6. Permissions: ItemRow · ItemBox · PageSection

*Revised 2026-07-27: the permission box splits into a two-level hierarchy — a
section over its boxes — and gains the zero-granted-view rule. Collapse moves
from the box to the section.*

The right pane is three nested, app-local pieces (born product-local, BEAM §2):

- **ItemRow** — one labelled row: a leading marker slot (a checkbox in edit, a
  quiet dot in view, provenance ticks pending), the label, and the dim opacity
  that drives §5 linking. Rows may wrap; variable heights are legal.
- **ItemBox** — a titled box of ItemRows. Header: group name in the **meta**
  voice + a **tri-state group checkbox** (edit only; hidden-but-space-preserved
  in view). Body: view lists **granted rows only**; edit is the **full
  checklist**. Border = nature (§1): view borderless, edit bordered.
- **PageSection** — the outer level: a section header (title in **meta** + a
  **tri-state checkbox selecting every permission in every box** + a **collapse
  caret** + a rule that bleeds to the right edge) over a grid of ItemBoxes.
  **Collapse lives here, at section level — never on the box.**

Rules:
- **Zero-granted view renders nothing.** A box with no granted rows is absent in
  view mode — the daily reader gets calm. *(The "None granted." / "+n not
  granted" absence affordances stay **parked**; their fate is a later design
  round.)*
- **Tri-state rolls up:** box state across its rows, section state across its
  boxes — full / partial / none.
- **One checkbox per permission**, even when multiple roles grant it.
  *(Provisional — overlapping-grant semantics pending domain confirmation.)*
- **Provenance** (each granted row's source-role tick) and the **header spine +
  fraction** are **parked, pending design** (`styling: pending design pass`) —
  the static answer to "why does he have this"; the kinetic answer is the §5
  linking. Same color system: the categorical **role ramp** (a seed-lane ramp,
  now shipped as `roleRamp` — the gap flagged here is closed).

## 7. Layout: grid-lanes, progressively

- Base = **standard CSS grid** (aligned rows). Enhancement via
  `@supports (display: grid-lanes)` → masonry. Same posture as squircle.
- **Never the columns hack** — visual order diverges from DOM order and breaks
  keyboard/screen-reader navigation.
- **Masonry vs aligned rows is an open craft question** — aligned rows aid
  comparison-scanning. Both variants live in code behind a clearly marked
  comment/uncomment toggle; the team decides on the live demo, not the canvas.

## 8. Tier revision & plumbing (decided upstream)

- **Users & Roles are tier 3** — full pages, real routes (`/users/:id`,
  `/roles/:id`); the placeholder drawer is deleted. This **revises the
  per-page declaration in `list-page-grammar.md` §5** (Users was tier 2/panel):
  row click now navigates, same destination as the identity link. The identity
  link rule itself is unchanged.
- Router lands in Sunlight + **GitHub Pages SPA fallback** (`404.html`) —
  required the day routes exist.

## Open questions (deliberately unresolved)

- View-mode section separation: how much spacing/surface-contrast is "calm"
  without becoming soup — tune on the live page.
- Overlapping-grant semantics (§6) — domain confirmation pending.
- Role deep page (the permission matrix) — next design round.
- Effective-permissions view with provenance column — shape pending how the
  side-by-side performs.
- Commit bar revival criteria — maker-checker.
