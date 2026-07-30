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
- `BeamStat` gains `severity?: 'warning' | 'danger'`. Severity is **never
  color-alone** — spine color always pairs with a second cue (icon or weight),
  per WCAG 1.4.1.
- **Spine gets its own semantic tokens** rather than borrowing:
  `spine/default` (today: aliases the table-border seed), `spine/warning`,
  `spine/danger` (from the semantic seeds), living in the derived lane with
  baked snapshots for Figma. Rationale: the day table borders get tuned, spines
  must not silently retune with them.
- The role-colored tick in the roles rail and on permission rows (§5–6) is the
  spine motif at its smallest — same pigment system as provenance.

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
page-header
┌────────────────────────────────────────────┐
│ [ breadcrumb ]                             │
│ [ title ]                      [ actions ] │
┼────────────────────────────────────────────┼
│ [ subtitle ]                               │
└────────────────────────────────────────────┘
```

- **The back link is header anatomy** *(2026-07-30):* the breadcrumb row is
  owned by `BeamPageHeader` (the `back` prop: `{ label, href?, onClick? }`),
  never hand-rolled above the header. `href` gives real-anchor semantics,
  `onClick` intercepts a plain left-click for SPA nav; a callback with no `href`
  (screen-state back) renders an accessible button.
- **Save model: the page-header actions slot.** View mode: `[Edit]`. Edit mode:
  `[Cancel] [Save]`, with Save enabled by dirty state. Nothing applies live.
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
