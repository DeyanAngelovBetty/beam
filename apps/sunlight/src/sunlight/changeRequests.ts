/**
 * changeRequests — the maker-checker core. Save stops meaning "apply": submitting an
 * edit creates a pending ChangeRequest; the live entity is untouched until a DIFFERENT
 * user approves. Approved/rejected/superseded requests are never deleted — the archive
 * IS the version history (each approved CR = one revision, with author/reviewer/payload).
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
 * for a backend table and nothing else changes. Storage key: betty.sunlight.changeRequests.v1
 * (bump the suffix if the shape changes; that's the reset path).
 */

// v2: the CR shape gained `baseSnapshot` (the before-state, for the review diff). Per the
// runbook's own rule, a shape change bumps the suffix — so v1 data is DISCARDED on first load
// (a demo store: acceptable, and pre-snapshot CRs would render the diff fallback anyway).
import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'betty.sunlight.changeRequests.v2';

/** CR-internal lifecycle. NOT BeamStatus — no design-vocabulary implications. */
export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected' | 'superseded';

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
  // live entity moves on. Optional: pre-v2 / hand-built CRs may lack it → the diff renders its
  // "snapshot unavailable" fallback. Supersede captures a FRESH snapshot for the new CR.
  baseSnapshot?: T;
  status: ChangeRequestStatus;
  submittedBy: string;
  submittedAt: string;
  reviewedBy?: string; // set on approve/reject; left empty when superseded (no reviewer acted)
  reviewedAt?: string; // set when the CR leaves 'pending' (approved/rejected/superseded)
  note?: string;
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
  note?: string;
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
/** Subscribe to change-request mutations (submit / approve / reject / supersede). */
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
 * Create a pending CR. One pending per entity: any existing pending for the same entity
 * is marked 'superseded' and ARCHIVED (not deleted) — "what was proposed then withdrawn"
 * is a question compliance asks.
 */
export function submit<T>(input: SubmitInput<T>): ChangeRequest<T> {
  const prior = requests.find((r) => r.entityId === input.entityId && r.status === 'pending');
  if (prior) {
    prior.status = 'superseded';
    prior.reviewedAt = now();
    prior.note = 'Superseded by a newer submission.';
  }
  const cr: ChangeRequest<T> = {
    id: newCrId(),
    entityType: input.entityType,
    entityId: input.entityId,
    entityName: input.entityName,
    baseVersion: input.baseVersion,
    draft: input.draft,
    baseSnapshot: input.baseSnapshot, // frozen at submit; supersede captures fresh per submission
    status: 'pending',
    submittedBy: input.submittedBy,
    submittedAt: now(),
    note: input.note,
  };
  requests.push(cr as ChangeRequest);
  save();
  emitChange();
  return cr;
}

/** The single pending CR for an entity (list badge + editor pending-draft load). */
export function getPendingFor(entityId: string): ChangeRequest | undefined {
  return requests.find((r) => r.entityId === entityId && r.status === 'pending');
}

/** All pending CRs (approvals queue; future app-level indicator is a selector over this). */
export function listPending(): ChangeRequest[] {
  return requests.filter((r) => r.status === 'pending');
}

/**
 * ALL change requests, newest-first — the filterable read backing the approvals list + its
 * ARCHIVE (approved/rejected/superseded are now browsable, not just the pending queue). A copy,
 * so callers can't mutate the store array. Filtering (status/type/search/date) is the page's job.
 */
export function listAll(): ChangeRequest[] {
  return [...requests].sort((a, b) => {
    const ka = a.reviewedAt ?? a.submittedAt;
    const kb = b.reviewedAt ?? b.submittedAt;
    return ka < kb ? 1 : ka > kb ? -1 : 0; // newest first (reviewed, else submitted)
  });
}

/** A single change request by id — the detail route + approve/reject from that page. */
export function getChangeRequest(id: string): ChangeRequest | undefined {
  return requests.find((r) => r.id === id);
}

/**
 * Approve: apply the draft onto the live entity and bump its version. Enforces
 * submitter ≠ reviewer, and a stale check against the entity's current version.
 * 'unregistered' is distinct from 'notFound' so a wiring gap never hides as a missing CR.
 */
export function approve(crId: string, reviewer: string): ApproveResult {
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
  save();
  emitChange();
  return { ok: true, cr };
}

/** Reject: archive as rejected with an optional note. The live entity is never touched. */
export function reject(crId: string, reviewer: string, note?: string): RejectResult {
  const cr = requests.find((r) => r.id === crId);
  if (!cr || cr.status !== 'pending') return { ok: false, reason: 'notFound' };
  if (cr.submittedBy === reviewer) return { ok: false, reason: 'forbidden' };
  cr.status = 'rejected';
  cr.reviewedBy = reviewer;
  cr.reviewedAt = now();
  cr.note = note;
  save();
  emitChange();
  return { ok: true, cr };
}

/** The archive for an entity = its version history (approved + rejected + superseded), newest first. */
export function history(entityId: string): ChangeRequest[] {
  return requests
    .filter((r) => r.entityId === entityId && r.status !== 'pending')
    .sort((a, b) => {
      const ka = a.reviewedAt ?? a.submittedAt;
      const kb = b.reviewedAt ?? b.submittedAt;
      return ka < kb ? 1 : ka > kb ? -1 : 0; // newest first
    });
}

/**
 * Seed a demo pending CR on a fresh store only (empty storage). Called by the entity
 * store, which owns the concrete draft shape — this module stays entity-agnostic.
 */
export function seedPendingIfEmpty<T>(makeInput: () => SubmitInput<T>): void {
  if (requests.length === 0) submit(makeInput());
}
