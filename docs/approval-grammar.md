# Approval Grammar

*The estate-wide rules for maker-checker change approval: statuses, parallel
requests, reasons, and every surface that talks about a change request. This
doc governs any Beam product that adopts the approval flow (Sunlight today;
Gaspar's rule builder via the maker-checker socket next). It extracts and
supersedes the flow sections of `approval-flow.md`, which remains the
implementation trail.*

*v0.1 draft · 2026-08-27 · Deyan (design) · with Alex (separate-doc proposal,
reason fields, optional-on-reject) and Tzeno (outdated model, backend
contract).*

---

## 1. Vocabulary

- **Maker** submits change requests (CRs); **checker** approves or rejects
  them. Four eyes: nobody decides on their own request.
- A **change request** carries a **proposed target state** (a snapshot of
  what the record should become), not a patch. "Change 1 → 3" is stored as
  "make it 3." This is what keeps parallel requests mechanically coherent:
  approving in any order is last-approved-wins, and no rebase machinery
  exists or is needed (rejected as out-of-scope machinery — see §3).
- The record itself never changes until a CR on it is approved.

## 2. Statuses & lifecycle

`pending · approved · rejected · canceled · outdated`

- **pending** — submitted, awaiting review. The only status a checker acts on.
- **approved** — checker accepted; the record takes the proposed state.
- **rejected** — checker declined, optionally with a reason (§4).
- **canceled** — the requester canceled their own pending request.
  *(Renames the earlier `withdrawn`: "withdraw" is a payments word at Betty —
  domain collision. Spelling of the enum string follows the backend
  contract — align with Tzeno once, record here.)*
- **outdated** — automatic: the record changed underneath a pending request
  (a sibling CR was approved), so its base no longer holds. Backend-driven
  (Tzeno). An outdated CR leaves the pending queue — the checker's queue is
  always honest; a stale diff is never actionable. **Fully terminal**: no
  reject-on-outdated, no transitions out (decided with Tzeno, 2026-08-27).
- Terminal statuses (approved / rejected / canceled / outdated) are archived
  states: visible in the approvals list under filters, never re-openable.
  Resubmission = a new CR.
- **Retention:** terminal CRs are kept as history. Cleanup (when/how they
  purge) is deliberately unspecified — a future backend decision (Tzeno),
  not a gap.

## 3. Parallelism

- **Multiple makers may hold pending CRs against the same record.** The
  checker chooses between competing proposals; the record shows its current
  (approved) state to everyone meanwhile.
- On approval of any CR, all sibling pending CRs on that record become
  `outdated` (§2). No auto-rejection, no rebase, no live re-diffing against
  a moving base — those were considered and rejected as machinery without a
  back-office customer (recorded so the "why can't we…" has an answer).
- **Proposed, needs decision:** one pending CR per maker per record.
  Parallel across people is the feature; parallel within one person is
  version spam — their own Cancel-and-resubmit path is the edit mechanism.
  **[open — Deyan to rule]**

## 4. Reasons

| act | reason | required? |
|---|---|---|
| submit | why this change (becomes the CR's description) | **required** |
| approve | reviewer note | optional |
| reject | why declined | optional *(lean: usage may show this wants to be required — a reasonless reject is a door slammed on the maker; revisit on evidence — Alex's call as proposed, 2026-08-26)* |

- **Capture ≠ display.** The submit reason is captured once and displayed
  everywhere the CR appears: the approvals list row, the CR detail, the diff
  page. Transparency comes from display, not from where the field lived.
- **Capture surface (maker):** the change-lifecycle strip — the ratified
  region between page header and details panel (`[header] · [page-level
  alert / change strip] · [details panel] · [rest]`). In edit mode, when the
  form goes dirty, the strip presents the reason composer ("Describe this
  change for review"); Submit stays disabled until filled. Not a dialog (no
  ambush after the fact, requirement visible before submitting), and not a
  DetailsPanel field (the reason is metadata about the change, not a field
  of the record — it must not dress like one).
- **Capture surface (checker):** inline on the CR detail page, where the
  decision meets the diff.

## 5. Surfaces

**Page-level alert (on the record, view mode)** — actor-relative, per the
existing ruling, now count-aware:
- Requester: "You submitted a change request on {date} — it's pending
  approval." + "{n} more request(s) are pending on this record" when true.
  Actions: [View request] · [Cancel request].
- Anyone else: "{n} change request(s) are pending on this record — awaiting
  review." Action: [View requests] → approvals list **filtered by record**.
- Editing is never blocked by pending CRs — the alert informs.
- Outcome statuses (rejected/outdated) do NOT surface on the record page or
  as list-page columns — backend contract constraint (Tzeno, 2026-08-27).
  Outcome awareness lives in the app-level bar + the approvals page.

**App-level bar (AppAlertBar)** — one rule, two voices: the bar renders
**your unseen items**.
- Checker: unseen pending CRs not authored by you ("{n} change requests
  awaiting review — [Review]").
- Maker: your CRs with unseen terminal outcomes — "Your change request on
  {record} was rejected" / "…became outdated", aggregated when several
  ("2 rejected · 1 outdated") → approvals page filtered to yours.
- **Dismissible** (Clarity-style: an ✕ icon button at the right end of the
  bar). Dismissal and viewing are the SAME transition — mark the currently
  shown items seen. The bar stays derived: it reappears only when genuinely
  new items exist (a new CR arrives, a new outcome lands), never re-nagging
  about seen ones. No arbitrary dismissal state — "seen" is the only flag.
  *(Amends the AppAlertBar's original no-manual-dismissal ruling
  (2026-08-14) — superseded 2026-08-27; the derived-only principle survives,
  dismissal is just another way to mark seen.)*

**Approvals list page:**
- Status is a **filter, not tabs** — one queue, not five pages; statuses are
  a filter dimension, not navigation contexts. Filter lives in the
  BeamFilterBar (status multi-select + the existing record filter).
- **Sort: pending pinned first**, then the rest by recency. The checker's
  default view is "everything actionable, on top."

**CR detail page:**
- The diff (ConfigDiffPanel) renders base → proposed. On an outdated CR it
  is a historical record under an explicit outdated banner, never an
  actionable comparison.
- Sibling awareness at decision time: "{n} other pending request(s) on this
  record" → the record-filtered list. (Side-by-side comparison UI:
  deliberately out of scope this round.)

## 6. Verbs & copy

- **"Cancel request"** — always verb + object, never bare "Cancel" (which
  already lives next to Save in edit mode) and never "Withdraw" (payments
  collision). Confirm dialog travels with the action, per ConfirmDialog
  doctrine.
- Status words in UI match the enum: a canceled CR is "canceled", not
  "withdrawn", everywhere including historical copy.

## 7. Open questions

1. One pending CR per maker per record? **[Deyan — proposed yes]**
2. Enum spelling `canceled` vs `cancelled` — follow backend contract. **[Tzeno]**
3. Does `outdated` fire on any record change, or only on sibling-CR
   approval? (Direct edits outside the flow shouldn't exist once approval
   is mandatory — but imports/migrations might.) **[Tzeno]**
4. Reject-reason required — revisit on usage evidence (lean recorded in §4).

*Resolved 2026-08-27: reject-on-outdated — no; outdated is fully terminal
(Tzeno). Retention — history kept, cleanup deferred (Tzeno).*

---

*Trail: extracted from approval-flow.md (Withdraw build, actor-relative
alerts, AppAlertBar, ConfigDiffPanel — 2026-08-14…17). New rulings dated
2026-08-27: outdated status + parallel model (Tzeno), outdated fully
terminal + retention deferred (Tzeno), reasons matrix + capture surfaces,
filter-not-tabs + pending-first sort, Cancel rename, unseen-items bar model
+ Clarity-style dismissal (supersedes the 08-14 no-dismissal ruling). Contributor credits: Alex — separate
approval-grammar doc (proposed 2026-08-26), reason-on-reject (optional);
Tzeno — outdated model, backend surfacing constraints.*
