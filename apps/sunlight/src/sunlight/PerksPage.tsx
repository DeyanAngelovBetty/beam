import { useEffect, useRef } from 'react';
import {
  Stack,
  Paper,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  BeamPageHeader,
  Box,
  GemIcon,
  BeamBool,
} from '@betty/beam';
import type { GemName } from '@betty/beam';

/**
 * Perks — a static REFERENCE MATRIX (loyalty tiers × capabilities), read-only.
 * NOT a list-grammar page: no filters, actions, identity links, pagination, or
 * detail behind it. A new page species — compare-and-scan (docs/loyalty-pages.md).
 *
 * ⚠️ SEED IS PLACEHOLDER. The screenshot is the spec and was not provided this
 * pass — tiers + "Multiplier on Level Up" are REAL (from LoyaltyStatusPage); the
 * rest is a transparent unlock-ladder scaffold. Replace VERBATIM from the
 * screenshot before this is trusted. // seed: pending the screenshot
 */

type PerkCell = { kind: 'text'; text: string } | { kind: 'granted' } | { kind: 'denied' };
const granted: PerkCell = { kind: 'granted' };
const denied: PerkCell = { kind: 'denied' };
const text = (t: string): PerkCell => ({ kind: 'text', text: t });


type PerkColumnKind = 'flag' | 'value';

interface PerkColumn {
  label: string;
  kind: PerkColumnKind;
}

// Column widths are a design decision, not an emergent property of the seed.
const COL_WIDTH: Record<PerkColumnKind, number> = { flag: 120, value: 160 };
const STATUS_COL_WIDTH = 140;

const PERK_COLUMNS: PerkColumn[] = [
  { label: 'Gem Stones', kind: 'value' },
  { label: 'Daily Wheel', kind: 'flag' },
  { label: 'Weekly Deposit Offer', kind: 'flag' },
  { label: 'Shop Weekly Promotion', kind: 'flag' },
  { label: 'Access to Better RAF', kind: 'flag' },
  { label: 'Status Exclusive Games', kind: 'flag' },
  { label: 'Multiplier on Level Up', kind: 'value' },
  { label: 'Priority Customer Support', kind: 'flag' },
  { label: 'Cashback', kind: 'flag' },
  { label: 'VIP Host', kind: 'flag' },
];

// Capability columns, in screenshot order (Status is the pinned first column).
// const PERK_COLUMNS = [
//   'Gem Stones',
//   'Daily Wheel',
//   'Weekly Deposit Offer',
//   'Shop Weekly Promotion',
//   'Access to Better RAF',
//   'Status Exclusive Games',
//   'Multiplier on Level Up',
//   'Priority Customer Support',
//   'Cashback',
//   'VIP Host',
// ] as const;

interface PerkRow {
  status: string;
  cells: PerkCell[]; // aligned to PERK_COLUMNS
}

// Real tiers + real multipliers (LoyaltyStatusPage). Everything else is the
// PLACEHOLDER ladder — obvious-on-purpose, replace verbatim from the screenshot.
const TIERS = ['Member', 'Amethyst', 'Topaz', 'Aquamarine', 'Opal', 'Emerald', 'Ruby', 'Sapphire', 'Diamond', 'VIP'];
const MULTIPLIER = [1, 1, 1.5, 1, 1, 1, 1.4, 1.6, 2, 2];
// Tier index at which each boolean capability turns on (placeholder thresholds).
const UNLOCK: Record<string, number> = {
  'Daily Wheel': 0,
  'Weekly Deposit Offer': 2,
  'Shop Weekly Promotion': 3,
  'Access to Better RAF': 4,
  'Status Exclusive Games': 5,
  'Priority Customer Support': 6,
  'VIP Host': 9,
};

const PERKS_MATRIX: PerkRow[] = TIERS.map((status, i) => ({
  status,
  cells: PERK_COLUMNS.map(({ label }) => {
    if (label === 'Gem Stones') return text(`Up to ${(i + 1) * 100} Coins`);
    if (label === 'Multiplier on Level Up') return text(`${MULTIPLIER[i]}x Multiplier`);
    if (label === 'Cashback') return i < 6 ? denied : text(`${i - 4}%`);
    return i >= (UNLOCK[label] ?? 99) ? granted : denied;
  }),
}));

// Scroll-affordance elevation, reused from BeamDataTable's pinned rail: a
// rightward shadow + inset divider appear only while content scrolls under the
// pinned Status column. Chrome uses the scroll-state container query; other
// engines the data-attribute the listener below toggles.
// perk-cell semantics + elevation values: pending design pass
const SCROLLED_SHADOW = '4px 0 6px -3px rgba(0, 0, 0, 0.18)';

const stickyStatusSx = {
  position: 'sticky' as const,
  left: 0,
  backgroundColor: 'background.paper',
  transition: 'box-shadow var(--beam-motion-quick)',
  boxShadow: '0 0 0 0 rgba(0, 0, 0, 0)',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '6px',
    bottom: '6px',
    right: 0,
    width: '1px',
    backgroundColor: 'divider',
    opacity: 0,
    transition: 'opacity var(--beam-motion-quick)',
    pointerEvents: 'none',
  },
  '@container scroll-state(scrollable: inline-start)': {
    boxShadow: SCROLLED_SHADOW,
    '&::after': { opacity: 1 },
  },
  '[data-perks-scrolled="true"] &': { boxShadow: SCROLLED_SHADOW },
  '[data-perks-scrolled="true"] &::after': { opacity: 1 },
};

function PerkCellView({ cell }: { cell: PerkCell }) {
  // Boolean cells follow the estate boolean convention (detail-page-grammar §2, extended from
  // BeamStat to table cells 2026-09-01): the BeamBool icon pair — CheckCircle FILLED for true,
  // Cancel OUTLINED for false. Colour carries yes/no, fill carries emphasis; NOT an alarm (this
  // answers the old red-✗ question — severity is never inferred from a boolean).
  if (cell.kind === 'granted') return <BeamBool value />;
  if (cell.kind === 'denied') return <BeamBool value={false} />;
  return <Typography variant="body2">{cell.text}</Typography>;
}

export function PerksPage() {
  // Base scroll-affordance path (Safari/Firefox): toggle data-perks-scrolled.
  // The container query handles Chrome with zero JS (same posture as the rail).
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const supportsScrollState =
      typeof CSS !== 'undefined' && CSS.supports?.('container-type', 'scroll-state');
    if (supportsScrollState) return;
    let raf = 0;
    const apply = () => {
      raf = 0;
      el.dataset.perksScrolled = el.scrollLeft > 0 ? 'true' : 'false';
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    apply();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <Stack spacing={3}>
      {/* Read-only page — the actions slot is empty (grammar §4). */}
      <BeamPageHeader title="Perks" subtitle="What each loyalty status unlocks." />

      {/* Reference matrix: a compare-and-scan grid. Non-interactive, so §1.1
          would say borderless — but a matrix earns internal rules for legibility
          (rules here are scanning aids, not an interaction signal); recorded as
          the reference-matrix species in docs/loyalty-pages.md. */}
      <Paper
        variant="outlined"
        ref={scrollRef}
        sx={{ overflowX: 'auto', containerType: 'scroll-state' as 'normal' }}
      >
        <Table size="small" 
          // sx={{ '& td, & th': { whiteSpace: 'nowrap' } }} 
          aria-label="Loyalty perks by status">

          <colgroup>
            <col style={{ width: STATUS_COL_WIDTH }} />
            {PERK_COLUMNS.map((c) => (
              <col key={c.label} style={{ width: COL_WIDTH[c.kind] }} />
            ))}
          </colgroup>

          <TableHead>
            <TableRow>
              <TableCell sx={{ ...stickyStatusSx, zIndex: 3, verticalAlign: 'bottom' }}>Status</TableCell>
              {PERK_COLUMNS.map((c) => (
                <TableCell
                  key={c.label}
                  align={'center'}
                  sx={{ verticalAlign: 'bottom', textWrap: 'balance' }}
                >
                  <Box 
                    sx={{ width: (c.kind === 'flag') ? '90px' : '120px', textWrap: 'balance', mx: 'auto' }}>
                    {c.label}
                  </Box>
                  
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {PERKS_MATRIX.map((row) => (
              <TableRow key={row.status} hover>
                <TableCell component="th" scope="row"
                  sx={{ ...stickyStatusSx, zIndex: 2, fontWeight: 500 }}>
                  {/* Gem visual + name — same size/gap as LoyaltyStatusDeltaPanel's meta header
                      (GemIcon size 30, gap 1, centred). Tier display name lowercases to its GemName. */}
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <GemIcon gem={row.status.toLowerCase() as GemName} size={30} />
                    {row.status}
                  </Box>
                </TableCell>
                {row.cells.map((cell, i) => (
                  <TableCell key={i}
                     align={'center'}>
                    {/*  align={cell.kind === 'text' ? 'left' : 'center'} */}
                    <PerkCellView cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}
