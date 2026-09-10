import type { BeamStatus } from '@betty/beam';

/**
 * tokenCampaigns — the Token Campaign / Prize Wall aggregate (Prize Wall flow, step 1). The IA is
 * modelled in FULL DEPTH here even though the list page uses a fraction; later prompts (detail page,
 * stage page) consume these fixtures. Moving from Midnight's stacked dialogs to Beam-style
 * multi-level drill-down pages (team buy-in, Radi, 2026-09-02) — see detail-page-grammar "Entities
 * get pages, never dialogs".
 *
 * SHAPE FLAGS (proposed here, real answers pending Radi/Tzeno — do not silently re-decide downstream):
 *  - `id` on every entity — NOT in the IA; added for keys / routes / inline-row identity. Confirmed.
 *  - Lifecycle is DERIVED (campaignLifecycle), not stored; `disabled` WINS the badge over date state
 *    (fixture semantics — real precedence pending Radi).
 *  - `WallStage.name` optional, "Stage {order}" fallback (the IA gives stages no label; the stage
 *    page + breadcrumb need one).
 *  - Named-slot images/sounds per the Figma (2026-09-04): images { slot, desktopUrl, mobileUrl }[],
 *    sounds { slot, url }[]. Slot ids are the Figma names (see the const unions below).
 *  - JOIN THE Radi/Tzeno BATCH (stored as proposed, unresolved): win+loss probability semantics
 *    (sum-to-100? remainder band?), `coins` vs `rewardAmount` on a reward, `finalOpenDate` vs the
 *    openingWindows (derived or independent?). See also the CR-granularity open item in
 *    detail-page-grammar (ties to approval-grammar open item (a)).
 */

// ── Named slots (Figma-authoritative, 2026-09-04) — images/sounds are NAMED SLOTS ─────────────────
// Shape corrected from the detail-page Figma (supersedes the earlier { slot, url } guesses):
// images carry a desktop + mobile URL per slot; sounds a single URL. Slot ids are the Figma names.
export const PROMO_IMAGE_SLOTS = ['promotionalIcon', 'promotionalImage', 'infoBannerImage'] as const;
export type PromoImageSlot = (typeof PROMO_IMAGE_SLOTS)[number];

export const SOUND_SLOTS = ['background', 'play', 'win', 'miss'] as const;
export type SoundSlot = (typeof SOUND_SLOTS)[number];

export interface PromoImage {
  slot: PromoImageSlot;
  desktopUrl: string;
  mobileUrl: string;
}
export interface CampaignSound {
  slot: SoundSlot;
  url: string;
}

/** Slot id → human label (display in the detail sections). */
export const PROMO_IMAGE_SLOT_LABEL: Record<PromoImageSlot, string> = {
  promotionalIcon: 'Promotional icon',
  promotionalImage: 'Promotional image',
  infoBannerImage: 'Info banner image',
};
export const SOUND_SLOT_LABEL: Record<SoundSlot, string> = {
  background: 'Background',
  play: 'Play',
  win: 'Win',
  miss: 'Miss',
};

// ── Leaf: reward item (edited inline on the stage page — ~8 fields, a leaf) ────────────────────────
export type RewardTier = 'none' | 'low' | 'medium' | 'high';

export type RewardType = 'Physical' | 'Digital' | 'Bonus';
export const REWARD_TYPES: RewardType[] = ['Physical', 'Digital', 'Bonus'];

export interface RewardItem {
  id: string;
  name: string;
  description: string;
  type: RewardType; // Reward Item dialog "TYPE" (added for the Wall Stage port)
  cashValue: number; // dialog "CASH VALUE"
  quantity: number; // dialog "QUANTITY"; card badge ×{quantity}
  coins: number; // vs rewardAmount — semantics pending Radi/Tzeno; card caption {coins} × ${cashValue}
  tier: RewardTier;
  imgUrl: string;
  quality: string; // free string for now; enum candidate — pending Figma
  rewardAmount: number; // dialog "REWARD AMOUNT"
  order: number;
}

// ── Inline row: opening window (edited inline on the stage page) ───────────────────────────────────
export interface OpeningWindow {
  id: string;
  openDate: string; // ISO
  endDate: string; // ISO
  durationMin: number; // derived (end − open); the Edit frame's DURATION (MIN) field. No recompute
  //                      coupling this pass — real duration semantics stay on the Radi/Tzeno flag.
}

/** A "quick rule" / "info page rule" row: a name + desktop/mobile media URLs (copy in View, fields in Edit). */
export interface QuickRule {
  id: string;
  name: string;
  desktopUrl: string;
  mobileUrl: string;
}

// ── Drill child: wall stage (contains lists → its own page) ───────────────────────────────────────
export interface WallStage {
  id: string;
  name?: string; // optional — "Stage {order}" fallback
  order: number;
  enabled: boolean;
  startDate: string; // ISO
  finalOpenDate: string; // ISO — relation to openingWindows pending Radi/Tzeno
  openingWindows: OpeningWindow[];
  headerImageDesktop: string;
  headerImageMobile: string;
  backgroundImageDesktop: string;
  backgroundImageMobile: string;
  winProbabilityPct: number; // win+loss semantics (sum-to-100?) pending Radi/Tzeno
  lossProbabilityPct: number;
  costOfPlay: number;
  rewardItems: RewardItem[];
  quickRules: QuickRule[]; // Wall Stage "Quick Rules" section
  infoPageTitle: string; // Wall Stage "Info Page Rules" → INFO PAGE TITLE
  infoRules: QuickRule[]; // Wall Stage "Info Page Rules" rows
}

// ── Aggregate root: token campaign ────────────────────────────────────────────────────────────────
export interface TokenCampaign {
  id: string;
  name: string;
  startDate: string; // ISO
  endDate: string; // ISO
  enabled: boolean;
  tAndC: string; // plain text for now; rich/markdown candidate — pending Figma
  promotionalImages: PromoImage[]; // named slots (desktop + mobile URL each)
  sounds: CampaignSound[]; // named slots
  wallStages: WallStage[];
  createdBy: string; // audit field — added for the list column (not in the IA aggregate)
}

// ── Derived lifecycle (not stored) ────────────────────────────────────────────────────────────────
export type CampaignLifecycle = 'running' | 'scheduled' | 'ended' | 'disabled';

/** Derive the campaign's lifecycle. `disabled` wins over date state (fixture semantics — real
 *  precedence pending Radi). Otherwise: before start → scheduled, after end → ended, else running. */
export function campaignLifecycle(c: TokenCampaign, now: number = Date.now()): CampaignLifecycle {
  if (!c.enabled) return 'disabled';
  if (now < Date.parse(c.startDate)) return 'scheduled';
  if (now > Date.parse(c.endDate)) return 'ended';
  return 'running';
}

export const LIFECYCLES: CampaignLifecycle[] = ['running', 'scheduled', 'ended', 'disabled'];

/** Lifecycle → shared status badge (BeamStatusBadge vocabulary). */
export function lifecycleBadge(life: CampaignLifecycle): { status: BeamStatus; label: string } {
  switch (life) {
    case 'running':
      return { status: 'active', label: 'Running' };
    case 'scheduled':
      return { status: 'scheduled', label: 'Scheduled' };
    case 'ended':
      return { status: 'expired', label: 'Ended' };
    case 'disabled':
      return { status: 'paused', label: 'Disabled' };
  }
}

/** The stage's display label (name, else the "Stage {order}" fallback). */
export const stageLabel = (s: WallStage) => s.name ?? `Stage ${s.order}`;

/**
 * The list's "token / prize info" column — a DERIVED SUMMARY PLACEHOLDER (real Figma content pending
 * Deyan's review): stage count + total reward items across stages.
 */
export function campaignSummary(c: TokenCampaign): string {
  const stages = c.wallStages.length;
  const rewards = c.wallStages.reduce((n, s) => n + s.rewardItems.length, 0);
  return `${stages} stage${stages === 1 ? '' : 's'} · ${rewards} reward${rewards === 1 ? '' : 's'}`;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────────────────────────
// Placeholder asset URLs (dev-only; real slots/art pending Figma).
const img = (slot: PromoImageSlot): PromoImage => ({
  slot,
  desktopUrl: `/assets/prize-wall/${slot}-desktop.png`,
  mobileUrl: `/assets/prize-wall/${slot}-mobile.png`,
});
const snd = (slot: SoundSlot): CampaignSound => ({ slot, url: `/assets/prize-wall/${slot}.mp3` });
const allImages: PromoImage[] = PROMO_IMAGE_SLOTS.map(img);
const allSounds: CampaignSound[] = SOUND_SLOTS.map(snd);

const TIERS: RewardTier[] = ['low', 'medium', 'high', 'none'];

function rewards(stageId: string, count: number): RewardItem[] {
  // Uniform card values per the frame's grid (× {quantity}, {coins} × ${cashValue}); varied type/tier/name.
  return Array.from({ length: count }, (_, i) => ({
    id: `${stageId}-r${i + 1}`,
    name: `Reward ${i + 1}`,
    description: `Prize wall reward ${i + 1}`,
    type: REWARD_TYPES[i % REWARD_TYPES.length],
    cashValue: 100,
    quantity: 5,
    coins: 100,
    tier: TIERS[i % TIERS.length],
    imgUrl: `/assets/prize-wall/reward-${i + 1}.png`,
    quality: i % 2 === 0 ? 'Standard' : 'Premium',
    rewardAmount: (i + 1) * 5,
    order: i + 1,
  }));
}

function windows(stageId: string, ...pairs: [string, string][]): OpeningWindow[] {
  return pairs.map(([openDate, endDate], i) => ({
    id: `${stageId}-w${i + 1}`,
    openDate,
    endDate,
    durationMin: Math.round((Date.parse(endDate) - Date.parse(openDate)) / 60_000),
  }));
}

// Rule copy per the frames (Quick Rules + Info Page Rules).
const QUICK_RULE_NAMES = ['Collect Hot Cocoas throughout the week', 'Visit the Prize Wall on Sunday 7pm', 'Use your Hot Cocoas for a chance to win prizes'];
const INFO_RULE_NAMES = ['Collect hot cocoas through promotions and the daily wheel', 'Visit the Prize Wall on Sunday 7pm', 'Use your Hot Cocoas for a chance to win prizes'];
function ruleRows(stageId: string, prefix: string, names: string[]): QuickRule[] {
  return names.map((name, i) => ({
    id: `${stageId}-${prefix}${i + 1}`,
    name,
    desktopUrl: `/assets/prize-wall/${stageId}-${prefix}${i + 1}-desktop.png`,
    mobileUrl: `/assets/prize-wall/${stageId}-${prefix}${i + 1}-mobile.png`,
  }));
}

function stage(campaignId: string, order: number, overrides: Partial<WallStage> = {}): WallStage {
  const id = `${campaignId}-s${order}`;
  return {
    id,
    order,
    enabled: true,
    startDate: '2026-08-15T00:00:00.000Z',
    finalOpenDate: '2026-10-15T00:00:00.000Z',
    openingWindows: windows(id, ['2026-08-15T09:00:00.000Z', '2026-08-15T21:00:00.000Z']),
    headerImageDesktop: `/assets/prize-wall/${id}-header-desktop.png`,
    headerImageMobile: `/assets/prize-wall/${id}-header-mobile.png`,
    backgroundImageDesktop: '',
    backgroundImageMobile: '',
    winProbabilityPct: 65,
    lossProbabilityPct: 35,
    costOfPlay: 50,
    rewardItems: rewards(id, 12),
    quickRules: ruleRows(id, 'qr', QUICK_RULE_NAMES),
    infoPageTitle: 'Prize wall',
    infoRules: ruleRows(id, 'ir', INFO_RULE_NAMES),
    ...overrides,
  };
}

export const TOKEN_CAMPAIGNS: TokenCampaign[] = [
  // RUNNING — the deep one: 3+ stages, a stage with multiple opening windows, several reward items.
  {
    id: 'tc-summer',
    name: 'Summer Token Rush',
    startDate: '2026-08-15T00:00:00.000Z',
    endDate: '2026-10-15T00:00:00.000Z',
    enabled: true,
    tAndC: 'Standard prize-wall terms apply. One play per token.',
    promotionalImages: allImages,
    sounds: allSounds,
    createdBy: 'Maja Novak',
    wallStages: [
      stage('tc-summer', 1, {
        // multiple opening windows
        openingWindows: windows(
          'tc-summer-s1',
          ['2026-08-15T09:00:00.000Z', '2026-08-15T13:00:00.000Z'],
          ['2026-08-15T17:00:00.000Z', '2026-08-15T21:00:00.000Z'],
          ['2026-08-16T09:00:00.000Z', '2026-08-16T21:00:00.000Z'],
        ),
        rewardItems: rewards('tc-summer-s1', 12),
      }),
      stage('tc-summer', 2, { costOfPlay: 100, winProbabilityPct: 55, lossProbabilityPct: 45, rewardItems: rewards('tc-summer-s2', 4) }),
      stage('tc-summer', 3, { costOfPlay: 250, winProbabilityPct: 40, lossProbabilityPct: 60, rewardItems: rewards('tc-summer-s3', 6) }),
    ],
  },
  // SCHEDULED — starts in the future.
  {
    id: 'tc-autumn',
    name: 'Autumn Prize Drop',
    startDate: '2026-11-01T00:00:00.000Z',
    endDate: '2026-12-31T00:00:00.000Z',
    enabled: true,
    tAndC: 'Standard prize-wall terms apply.',
    promotionalImages: [img('promotionalImage')],
    sounds: [snd('background'), snd('win')],
    createdBy: 'Ivan Horvat',
    wallStages: [stage('tc-autumn', 1, { startDate: '2026-11-01T00:00:00.000Z', finalOpenDate: '2026-12-31T00:00:00.000Z' })],
  },
  // ENDED — end date in the past.
  {
    id: 'tc-spring',
    name: 'Spring Coin Fest',
    startDate: '2026-05-01T00:00:00.000Z',
    endDate: '2026-06-30T00:00:00.000Z',
    enabled: true,
    tAndC: 'Standard prize-wall terms apply.',
    promotionalImages: allImages,
    sounds: allSounds,
    createdBy: 'Maja Novak',
    wallStages: [
      stage('tc-spring', 1, { startDate: '2026-05-01T00:00:00.000Z', finalOpenDate: '2026-06-30T00:00:00.000Z' }),
      stage('tc-spring', 2, { startDate: '2026-05-15T00:00:00.000Z', finalOpenDate: '2026-06-30T00:00:00.000Z' }),
    ],
  },
  // DISABLED — enabled:false (its dates would read "running", but disabled wins the badge).
  {
    id: 'tc-holiday',
    name: 'Holiday Vault (draft)',
    startDate: '2026-08-01T00:00:00.000Z',
    endDate: '2026-10-01T00:00:00.000Z',
    enabled: false,
    tAndC: '',
    promotionalImages: [],
    sounds: [],
    createdBy: 'Ravi Patel',
    wallStages: [stage('tc-holiday', 1, { enabled: false, rewardItems: rewards('tc-holiday-s1', 2) })],
  },
];

export function getTokenCampaigns(): TokenCampaign[] {
  return TOKEN_CAMPAIGNS;
}

export function getTokenCampaign(id: string): TokenCampaign | undefined {
  return TOKEN_CAMPAIGNS.find((c) => c.id === id);
}

export function getWallStage(campaignId: string, stageId: string): WallStage | undefined {
  return getTokenCampaign(campaignId)?.wallStages.find((s) => s.id === stageId);
}
