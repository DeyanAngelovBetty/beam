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
   order `[expand][select][⋮]`, each control optional per page; kebab renders
   dim at rest, full on row hover **and keyboard focus**. Pinned-left means
   actions stay visible while data columns scroll — which structurally kills the
   legacy failure (icon-only actions in the last column, scrolled out of view —
   the audit's §3.12 finding). Caret in the rail = expand, only, always.
2. **Inside the detail surface** — edit/save/delete live where the record is open,
   with room for labels and confirmation.
3. **The bulk bar** — for multi (below).

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

## 5. Per-page declaration (the checklist that makes screens assembly)

📎 [Visual →](https://www.figma.com/design/9yNbolohxGitkMJKDjoyKG/Beam--MUI-v9-?node-id=12282-4264)

Every new list page answers five questions, then it's built:
1. Promoted filters (2–3)?
2. Click tier (expand / panel / page)?
3. Rail: which controls (expand/select/kebab) + kebab actions (labeled)?
4. Bulk actions (and which are destructive)?
5. Any inline cell control (max one, safe, a field-as-control)?

**Users:** search + Active + Effective Permission · tier 2 panel (tabs: Roles /
Permissions / Effective) · kebab: reset password, deactivate · bulk:
activate/deactivate, assign role · inline: Active toggle.
**Roles:** search · tier 2 panel (summary) → "Open editor" full page (permission
matrix) · kebab: duplicate, delete · bulk: delete (confirmed) · inline: none.

## Open questions (deliberately unresolved — input wanted)

- Panel width/resizability, and does panel state belong in the URL from day one?
- Does any current page genuinely earn tier 3 directly (no panel first)?
- Saved views: spec now or after URL-state ships?
- Kebab vs. no per-row menu at all (everything through the panel) — is the kebab
  even needed on tier-2 pages?
