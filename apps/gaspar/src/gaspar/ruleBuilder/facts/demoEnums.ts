/**
 * Demo enum catalog — a SANITIZED twin of the engine's input/evaluation enums (generic values only;
 * nothing internal). Maps a fact's `enumType` (from the facts catalog) to its allowed values, and
 * supplies the value lists the action editors offer (risk level, required action).
 */
export const KYC_STATUS_VALUES = ['NotStarted', 'InProgress', 'Verified', 'Rejected'] as const;
export const ACCOUNT_TIER_VALUES = ['Standard', 'Premium', 'VIP'] as const;
export const PAYMENT_METHOD_TYPE_VALUES = ['Card', 'EWallet', 'BankTransfer'] as const;

export const RISK_LEVEL_VALUES = ['Low', 'Medium', 'High', 'Critical'] as const;
export const REQUIRED_ACTION_VALUES = ['ThreeDS', 'ManualReview', 'IdentityVerification'] as const;

/** enumType (from the facts catalog) → its valid values, for the condition value picker. */
export const ENUM_TYPE_VALUES: Record<string, readonly string[]> = {
  KycStatus: KYC_STATUS_VALUES,
  AccountTier: ACCOUNT_TIER_VALUES,
  PaymentMethodType: PAYMENT_METHOD_TYPE_VALUES,
};
