# SPEC — Gaspar Transactions Grid: Column Update (Tracer Bullet 1) — v2

**Date:** 2026-09-08 (v2 — merged MN columns + Konstantin's list, status resolved)
**Consumer:** Gaspar transactions page (`payments` list endpoint)
**Organism:** BeamDataTable (TanStack headless + MUI surface)
**Scope:** Column definitions and cell treatments only.
**Explicitly out of scope:** column show/hide + reordering (bullet 3), row selection / export actions, advanced filters, detail/history panel — all noted in the roadmap appendix, none built in this pass. If a column need seems to require touching the organism, stop and flag.

## Column model: catalog vs default set

Columns are a fluid, ongoing conversation with the Gaspar team. So this spec defines two things:

1. **The catalog** — every column we know about (MN's current set ∪ Konstantin's set), each marked by data availability.
2. **The default-visible set** — what renders now, from fields that exist in the `payments` list response today.

Build column defs for the full *available* catalog; the default set is just initial visibility. When bullet 3 lands, the catalog becomes the column manager's contents for free.

## Data source

Server-paginated `payments` list response (sample in conversation source). Fields available per row:
`id, organizationId, marketId, idempotencyKey, customerId, paymentMethodId, amount, currency, direction, psp, status, threeDsStatus, threeDsSessionReference, pspTransactionId, createdAt, updatedAt`

## Default-visible columns (in order)

| # | Header | Accessor | Treatment |
|---|--------|----------|-----------|
| 1 | Transaction ID | `id` | GUID cell |
| 2 | PSP Transaction ID | `pspTransactionId` | Mono text; nullable — em-dash. PSP-prefixed strings, not GUIDs — middle-truncate + copy if width-constrained |
| 3 | Customer | `customerId` | Plain text |
| 4 | Payment method | `paymentMethodId` | Phase A/B — see below |
| 5 | Amount | `amount` | Right-aligned, tabular-nums, 2dp |
| 6 | Currency | `currency` | ISO code as-is (separate column confirmed) |
| 7 | Direction | `direction` | Badge, neutral tones — not a success/failure signal |
| 8 | Status | `status` | Badge. Known value: `Succeeded` (positive). Unseen values — neutral badge, raw string |
| 9 | Provider | `psp` | Plain text (`Nuvei`) — MN's "Provider" column, kept |
| 10 | 3DS Status | `threeDsStatus` | Badge. Known value: `NotRequired` (neutral) |
| 11 | Created At | `createdAt` | Timestamp cell |
| 12 | Last Updated | `updatedAt` | Timestamp cell |

## Catalog: columns with NO current data source (do not build, do not fake)

From MN's current grid — each needs a backend answer before it can exist against the new API:

- **Transaction Type** — MN concept; new API has only `direction`. Question for Konstantin: is Type subsumed by `direction`, or is there a richer type enum coming? Until answered, `direction` is the type column.
- **Name on Card** — absent from both `payments` and `payment-methods` responses. Backend ask if it's still wanted.
- **Payment Method Details** (brand/last4/etc.) — exists on the payment-methods resource; becomes the Phase B card cell, not a separate column.
- **ProcessedBy** — no field in response. Source unknown.
- **Fraud Rules Matched** — no field in response. Presumably future rules-engine integration.

These stay documented here so the column conversation has a ledger, but nothing renders for them.

Not shown as columns: `organizationId`, `marketId` (context-scoped), `idempotencyKey`, `threeDsSessionReference` (detail material).

## Shared cell treatments

**GUID cell** — middle-truncated display, full value in tooltip, click-to-copy with confirmation. Reuse Beam's existing copy pattern; if none exists, flag before inventing one.

**Timestamp cell** — `2026-09-04 13:32` local, full ISO string with offset in tooltip. No relative time — ops need sortable, comparable values.

**Badge cells** — BeamStatusBadge (or current Beam badge molecule). Enum rule: map ONLY values observed in sample payloads (`Succeeded`, `NotRequired`, `Deposit`). Any unseen value renders as neutral badge + raw string. No invented enum→color tables.

## Payment method column — two phases

**Phase A (build now):** `paymentMethodId` as GUID cell. Functional, honest, ugly.

**Phase B (behind data availability, do not fake):** composite card cell — `[brand mark] •••• 1111`, tooltip with BIN, expiry, prepaid flag. Card fields live on the payment-methods resource, NOT in the payments list response. Activates only when backend expands the list response with an embedded card summary (ask pending with Konstantin). Cell accepts an optional card-summary object, falls back to Phase A when absent. No client-side joins, no per-row fetches.

## Acceptance

- Grid renders the 12 default columns, in order, against the sample payload.
- Null `pspTransactionId` shows em-dash, not blank.
- Unknown enum values render neutrally without error.
- Amounts align vertically (tabular-nums verified).
- No organism API changes; no promotions — page-local until bullet 3.
- Copy affordance works on GUID cells.
- Catalog columns without data sources do not appear anywhere in the rendered grid.

## Roadmap appendix (context, NOT scope)

Head-of-payments feedback + reference backoffice observations, mapped to future bullets so this pass builds nothing that blocks them:

1. **Row export (raw JSON) + batch selection/export** — needs TanStack `rowSelection` state + a checkbox column; pairs naturally with the bullet-3 organism work. Export format/endpoint TBD with backend.
2. **Space density** — sticky header, collapsing search/filter panel on scroll, possible row-density toggle. CSS-first territory.
3. **AND/OR advanced filters** — filter-builder UI over server-side query params. Contract conversation with backend; reference backoffice's Quick/Advanced Search tab split is a decent pattern.
4. **Per-row detail/history** — the `events` array in the payment-details response is exactly this material (Initiated → PspAssigned → SubmittedToProvider → Approved). Reference lifecycle screenshot shows the target shape. Likely a detail drawer/panel per View-first doctrine.

The 12-column layout must not paint us into a corner on any of these: leave the leading cell gutter available for a future selection checkbox, and don't design row interactions that would conflict with a future row-click-opens-detail pattern.

---

## Build notes — how this codebase satisfied the spec (2026-09-08)

Deltas between the spec's language and this repo, recorded so the next reader isn't surprised:

- **`BeamColumn`, not raw TanStack `columnDef`.** The organism's public API is `BeamColumn<Row>`; the column defs are expressed through it. `getValue` (spec-implicit) makes a column sortable + searchable.
- **`tabular-nums` is automatic.** `BeamDataTable` applies `font-variant-numeric: tabular-nums` to every right-aligned column, so the Amount acceptance is satisfied by the organism — the cell only right-aligns and renders `amount.toFixed(2)`.
- **Badges are PAGE-LOCAL (`TxBadge`), not `BeamStatusBadge`.** Conflict surfaced and ruled on: `BeamStatusBadge` takes a fixed semantic `BeamStatus` union with **no neutral/unknown member** and colors from the token, so it structurally cannot render "neutral badge + arbitrary raw string." `TxBadge` (an MUI `Chip`, colored via palette tokens) renders the raw string always, `success` tone only for the observed positive (`Succeeded`), neutral for everything else. **`BeamStatus` is untouched**; API-string ↔ `BeamStatus` reconciliation is a separate future Beam task.
- **Copy cell is PAGE-LOCAL (`TruncateCopyCell`).** No shared Beam copy pattern exists (only Sunlight's page-local `CopyUrlButton`) — flagged per the spec. This is the estate's **second** page-local copy affordance; promotion to a Beam copy molecule is a queued candidate, separate task.
- **Row expansion removed.** The prior page's `renderExpanded`/`RoutePanel`/`route[]` mock is dropped — orphaned by the new API and fenced off for the future detail drawer (roadmap #4). No `onRowClick`, no selection gutter consumed.
- **Tabs left untouched and non-functioning.** The `BeamTabs` row does not filter rows (it never did); retained as-is pending the filters conversation (roadmap #3), not wired this pass.
- **Mock, not live.** `PAYMENTS` mocks the list response (no endpoint reachable here). It deliberately includes a null `pspTransactionId` and unseen enum values (`Pending`, `Failed`, `Authenticated`) to exercise the em-dash and neutral-fallback acceptance criteria.

### Error Code — PROPOSED column (2026-09-08), pending backend confirmation

Added a page-local **Error Code** column (after Status), driven by `PaymentRow.errorCode?: string | null`. **This field does not exist in the payments API today** — the column is a rendered proposal, not an implementation.

- **Vocabulary is an OPEN backend question:** MTI (ISO 8583 message-type indicators) vs response/decline codes vs PSP-specific codes. The demo dictionary (`MTI_CODES`) is seeded from the ISO 8583 MTI table as a stand-in; the real code space is TBD with the backend team.
- **Cell (`ErrorCodeCell`, page-local):** mono code text; hover **or keyboard focus** (focusable `tabIndex=0` trigger) reveals the meaning (+ usage note when present) via `Tooltip` — estate precedent for a reveal-on-hover/focus (Popover is click-only). Dictionary is **data, not logic**; an unknown code renders the code with a "Unknown code" reveal — the same no-invented-meanings honesty rule as the badges.
- **Null/absent → em-dash**, same treatment as `pspTransactionId`. Mock seeding: the `Failed` row carries `0400`, one `Succeeded` row is explicit `null`, the rest absent.
- **Scope:** no filter for it, no organism change. When the backend settles the field + vocabulary, the dictionary and column graduate from proposal to real.
