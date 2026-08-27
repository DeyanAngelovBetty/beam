# Approval flow — maker-checker across the estate

> **2026-08-27 — flow doctrine extracted to [approval-grammar.md](approval-grammar.md).**
> The estate-wide rulings — statuses & lifecycle, parallelism, reasons, and every
> surface that talks about a change request — now live in that grammar doc (ground
> truth). **This file remains the implementation trail** (the save-model inversion,
> the store recipe, dated build history).

*The four-eyes (maker-checker) workstream, introduced 2026-08-10 (Jamie's brief,
via Radi + Georgi): config-changing entities — loyalty statuses, payout configs,
game configs, and whatever joins them — stop applying edits directly. This doc is
the doctrine: the save model, the change-request store, the visibility rules, and
the recipe for putting any entity under approval. Tracer entity: Loyalty Status
(`apps/sunlight`) — landed `a4c64a0`, 2026-08-10. v1 · 2026-08-10.*

*Anticipated by the system before it arrived: BEAM.md §6.4 named `pendingApproval`
a candidate status; §8 requires approval states visible on objects; detail-grammar
§4 parked the commit bar as "the candidate docking point for maker-checker."
That revival criterion is now met — the commit bar remains parked (see Open), but
this is the workstream it was waiting for.*

---

## Walkthrough — the three-actor script *(2026-08-27)*

*One artifact, three jobs: the **acceptance test** (every step names its surface +
expected state), the **demo script**, and the **onboarding doc**. Walk it end to end in
Sunlight, flipping "Acting as" in the shell chrome. Three demo actors:
**Maja Novak** (maker), **Ivan Horvat** (maker), **Ravi Patel** (checker). Ground truth:
[approval-grammar.md](approval-grammar.md).*

**Day-zero state (seeded, out of the box).** One record carries the contest: **Topaz**
holds two competing pendings — Maja's (multiplier → 1.75) and Ivan's (→ 1.6), each with
its own reason. Every other loyalty status is clean. The seeded `seenBy` marks make the
day-zero bars honest: **Ravi** opens to "2 change requests await your review"; **Maja**
and **Ivan** each open to nothing (each has already "seen" the other's proposal, and
neither has an outcome yet).

The script below reproduces the whole lifecycle **by hand on a clean record** (use e.g.
**Amethyst**) so you watch each transition happen live. Counts in the app-level bar are
global, so remember the seeded Topaz contest adds 2 to the checker's review count until
it's resolved.

| # | Act as | Do | Surface → expected state |
|---|---|---|---|
| 1 | **Maja** | Edit Amethyst, change the multiplier, fill the reason composer, **Submit for approval**. | Change-lifecycle strip shows the required reason composer; Submit disabled until it's filled. After submit: Amethyst's view shows the **requester** alert ("You submitted … pending approval", [View request] · [Cancel request]). |
| 2 | **Ivan** | Edit Amethyst, a *different* multiplier + reason, Submit. | Allowed — parallel pendings by different makers (§3). Amethyst view (as Ivan) now shows the requester alert **+ "1 more request is pending on this record"**. Switch to Maja: her requester alert gains the same "+1 more" tail. |
| 3 | **Maja** (guard) | Edit Amethyst again, try to Submit a second time. | The strip shows the **own-pending blocker** at entry — "You already have a pending request on this record — cancel it to submit a new change" + inline [Cancel request]; Submit stays disabled. (The store's `duplicatePending` guard is the safety net; the strip prevents reaching it.) |
| 4 | **Ravi** | Open **Configuration Approvals**. | The list opens **pending-first**. Amethyst's two competing CRs sit on top (plus the seeded Topaz two). Each row shows its **Reason**. Open Ivan's CR → the detail shows the diff, the **submit reason** heading it, a **"1 other pending request on this record"** sibling line, and a **Decision note (optional)** field. |
| 5 | **Ravi** | **Approve** Ivan's CR (optionally add a decision note). | Ivan's CR → **approved**, Amethyst takes multiplier 1.6 (a new revision). **Maja's CR auto-outdates** (§2): its detail shows the **outdated banner** + a historical, non-actionable diff; the list shows it as **outdated**; Amethyst's record page no longer shows Maja's pending. |
| 6 | **Maja** | Look at the app-level bar. | The bar shows the **outcome voice**: "Your change request on Amethyst became outdated" — `info`, dismissible. (This surfaces even though Maja viewed her request while it was pending: "seen" is outcome-relative — §5.) |
| 7 | **Maja** | Click **✕** (or open the CR). | Dismiss and view are the same transition — both mark it seen. The bar slides away. |
| 8 | **Maja** | Trigger no new work; switch away and back. | **No re-nag** — the outcome stays seen; the bar reappears only for genuinely new unseen items. |
| 9 | **Maja** | On a **fresh** clean record (e.g. Opal), submit a CR with a reason. | Requester alert on Opal; the CR joins the checker's queue. |
| 10 | **Ravi** | Open Maja's Opal CR, **Reject** it with a reason in the decision note. | Opal CR → **rejected** (the decision note is recorded and shown on the CR). The live Opal is untouched. |
| 11 | **Maja** | App-level bar. | Outcome voice: "Your change request on Opal was rejected" (`info`, dismissible). ✕ clears it; no re-nag. |

**Every actor-relative derivation flips live on the "Acting as" switch** (verify by
switching mid-step): the page-level alert **voice + counts**, the app-level **bar
contents**, the editor's **own-pending strip mode**, the `duplicatePending` **guard**, and
the CR-detail **action set** ([Cancel request] on your own · [Reject] [Approve] on
another's · none on an archived one).

---

## 1. The save model inversion

**Save stops meaning apply. Save creates a change request.** For an entity under
approval, the editor's primary action is **Submit for approval** — the button says
what it does (detail-grammar §4 save-model slot, header actions, enabled by dirty
state). The live entity is untouched until a *different* user approves. Nothing
applies live, ever, on the maker's side.

This is the single load-bearing decision; everything below is its consequences.

## 2. The ChangeRequest object

One shape serves all three product asks — four-eyes, versioning, notifications:

```ts
interface ChangeRequest<T = unknown> {
  id: string;
  entityType: 'loyaltyStatus';        // union grows via registerEntity, never by editing the store
  entityId: string;                   // string-keyed even when the domain id is numeric
  entityName: string;                 // denormalized for lists/notifications
  baseVersion: number;                // live version the draft was made against
  draft: T;                           // FULL proposed domain payload (no version field)
  status: 'pending' | 'approved' | 'rejected' | 'superseded';
  submittedBy: string; submittedAt: string;
  reviewedBy?: string; reviewedAt?: string; note?: string;
}
```

- **Four-eyes** = approve copies `draft` onto the live entity, bumps its
  `version`, marks the CR approved. Submitter ≠ reviewer is one comparison.
- **Versioning** = **the archive IS the history.** Non-pending CRs are never
  deleted; each approved CR is one revision — author, reviewer, timestamps, full
  payload. No separate revisions table.
- **Notifications** = **derived, never stored.** Any indicator is a selector over
  `listPending()` — no second source of truth to drift. (Surface not built yet;
  see Open.)
- `status` here is the **CR's internal lifecycle union** — it is NOT `BeamStatus`
  and carries no vocabulary implications (§5).

## 3. Store rules (`changeRequests.ts`)

The generic store, `apps/sunlight/src/sunlight/changeRequests.ts` (product-local
per BEAM.md §2 until a second product needs it). API:
`submit / getPendingFor(entityId) / listPending / approve / reject / withdraw / history(entityId)`.

1. **One pending CR per entity.** Resubmit supersedes: the replaced pending CR is
   marked `superseded` and **archived, not deleted**. Rationale: in an iGaming
   back office the audit trail is the product — "what was proposed and then
   withdrawn" is a question compliance asks. `history()` includes superseded
   AND `withdrawn` (a submitter's own retraction; see the Open-items ruling).
2. **Stale check at approval.** `baseVersion !== getVersion(entityId)` →
   `{ ok: false, reason: 'conflict' }`, nothing applied. Surfaced to the
   reviewer in words ("the live entity changed since this request"), never
   silently applied.
3. **Submitter ≠ reviewer**, enforced in the store (`'forbidden'`) *and*
   structurally in the UI (disabled actions + tooltip). Structure prevents;
   the store backstops.
4. **Persistence is one seam.** Demo engine: localStorage, single key
   (`betty.sunlight.changeRequests.v1` — bump the suffix on shape change), private
   `load()/save()` pair, in-memory hydrate on import. **Nothing outside the
   module touches storage.** The real backend table replaces the seam, not the
   consumers.

## 4. The applicator registry — how the store stays generic

The CR store never imports a concrete entity. Each entity store registers itself:

```ts
registerEntity('loyaltyStatus', {
  getVersion(entityId): number | undefined,
  applyDraft(entityId, draft): void,   // replace fields, version += 1
});
```

`approve()` resolves the applicator by `entityType`. A missing applicator is its
own failure — `reason: 'unregistered'` — never masquerading as `notFound`.

**⚠️ Consumer contract: side-effect registration.** Registration happens when the
entity store module is imported. In the app that's guaranteed (pages import their
stores); in **isolation — Storybook is the realistic case** — a surface that
approves CRs must import the entity store *explicitly, with a comment saying
why*. Every future entity type inherits this trap; the comment is doctrine, not
decoration.

## 5. Visibility — badge, not name

- **Never mutate the name.** "(pending approval)" appended to a name is state
  smuggled into data — it would ride into the next draft and get submitted back.
- The list carries an **approval column**: `<BeamStatusBadge status="pending" />`
  when a pending CR exists, **empty otherwise**. No "live" badges on every row —
  one badge on the changed row is signal; ten are noise (the zero-granted-view
  philosophy: the daily reader gets calm).
- **`pending` is a deliberate semantic borrow** from the settlement family
  (settled | pending | refunded | chargeback). The proper word —
  `pendingApproval`, distinct pigment-or-not — is the anticipated §6.4 vocabulary
  extension, decided deliberately on its own day. Recorded so the borrow reads
  as chosen, not accidental.

## 6. Editor grammar for entities under approval

- **View-first — the estate rule.** *Every* detail route opens **read-only** — the same
  anatomy (fields as text, row tables read-only, companions/previews as display), no
  editable affordance — and an explicit **Edit** action enters the editor. Inspecting is
  reading; editing is a separate, deliberate act (list-page-grammar §2: link = read
  intent, Edit = write intent). This holds for direct-write editors and governed ones
  alike; what differs is only the **save model behind Edit**, not the view-first posture.

  *Widened 2026-08-13 — ratified, recorded (late).* This started as a rule for entities
  *under approval*, then got narrowly codified. It was agreed estate-wide the week of
  2026-08-11 (**Deyan, Alex, Tzeno**): all detail pages open view-first; Edit is the
  deliberate flip. That conversation **pre-dated** the narrow codification — the agreement
  existed before the doc said "conditional." Per the drift lesson (§list-page-grammar's own
  episode), agreements get written the day they're made; this one is being written **late**,
  and this note is the repair. The **governed overlay is unchanged**: for an entity under
  approval, Edit still enters the CR editor — Submit-for-approval, dirty gate, `useBlocker`,
  the pending-draft rule below, a pending CR shown in view as a **notice** (not a draft).
  Direct-write editors keep view-first + their own **[Cancel] [Save]**; they onboard the CR
  save model later via the §8 recipe, a save-model change only — the view-first posture is
  already theirs.

  **Cancel exits edit to view, not the page** (detail-grammar §4): the in-page flip returns to
  the same entity's view; the back-link is the page exit. *Divergence, recorded:* the **User
  page** does view↔edit as a **route split** (`/users/:id` vs `/users/:id/edit`), not an in-page
  mode flip — so its `/edit` cancel navigates by its own route mechanism and is **out of scope**
  for the flip rule. Left as-is; unify onto the in-page flip only if the split ever costs us.
- Anatomy = the `PayoutConfigEditor` precedent: `BeamPageHeader` + back link,
  **[Cancel] [Submit for approval]** in the header actions slot, dirty-gated,
  `useBlocker` discard guard. No commit bar (parked, §4 of detail grammar).
- **Import → draft, never store.** A single-entity file import deep-links into edit
  mode with the payload as a dirty draft (banner: "Imported — review and submit for
  approval"); identity (id) is re-anchored to the target, never moved by file. A
  collection import diffs against live and files **one CR per changed entity** (none
  for unchanged). Four-eyes is not bypassable via file — import proposes, it never applies.
- **The view-mode header carries the entity's non-edit actions; edit mode carries only
  the save model.** View is the record's page, so it offers the same per-item non-edit
  actions the row does — **[Export] [Import…] [Edit]**, Edit primary and last. On Edit
  those hide and the header becomes exactly **[Cancel] [Submit for approval]**: importing
  over a live draft is a collision we don't invite (the row/view import paths cover it).
- **Pending-draft rule: the editor seeds from the pending draft, not live.**
  If `getPendingFor()` returns a CR, the maker is continuing the current
  proposal, not restarting — banner states whose draft it is and that submitting
  replaces it. Dirty baseline = the draft; `baseVersion` is **re-read from live
  at submit time** so the stale check stays meaningful.
- **Post-submit → the list.** Landing where your own row now wears the badge is
  the feedback loop that teaches what Submit means. Makers are never routed into
  the approvals queue — that's the checker's room.
- **The "Acting as" switcher is demo scaffolding, not architecture** *(2026-08-14):*
  it fakes a second identity so four-eyes is demonstrable in one browser. The real
  integration target is the **authenticated user + an approve-type permission**
  (the app's auth + permission-check model) — nobody should mistake the switcher for
  the mechanism.

## 7. The approvals surface

`PendingApprovalsPage` (`/pending-approvals`, nav: **Administration** — a
reviewer's surface, same audience as Users/Roles; the future indicator deep-links
here regardless of nav depth). Grammar-conformant list of `listPending()`;
row expands to a **read-only draft summary**; Approve/Reject in the expanded
action bar (list-grammar §3 — never on the row surface).

- **The draft summary is the ceiling.** Live-vs-proposed diffing is a parked
  design round (Figma first); the CR already carries everything it needs
  (`baseVersion` + `draft` + `history()`), so it lands later with **zero store
  changes**. Do not improvise comparison UI.
- Reviewer identity, demo: module-level `currentUser` + a visible "Acting as"
  switcher on this page — honest, demonstrable four-eyes, not faked. Demo actors:
  **Maja (maker)** and **Ravi (checker)**; the switcher defaults to the checker
  and the seeded CR (Topaz multiplier 1.5→1.75) is maker-authored, so
  Approve/Reject are live out of the box. Real identity arrives with the backend.
- **Reset path:** clear `betty.sunlight.changeRequests.v1` (or bump the `.v1`
  suffix on a shape change) to return the demo to its seeded state.

## 8. Onboarding the next entity type (the recipe)

Payout configs, game configs, and successors join by following the tracer, not by
touching the CR store:

1. Entity store gains `version: number` (seeds at 1) and calls
   `registerEntity('<type>', { getVersion, applyDraft })` at module load.
2. `entityType` union gains the word (the one edit inside `changeRequests.ts` —
   a type, not logic).
3. The editor's save action becomes `submit(...)` with **Submit for approval**
   labeling and the §6 pending-draft rule.
4. The list gains the §5 approval column.
5. Stories for any new surface import the entity store per the §4 contract.
6. The detail route flips to **view-first** (§6): read-only by default, an explicit
   Edit action enters the editor. That switch is what turns an always-edit
   direct-write editor into a governed one — do it in the same change as steps 1–3.

An entity onboarded without all six is half-governed; flag it, don't ship it.

## Open questions (deliberately unresolved)

- **Notifications surface** — app-level pending indicator (badge on nav /
  shell chrome) as a derived `listPending()` selector; a `useSyncExternalStore`
  subscription is the noted future shape. Per-role routing, read state,
  push-vs-poll: the larger conversation Jamie flagged.
- **Our CR model is a PROPOSAL, pending the backend team's contract** *(2026-08-14):*
  the parity target (Tzeno's "Configuration Approvals") is a SEPARATE system — its actual
  contract is unavailable to us — so our change-request shape, columns, status vocabulary,
  and the `baseSnapshot`/diff semantics are our own design against their screenshots. They
  exist for design/a11y vetting regardless of eventual adoption; revisit when the real
  contract lands (snapshot capture point, operation types create/update/delete, concurrency).
- **Diff view** — **now built** (`ConfigDiffPanel`, on our `baseSnapshot`): frozen before-state
  vs proposed, changed-only with non-colour markers, snapshot-absent fallback. Live-vs-proposed
  comparison is real; the open part is only reconciling it with the eventual backend diff.
- **Filter-API reconciliation** — the approvals list is built on the existing composition
  `BeamFilterBar`; moving it to a field-schema filter API is a recorded later task, not owned here.
- **App-level alert bar — built** *(2026-08-14, supersedes the earlier "later" deferral for §3
  only).* A standing condition needs a standing surface: `AppAlertBar` is a full-width, in-flow
  alert bar (pushes content down) filling the gap where our shared component set has only a
  transient toast — a proposed organism, product-local for now. The Sunlight instance
  (`PendingReviewAlert`) is DERIVED, never stored: shown iff pending CRs not by the current actor
  > 0, live via the reactive stores, no dismissal (it clears when the queue empties). We do NOT
  invent a toast system; transient outcome notices + conflict/own-request tooltips stay inline.

  *(2026-08-27 — supersedes the no-dismissal ruling above; see [approval-grammar.md](approval-grammar.md) §5.)*
  The bar is now the **unseen-items** model, two voices: a **checker** sees unseen pending CRs not
  authored by them; a **maker** sees their own CRs with unseen terminal outcomes (rejected/outdated),
  aggregated ("2 rejected · 1 outdated"). It is **dismissible** — a Clarity-style ✕ at the right end —
  where **dismissal and viewing are the SAME transition**: both call `markSeen` on the shown items.
  The derived-only principle survives intact: "seen" is the only flag, and the bar reappears solely
  when genuinely new unseen items arrive, never re-nagging about seen ones.
- **Maker-withdraw — BUILT as Withdraw** *(2026-08-14).* Actions now follow the actor's
  RELATIONSHIP to the CR, not a fixed reviewer toolbar with buttons greyed out. A different act
  from a reviewer's Reject: the *submitter* retracts their own pending request (an own-request
  action, no second pair of eyes), archived as a new `withdrawn` status — not deleted, not
  `superseded`. The maker's old disabled Approve/Reject is gone; they see [Withdraw] only.
  ALIGNMENT AGENDA: the backend team's "Cancel" ↔ our "Withdraw" naming mapping (and their
  archive semantics) still to confirm with Tzeno's team.

  Actor → action-set (the vocabulary ruling, implemented):

  | relationship to a **pending** CR | actions |
  | --- | --- |
  | requester (you submitted it) | **[Withdraw]** |
  | approver (anyone else) | **[Reject] [Approve]** |
  | any actor, **archived** CR | none (browse-only) |

  *(2026-08-17)* The page-level **pending-CR alert** is actor-relative too, not just the action set —
  the requester sees a *pending-approval* line with **Withdraw** inline (an own-request action, no
  second pair of eyes), the reviewer sees an *awaiting-review* line with **Review → the CR page**
  (Approve/Reject stay on the CR page, where the diff is). First applied on LoyaltyStatusEditor's
  view-mode alert. Componentizing it as a page-level `BeamAlert` (a sibling of `AppAlertBar` and the
  toast) is a recorded next step, **not** done here — this pass is the copy/behaviour ruling the
  later component will encode.

  Two action rulings for that alert (and for BeamAlert to inherit): **(1) flat only** — page-level
  alert actions are always `variant="text"`; the tinted surface already carries a border, so
  emphasis between actions is by ORDER (primary rightmost), never by variant. (The app-level bar
  keeps its outlined ghost CTA — a different surface, deliberately.) **(2) never wrap** — the action
  cluster holds its size (`flexShrink:0`, `whiteSpace:nowrap`, `alignSelf:center`) while the message
  column flexes/wraps; the two buttons get a real gap and the message keeps its right padding so
  they don't kiss. **Max two actions** on a page-level alert. Seeded as a shared sx
  (`sunlight/pageAlert.ts`) until BeamAlert lands.
- **`pendingApproval` vocabulary word** — the §6.4 extension; decide when the
  borrow starts to chafe (e.g. the day a settlement `pending` and an approval
  `pending` share a screen).
- **Reviewer edit-then-approve** — classic maker-checker forbids it: an edited
  draft re-enters pending for a *different* reviewer, or the second pair of eyes
  reviewed nothing. Not built; record here when the product conversation lands.
- **Approve permission** — who may review is a Roles-model permission name
  (machinery exists); with it, per-role notification routing.
- **Commit bar revival** — the parked dirty-state bar remains the candidate
  docking point if the header save model proves too quiet for approval flows.
- **Rejected → resubmit UX** — how a maker learns of and acts on a rejection
  (currently: the archived CR + note; no surface points at it). Related small
  follow-up: the reject action captures no `note` in the UI yet (the store
  field exists).
- **`rewardType` affordance** — free-text in the tracer (matches the domain's
  string; no invented vocabulary). A select arrives when the domain confirms
  the closed set.
- **Storybook shares the module store across stories** (approving in one story
  consumes the seed) — expected for a live tracer, noted in the story; isolate
  per-story only if it starts costing us.
