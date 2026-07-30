import {
  nameIsUnique,
  type GameType,
  type PayoutConfig,
  type PayoutConfigInput,
  type PayoutRow,
  type RewardType,
} from './payoutConfigs';

/**
 * The Payout Config editor's FORM model — the working shape the create/edit
 * page and PayoutRowsEditor share. Probabilities are held as raw percentage
 * STRINGS (what the user typed) so editing never reformats mid-keystroke or
 * leaks ×100 float artifacts; conversion to the 0..1 domain happens on save.
 * Each row/reward carries a client-only `_key` for React (never leaves the
 * form); domain identity is the optional `id` (the PUT contract, brief §5.2).
 */

export interface EditorReward {
  _key: string;
  rewardType: RewardType;
  amount: string; // raw input — positive whole number
}

export interface EditorRow {
  _key: string;
  id?: string;
  winMessage: string;
  probabilityPct: string; // raw percentage input
  rewards: EditorReward[];
}

export interface EditorModel {
  name: string;
  gameType: GameType | '';
  rows: EditorRow[];
}

export const REWARD_TYPES: RewardType[] = ['Coins', 'Tokens'];
export const MAX_NAME = 100;
export const MAX_WIN_MESSAGE = 200;
const EPS = 1e-6;

let keySeq = 0;
/** Client-only React key — never part of the domain. */
export function clientKey(): string {
  keySeq += 1;
  return `k${keySeq}`;
}

/** First reward type not yet used in a row (for Add Reward / a new row's default). */
export function firstUnusedType(rewards: { rewardType: RewardType }[]): RewardType | undefined {
  return REWARD_TYPES.find((t) => !rewards.some((r) => r.rewardType === t));
}

export function emptyReward(rewardType: RewardType = 'Coins'): EditorReward {
  return { _key: clientKey(), rewardType, amount: '' };
}

export function emptyRow(): EditorRow {
  return { _key: clientKey(), winMessage: '', probabilityPct: '', rewards: [emptyReward('Coins')] };
}

export function emptyModel(): EditorModel {
  return { name: '', gameType: '', rows: [emptyRow()] };
}

/** 0..1 → percentage input string, float tail trimmed (0.69895 → "69.895"). */
export function formatPctForInput(p: number): string {
  return String(Number((p * 100).toFixed(6)));
}

export function toEditorModel(config: PayoutConfig): EditorModel {
  return {
    name: config.name,
    gameType: config.gameType,
    rows: config.rows.map((row) => ({
      _key: clientKey(),
      id: row.id,
      winMessage: row.winMessage,
      probabilityPct: formatPctForInput(row.probability),
      rewards: row.rewards.map((r) => ({ _key: clientKey(), rewardType: r.rewardType, amount: String(r.amount) })),
    })),
  };
}

/** Form → domain payload (call only when valid). Percentage → 0..1, trimmed. */
export function toDomainInput(model: EditorModel): PayoutConfigInput {
  const rows: PayoutRow[] = model.rows.map((row) => {
    const rewards = row.rewards.map((r) => ({ rewardType: r.rewardType, amount: parseInt(r.amount, 10) }));
    return {
      id: row.id,
      probability: Number((parseFloat(row.probabilityPct) / 100).toFixed(8)),
      winMessage: row.winMessage.trim(),
      // prizeValue is derived from the rewards (headline value feeding avg).
      prizeValue: rewards.reduce((sum, r) => sum + r.amount, 0),
      rewards,
    };
  });
  return { name: model.name.trim(), gameType: model.gameType as GameType, rows };
}

/** Serialized projection for dirty-checking — drops client keys. */
export function serializeModel(model: EditorModel): string {
  return JSON.stringify({
    name: model.name,
    gameType: model.gameType,
    rows: model.rows.map((r) => ({
      winMessage: r.winMessage,
      probabilityPct: r.probabilityPct,
      rewards: r.rewards.map((rw) => ({ rewardType: rw.rewardType, amount: rw.amount })),
    })),
  });
}

// ---- Validation -------------------------------------------------------------

export interface RewardErrors {
  amount?: string;
}
export interface RowErrors {
  winMessage?: string;
  probability?: string;
  rewards: RewardErrors[];
}
export interface ModelValidation {
  name?: string;
  gameType?: string;
  rows: RowErrors[];
  total: number; // percentage
  remaining: number; // 100 - total
  status: 'exact' | 'under' | 'over';
  aggregate?: string;
  valid: boolean;
}

const isWholePositive = (s: string) => /^\d+$/.test(s.trim()) && parseInt(s.trim(), 10) >= 1;

/** Validate the rows only (probability, rewards, totals) — used by the editor + page. */
export function validateRows(rows: EditorRow[]): {
  rows: RowErrors[];
  total: number;
  remaining: number;
  status: ModelValidation['status'];
  aggregate?: string;
  rowsValid: boolean;
} {
  let total = 0;
  let hasFieldError = false;

  const rowErrors: RowErrors[] = rows.map((row) => {
    const errs: RowErrors = { rewards: [] };

    if (row.winMessage.length > MAX_WIN_MESSAGE) {
      errs.winMessage = `Keep it under ${MAX_WIN_MESSAGE} characters.`;
    }

    const raw = row.probabilityPct.trim();
    const n = Number(raw);
    if (raw === '') errs.probability = 'Enter a probability.';
    else if (!Number.isFinite(n)) errs.probability = 'Enter a number.';
    else if (n < 0) errs.probability = 'Must be 0 or more.';
    else if (n > 100) errs.probability = 'Must be 100 or less.';
    else total += n;

    errs.rewards = row.rewards.map((rw) =>
      isWholePositive(rw.amount) ? {} : { amount: 'Whole number ≥ 1.' }
    );

    if (errs.winMessage || errs.probability || errs.rewards.some((r) => r.amount)) hasFieldError = true;
    return errs;
  });

  const roundedTotal = Number(total.toFixed(4));
  const status: ModelValidation['status'] =
    Math.abs(total - 100) < EPS ? 'exact' : total < 100 ? 'under' : 'over';

  let aggregate: string | undefined;
  if (rows.length === 0) aggregate = 'Add at least one payout row.';
  else if (status !== 'exact') aggregate = `Probabilities must total 100% (currently ${roundedTotal}%).`;

  return {
    rows: rowErrors,
    total: roundedTotal,
    remaining: Number((100 - total).toFixed(4)),
    status,
    aggregate,
    rowsValid: !hasFieldError && rows.length >= 1 && status === 'exact',
  };
}

/** Full model validation (adds Name + Game Type) — the page's Save gate. */
export function validateModel(model: EditorModel, excludeId?: string): ModelValidation {
  const rowsResult = validateRows(model.rows);

  let name: string | undefined;
  const trimmed = model.name.trim();
  if (!trimmed) name = 'Name is required.';
  else if (trimmed.length > MAX_NAME) name = `Keep it under ${MAX_NAME} characters.`;
  else if (model.gameType && !nameIsUnique(trimmed, model.gameType, excludeId))
    name = 'A config with this name already exists for this game type.';

  const gameType = model.gameType ? undefined : 'Game Type is required.';

  return {
    name,
    gameType,
    rows: rowsResult.rows,
    total: rowsResult.total,
    remaining: rowsResult.remaining,
    status: rowsResult.status,
    aggregate: rowsResult.aggregate,
    valid: !name && !gameType && rowsResult.rowsValid,
  };
}
