import { INF, toDraft, type LoyaltyStatus, type LoyaltyStatusDraft, type StatusReward } from './loyaltyStatuses';

/**
 * loyaltyImportExport — the versioned, typed JSON envelope for Loyalty Status import/export.
 * Two shapes, one entity: a SINGLE status (row export/import) and a LIST (grid export/import).
 * `entityType` + `version` are the guard: a rule-builder file, a theme combo, or a future v2 is
 * rejected with typed errors, never a crash (the Rule Builder import-panel precedent).
 *
 * Import NEVER writes the store. A single import routes the payload to the editor as a DRAFT;
 * a list import files one change request per changed status. Four-eyes is not bypassable via file.
 */

export const IMPORT_VERSION = 1;
const ENTITY_SINGLE = 'loyaltyStatus';
const ENTITY_LIST = 'loyaltyStatusList';

export type StatusExport = { version: 1; entityType: typeof ENTITY_SINGLE; status: LoyaltyStatusDraft };
export type ListExport = { version: 1; entityType: typeof ENTITY_LIST; items: LoyaltyStatusDraft[] };

// Canonical field order → byte-stable round-trips (export → import → approve → export is identical).
function canonicalReward(r: StatusReward): StatusReward {
  return {
    id: r.id,
    pointsToClaim: r.pointsToClaim,
    rewardType: r.rewardType,
    rewardAmount: r.rewardAmount,
    expiryHours: r.expiryHours,
  };
}
function canonicalDraft(d: LoyaltyStatusDraft): LoyaltyStatusDraft {
  return {
    id: d.id,
    gem: d.gem,
    name: d.name,
    maxDays: d.maxDays,
    boxes: d.boxes,
    keepBoxes: d.keepBoxes,
    keepGems: d.keepGems,
    multiplier: d.multiplier,
    rewards: d.rewards.map(canonicalReward),
  };
}

export function serializeStatus(status: LoyaltyStatus): string {
  const payload: StatusExport = { version: IMPORT_VERSION, entityType: ENTITY_SINGLE, status: canonicalDraft(toDraft(status)) };
  return JSON.stringify(payload, null, 2);
}

export function serializeList(statuses: LoyaltyStatus[]): string {
  const payload: ListExport = { version: IMPORT_VERSION, entityType: ENTITY_LIST, items: statuses.map((s) => canonicalDraft(toDraft(s))) };
  return JSON.stringify(payload, null, 2);
}

/** The export gesture — copy to clipboard AND download. The one DOM touch in this module; shared
 *  by the list page (row/grid export) and the detail page's view-mode Export, so both behave alike. */
export function downloadAndCopy(filename: string, json: string): void {
  void navigator.clipboard?.writeText(json);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
export const slugifyName = (s: string) => s.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'loyalty-status';

// ── validation ───────────────────────────────────────────────────────────────────────────────
type Ok<T> = { ok: true } & T;
type Err = { ok: false; errors: string[] };

const isStr = (v: unknown): v is string => typeof v === 'string';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Structural check of one draft; pushes typed errors under `path`. Returns the coerced draft. */
function validateDraft(raw: unknown, path: string, errors: string[]): LoyaltyStatusDraft | null {
  if (typeof raw !== 'object' || raw === null) {
    errors.push(`${path}: not an object.`);
    return null;
  }
  const o = raw as Record<string, unknown>;
  const before = errors.length;
  if (!isNum(o.id) && !isStr(o.id)) errors.push(`${path}: id must be present.`);
  if (!isStr(o.gem)) errors.push(`${path}: gem must be a string.`);
  if (!isStr(o.name)) errors.push(`${path}: name must be a string.`);
  if (!isStr(o.maxDays)) errors.push(`${path}: maxDays must be a string ('${INF}' or digits).`);
  if (!isNum(o.boxes)) errors.push(`${path}: boxes must be a number.`);
  if (!isStr(o.keepBoxes)) errors.push(`${path}: keepBoxes must be a string.`);
  if (!isStr(o.keepGems)) errors.push(`${path}: keepGems must be a string.`);
  if (!isNum(o.multiplier)) errors.push(`${path}: multiplier must be a number.`);
  if (!Array.isArray(o.rewards)) {
    errors.push(`${path}: rewards must be an array.`);
  } else {
    o.rewards.forEach((r, i) => {
      const ro = r as Record<string, unknown>;
      if (typeof r !== 'object' || r === null) return errors.push(`${path}.rewards[${i}]: not an object.`);
      if (!isStr(ro.id)) errors.push(`${path}.rewards[${i}]: id must be a string.`);
      if (!isNum(ro.pointsToClaim)) errors.push(`${path}.rewards[${i}]: pointsToClaim must be a number.`);
      if (!isStr(ro.rewardType)) errors.push(`${path}.rewards[${i}]: rewardType must be a string.`);
      if (!isNum(ro.rewardAmount)) errors.push(`${path}.rewards[${i}]: rewardAmount must be a number.`);
      if (!isNum(ro.expiryHours)) errors.push(`${path}.rewards[${i}]: expiryHours must be a number.`);
    });
  }
  return errors.length === before ? (o as unknown as LoyaltyStatusDraft) : null;
}

function parse(input: string): { data?: unknown; error?: string } {
  try {
    return { data: JSON.parse(input) };
  } catch {
    return { error: 'Not valid JSON.' };
  }
}

/** Envelope guard shared by both shapes — version + entityType. */
function checkEnvelope(o: Record<string, unknown>, expected: string, errors: string[]): void {
  if (o.version !== IMPORT_VERSION) errors.push(`Unsupported version (expected ${IMPORT_VERSION}, got ${String(o.version)}).`);
  if (o.entityType !== expected) errors.push(`Wrong file: expected entityType '${expected}', got '${String(o.entityType)}'.`);
}

export function validateStatusImport(input: string): Ok<{ draft: LoyaltyStatusDraft }> | Err {
  const { data, error } = parse(input);
  if (error) return { ok: false, errors: [error] };
  if (typeof data !== 'object' || data === null) return { ok: false, errors: ['Top level must be an object.'] };
  const o = data as Record<string, unknown>;
  const errors: string[] = [];
  checkEnvelope(o, ENTITY_SINGLE, errors);
  if (errors.length) return { ok: false, errors };
  const draft = validateDraft(o.status, 'status', errors);
  if (!draft || errors.length) return { ok: false, errors: errors.length ? errors : ['Invalid status payload.'] };
  return { ok: true, draft };
}

export function validateListImport(input: string): Ok<{ items: LoyaltyStatusDraft[] }> | Err {
  const { data, error } = parse(input);
  if (error) return { ok: false, errors: [error] };
  if (typeof data !== 'object' || data === null) return { ok: false, errors: ['Top level must be an object.'] };
  const o = data as Record<string, unknown>;
  const errors: string[] = [];
  checkEnvelope(o, ENTITY_LIST, errors);
  if (!Array.isArray(o.items)) errors.push('`items` must be an array.');
  if (errors.length) return { ok: false, errors };
  const items = (o.items as unknown[]).map((raw, i) => validateDraft(raw, `items[${i}]`, errors)).filter(Boolean) as LoyaltyStatusDraft[];
  if (errors.length) return { ok: false, errors };
  return { ok: true, items };
}

// ── merge + diff (identity always comes from LIVE — import can't move a status's id/gem) ────────
const EDITABLE_KEYS = ['name', 'maxDays', 'boxes', 'keepBoxes', 'keepGems', 'multiplier'] as const;

/** The editable fields of `draft`, re-anchored to `live`'s identity (id + gem immutable). */
export function mergeOntoLive(draft: LoyaltyStatusDraft, live: LoyaltyStatus): LoyaltyStatusDraft {
  return {
    id: live.id,
    gem: live.gem,
    name: draft.name,
    maxDays: draft.maxDays || INF,
    boxes: draft.boxes,
    keepBoxes: draft.keepBoxes || INF,
    keepGems: draft.keepGems || INF,
    multiplier: draft.multiplier,
    rewards: draft.rewards.map(canonicalReward),
  };
}

export type StatusDiff = { id: string; name: string; changedFields: number };
export type ListDiff = { changed: StatusDiff[]; unchanged: number; unknown: string[] };

/** Field-level diff of an imported list against live. Unchanged → no CR; unknown ids are skipped. */
export function computeListDiff(items: LoyaltyStatusDraft[], live: LoyaltyStatus[]): ListDiff {
  const byId = new Map(live.map((s) => [String(s.id), s]));
  const changed: StatusDiff[] = [];
  const unknown: string[] = [];
  let unchanged = 0;
  for (const item of items) {
    const liveStatus = byId.get(String(item.id));
    if (!liveStatus) {
      unknown.push(String(item.id));
      continue;
    }
    let n = 0;
    for (const k of EDITABLE_KEYS) if (String(item[k]) !== String(liveStatus[k])) n += 1;
    if (JSON.stringify(item.rewards.map(canonicalReward)) !== JSON.stringify(liveStatus.rewards.map(canonicalReward))) n += 1;
    if (n > 0) changed.push({ id: String(item.id), name: liveStatus.name, changedFields: n });
    else unchanged += 1;
  }
  return { changed, unchanged, unknown };
}
