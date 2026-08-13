# Approval flow — maker-checker across the estate

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
`submit / getPendingFor(entityId) / listPending / approve / reject / history(entityId)`.

1. **One pending CR per entity.** Resubmit supersedes: the replaced pending CR is
   marked `superseded` and **archived, not deleted**. Rationale: in an iGaming
   back office the audit trail is the product — "what was proposed and then
   withdrawn" is a question compliance asks. `history()` includes superseded.
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
- **Diff view** — the review round: live-vs-proposed comparison, Figma first.
- **Maker-withdraw** (the reference UI's "Cancel") — semantics to align with the backend
  team before building. It is a DIFFERENT act from a reviewer's Reject: the *submitter*
  retracts their own pending request (an own-request action, no second pair of eyes). We
  deliberately have not built it — our vocabulary stays Approve / Reject, identical on list
  and detail. Confirm the semantics (and whether it archives as `superseded` or a new
  `withdrawn` state) with Tzeno's team on Monday.
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
