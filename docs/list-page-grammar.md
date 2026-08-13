# List Page Grammar — filter, inspect, act

*Draft for alignment (Deyan + Vasco), then → BEAM.md + organisms.
Visual companion: the **📖 List Page Grammar** page in the Beam file (each section deep-links its frame). The goal: every
list page in Sunlight, Gaspar, and Midnight-on-Beam answers three questions the same
way — how do I narrow it, what does clicking do, and how do I act on records — so
list pages become assembly, not design, from here on.*

---

## 1. Filter bar — one anatomy, two behaviors

📎 [Visual →](https://www.figma.com/design/9yNbolohxGitkMJKDjoyKG/Beam--MUI-v9-?node-id=12282-4170)

**Anatomy (identical on every list page):**
`[search] [2–3 promoted filters] [Filters ▾ +n] … [result count] [Clear all]`
with **applied filters rendered as removable chips** beneath, and **date presets as
chips** where time matters (Today / 7d / 30d — the Payments-tab pattern, kept).

**Rules:**
- Each page *declares* its promoted filters (the 2–3 highest-use); everything else
  lives behind the Filters button with a count badge. Promotion is a per-page
  decision; the anatomy is not.
- **Live vs submitted is behavior, not layout.** Client-resident data filters
  as-you-type (debounced); server queries (Users: 274 rows, paginated) show a
  pending/apply affordance. Same visual grammar either way — the backend never
  gets to redesign the UI.
- **Result count is always visible** ("274 users · showing 41") — the feedback loop
  that makes filtering trustworthy.
- **Filter state lives in the URL.** Shareable filtered views are half of BO
  collaboration; this also makes future *saved views* nearly free.

## 2. Row click — one meaning, three tiers

📎 [Visual →](https://www.figma.com/design/9yNbolohxGitkMJKDjoyKG/Beam--MUI-v9-?node-id=12282-4196)

**A row click always means "inspect this record."** What varies per page is only the
tier where inspection happens, chosen once per list by record depth:

| Tier | Surface | Row click does | Example |
|---|---|---|---|
| 1 | **Expand in row** | toggles the expansion (big-target twin of the rail caret) | Loyalty gems |
| 2 | **Side panel** (`BeamDetailPanel`) | opens the panel — peek without losing the list | Users, Roles summary |
| 3 | **Full page** | navigates (same destination as the identity link) | Player 360 |

**The identity link rule:** whenever a record has a canonical full page, its
**identity cell (the name) renders as a true link** to it — real `<a>` semantics:
middle-click, new-tab, copy-address, history. On tier-2 pages this gives the double
affordance operators actually want: **row click peeks (panel), name click goes
(page)**. Tiers still escalate: panels may offer "Open full page."

**Hit zones — three, spelled out** ([visual →](https://www.figma.com/design/9yNbolohxGitkMJKDjoyKG/Beam--MUI-v9-?node-id=12282-4227)):
the **row controls rail** (left, pinned) does control things and never navigates;
the **identity cell** is a link; **everything else** inspects at the declared tier.
Affordances: whole-row hover highlight + the link-styled name + the rail itself.
(No row-end chevron — with the rail and the link, a third signal is noise.)

## 3. Actions — never on the row surface

📎 [Visual →](https://www.figma.com/design/9yNbolohxGitkMJKDjoyKG/Beam--MUI-v9-?node-id=12282-4214)

Row *actions* have exactly three homes:
1. **The kebab in the row controls rail** — secondary per-record actions as
   *labeled* menu items. The rail is a **pinned first column**, fixed internal
   order `[select][⋮][expand]`, each control optional per page; kebab renders
   dim at rest, full on row hover **and keyboard focus**. Pinned-left means
   actions stay visible while data columns scroll — which structurally kills the
   legacy failure (icon-only actions in the last column, scrolled out of view —
   the audit's §3.12 finding). Caret in the rail = expand, only, always.

   *Amended 2026-07-29: rail order is `[select][⋮][expand]` — selection anchors
   the rail's outer edge (the row's coarsest handle), and the expand caret sits
   innermost, nearest the row content it opens.*

   *Amended 2026-07-30: rail elevation is a **truth-conditional** cue. When the
   table scrolls horizontally and content passes under the pinned rail, the rail
   gains a rightward shadow + an inset right-edge divider (pigment/elevation
   only — geometry never moves, constant-geometry family). Both are fully gone
   at scrollLeft 0 and fade on the quick motion token. Chrome uses a scroll-state
   container query; other engines a feature-gated scroll listener. The footer
   row is outside the scroll container, so it correctly shows no cue.*
2. **Inside the detail surface** — edit/save/delete live where the record is open,
   with room for labels and confirmation.
3. **The bulk bar** — for multi (below).

*Amended 2026-07-30: row actions are DATA, defined once.* A row's actions are
declared once per datagrid as `rowActions(row) → BeamRowAction[]` (id · label ·
onSelect · destructive? · disabled?/reason). Every surface that manifests them —
the rail kebab, and an action bar the organism appends below `renderExpanded`
when the row is expanded — projects that **one** definition; the consumer never
hand-rolls action buttons in expansion content (there is no opt-out, so surfaces
cannot drift). State-dependent actions (Enable ↔ Disable) are expressed by
returning the right one from the closure; to hide an action, don't return it.
Destructive reads error-tinted per surface (grouped-last menu item · error
button); disabled stays visible with its reason. This killed a live drift:
PayoutConfigs' kebab and expansion footer had shown different sets.

*Amended 2026-08-13 — the opt-out is gone (again), and the projection is spelled
out.* The rule above said **there is no opt-out**. One day later a
`showExpandedActions` flag landed and quietly set PayoutConfigs, GameConfigs, and
MetaGamePresets to `false` — no rationale in the commit, no note here —
reintroducing the very opt-out this section forbids (loyalty inherited it later by
copying the others). Repaired: the flag is **removed** from `BeamDataTable`, so the
projection is unconditional once more. The exact contract, restated so it can't be
read as optional again:

> When a row has actions **and** expands, both are true — the actions live in the
> **kebab** (rail placement), **and** they project into the expanded panel as the
> **expanded bar**: rendered **below any panel content**, **left-aligned** (altitude
> determines alignment — detail-grammar §4). The bar renders the *same* `rowActions`
> definition as the kebab — **one source of truth, two projections; never two lists
> to maintain.** `PendingApprovalsPage` never opted out and was the surviving
> reference through the drift.

*Amended 2026-07-31 — altitude determines alignment (detail-grammar §4).* Sub-page
action strips (the batch strip, Add Row / Add Rule) render **LEFT, directly above
the organism** they operate on; the page's right edge (the `BeamPageHeader`
actions slot) is page-only. Per-item rail/cell controls keep their anatomy;
collapse carets are disclosure, not actions.

**The one carve-out — inline cell controls:** a single, safe, high-frequency toggle
that *is a field of the record* (Users → Active, Loyalty → Daily Wheel) may render
inline as its control, with an aria-label. This is a cell showing its value, not a
row action. Sparingly: one per table, never destructive.

## 4. Bulk — selection and the bulk bar

📎 [Visual →](https://www.figma.com/design/9yNbolohxGitkMJKDjoyKG/Beam--MUI-v9-?node-id=12282-4244)

- Checkbox selection only. Non-empty selection swaps the toolbar region into the
  **bulk bar**: count, bulk-eligible actions, clear-selection. (Filter bar and bulk
  bar are two states of one region — already how the code behaves.)
- Actions that can't apply to the entire selection are **disabled with a reason** —
  never hidden, never partially applied.
- Destructive bulk actions use the confirm grammar (type-to-confirm for the truly
  dangerous).
- Server-paginated lists: selection is **page-scoped**, with explicit escalation —
  *"All 25 on this page selected · Select all 274 matching this filter."* Filter
  down → select all matching is the real ops workflow; this is where §1 and §4
  meet.

*Amended 2026-07-29 — constant geometry, variable enablement.* The bulk bar no
longer overlays or replaces the toolbar on selection (that reflow is gone). This
applies detail-grammar §1's border rule to interaction: **the geometry is
constant; only enablement varies.**
- **Batch actions render always**, in a persistent, **unboxed** strip on the page
  background between the filter bar and the table (§1.3 exempt — plain actions,
  not a raised container). They are **disabled at zero selection** and enable as
  selection grows. Nothing overlays, replaces, or reflows on select/deselect.
- **Ownership:** BeamDataTable keeps owning selection and renders the strip
  itself, above its Paper — the batch bar is *table* chrome (it acts on the
  table's selected rows), distinct from the filter bar's *page* chrome (which
  narrows the dataset). *(When the server-side "select all matching" escalation
  above is built, selection lifts to page state and the bar may migrate; not
  yet.)*
- **Selection count** lives in the **table footer, left, opposite pagination**,
  always present: `No rows selected` ↔ `{n} selected`. It is `aria-live` so its
  changes are announced.
- **A11y:** disabled batch buttons use **`aria-disabled`, not `disabled`** — they
  stay focusable and announced, so a screen-reader user discovers them; each is
  `aria-describedby` a hint ("Select one or more rows…") that explains *why*
  it's inert, and the click handler no-ops. Enablement is also conveyed visually.
- **Destructive** batch actions keep confirmation.

## 5. Per-page declaration (the checklist that makes screens assembly)

📎 [Visual →](https://www.figma.com/design/9yNbolohxGitkMJKDjoyKG/Beam--MUI-v9-?node-id=12282-4264)

Every new list page answers five questions, then it's built:
1. Promoted filters (2–3)?
2. Click tier (expand / panel / page)?
3. Rail: which controls (expand/select/kebab) + kebab actions (labeled)?
4. Bulk actions (and which are destructive)?
5. Any inline cell control (max one, safe, a field-as-control)?

**Users:** search + Active + Effective Permission · **tier 3 full page**
(`/users/:id`) · kebab: reset password, deactivate · bulk: activate/deactivate,
assign role · inline: Active toggle.
**Roles:** search · **tier 3 full page** (`/roles/:id`; permission matrix is a
later round) · kebab: duplicate, delete · bulk: delete (confirmed) · inline: none.

*Revised 2026-07-24: Users & Roles moved from tier 2 (panel) to tier 3 (full
page) per `detail-page-grammar.md` §8 — row click now navigates to the same
destination as the identity link.*

## 6. Actions are a complexity cost — earn the combination

📌 *Added 2026-07-29.*

**Batch actions and row actions together are a complexity cost, not a default.**
A page earns the combination only when *both* are genuinely needed; prefer one,
justify two. Row actions serve the single record; batch actions serve the
multi-select workflow. A page that has never shown a real multi-select need
should not carry a batch bar just because the table can.

*Audit 2026-07-29 — the two shipped list pages:*

| Page | Row actions | Batch actions | Verdict |
|---|---|---|---|
| **Users** | none (inline Active toggle only) | none | No combination — clause N/A. |
| **Roles** | kebab: Edit / Users in Role / Delete | none | One set — clean. |
| **Payout Configs** | kebab: Edit + Enable/Disable | none | ✅ One set — resolved by product docs. |

*Resolved 2026-07-29 — Payout Configs.* Georgi's Design Brief settled it: no
Delete, no bulk workflows. The page now carries **row actions only** (Edit +
Enable/Disable) and renders **no batch strip**. The earlier "both — under review"
combination is gone; the clause is satisfied by the product spec, not a guess.

*Reconcile-later (2026-07-29): §5 declares Users with a kebab (reset password,
deactivate) and bulk (activate/deactivate, assign role), but the shipped code
has neither — only the inline Active toggle. Close the gap (build the declared
actions or revise the declaration); don't let it drift.*

## Open questions (deliberately unresolved — input wanted)

- Panel width/resizability, and does panel state belong in the URL from day one?
- Does any current page genuinely earn tier 3 directly (no panel first)?
- Saved views: spec now or after URL-state ships?
- Kebab vs. no per-row menu at all (everything through the panel) — is the kebab
  even needed on tier-2 pages?
