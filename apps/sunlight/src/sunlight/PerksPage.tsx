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
} from '@betty/beam';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

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

// Capability columns, in screenshot order (Status is the pinned first column).
const PERK_COLUMNS = [
  'Gem Stones',
  'Daily Wheel',
  'Weekly Deposit Offer',
  'Shop Weekly Promotion',
  'Access to Better RAF',
  'Status Exclusive Games',
  'Multiplier on Level Up',
  'Priority Customer Support',
  'Cashback',
  'VIP Host',
] as const;

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
  cells: PERK_COLUMNS.map((col) => {
    if (col === 'Gem Stones') return text(`Up to ${(i + 1) * 100} Coins`);
    if (col === 'Multiplier on Level Up') return text(`${MULTIPLIER[i]}x Multiplier`);
    if (col === 'Cashback') return i < 6 ? denied : text(`${i - 4}%`);
    return i >= (UNLOCK[col] ?? 99) ? granted : denied;
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
  // perk-cell semantics: pending design pass (the red-✗ question is Deyan's).
  if (cell.kind === 'granted') return <CheckIcon fontSize="small" sx={{ color: 'success.main' }} titleAccess="Included" />;
  if (cell.kind === 'denied') return <CloseIcon fontSize="small" sx={{ color: 'error.main' }} titleAccess="Not included" />;
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
      <BeamPageHeader title="Perks" description="What each loyalty status unlocks." />

      {/* Reference matrix: a compare-and-scan grid. Non-interactive, so §1.1
          would say borderless — but a matrix earns internal rules for legibility
          (rules here are scanning aids, not an interaction signal); recorded as
          the reference-matrix species in docs/loyalty-pages.md. */}
      <Paper
        variant="outlined"
        ref={scrollRef}
        sx={{ overflowX: 'auto', containerType: 'scroll-state' as 'normal' }}
      >
        <Table size="small" sx={{ '& td, & th': { whiteSpace: 'nowrap' } }} aria-label="Loyalty perks by status">
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...stickyStatusSx, zIndex: 3 }}>Status</TableCell>
              {PERK_COLUMNS.map((col) => (
                <TableCell key={col} align="center">
                  {col}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {PERKS_MATRIX.map((row) => (
              <TableRow key={row.status} hover>
                <TableCell component="th" scope="row" sx={{ ...stickyStatusSx, zIndex: 2, fontWeight: 500 }}>
                  {row.status}
                </TableCell>
                {row.cells.map((cell, i) => (
                  <TableCell key={i} align={cell.kind === 'text' ? 'left' : 'center'}>
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
