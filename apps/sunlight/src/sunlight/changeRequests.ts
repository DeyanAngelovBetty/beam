/**
 * changeRequests — the maker-checker core. Save stops meaning "apply": submitting an
 * edit creates a pending ChangeRequest; the live entity is untouched until a DIFFERENT
 * user approves. Approved/rejected/canceled/outdated requests are never deleted — the
 * archive IS the version history (each approved CR = one revision, with author/reviewer/payload).
 *
 * Generic over entity type. It never imports a concrete entity: entity types register an
 * APPLICATOR (getVersion + applyDraft) via `registerEntity`, so the union grows by
 * registration, not by editing this file. Registration is a SIDE EFFECT of importing the
 * entity-store module — a consumer that reaches approve() without having imported that
 * module gets `reason: 'unregistered'` (never a masqueraded 'notFound'). See
 * loyaltyStatuses.ts (registers itself) and PendingApprovalsPage.stories.tsx (imports it
 * on purpose, per that contract).
 *
 * Persistence is localStorage behind the ONE load()/save() seam below — swap those two
 * for a backend table and nothing else changes. Storage key: betty.sunlight.changeRequests.v3
 * (bump the suffix if the shape changes; that's the reset path).
 */

// v3 (approval-grammar v2): the CR model gained structured reasons (submitReason required,
// decisionReason optional), per-actor seen marks (seenBy), and the 'outdated' status; the status
// 'withdrawn' became 'canceled' and 'superseded' was retired (its "another proposal won" role is now
// 'outdated', decided at approve-time, not submit-time). Per the runbook's shape-change rule the
// suffix bumps — so v1/v2 data is DISCARDED on first load (a demo store: acceptable, and pre-v3 CRs
// carry none of the new required fields).
import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'betty.sunlight.changeRequests.v3';

/**
 * CR-internal lifecycle. NOT BeamStatus — no design-vocabulary implications (a neutral badge is all
 * the terminal words ask for). Five words (approval-grammar §2):
 *   pending   — awaiting a second pair of eyes.
 *   approved  — a reviewer applied it; the live entity bumped a revision.
 *   rejected  — a reviewer declined it; the live entity untouched.
 *   canceled  — the REQUESTER retracted their own still-pending request (their own act, not a review).
 *   outdated  — another CR on the SAME record was approved, so this pending one is moot. A SYSTEM
 *               transition (no actor), fully terminal — no transitions out.
 * SPELLING: 'canceled' (one 'l', American). This is the canonical location; the backend contract may
 * use a different term (grammar §7.2 alignment — see the task report).
 */
export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected' | 'canceled' | 'outdated';

/** The entity-type union. Grows as more entities adopt maker-checker. */
export type ChangeRequestEntity = 'loyaltyStatus';

export interface ChangeRequest<T = unknown> {
  id: string;
  entityType: ChangeRequestEntity;
  entityId: string;
  entityName: string; // denormalized so lists never join
  baseVersion: number; // the live version the draft was made against (stale check)
  draft: T; // full proposed domain payload (fields + rewards; no version)
  // The BEFORE-state: the live entity captured at submit time, IMMUTABLE thereafter. This is what
  // makes an archived CR's diff historically stable — it shows what changed THEN, even after the
  // live entity moves on. Optional: pre-v3 / hand-built CRs may lack it → the diff renders its
  // "snapshot unavailable" fallback.
  baseSnapshot?: T;
  status: ChangeRequestStatus;
  submittedBy: string;
  submittedAt: string;
  /** Why the requester proposed this change (approval-grammar §4). OPTIONAL — never gates submit;
   *  surfaces that show it render a quiet "No description" placeholder when it's absent. */
  submitReason?: string;
  reviewedBy?: string; // set on approve/reject; empty for canceled/outdated (no reviewer acted)
  reviewedAt?: string; // set when a REVIEWER acts (approved/rejected)
  /** The reviewer's rationale, set on approve/reject when given (approval-grammar §4). Optional. */
  decisionReason?: string;
  /** Set on cancel (by the submitter, while pending). A cancellation is NOT a review, so
   *  reviewedBy/At stay empty; this is its own timestamp (by = submittedBy, implicit). */
  canceledAt?: string;
  /** Set when approve() of a SIBLING CR outdated this one. A system transition — no actor. */
  outdatedAt?: string;
  /** Per-actor seen marks (approval-grammar §5): actor → ISO timestamp of when they last saw this CR.
   *  The ONLY alert flag in the model — no stored "unread" state; the selectors derive from this. */
  seenBy: Record<string, string>;
}

export interface SubmitInput<T = unknown> {
  entityType: ChangeRequestEntity;
  entityId: string;
  entityName: string;
  baseVersion: number;
  draft: T;
  /** The live entity's current state, captured by the caller at submit time → the CR's frozen
   *  before-state. Required: the caller holds the live entity, this module stays entity-agnostic. */
  baseSnapshot: T;
  submittedBy: string;
  /** Why the change is proposed (approval-grammar §4). OPTIONAL — never gates submit. */
  submitReason?: string;
}

/** How approve() writes a draft onto a concrete entity without this module importing it. */
export interface EntityApplicator<T = unknown> {
  getVersion(entityId: string): number | undefined;
  applyDraft(entityId: string, draft: T): void;
}

export type ApproveResult =
  | { ok: true; cr: ChangeRequest }
  | { ok: false; reason: 'notFound' | 'unregistered' | 'forbidden' | 'conflict' };

export type RejectResult = { ok: true; cr: ChangeRequest } | { ok: false; reason: 'notFound' | 'forbidden' };

export type CancelResult = { ok: true; cr: ChangeRequest } | { ok: false; reason: 'forbidden' | 'notPending' };

// ── The one persistence seam ─────────────────────────────────────────────────────────
function load(): ChangeRequest[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return raw ? (JSON.parse(raw) as ChangeRequest[]) : [];
  } catch {
    return []; // corrupt/unavailable storage → start clean rather than throw
  }
}

function save(): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  } catch {
    /* storage full / unavailable — the in-memory array stays authoritative this session */
  }
}

// In-memory source of truth for the session, mirrored to storage on every mutation.
const requests: ChangeRequest[] = load();
const applicators = new Map<ChangeRequestEntity, EntityApplicator>();

// Reactivity (the noted useSyncExternalStore shape): a monotonic revision + a listener Set, so
// derived views (the app-level review alert, the approvals list) re-render on any CR mutation —
// the demo beat "submit → switch actor → the bar is just there" needs a live read, not a tick.
const crListeners = new Set<() => void>();
let crRevision = 0;
function emitChange(): void {
  crRevision += 1;
  crListeners.forEach((l) => l());
}
/** Subscribe to change-request mutations (submit / approve / reject / cancel / markSeen). */
export function subscribeChangeRequests(onChange: () => void): () => void {
  crListeners.add(onChange);
  return () => crListeners.delete(onChange);
}
/** Reactive read — returns a revision that bumps on every mutation; consumers re-read live. */
export function useChangeRequests(): number {
  return useSyncExternalStore(
    subscribeChangeRequests,
    () => crRevision,
    () => crRevision,
  );
}

let idSeq = 0;
function newCrId(): string {
  idSeq += 1;
  return `cr-${Date.now().toString(36)}-${idSeq}`;
}

function now(): string {
  return new Date().toISOString();
}

/** An entity type registers how its drafts are versioned and applied. */
export function registerEntity<T>(entityType: ChangeRequestEntity, applicator: EntityApplicator<T>): void {
  applicators.set(entityType, applicator as EntityApplicator);
}

/**
 * Create a pending CR. Concurrent pendings on the same record are ALLOWED without limit
 * (approval-grammar §3) — ANY number, by any actor INCLUDING the same maker twice. Approval resolves
 * the pileup: approving one outdates all its siblings (§2). *(2026-08-28: the one-open-per-maker
 * guard, proposed + implemented 2026-08-27, was reversed — less robust, much simpler, and the
 * approvals page is where contests resolve. submit() always creates; there are no refusals, so it
 * returns the CR directly rather than a result union.)*
 */
export function submit<T>(input: SubmitInput<T>): ChangeRequest<T> {
  const cr: ChangeRequest<T> = {
    id: newCrId(),
    entityType: input.entityType,
    entityId: input.entityId,
    entityName: input.entityName,
    baseVersion: input.baseVersion,
    draft: input.draft,
    baseSnapshot: input.baseSnapshot, // frozen at submit
    status: 'pending',
    submittedBy: input.submittedBy,
    submittedAt: now(),
    submitReason: input.submitReason,
    seenBy: {}, // no one has "seen" it yet — not even the author (keeps outcome alerts honest)
  };
  requests.push(cr as ChangeRequest);
  save();
  emitChange();
  return cr;
}

/** All pending CRs (approvals queue; app-level indicators are selectors over this). */
export function listPending(): ChangeRequest[] {
  return requests.filter((r) => r.status === 'pending');
}

// The action/event timestamp a CR sorts by: the reviewer's action, else its terminal system/own
// event, else submission. One helper so listAll() and history() never drift.
function lastActionAt(r: ChangeRequest): string {
  return r.reviewedAt ?? r.canceledAt ?? r.outdatedAt ?? r.submittedAt;
}

/**
 * ALL change requests, newest-first — the filterable read backing the approvals list + its ARCHIVE
 * (approved/rejected/canceled/outdated are browsable, not just the pending queue). A copy, so callers
 * can't mutate the store array. Filtering (status/type/search/date) is the page's job.
 */
export function listAll(): ChangeRequest[] {
  return [...requests].sort((a, b) => {
    const ka = lastActionAt(a);
    const kb = lastActionAt(b);
    return ka < kb ? 1 : ka > kb ? -1 : 0; // newest first (last action, else submitted)
  });
}

/** A single change request by id — the detail route + approve/reject from that page. */
export function getChangeRequest(id: string): ChangeRequest | undefined {
  return requests.find((r) => r.id === id);
}

/**
 * Approve: apply the draft onto the live entity and bump its version. Enforces submitter ≠ reviewer,
 * and a stale check against the entity's current version. ATOMIC auto-outdate (approval-grammar §2):
 * every OTHER pending CR on the same record flips to 'outdated' in the same call — approval of one
 * proposal moots its rivals. 'unregistered' is distinct from 'notFound' so a wiring gap never hides
 * as a missing CR. `decisionReason` is the reviewer's optional rationale.
 */
export function approve(crId: string, reviewer: string, decisionReason?: string): ApproveResult {
  const cr = requests.find((r) => r.id === crId);
  if (!cr || cr.status !== 'pending') return { ok: false, reason: 'notFound' };
  const applicator = applicators.get(cr.entityType);
  if (!applicator) return { ok: false, reason: 'unregistered' };
  if (cr.submittedBy === reviewer) return { ok: false, reason: 'forbidden' };
  const liveVersion = applicator.getVersion(cr.entityId);
  if (liveVersion === undefined || liveVersion !== cr.baseVersion) return { ok: false, reason: 'conflict' };
  applicator.applyDraft(cr.entityId, cr.draft);
  cr.status = 'approved';
  cr.reviewedBy = reviewer;
  cr.reviewedAt = now();
  if (decisionReason) cr.decisionReason = decisionReason;
  // Atomic with the approval: every OTHER pending CR on this record is now moot.
  const outdatedAt = cr.reviewedAt;
  for (const other of requests) {
    if (other !== cr && other.entityId === cr.entityId && other.status === 'pending') {
      other.status = 'outdated';
      other.outdatedAt = outdatedAt;
    }
  }
  save();
  emitChange();
  return { ok: true, cr };
}

/** Reject: archive as rejected with an optional reviewer rationale. The live entity is never touched. */
export function reject(crId: string, reviewer: string, decisionReason?: string): RejectResult {
  const cr = requests.find((r) => r.id === crId);
  if (!cr || cr.status !== 'pending') return { ok: false, reason: 'notFound' };
  if (cr.submittedBy === reviewer) return { ok: false, reason: 'forbidden' };
  cr.status = 'rejected';
  cr.reviewedBy = reviewer;
  cr.reviewedAt = now();
  if (decisionReason) cr.decisionReason = decisionReason;
  save();
  emitChange();
  return { ok: true, cr };
}

/**
 * Cancel: the SUBMITTER retracts their own still-pending request (approval-grammar §2 — was
 * 'withdraw'). Archived, not deleted ("proposed then thought better of" is history compliance asks
 * about). A cancellation is NOT a review — reviewedBy/At stay empty; canceledAt records when
 * (by = submittedBy, implicit). Refusals: 'forbidden' (not the submitter), 'notPending' (already
 * archived / gone). Resubmitting afterward is unblocked — 'canceled' is non-pending, so it never
 * trips the §3 same-actor guard in submit().
 */
export function cancel(crId: string, actor: string): CancelResult {
  const cr = requests.find((r) => r.id === crId);
  if (!cr || cr.status !== 'pending') return { ok: false, reason: 'notPending' };
  if (cr.submittedBy !== actor) return { ok: false, reason: 'forbidden' };
  cr.status = 'canceled';
  cr.canceledAt = now();
  save();
  emitChange();
  return { ok: true, cr };
}

/**
 * Mark CRs as seen by an actor (approval-grammar §5). Used by the CR-detail view (a checker opening a
 * pending request; a requester opening a rejected/outdated outcome) AND by bar dismissal alike —
 * seen is the ONLY alert flag, so both paths write the same mark. Unknown ids are skipped.
 *
 * The mark ADVANCES to now on every call (it is not write-once). This is load-bearing for outcomes:
 * a maker who viewed their request while it was PENDING has a seen-mark; when it later becomes
 * rejected/outdated, that OUTCOME is newer than the mark, so `unseenOutcomesForRequester` compares
 * timestamps (not mere presence) and still surfaces it — until the maker sees the outcome itself,
 * which re-advances the mark past it. "A new outcome lands" thus re-nags exactly once.
 */
export function markSeen(crIds: string[], actor: string): void {
  const ts = now();
  let touched = false;
  for (const id of crIds) {
    const cr = requests.find((r) => r.id === id);
    if (cr) {
      cr.seenBy[actor] = ts; // advance the mark (see the outcome-time comparison below)
      touched = true;
    }
  }
  if (touched) {
    save();
    emitChange();
  }
}

// ── Derived selectors (derived-only doctrine — no stored alert state; `seenBy` is the one flag) ──

/** Every pending CR on a record (approval-grammar §5 — the contest set a checker chooses among). */
export function pendingOnRecord(recordId: string): ChangeRequest[] {
  return requests.filter((r) => r.entityId === recordId && r.status === 'pending');
}

/** For a CHECKER: pending CRs they can act on (not their own) and haven't yet seen. Drives the
 *  reviewer's unseen-work indicator. */
export function unseenPendingForChecker(actor: string): ChangeRequest[] {
  return requests.filter(
    (r) => r.status === 'pending' && r.submittedBy !== actor && r.seenBy[actor] === undefined,
  );
}

/** For a REQUESTER: their OWN CRs whose negative OUTCOME (rejected | outdated) they haven't seen.
 *  "Unseen" is outcome-relative, not mere absence: an item counts if never seen OR last seen BEFORE
 *  the outcome landed (they saw the request while pending, but not its result). Approved outcomes
 *  apply to the live entity and aren't alerted here; canceled is the requester's own act (excluded). */
export function unseenOutcomesForRequester(actor: string): ChangeRequest[] {
  return requests.filter((r) => {
    if (r.submittedBy !== actor) return false;
    if (r.status !== 'rejected' && r.status !== 'outdated') return false;
    const outcomeAt = r.status === 'rejected' ? r.reviewedAt : r.outdatedAt;
    const seen = r.seenBy[actor];
    return seen === undefined || (outcomeAt !== undefined && seen < outcomeAt);
  });
}

/** The archive for an entity = its version history (approved + rejected + canceled + outdated), newest first. */
export function history(entityId: string): ChangeRequest[] {
  return requests
    .filter((r) => r.entityId === entityId && r.status !== 'pending')
    .sort((a, b) => {
      const ka = lastActionAt(a);
      const kb = lastActionAt(b);
      return ka < kb ? 1 : ka > kb ? -1 : 0; // newest first
    });
}

/**
 * Run a demo seed on a fresh store only (empty storage). The entity store owns the concrete draft
 * shape + how many CRs to seed (this module stays entity-agnostic), so it passes a thunk that may
 * submit several CRs and set seen marks. On a fresh store the duplicate guard can't fire.
 */
export function seedIfEmpty(seed: () => void): void {
  if (requests.length === 0) seed();
}
