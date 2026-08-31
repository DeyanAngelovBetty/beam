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
- **The four-eyes invariant is submitter ≠ reviewer** — that is the whole of
  the rule the flow enforces. *Who may review at all* (role/permission) is a
  backend-owned layer ABOVE it, out of demo scope: in the demo any non-submitter
  can be the second pair of eyes, so a checker who submits a CR sees the
  own-request action set and a DIFFERENT checker approves it (the maker/checker
  labels are demo personas, not enforced permissions).
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
- **One pending CR per maker per record?** Proposed 2026-08-27 (yes) →
  implemented 2026-08-27 (`duplicatePending` guard + editor own-pending
  blocker) → **REVERSED 2026-08-28 (NO — multi-pending, no guard).** A maker
  may hold any number of pending CRs on a record; submitting always creates.
  Rationale (team, 2026-08-28): *less robust, much simpler; the approvals page
  is where contests resolve, and sibling auto-outdate on approve (§2) cleans up
  any pileup — including one maker's own stack — so the guard bought little.*
  Editing is never blocked; a second submit just adds a CR and the record's
  pending count rises. *(The proposed → implemented → reversed trail with all
  three dates is the process, not churn.)*

## 4. Reasons

| act | reason | required? |
|---|---|---|
| submit | why this change (becomes the CR's description) | optional |
| approve | reviewer note | optional |
| reject | why declined | optional *(lean: usage may show this wants to be required — a reasonless reject is a door slammed on the maker; revisit on evidence — Alex's call as proposed, 2026-08-26)* |

*Reasons are OPTIONAL across the board (revised 2026-08-27 — supersedes the
original "submit required" ruling; see the note below). Submit is never gated
on the reason.*

- **Capture ≠ display.** The submit reason is captured once and displayed
  everywhere the CR appears: the approvals list row, the CR detail, the diff
  page. Transparency comes from display, not from where the field lived.
- **Empty is a first-class state.** A CR with no description is normal, not an
  error: every surface that shows the reason renders a quiet placeholder
  ("No description") when it's absent — never a blank-looking layout.
- **Capture surface (maker):** the **DetailsPanel**, as its full-width first
  row (the `gridColumn: '1 / -1'` convention) — a "Change description" field
  captured ALONGSIDE the change, in the one edit surface. It is **present from
  edit-mode entry, disabled until the form goes dirty** (constant geometry, no
  mid-edit layout jump). *(Revised 2026-08-27 — supersedes the original ruling
  that put a REQUIRED composer in the change-lifecycle strip and gated Submit
  on it. Once the reason went optional the composer lost its gate job, and a
  separate strip surface only fragmented the single edit surface — walkthrough
  evidence, Deyan+Alex. The strip keeps the page-level alert and the
  own-pending blocker; only the composer moved.)*
- **Capture surface (checker):** the **first row of the CR detail panel** — a
  "Decision note" field-twin (full-width, `gridColumn: '1 / -1'`), mirroring the
  maker's row: a **field while the CR is decidable by this actor, a stat once
  decided** ("—" on your own CR, where you get no decision voice; the recorded
  note joins Reviewed by / Reviewed at as the review record). Constant geometry —
  the row is present in all three states, field⇄stat swapping in place.
  *(Relocated 2026-08-27 from a standalone field at the bottom of the detail
  page — same move as the maker's reason, and for the same reason: one panel,
  the twins rule carrying the state.)*

## 5. Surfaces

**FEATURE PAGES ARE ACTOR-AGNOSTIC** *(layering principle, 2026-08-28).* A
record page shows the same thing to everyone; actor-awareness (who may cancel,
approve, reject; whose outcomes to surface) is confined to the **approvals
surface** and the **app-level bar**. This keeps the many feature pages simple and
the maker-checker machinery in one place.

**Page-level alert (on the record, view mode)** — ONE universal voice:
- "{n} change request(s) pending on this record." + ONE action:
  **[View change requests]** → the approvals list **filtered by FEATURE TYPE**
  (`?type=<slug>`, e.g. `loyalty-status`), for EVERY actor.
- Editing is never blocked by pending CRs — the alert only informs. Acting on a
  request (Cancel / Approve / Reject) lives on the approvals surface, not here.
- **No per-record filter link.** Filtering the approvals list by an individual
  record is a backend can't, and Radi's not-a-must — *recorded rejected-for-now*
  (revisit if the backend gains it and a real need appears). The count on the
  alert is the record-specific signal; the link scopes by type.
- *(Supersedes the 2026-08-17 actor-relative page alert — requester/reviewer
  voices with [View request] · [Cancel request] / [Review]. That machinery is
  not lost, it MOVED: actor-relative action sets live on the CR detail + list,
  actor-relative voices live on the app-level bar. Team decision 2026-08-28.)*
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
- **"Seen" is outcome-relative, not write-once.** A new outcome re-nags
  exactly once, even if the CR was already viewed while pending: the seen
  mark advances to now on each view, and the maker-outcome derivation counts
  an item unseen when it was last seen BEFORE the outcome landed (rejected /
  outdated). So a maker who opened their pending request still hears when it
  is later rejected or outdated — and it clears the moment they see the
  outcome itself. *(Bug found and fixed during the 2026-08-27 surfaces pass:
  the first cut keyed on mere presence of a seen mark, which suppressed the
  outcome forever once the pending had been viewed.)*

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

## Presentation — inline-delta rendering *(adopted 2026-08-28)*

**Adopted from Alex (official Sunlight), imported deliberately as-is.** Beam's
approval detail for Loyalty Status renders the entity's review layout as
**per-cell old→new deltas**: the old value struck through in an error tint, the
new value in a success tint, side by side; unchanged scalars omitted, unchanged
rows quiet; changed scalars in a responsive `BeamStat` grid; reward rows in a
positional diff table; a description line + gem/name meta above. This is the
**first tracer for taking an organism-level pattern from the Sunlight team into
Beam** — ported faithfully (`ChangeValue`, `LoyaltyStatusDeltaPanel`,
`LoyaltyRewardsDeltaTable`), *not* redesigned. Reservations are logged here, not
fixed in code.

**Two renderings coexist on the page, by intent.** The new delta panel sits
**above the existing `ConfigDiffPanel`, which is unchanged and unmoved** — both
render, deliberately. Whether one eventually **supersedes** the other, or they
**split by role/context**, is an **unresolved future ruling**. Recorded here so
nobody reads the stacking as an accident.

Open items — explicitly **NOT** addressed in this port:

- **(a) Positional (index-based) reward diff → row-insert cascade.** The reward
  table pairs rows by INDEX (`before[i]` vs `after[i]`, row id = the index), so
  inserting or removing a row shifts every row below it and lights them all up as
  false edits. **The strongest form of the observation:** the extraction memo
  found that *the keyed mechanism already exists in the same file* — the scalar
  fields are diffed with `microdiff` over a fixed projection, i.e. addressed by
  field name with no cascade. So the port already contains, side by side, both a
  keyed diff (scalars) and a positional one (rows); only the rows cascade.
  Pending Alex's input on whether the rows should move to a keyed (row-identity)
  diff.
- **(b) Colour-only + strikethrough value encoding.** Change is conveyed by
  colour (error/success) and `line-through` alone — no non-colour channel. An
  a11y gap (WCAG 1.4.1) that needs a shape/text cue eventually; ported as-is.
- **(c) Decision-note placement divergence.** The ported layout keeps the
  decision note **in the panel**; our own doctrine puts change metadata in the
  **change-lifecycle strip / DetailsPanel first row** (§4). Divergence noted,
  unresolved — not reconciled in this port.

*Provenance: Alex (official Sunlight — `features/loyalty/approvals`); ported into
Beam 2026-08-28. Faithful port, reservations logged not fixed.*

## 7. Open questions

1. ~~One pending CR per maker per record?~~ **[2026-08-27 yes → 2026-08-28 REVERSED to NO — multi-pending, no guard (§3).]**
2. Enum spelling `canceled` vs `cancelled` — follow backend contract. **[Tzeno]**
3. Does `outdated` fire on any record change, or only on sibling-CR
   approval? (Direct edits outside the flow shouldn't exist once approval
   is mandatory — but imports/migrations might.) **[Tzeno]**
4. Reject-reason required — revisit on usage evidence (lean recorded in §4).

*Resolved 2026-08-27: reject-on-outdated — no; outdated is fully terminal
(Tzeno). Retention — history kept, cleanup deferred (Tzeno). One pending CR
per maker per record — yes, implemented (§3, §7.1; guard + own-pending strip
mode). Bar "seen" is outcome-relative — a new outcome re-nags once even if the
CR was viewed while pending (§5; bug found + fixed in the surfaces pass).*

*Reversed/amended 2026-08-28 (Deyan + Sunlight team + Radi): one-pending-per-maker
→ NO (multi-pending, guard removed — §3/§7.1); page alert → one universal
count-voice, feature pages actor-agnostic, per-record filtering rejected-for-now
(§5).*

---

*Trail: extracted from approval-flow.md (Withdraw build, actor-relative
alerts, AppAlertBar, ConfigDiffPanel — 2026-08-14…17). New rulings dated
2026-08-27: outdated status + parallel model (Tzeno), outdated fully
terminal + retention deferred (Tzeno), reasons matrix + capture surfaces,
filter-not-tabs + pending-first sort, Cancel rename, unseen-items bar model
+ Clarity-style dismissal (supersedes the 08-14 no-dismissal ruling),
one-pending-per-maker resolved yes (§3/§7.1), outcome-relative seen (§5).
Amended 2026-08-27 (Deyan+Alex walkthrough): reasons OPTIONAL across the board
(supersedes "submit required", §4) + the maker capture surface moved from the
change-lifecycle strip composer into the DetailsPanel first-row field
(supersedes the strip-composer + submit-gate ruling); four-eyes invariant
stated as submitter ≠ reviewer, role permissions backend-owned (§1).
Amended 2026-08-28 (Deyan + Sunlight team + Radi): feature pages actor-agnostic /
one universal page-alert voice + type-filtered link, per-record filtering
rejected-for-now (§5, supersedes 08-17); multi-pending — one-per-maker guard
reversed (§3/§7.1).
Contributor credits: Alex — separate
approval-grammar doc (proposed 2026-08-26), reason-on-reject (optional);
Tzeno — outdated model, backend surfacing constraints; Radi — team
simplification (2026-08-28).*
