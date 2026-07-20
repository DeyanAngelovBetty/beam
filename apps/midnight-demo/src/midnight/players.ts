import type { BeamStatus } from '@betty/beam';

/** Shared demo data for the two retrofit screens. */

export interface Player {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dob: string;
  registeredAt: string;
  status: BeamStatus;
}

export interface PaymentTransaction {
  id: string;
  createdAt: string;
  transactionId: string;
  type: 'Deposit' | 'Withdrawal';
  method: string;
  provider: string;
  amount: number;
  currency: string;
  status: BeamStatus;
  balanceBefore: number;
  balanceAfter: number;
  fraudRules?: string;
}

const FIRST = ['Edna', 'Raven', 'Reed', 'Henri', 'Ethan', 'Maia', 'Jonas', 'Madisen', 'Shaylee', 'Favian', 'Marilyne', 'Nadia'];
const LAST = ['Schimmel', 'Abshire', 'Buckridge', 'Feil', 'Bechtelar', 'Wiegand', 'Quigley', 'Padberg', 'Gleichner', 'Flatley', 'Kerluke', 'Rowe'];

export const PLAYERS: Player[] = FIRST.map((firstName, i) => ({
  id: String(257291 - i),
  email: `player.${firstName.toLowerCase()}.${(1000 + i * 37).toString(16)}@example.ca`,
  firstName,
  lastName: LAST[i],
  dob: `${String(1 + (i % 28)).padStart(2, '0')}-${['Jan', 'Feb', 'Mar', 'Jun', 'Aug', 'Oct'][i % 6]}-${1928 + i * 5}`,
  registeredAt: `20-Jul-2026 08:${String(59 - i).padStart(2, '0')}`,
  status: i % 7 === 3 ? 'pending' : 'active',
}));

export const CURRENT_PLAYER = PLAYERS[0];

const METHODS = ['Debit card — Visa', 'Real-time Interac e-Transfer', 'Debit card — Mastercard', 'Interac Online'];
const PROVIDERS = ['Worldpay', 'Gigadat', 'Nuvei', 'Trustly'];
const STATUSES: BeamStatus[] = ['settled', 'pending', 'settled', 'error', 'refunded', 'chargeback'];

export const TRANSACTIONS: PaymentTransaction[] = Array.from({ length: 18 }, (_, i) => {
  const amount = 10 + ((i * 130) % 240);
  const isDeposit = i % 3 === 2;
  const balanceBefore = 20 + ((i * 30) % 120);
  return {
    id: `tx-${288100 - i}`,
    createdAt: `20-Jul-2026 08:${String(50 - i).padStart(2, '0')}:41 ET`,
    transactionId: String(288100 - i),
    type: isDeposit ? 'Deposit' : 'Withdrawal',
    method: METHODS[i % METHODS.length],
    provider: PROVIDERS[i % PROVIDERS.length],
    amount,
    currency: 'CAD',
    status: STATUSES[i % STATUSES.length],
    balanceBefore,
    balanceAfter: isDeposit ? balanceBefore + amount : Math.max(0, balanceBefore - amount),
    fraudRules: i % 5 === 2 ? 'CardNameMismatch' : undefined,
  };
});
