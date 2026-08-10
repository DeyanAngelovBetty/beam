# Loyalty pages — Sunlight's loyalty surfaces in Beam

*The Loyalty workstream in `apps/sunlight` (nav: Loyalty → Status · Perks). This
doc records the loyalty pages and any page species they introduce. v1 ·
2026-07-31.*

---

## Page species: the REFERENCE MATRIX (2026-07-31)

**Perks** (`/perks`) is *not* a list-grammar page. It has no filters, no row
actions, no identity links, no pagination, and nothing behind it — a row click
does nothing. It is a new species: a **reference matrix** — rows × capabilities,
for compare-and-scan. Do not bolt list chrome onto it.

- **Shape:** loyalty tiers (Member → VIP, ladder order) down the side; capability
  columns across the top; each cell is text, a granted tick, or a denied cross.
- **Surface / border call (argued against grammar §1's own test):** the matrix is
  read-only and non-interactive *by nature* — it sorts and selects nothing — so
  detail-grammar §1.1 (raised + read-only → borderless) would make it borderless.
  **But** a matrix earns internal rules: with ~11 columns, row/column separators
  and a header underline are **legibility aids for scanning, not an "interactive
  invites" signal.** §1.1's "never rules" governs separating stacked *panels*, not
  a data grid's internal structure. So the reference matrix carries a bordered
  container + a meta-voice header + a pinned first column — recorded here as the
  species rule, distinct from §1's list/detail dichotomy.
- **Not BeamDataTable.** The organism can render read-only (omit rail / selection
  / pagination / filter / sort by passing columns without `getValue`), but its
  sticky-first-column + scroll affordance is built for the **rail** (a controls
  column), and cannot pin an arbitrary *data* column. The matrix needs the
  **Status** data column pinned, so it's a plain bordered table (grammar §1's
  "else" branch).
- **Pinned Status + scroll affordance:** the first column is `position: sticky`;
  the scroll-affordance elevation (truth-conditional inset divider + rightward
  shadow) is **reused from BeamDataTable's rail** — the CSS enhancement
  (scroll-state container query) transferred cheaply as `sx`; the JS base
  (a `data-perks-scrolled` listener, feature-gated) is a small copy. *Flag: the
  mechanism isn't extracted/shared — a future refactor could lift it out of
  BeamDataTable into a reusable sticky-scroll helper.*
- **Cell semantics:** granted = success tick, denied = error cross, for now —
  `// perk-cell semantics: pending design pass`. The **red-✗ question** (should
  "not included" read as an error/red, or something calmer?) is Deyan's design
  call.

### ⚠️ Seed status
The perks **data is placeholder** — the screenshot is the spec and wasn't
provided when this was built. Tiers + "Multiplier on Level Up" are real (from
`LoyaltyStatusPage`); the rest is a transparent unlock-ladder scaffold. **Replace
verbatim from the screenshot before this page is trusted.**

## The status gem panel — companion, both modes *(2026-08-10)*

**Table-left, panel-right — one anatomy, view and edit.** The rewards table is the
primary record (scanning starts left); `NextGemPanel` is a companion annex on the
right, in both the expanded view row and the editor. On narrow widths the row stacks
**table-first**. This flip (the panel led before) makes the record primary and the
visualization secondary — and gives the editor the "same thing, now editable" bridge:
identical layout, one now has inputs.

**The editor's panel derives from the LIVE model, not the store.** Adding a reward row
grows the milestone ladder immediately; editing points reflects at once. Milestones are
keyed by the reward row's `_key` (the same id the React key uses), so a new row links the
moment it exists.

**Linking is hover AND focus-within, focus wins.** The view's hover linking carries over;
the editor, being keyboard-first, lets the row containing the focused input drive the
highlight even when the pointer rests elsewhere — the roles-rail keyboard-focus parity
(detail-grammar §5), applied to the milestone pattern it was scaled from. Mechanism is the
existing shared-state + `data-` attribute linking, extended for focus; the shared
`useLinking` hook (the roles-scoped, dim-based variant) is deliberately *not* bent to fit —
its semantics differ and it has other consumers. The panel is companion, not control:
clicking a milestone does nothing this pass.
