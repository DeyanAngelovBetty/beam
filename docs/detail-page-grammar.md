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
- **Bidirectional hover/focus linking** (the NextGemPanel pattern, scaled):
  hover/focus a role → its permissions highlight, others dim; hover/focus a
  permission → the roles granting it highlight. The inverse direction *is*
  provenance, kinetic. **Keyboard focus triggers the same linking** — hover-only
  is half an interaction. Mechanism: shared state + `data-` attributes; no
  exotic CSS.

## 6. Permission box

- **Header:** group name + **fraction** ("Transactions · 12 / 14") — tri-state
  made numeric. The header spine carries group state: full = quiet · partial =
  accent · none = dim.
- **View body:** **granted only**, quiet list; absences behind a
  **"+n not granted"** reveal. The daily reader gets calm; the compliance reader
  gets completeness.
- **Provenance:** each granted row wears a tick colored to its source role — the
  static answer to "why does he have this"; the hover linking (§5) is the
  kinetic answer. Same colors, one system.
- **One checkbox per permission**, even when multiple roles grant it.
  *(Provisional — overlapping-grant semantics to be confirmed with the domain
  team; revisit w/c 2026-07-27.)*
- **Edit body:** full checklist; tri-state group checkbox in the header; the
  spine holds the frame through the view ↔ edit transition.
- Rows may wrap → variable row heights are expected and legal.
- 📌 **System gap, flagged:** role provenance needs a **categorical color ramp**
  (per-role accents). No such tokens exist yet; they are a seed-lane proposal,
  not a local invention (BEAM §10.6).

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
