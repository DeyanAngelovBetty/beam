# SPEC — BeamFiltersPanel: Advanced Variant (Add / Remove / Persist Fields)

**Date:** 2026-09-09 (v2 — rewritten around Deyan's Figma design; supersedes the morning condition-builder draft entirely)
**Design:** Figma frame `AdvancedFiltersPanel` (node 12900-785) — exported to `apps/gaspar/designs/AdvancedFiltersPanel.png`; the frame is authoritative for layout, spacing, and the [+]/[x] affordances.
**Consumer:** Gaspar transactions page (first).
**Scope:** ONE thing — a filter panel whose fields can be added, removed, and persisted. Nothing else.
**Explicitly out of scope (deliberate, iterative):** AND/OR or any boolean UI, operator pickers, saved/favorite filter sets, duplicate field instances, server-side seams, URL state, chips. These are later iterations by design, not omissions.

## Component model

One Beam organism, two representations, chosen per page at composition time:

- Default representation: exactly today's BeamFilterBar behavior. Untouched.
- Advanced representation: same panel, same familiar position, plus:
  - a **[+] add-field** button after the last field (per Figma),
  - **removable fields** — added fields render wrapped with an **[x]** remove affordance to the field's right (per Figma); default fields have no [x],
  - **persistence** of which fields have been added.

No tabs, no mode switch, no visual chrome distinguishing the two beyond [+] and [x] — position and familiarity carry the identity.

## Component (as built)

**Extended `BeamFilterBar` in place** (kept the name — the concept name "FiltersPanel" is a future quiet-day rename if ever; a rename now would churn ~8 Sunlight consumers). New optional prop:

- `advanced?: { addableFields: AddableField[]; storageKey: string; onFieldRemoved?: (id) => void }` — presence enables the advanced representation.
- `AddableField = { id, label, control, disabled?, disabledReason? }` — `control` is the field's rendered input (composition, same as today's children mechanism); `disabled` marks a menu entry that can't be added yet.
- Default (always-present) fields remain the page's children, exactly as today.

## The [+] menu

- Lists addable fields not currently added (one instance per field — added ones drop out).
- Entries may be `disabled` with a reason — Gaspar seeds the no-data-source catalog here ("Name on Card — awaiting data", "Fraud Rules Matched — awaiting data", etc.), making the menu the third rendered ledger (columns manager, error codes, now this).
- Menu is keyboard-operable; [x] removal is keyboard-reachable.

## Semantics (small but exact)

- Adding a field appends it after the defaults (Figma order), empty-valued.
- An added-but-empty field filters nothing.
- All fields conjoin — same implicit behavior as today's bar; no boolean UI exists.
- **Draft/applied doctrine unchanged:** values commit on FILTER, as today. Removing a field clears its draft value; the grid updates only on the next FILTER press. CLEAR ALL clears all values (draft + applied) but KEEPS the added-field structure — structure is workspace, values are query.
- One instance per field, enforced by the menu.

## Persistence

- localStorage, key `beam:filters:<storageKey>:fields:v1`, payload: ordered array of added field ids. Values are never persisted.
- On load: drop ids not in `addableFields` (silent), restore the rest in saved order.
- Same merge posture as the column manager; same per-browser per-person configs — every stakeholder composes their own panel.

## Gaspar wiring

- Defaults stay exactly the current five: search, created from/to, status, direction, provider.
- Addable (all client-side over the mock, observed-values-only for enums): currency (select), 3DS status (select), error code (select incl. "empty"), amount (min/max pair — one field, two inputs).
- Disabled ledger entries: Transaction Type, Name on Card, ProcessedBy, Fraud Rules Matched — "awaiting data".

## Mock seed

PAYMENTS grown to ~40 rows. NO new enum values: statuses Succeeded/Pending/Failed, providers Nuvei/Adyen, currencies USD/EUR/CAD only. Varied amounts across magnitudes, createdAt spread across ~3 weeks, several Failed rows with distinct MTI errorCodes, null pspTransactionId on Pending rows, mostly-Succeeded distribution. buildEvents rules unchanged (Failed timelines still stop early).

## Acceptance

- Default representation byte-identical for every existing consumer (Sunlight untouched — verify render, not just typecheck).
- Add currency → select EUR → FILTER → grid narrows; remove the field → grid unchanged until FILTER pressed again.
- Reload restores added fields (empty-valued); values never survive reload.
- [+] menu never offers an already-added field; disabled entries show reasons and are not addable.
- CLEAR ALL empties values, keeps structure; applied signals (border/filled CTA) reflect committed values exactly as today.
- Keyboard-only: add a field, fill it, filter, remove it.
- Figma frame exported to apps/gaspar/designs/ and referenced from build-notes.

---

## Build notes — how this was implemented (2026-09-09)

- **Component:** `BeamFilterBar` extended in place with the optional `advanced` config (no rename, no alias). Absent ⇒ today's default bar, byte-identical (verified: no Sunlight consumer passes `advanced`, and none uses the added-fields/[+] paths).
- **State backbone:** `packages/beam/src/BeamFilterBar/useFilterFields.ts` — **deliberately parallels `useColumnManager`** (BeamDataTable): the same opt-in-capability idiom. The organism owns the STRUCTURE (`addedFieldIds`) + persistence (localStorage, merge-on-load dropping unknown/disabled ids); the page owns the VALUES (draft/applied). Removal bridges back via `advanced.onFieldRemoved(id)` so the page clears the field's draft value(s).
- **CLEAR ALL keeps structure:** the page's `clearAll` zeroes values only; the bar never resets `addedFieldIds`.
- **[+] menu:** MUI `Menu`; lists not-yet-added fields; disabled "awaiting data" entries render disabled with their reason (the third rendered ledger). Each added field carries a keyboard-reachable `[x]`.
- **Design source:** `apps/gaspar/designs/AdvancedFiltersPanel.png` (node 12900-785) — visual-authoritative. (The connector pull needed a fileKey the node id alone didn't provide — Gaspar has no registered Figma file — so the frame was added manually.)
- **Story:** `BeamFilterBar.stories.tsx` → `Advanced`.

### Parked adjacencies (out of scope, by design — recorded so they aren't re-litigated)

Operators / value-comparison pickers, AND/OR or any boolean UI, saved/favorite filter sets, duplicate field instances, applied-filter chips, URL/query-param state, server-side filter seams. All deliberate later iterations, not omissions.
