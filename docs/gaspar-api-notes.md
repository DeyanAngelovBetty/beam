# Gaspar Transactions — wire ↔ fixture reconciliation

**Status:** analysis only, no code changed (Task 1). Task 2 (regenerate fixtures to the wire shape)
is gated on the rulings to the flags at the end of this doc.

**Sources reconciled**
- **Wire sample:** [`apps/gaspar/fixtures/samples/2026-09-21-konstantin-transactions.json`](../apps/gaspar/fixtures/samples/2026-09-21-konstantin-transactions.json) — a real `payments` list response, **Konstantin, 2026-09-21**, 30 items (`id` 1–30), one envelope page.
- **Our fixture + consumer:** `PaymentRow` / `RAW_PAYMENTS` in [`apps/gaspar/src/gaspar/TransactionsPage.tsx`](../apps/gaspar/src/gaspar/TransactionsPage.tsx) (1,200 synthesized rows) and the port's pagination contract in [`packages/beam/src/TableNext/useClientPagination.ts`](../packages/beam/src/TableNext/useClientPagination.ts) + `Table.types.ts`.

The wire sample is the source of truth for **what exists**; everything our fixture carries beyond it is
either a proposed column, a context field we invented, or detail material sourced from another resource.

---

## 1. Field-by-field delta

Legend — **✅ match** · **⚠️ divergence (needs a ruling or a mapping layer)** · **WE-ONLY** (not on the wire) · **WIRE-ONLY** (we don't carry it, or don't honor its semantics).

| Wire field | Wire type / sample | Our field | Our type | Delta |
|---|---|---|---|---|
| `id` | **number**, sequential int PK (1…30, items sorted **desc**) | `id` | **string** `pay_<token>` | ⚠️ **type: number → string.** Wire is a bare integer PK; ours a prefixed token. Affects search/copy/URL + the roadmap #4 detail-drawer route. |
| `customerId` | **string** `"398595"` (numeric, unprefixed) | `customerId` | string `cus_<n>` | ✅ type match; cosmetic value shape differs (prefix). |
| `paymentMethodId` | **number**, FK int (1, 2, 3) | `paymentMethodId` | **string** `pm_<token>` | ⚠️ **type + semantics.** Wire is an integer **FK into payment-methods**; ours an opaque copy-able token. We render it as a GUID, never resolve it. → **Flag 3.** |
| `amount` | **number**, all **whole** in sample (25, 8, 13, 7, 3, 33, 11, 5) | `amount` | number, 2-dp decimals | ⚠️ **units unknown** — whole euros? minor units (cents)? sample can't disambiguate. → **Flag 4.** |
| `currency` | `"EUR"` (only value) | `currency` | `"CAD"` (hardcoded) | ⚠️ **value divergence EUR vs CAD.** → **Flag 1.** |
| `direction` | `"Deposit"` / `"Withdrawal"` | `direction` | same two | ✅ **vocabulary match.** (Display-only rename → "Transaction Type"; field/key untouched.) |
| `psp` | `"Nuvei"` / `"Worldpay"` | `psp` | `"Nuvei"` / `"Adyen"` | ⚠️ **enum divergence:** Worldpay (wire) vs Adyen (ours); Nuvei common. → §2. |
| `status` | `Initiated` / `Processing` / `Succeeded` / `Failed` (PascalCase) | `status` | `created`/`pending`/`processing`/`failed`/`completed` (lower) | ⚠️ **whole-vocabulary divergence** incl. casing; and our `pending`/`created` **do not exist on the wire.** → §2 + **Flag 5.** |
| `threeDsStatus` | `"NotRequired"` (only value observed) | `threeDsStatus` | `Authenticated` / `NotRequired` | ⚠️ partial — sample shows one value; full set unknown. → §2. |
| `pspTransactionId` | **string \| null**; null on pre-PSP rows | `pspTransactionId` | string \| null | ✅ **shape + nullability match** (see §2 for the null rule). Format is PSP-dependent/opaque. |
| `createdAt` | ISO 8601 **with `+03:00` offset** | `createdAt` | ISO 8601 (`Z`/UTC) | ✅ type match; wire is server-local offset, ours UTC. Display slices to local either way. |
| `updatedAt` | ISO 8601; **`== createdAt` on Initiated rows** | `updatedAt` | ISO, always bumped a few sec | ⚠️ realism: wire leaves `updatedAt == createdAt` for un-progressed rows; our generator always bumps. → Task 2 clustering. |
| — | — | `customerEmail` | string | **WE-ONLY** — not on the wire row. Column **and** a search field. → **Flag 2.** |
| — | — | `cardType` (Visa/Mastercard), `cardSummary?` | — | **WE-ONLY, proposed** — brand/last4 live on payment-methods, reachable only via the FK. → **Flag 3.** |
| — | — | `errorCode` | string \| null | **WE-ONLY, proposed** — no wire field (MTI vs decline-code vocabulary is itself open). |
| — | — | `threeDsSessionReference` | string \| null | **WE-ONLY** — detail material, not a column. |
| — | — | `organizationId`, `marketId`, `idempotencyKey` | string | **WE-ONLY** — context/plumbing we invented; not on this sample. |
| — | — | `events[]` | `PaymentEvent[]` | **WE-ONLY** — synthesized timeline; the real source is a **separate payment-details resource**, not the list row. |

**WIRE-ONLY (present on the wire, absent from our semantics):**
- `paymentMethodId` **as an integer FK** — we carry a string but never treat it as a lookup key (→ Flag 3).
- `currency` **as a real per-row value** — we carry the field but flatten it to a CAD constant (→ Flag 1).
- The envelope's `totalPages` / `hasPreviousPage` / `hasNextPage` — the port derives paging from `totalCount`; we don't consume them (§3).

---

## 2. Enum vocabularies

**`status`** — the largest divergence, and load-bearing.

| Wire (observed) | Our fixture | Likely intent |
|---|---|---|
| `Initiated` | `created` | pre-PSP created |
| `Processing` | `processing` | in flight |
| `Succeeded` | `completed` | terminal success |
| `Failed` | `failed` | terminal failure |
| — (none) | `pending` | **no wire equivalent in the sample** |

Two things to carry back: (a) casing/naming — wire is PascalCase (`Succeeded`), ours lowercase (`completed`);
(b) our **`pending`** has no wire member here. That matters beyond cosmetics: the page's whole severity +
**eligibility** model hangs on `pending` being the actionable state (Complete/Decline enabled only for
Pending; the loud/scan story). If the wire has no Pending, the eligibility anchor has to move. → **Flag 5.**

**`threeDsStatus`** — wire sample shows only `NotRequired`. Ours adds `Authenticated`. Full set (Authenticated
/ Failed / Required / Attempted…?) unknown from one sample.

**`psp`** — wire: `Nuvei`, `Worldpay`. Ours: `Nuvei`, `Adyen`. Need the real provider roster (and whether it's
a closed vocabulary or free-form).

**`direction`** — wire `Deposit` / `Withdrawal` == ours. ✅ No action.

**`currency`** — wire `EUR` only; ours `CAD` only. Whether the field is single- or multi-value in prod is
itself part of Flag 1.

**`pspTransactionId` null rule** — wire confirms our model: **null until a PSP is assigned.** In the sample,
every `Initiated` row and every `Processing` row has `pspTransactionId: null`; every `Succeeded` row has a
value. (Formats vary by PSP: long numeric `7110000000030065021` vs alphanumeric `payVkxXkBeSsmfpUZrXh6uzl0` —
treat as opaque.) Task 2 should tie the null to **pre-PSP status**, not to a row index.

---

## 3. Pagination envelope vs `useClientPagination`

**Wire envelope** (top level of the sample):
```
{ items[], pageNumber, pageSize, totalPages, totalItems, hasPreviousPage, hasNextPage }
```
- `pageNumber` — **1-based** · `pageSize` · `totalItems` · `items[]` = the **server-sliced page**.
- `totalPages`, `hasPreviousPage`, `hasNextPage` — derived conveniences.

**Our port contract** (`Table.types.ts`):
```
pagination: { page /*1-based*/, pageSize, onChange }   +   totalCount   // and the port NEVER slices
```
`useClientPagination` is only the **demo adapter**: it takes the full array and slices it because our fixture
is a client-side blob, not a server.

**Convergence dividend — the adapter is nearly nothing.** The wire is already 1-based and already sliced, and
the port was built server-shaped for exactly this. The whole mapping is a rename, no arithmetic:

| Wire envelope | Port prop | Note |
|---|---|---|
| `pageNumber` | `pagination.page` | both 1-based — **no 0↔1 seam** |
| `pageSize` | `pagination.pageSize` | — |
| `totalItems` | `totalCount` | — |
| `items` | `data` | **no slicing** — the page is the page |
| `totalPages` / `hasNext` / `hasPrevious` | *(unused)* | port derives from `totalCount`/`pageSize`; available as a cross-check |

So for Task 2 the fixture **store returns the envelope natively** (a `getPage(pageNumber, pageSize, filters?)`
→ `{ items, pageNumber, pageSize, totalItems, … }`), and the page's adapter maps those five names onto the
port props — no `useClientPagination` slice in the real path. That thinness is the payoff of the server-shaped
port; worth calling out to Konstantin as the reason the port drops onto the real endpoint cleanly.

---

## 4. Flags — for a ruling, not decided here

1. **EUR vs CAD.** Wire sample is 100% EUR; our fixture is 100% CAD (per spec §2.4, "Boryana's MCP is
   single-currency CAD"). Which is truth for the demo — and **is `currency` single- or multi-value in prod**?
   (If multi, the currency column/filter stop being cosmetic and amount formatting becomes currency-aware.)
2. **`customerEmail` provenance.** Not on the wire list row, but we show it as a column **and** search on it.
   Options: (a) backend joins it into the list response; (b) a separate customer endpoint (per-row or batch)
   we call; (c) it isn't available and the column/search should be dropped or gated. Ops currently relies on
   email search — need the real source before Task 2 can decide whether to keep the field.
3. **`paymentMethodId` lookup.** It's an integer FK into payment-methods, which is where card brand/last4
   (our Phase-B `cardSummary` / `cardType`) would come from. Options: (a) backend embeds a card summary in the
   list row later (our Phase-B seam already expects this); (b) a separate/batch payment-methods lookup;
   (c) never — keep rendering the id. This decides whether `cardType`/`cardSummary` are real or stay proposed.
4. **`amount` units.** Sample amounts are all whole numbers — whole major units (EUR) or minor units (cents)?
   Determines whether Task 2 emits integers or 2-dp decimals, and how the Amount cell formats.
5. **`status` vocabulary — and the eligibility anchor.** Adopt the wire's `Initiated/Processing/Succeeded/
   Failed` verbatim (Task 2 assumes yes). But **does a Pending state exist at all?** If not, the
   Complete/Decline eligibility (today: Pending-only) and the severity/scan story need a new anchor. Also
   confirm casing (PascalCase on the wire) so the badge map + filter values match the API 1:1.

Secondary (lower stakes, still worth a line): **`id` as int vs string** (URL/detail-route impact); the full
**`threeDsStatus`** and **`psp`** rosters; the `+03:00` **timestamp offset** convention.

---

## 5. Questions to take back to Konstantin / Boryana

1. **Currency:** EUR or CAD for the demo — and is `currency` single- or multi-value in production?
2. **Amount:** major units (EUR/CAD) or minor units (cents)? Any scale/precision guarantee?
3. **Status:** is the vocabulary exactly `Initiated / Processing / Succeeded / Failed`, or are there more
   (esp. **any Pending/awaiting-action state**)? Confirm exact casing.
4. **Eligibility:** which status(es) may be Completed / Declined? (Today the UI assumes Pending-only.)
5. **Customer email:** does the payments list carry it, is it a join the backend will add, or a separate
   endpoint? Is email a supported search field server-side?
6. **paymentMethodId:** confirm it's an FK — and how do we resolve card brand/last4 (embedded summary vs a
   payment-methods lookup)? Timeline for an embedded card summary in the list row?
7. **PSP roster:** full provider list (Nuvei, Worldpay, Adyen, …)? Closed vocabulary or free-form?
8. **3DS status roster:** full set beyond `NotRequired` / `Authenticated`?
9. **id type:** integer PK on the wire — is the public/stable transaction identifier the int `id`, or is there
   a separate GUID for URLs and the detail drawer?
10. **Payment-details / events:** is the timeline a separate resource (endpoint + shape)? Are the observed
    event types (`Initiated`/`PspAssigned`/`SubmittedToProvider`/`Approved`) the full set, and **is there a
    failure event type** (today a Failed row's timeline stops at SubmittedToProvider)?
11. **Envelope:** is `{ items, pageNumber, pageSize, totalPages, totalItems, hasPreviousPage, hasNextPage }`
    the stable list-response shape across Gaspar endpoints? Any server-side sort/filter params to mirror?

---

---

## 6. Interim rulings applied — Task 2 (2026-09-24)

Task 2 shipped under these documented INTERIM rulings (fixtures regenerated to the wire shape + envelope
in `apps/gaspar/src/gaspar/transactionsFixture.ts`; each ruling is ledgered in-code against its flag):

| Flag | Interim ruling | Status |
|---|---|---|
| Q1 currency | **CAD** (spec wins); sample EUR flagged test-env | pending confirm |
| Q2 amount | **major units, 2dp** | pending confirm |
| Q3 status | **wire's four, PascalCase** — Initiated/Processing/Succeeded/Failed (via `STATUS_META`) | adopted |
| Q4 eligibility | **anchor = Failed** — Complete/Decline + failure-accent + gating read `STATUS_META`, no literals | INTERIM, product ruling pending |
| Q5 email | **ENRICHED** in the adapter (kept displayed + searchable) | provenance pending |
| Q6 paymentMethodId | **FK kept**, card summary ENRICHED from it (shown in the Payment method cell + reveal) | lookup mechanism pending |
| Q7 psp | **Nuvei / Worldpay** (Adyen dropped) | adopted (sample+spec agree) |
| Q9 id | wire **int PK** kept as `wireId`; **`pay_`-prefixed display id** for continuity (my call) | flagged — drop prefix if int is the identifier |

Q8 (3DS roster), Q10 (events/failure event), Q11 (envelope stability) unchanged — still open, still to
confirm with Konstantin. The pagination path is now the envelope consumed 1-based with no client slicing
(the convergence dividend, §3); `useClientPagination` is retired from this page.
