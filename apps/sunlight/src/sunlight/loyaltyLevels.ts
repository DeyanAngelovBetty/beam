/**
 * loyaltyLevels — the Loyalty LEVELS data, ported from official Sunlight
 * (features/loyalty: LoyaltyLevel + the levels list API). Beam has no backend, so the RTK-Query
 * `useGetLoyaltyLevelsQuery`/`schemeType` plumbing is adapted to a local module store with seed data
 * (mirrors loyaltyStatuses.ts). Shape is faithful to the source `loyaltyLevelSchema`.
 */

export interface LoyaltyLevel {
  level: number;
  startPoints: number;
  endPoints: number;
  prizeType: string;
  prizeAmount: number;
  isSpecial: boolean;
  prizeDelivery: string;
  expiryHours?: number;
}

/** The two level schemes the page tabs between (source: `SchemeType`). */
export type SchemeType = 'A' | 'B';

const PRIZE_TYPES = ['Coins', 'Free Spins', 'Tokens'];
const DELIVERY = ['Instant', 'Claimable'];

// Seed a plausible ladder per scheme. Scheme B runs wider XP bands + richer prizes than A.
function seedScheme(scheme: SchemeType): LoyaltyLevel[] {
  const band = scheme === 'A' ? 500 : 750;
  const count = scheme === 'A' ? 12 : 10;
  const basePrize = scheme === 'A' ? 100 : 150;

  return Array.from({ length: count }, (_, i) => {
    const level = i + 1;
    const isSpecial = level % 5 === 0; // every 5th level is a milestone
    return {
      level,
      startPoints: i * band,
      endPoints: level * band - 1,
      prizeType: PRIZE_TYPES[i % PRIZE_TYPES.length],
      prizeAmount: basePrize + i * 25,
      isSpecial,
      prizeDelivery: isSpecial ? 'Claimable' : DELIVERY[i % DELIVERY.length],
      expiryHours: isSpecial ? 48 : 24,
    };
  });
}

const LEVELS: Record<SchemeType, LoyaltyLevel[]> = {
  A: seedScheme('A'),
  B: seedScheme('B'),
};

/** The levels for a scheme (stands in for the paged list query — the list handles paging). */
export function getLoyaltyLevels(schemeType: SchemeType): LoyaltyLevel[] {
  return LEVELS[schemeType];
}
