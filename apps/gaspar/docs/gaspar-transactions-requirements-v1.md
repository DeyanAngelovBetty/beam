# Transactions Page — Technical Requirements

Companion to the Gaspar Payment Orchestrator Requirements Specification. Referenced from §4 (Technical Requirements) and §6 (Release Phasing).

Requirements are **cumulative**: each version assumes everything specified in the versions before it. Field names marked *TBC* are not yet present in the payments API.

### Conventions that apply to every version

- Null values render as an em-dash in a muted tone — never blank, never zero, never "N/A".
- Timestamps are stored and transmitted in UTC with offset; conversion happens at display only.
- No value is ever inferred, synthesised or back-filled to make data look complete. What the API returns is what the page shows.
- Colour never carries meaning on its own. Every state that is coloured is also labelled.
- Access control is enforced server-side. Hiding a control in the interface is not access control.

---

### v1.0 — 5 October

#### Data source

The page renders the `payments` list response. All paging, sorting and filtering are **server-side**; the client never loads the full result set to filter locally. The endpoint accepts page number, page size, sort field, sort direction and every filter below, and returns the total record count.

#### Columns

Fifteen columns, in this default order:

| Column | Field | Type | Alignment | Treatment |
| --- | --- | --- | --- | --- |
| Created At | `createdAt` | ISO 8601 + offset | right | Timestamp cell |
| Last Updated | `updatedAt` | ISO 8601 + offset | right | Timestamp cell |
| Merchant Transaction ID | *TBC* | string | left | Identifier cell |
| Transaction Type | `direction` | enum | left | Badge |
| Amount | `amount` | decimal | right | Two decimals, tabular figures |
| Currency | `currency` | ISO 4217 | left | Plain |
| Status | `status` | enum | left | Badge |
| Customer ID | `customerId` | string | left | Plain, links to the player record |
| Customer Email | *TBC* | string | left | Plain, truncated with full value on hover |
| Gaspar Transaction ID | `id` | string | left | Identifier cell |
| PSP Transaction ID | `pspTransactionId` | string, nullable | left | Identifier cell, monospace |
| Payment Method | `paymentMethodId` | string | left | Payment method cell |
| Error Code | *TBC* | string, nullable | left | Error code cell |
| Provider | `psp` | enum | left | Plain |
| 3DS Status | `threeDsStatus` | enum | left | Badge |

Numeric and timestamp columns are right-aligned with tabular figures. Identifiers, timestamps, amount and currency never wrap. The grid scrolls horizontally inside its own container; the page body never scrolls sideways.

#### Cell treatments

**Identifier cell.** Middle-truncated so both ends remain readable — operators recognise identifiers by their tail as often as their head. Full value in a tooltip on hover *and* keyboard focus. An adjacent copy control writes the full untruncated string to the clipboard and confirms with a transient notice.

**Timestamp cell.** Local time in sortable form `YYYY-MM-DD HH:mm`, with the complete ISO value and offset in a tooltip. Relative time is not used: operators correlate timestamps across rows and systems, and relative values cannot be compared.

**Badge cell.** The raw value is always the label. Colour applies only to values explicitly mapped in configuration; anything unmapped renders neutral with its raw string. Colours resolve through theme tokens.

**Error code cell.** Monospace. Hover or keyboard focus reveals the code's meaning from a code dictionary, with a usage note where one exists. A code absent from the dictionary shows the code and an "Unknown code" reveal.

**Payment method cell.** Renders the payment method identifier. Must be structured to accept a richer method summary without rework — Interac and Apple Pay carry no card brand or last-4.

#### Filters

The filter bar edits a **draft**; the grid queries by **applied** state. Changing a field does not re-query. The Filter action commits draft to applied.

- **Search** — free text against Merchant Transaction ID, Gaspar Transaction ID, PSP Transaction ID and Customer ID.
- **Created From / Created To** — range on `createdAt`, inclusive both bounds, compared as calendar dates.
- **Status, Transaction Type, Provider, Error Code, 3DS Status** — single-select.

Select options are derived from the data, never hardcoded, so a new enum value appears without a front-end change. **Clear all** resets both draft and applied. The applied indicator reflects committed state only.

Filters are not persisted to the URL in v1.0.

*Known constraint:* Enter in the search field cannot commit without an addition to the shared filter-bar component. Enter commits from the date fields; the Filter action commits everything. Accepted for v1.0.

**Instrumentation:** filter usage is logged from day one — which filters are applied, in what combinations, how often. The v1.2 filter additions are chosen from this evidence rather than from opinion.

#### Sorting

Every column sortable both directions, on the underlying value rather than the rendered string. Default: Created At, newest first. Applied server-side; resets to page one.

#### Pagination

Server-side, with total record count and current range visible. Changing page size returns to page one. Page resets when filters are applied or sort changes.

#### Event Timeline

Each row expands and collapses in place, showing for every event: timestamp, event type, and accompanying detail including sub-status and PSP reference where present. Oldest first. Expansion is per row and does not survive a page change.

The timeline renders exactly the events the API returns. Where a sequence is incomplete — a failed payment with no terminal failure event recorded — it ends where the records end.

Row expansion is the only row interaction in v1.0. No row click target, no detail drawer.

#### States

- **Loading** — preserves the header row and layout so the page does not reflow when data arrives.
- **Empty** — distinguishes "no results for these filters" from "no data".
- **Error** — states that loading failed and offers retry, rather than rendering an empty grid.

#### Enum handling

New or unrecognised values for Status, Transaction Type, Provider or 3DS Status never break rendering, are never dropped, and are never assigned a colour by inference. They render neutrally with their raw value and remain filterable and sortable.

#### Roles

**Viewer** reads, filters, sorts and expands. **Editor** does the same; the difference becomes material once actions exist.

#### Accessibility

Semantic table with a header row. Every interactive element — copy controls, expansion toggles, filter fields, pagination — keyboard reachable with a visible focus state. Every tooltip reveal available on focus, not hover alone. Copy controls carry an accessible label naming the value copied.

#### Non-functional

Responsive at the volumes the current back office already handles — several thousand records. Filter and sort requests do not block the interface; the previous result set stays visible until the new one arrives.

---

### v1.1 — 1 November (TBC)

#### Export

- **Scope.** Exports the **entire filtered result set**, not the visible page. Where a selection exists, exports the selection instead. The current page is never the unit of export.
- **Formats.** CSV and XLS are data formats; PDF is a presentation format and may paginate and drop columns that do not fit, provided it states that it has.
- **Values are exported raw, not as rendered.** Full untruncated identifiers, full ISO timestamps with offset, raw enum values, amounts as numbers rather than formatted strings, currency in its own column. Screen conventions — truncation, local time, badges — do not carry into the file.
- **Columns.** The default column set in v1.1. From v1.2 the export follows the user's current column configuration and order.
- **Encoding.** UTF-8 with BOM so Excel opens CSV correctly. Delimiter and decimal separator fixed and documented, not locale-derived.
- **Size.** Above an agreed row threshold the export is generated asynchronously and the user notified when ready; a synchronous export must never block the interface or time out silently.
- **Filename** encodes the export timestamp and record count.
- **Audit.** Every export is logged: who, when, which filters, how many rows, which format. The file contains Customer Email, so an export moves personal data out of the system and must be attributable.

#### Multi-select

- Select an individual row, all rows on the page, or **all rows matching the current filter** — the last being distinct from the second and stated explicitly in the interface, with its count.
- Selection persists across pagination while the filter is unchanged, and clears when filters or sort change.
- The selected count is always visible, with a one-action clear.
- The action bar appears only when a selection exists.

---

### v1.2 — date TBD

#### Column management

- Users add, remove and reorder columns. The configuration is **persisted server-side per user**, not in browser storage — it must survive a change of device or browser.
- Stored per user per grid: the visible set and the order.
- The catalogue includes columns with no data source, shown disabled and labelled "awaiting data", so the gap stays visible rather than silently absent.
- A reset-to-default action exists.
- A column added server-side appears for users who have never customised. For users who have, it is appended in the visible set rather than silently hidden.
- Export follows the user's configuration from this point.

#### Pagination at 500

- Page size configurable up to 500, with jump-to-page. Out-of-range page numbers are rejected in the interface, not by the server erroring.
- The list endpoint must serve 500 rows across the full column set within an agreed response-time budget. This is a backend load requirement, not a client setting.
- The client renders 500 rows without degrading scroll performance; virtualised rendering if measurement requires it.
- Total-count accuracy at scale: if an exact count becomes expensive, an approximate count is acceptable provided the interface says it is approximate.

#### Additional filters

Chosen from the usage instrumented since v1.0. Multi-select filters, where introduced, OR within a single field while continuing to AND across fields.

---

### Beyond v1.2

#### Actions — complete and decline

- **Eligibility is evaluated server-side** and returned per transaction. The interface reflects that answer; it never decides eligibility itself.
- Actions are **idempotent** — a repeated request for the same transaction and action produces the same result, not a second effect.
- Every action requires explicit confirmation stating what will happen and to how many transactions.
- A bulk action is applied per transaction, **not as a transaction of its own**: partial failure is expected and the result reports which succeeded and which did not, with reasons. A single failure does not roll back the rest.
- Every action writes an audit record: who, what, when, which transactions, the outcome.
- The grid refreshes affected rows from the server after an action rather than assuming the outcome.

#### Custom saved filters

Named filter sets, persisted per user server-side. Shareable across the team as a later addition.

#### AND/OR filter logic

A change to the query model rather than to the interface. The filter contract established in v1.0 should be shaped so that combining predicates can be added without redesigning it. Until this ships, the Excel export covers the case with live data.