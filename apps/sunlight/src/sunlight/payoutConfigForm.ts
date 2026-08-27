import {
  nameIsUnique,
  REWARD_TYPES,
  type GameType,
  type MultiplierRow,
  type PayoutConfig,
  type PayoutConfigInput,
  type PayoutRow,
  type RewardType,
  type StandardPayoutGameType,
} from './payoutConfigs';

/**
 * The Payout Config editor's FORM model. Probabilities and numeric values stay
 * as raw strings while editing so inputs never reformat mid-keystroke. Public
 * sector numbers are always derived by the UI from the current array position;
 * `_key` is client-only identity and never leaves this model.
 */

export interface EditorReward {
  _key: string;
  rewardType: RewardType;
  amount: string;
}

export interface EditorRow {
  _key: string;
  id?: string;
  winMessage: string;
  probabilityPct: string;
  rewards: EditorReward[];
}

export interface EditorMultiplierRow {
  _key: string;
  probabilityPct: string;
  multiplier: string;
}

interface EditorModelBase {
  name: string;
  payoutRows: EditorRow[];
}

export type EditorModel =
  | (EditorModelBase & { gameType: StandardPayoutGameType | '' })
  | (EditorModelBase & {
      gameType: 'BettyWheelOfWins';
      multiplierRows: EditorMultiplierRow[];
    });

export { REWARD_TYPES };
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
  return REWARD_TYPES.find((type) => !rewards.some((reward) => reward.rewardType === type));
}

export function emptyReward(rewardType: RewardType = 'Coins'): EditorReward {
  return { _key: clientKey(), rewardType, amount: '' };
}

export function emptyRow(): EditorRow {
  return { _key: clientKey(), winMessage: '', probabilityPct: '', rewards: [emptyReward('Coins')] };
}

export function emptyMultiplierRow(): EditorMultiplierRow {
  return { _key: clientKey(), probabilityPct: '', multiplier: '' };
}

export function emptyModel(): EditorModel {
  return { name: '', gameType: '', payoutRows: [emptyRow()] };
}

/** Change the create-time type without retaining an irrelevant hidden collection. */
export function withGameType(model: EditorModel, gameType: GameType): EditorModel {
  if (gameType === 'BettyWheelOfWins') {
    return model.gameType === 'BettyWheelOfWins'
      ? model
      : { name: model.name, gameType, payoutRows: model.payoutRows, multiplierRows: [emptyMultiplierRow()] };
  }
  return { name: model.name, gameType, payoutRows: model.payoutRows };
}

/** 0..1 → percentage input string, float tail trimmed (0.69895 → "69.895"). */
export function formatPctForInput(probability: number): string {
  return String(Number((probability * 100).toFixed(6)));
}

const toEditorRows = (rows: PayoutRow[]): EditorRow[] =>
  rows.map((row) => ({
    _key: clientKey(),
    id: row.id,
    winMessage: row.winMessage,
    probabilityPct: formatPctForInput(row.probability),
    rewards: row.rewards.map((reward) => ({
      _key: clientKey(),
      rewardType: reward.rewardType,
      amount: String(reward.amount),
    })),
  }));

export function toEditorModel(config: PayoutConfig): EditorModel {
  if (config.gameType === 'BettyWheelOfWins') {
    return {
      name: config.name,
      gameType: config.gameType,
      payoutRows: toEditorRows(config.payoutRows),
      multiplierRows: config.multiplierRows.map((row) => ({
        _key: clientKey(),
        probabilityPct: formatPctForInput(row.probability),
        multiplier: String(row.multiplier),
      })),
    };
  }
  return { name: config.name, gameType: config.gameType, payoutRows: toEditorRows(config.rows) };
}

const toDomainPayoutRows = (rows: EditorRow[]): PayoutRow[] =>
  rows.map((row) => {
    const rewards = row.rewards.map((reward) => ({
      rewardType: reward.rewardType,
      amount: parseInt(reward.amount, 10),
    }));
    return {
      id: row.id,
      probability: Number((Number(row.probabilityPct) / 100).toFixed(8)),
      winMessage: row.winMessage.trim(),
      // Existing demo-only headline value; not editable and not a sector identifier.
      prizeValue: rewards.reduce((sum, reward) => sum + reward.amount, 0),
      rewards,
    };
  });

/** Form → domain payload. Call only after validateModel reports valid. */
export function toDomainInput(model: EditorModel): PayoutConfigInput {
  const payoutRows = toDomainPayoutRows(model.payoutRows);
  if (model.gameType === 'BettyWheelOfWins') {
    const multiplierRows: MultiplierRow[] = model.multiplierRows.map((row) => ({
      probability: Number((Number(row.probabilityPct) / 100).toFixed(8)),
      multiplier: Number(row.multiplier),
    }));
    return { name: model.name.trim(), gameType: model.gameType, payoutRows, multiplierRows };
  }
  return { name: model.name.trim(), gameType: model.gameType as StandardPayoutGameType, rows: payoutRows };
}

/** Serialized projection for dirty-checking — drops client/internal identity. */
export function serializeModel(model: EditorModel): string {
  const common = {
    name: model.name,
    gameType: model.gameType,
    payoutRows: model.payoutRows.map((row) => ({
      winMessage: row.winMessage,
      probabilityPct: row.probabilityPct,
      rewards: row.rewards.map((reward) => ({ rewardType: reward.rewardType, amount: reward.amount })),
    })),
  };
  return JSON.stringify(
    model.gameType === 'BettyWheelOfWins'
      ? {
          ...common,
          multiplierRows: model.multiplierRows.map((row) => ({
            probabilityPct: row.probabilityPct,
            multiplier: row.multiplier,
          })),
        }
      : common,
  );
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

export interface MultiplierRowErrors {
  probability?: string;
  multiplier?: string;
}

type ProbabilityStatus = 'exact' | 'under' | 'over';

export interface MultiplierRowsValidation {
  rows: MultiplierRowErrors[];
  total: number;
  remaining: number;
  status: ProbabilityStatus;
  aggregate?: string;
  multiplication?: string;
  rowsValid: boolean;
}

export interface ModelValidation {
  name?: string;
  gameType?: string;
  rows: RowErrors[];
  total: number;
  remaining: number;
  status: ProbabilityStatus;
  aggregate?: string;
  multiplier?: MultiplierRowsValidation;
  valid: boolean;
}

const isWholePositive = (value: string) =>
  /^\d+$/.test(value.trim()) && parseInt(value.trim(), 10) >= 1;

/** Validate payout rows only — used by the editor and the page-level Save gate. */
export function validateRows(
  rows: EditorRow[],
  itemLabel: 'payout row' | 'payout sector' = 'payout row',
): {
  rows: RowErrors[];
  total: number;
  remaining: number;
  status: ProbabilityStatus;
  aggregate?: string;
  rowsValid: boolean;
} {
  let total = 0;
  let hasFieldError = false;

  const rowErrors = rows.map((row) => {
    const errors: RowErrors = { rewards: [] };

    if (row.winMessage.length > MAX_WIN_MESSAGE) {
      errors.winMessage = `Keep it under ${MAX_WIN_MESSAGE} characters.`;
    }

    const rawProbability = row.probabilityPct.trim();
    const probability = Number(rawProbability);
    if (rawProbability === '') errors.probability = 'Enter a probability.';
    else if (!Number.isFinite(probability)) errors.probability = 'Enter a number.';
    else if (probability < 0) errors.probability = 'Must be 0 or more.';
    else if (probability > 100) errors.probability = 'Must be 100 or less.';
    else total += probability;

    errors.rewards = row.rewards.map((reward) =>
      isWholePositive(reward.amount) ? {} : { amount: 'Whole number ≥ 1.' },
    );

    if (errors.winMessage || errors.probability || errors.rewards.some((reward) => reward.amount)) {
      hasFieldError = true;
    }
    return errors;
  });

  const roundedTotal = Number(total.toFixed(4));
  const status: ProbabilityStatus =
    Math.abs(total - 100) < EPS ? 'exact' : total < 100 ? 'under' : 'over';

  let aggregate: string | undefined;
  if (rows.length === 0) aggregate = `Add at least one ${itemLabel}.`;
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

/** Centralized multiplier and reward×multiplier validation for Wheel of Wins. */
export function validateMultiplierRows(
  rows: EditorMultiplierRow[],
  payoutRows: EditorRow[],
): MultiplierRowsValidation {
  let total = 0;
  let hasFieldError = false;

  const rowErrors = rows.map((row) => {
    const errors: MultiplierRowErrors = {};
    const rawProbability = row.probabilityPct.trim();
    const probability = Number(rawProbability);
    if (rawProbability === '') errors.probability = 'Enter a probability.';
    else if (!Number.isFinite(probability)) errors.probability = 'Enter a number.';
    else if (probability < 0) errors.probability = 'Must be 0 or more.';
    else if (probability > 100) errors.probability = 'Must be 100 or less.';
    else total += probability;

    const rawMultiplier = row.multiplier.trim();
    const multiplier = Number(rawMultiplier);
    if (rawMultiplier === '') errors.multiplier = 'Enter a multiplier.';
    else if (!Number.isFinite(multiplier)) errors.multiplier = 'Enter a number.';
    else if (multiplier <= 0) errors.multiplier = 'Must be greater than 0.';

    if (errors.probability || errors.multiplier) hasFieldError = true;
    return errors;
  });

  const roundedTotal = Number(total.toFixed(4));
  const status: ProbabilityStatus =
    Math.abs(total - 100) < EPS ? 'exact' : total < 100 ? 'under' : 'over';

  let aggregate: string | undefined;
  if (rows.length === 0) aggregate = 'Add at least one multiplier sector.';
  else if (status !== 'exact') {
    aggregate = `Multiplier probabilities must total 100% (currently ${roundedTotal}%).`;
  }

  let multiplication: string | undefined;
  for (let multiplierIndex = 0; multiplierIndex < rows.length && !multiplication; multiplierIndex += 1) {
    const multiplierRow = rows[multiplierIndex];
    const multiplierProbability = Number(multiplierRow.probabilityPct.trim());
    const multiplier = Number(multiplierRow.multiplier.trim());
    if (
      rowErrors[multiplierIndex]?.probability
      || rowErrors[multiplierIndex]?.multiplier
      || multiplierProbability <= 0
    ) {
      continue;
    }

    for (let payoutIndex = 0; payoutIndex < payoutRows.length && !multiplication; payoutIndex += 1) {
      const payoutRow = payoutRows[payoutIndex];
      const payoutProbability = Number(payoutRow.probabilityPct.trim());
      if (!Number.isFinite(payoutProbability) || payoutProbability <= 0 || payoutProbability > 100) continue;

      for (const reward of payoutRow.rewards) {
        if (!isWholePositive(reward.amount)) continue;
        const amount = parseInt(reward.amount, 10);
        const result = amount * multiplier;
        const wholeNumberTolerance = Number.EPSILON * Math.max(1, Math.abs(result)) * 4;
        if (
          result <= 0
          || !Number.isFinite(result)
          || Math.abs(result - Math.round(result)) > wholeNumberTolerance
        ) {
          multiplication = `Payout sector ${payoutIndex + 1}: ${amount} ${reward.rewardType} × multiplier sector ${multiplierIndex + 1} (${multiplier}) = ${result}. Results must be positive whole numbers.`;
          break;
        }
      }
    }
  }

  return {
    rows: rowErrors,
    total: roundedTotal,
    remaining: Number((100 - total).toFixed(4)),
    status,
    aggregate,
    multiplication,
    rowsValid: !hasFieldError && rows.length >= 1 && status === 'exact' && !multiplication,
  };
}

/** Full model validation — the page's single Save gate. */
export function validateModel(model: EditorModel, excludeId?: string): ModelValidation {
  const payout = validateRows(
    model.payoutRows,
    model.gameType === 'BettyWheelOfWins' ? 'payout sector' : 'payout row',
  );
  const multiplier = model.gameType === 'BettyWheelOfWins'
    ? validateMultiplierRows(model.multiplierRows, model.payoutRows)
    : undefined;

  let name: string | undefined;
  const trimmedName = model.name.trim();
  if (!trimmedName) name = 'Name is required.';
  else if (trimmedName.length > MAX_NAME) name = `Keep it under ${MAX_NAME} characters.`;
  else if (model.gameType && !nameIsUnique(trimmedName, model.gameType, excludeId)) {
    name = 'A config with this name already exists for this game type.';
  }

  const gameType = model.gameType ? undefined : 'Game Type is required.';

  return {
    name,
    gameType,
    rows: payout.rows,
    total: payout.total,
    remaining: payout.remaining,
    status: payout.status,
    aggregate: payout.aggregate,
    multiplier,
    valid: !name && !gameType && payout.rowsValid && (!multiplier || multiplier.rowsValid),
  };
}
