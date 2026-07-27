import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Typography } from '@betty/beam';
import { ItemBox } from './ItemBox';
import { CATALOG } from './userDetail';
import type { Linking } from './useLinking';

/**
 * Lab bench for ItemBox — a titled box of ItemRows (detail-page §6). States
 * are real groups from the catalog: full / partial / zero-granted in view,
 * and the edit checklist. A box with zero granted rows renders NOTHING in
 * view (the 2026-07-27 grammar revision) — shown inside a labeled frame so
 * the absence is visible on the bench.
 *
 * A Lab entry is a question, not a home (BEAM.md §9).
 */

const noop = { onMouseEnter: () => {}, onMouseLeave: () => {}, onFocus: () => {}, onBlur: () => {} };
/** Inert linking for the bench; `dim` forces every row to the dimmed state. */
function benchLinking(dim = false): Linking {
  return {
    activeRole: null,
    roleProps: () => noop,
    roleDimmed: () => dim,
    permissionDimmed: () => dim,
  };
}

const group = (id: string) => CATALOG.find((g) => g.id === id)!;
const grantedSet = (...ids: string[]) => new Set(ids);
const noProvenance = new Map<string, string[]>();

// Render-only bench (no controls): meta stays untyped to the component so the
// fixed-state stories don't have to satisfy ItemBox's required args.
const meta: Meta = {
  title: 'Lab/Sunlight/ItemBox',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

/** View, fully granted — every row present. */
export const ViewFull: Story = {
  render: () => (
    <Box sx={{ maxWidth: 420 }}>
      <ItemBox
        group={group('loy')}
        mode="view"
        granted={grantedSet('loy.view', 'loy.grant', 'loy.config')}
        provenance={noProvenance}
        linking={benchLinking()}
      />
    </Box>
  ),
};

/** View, partially granted — granted rows only. */
export const ViewPartial: Story = {
  render: () => (
    <Box sx={{ maxWidth: 420 }}>
      <ItemBox
        group={group('tx')}
        mode="view"
        granted={grantedSet('tx.view', 'tx.refund')}
        provenance={noProvenance}
        linking={benchLinking()}
      />
    </Box>
  ),
};

/** View, zero granted — renders nothing. The dashed frame is bench furniture. */
export const ViewZeroGranted: Story = {
  render: () => (
    <Box sx={{ maxWidth: 420 }}>
      <Typography variant="caption" color="text.secondary">
        Zero-granted box — renders nothing inside the frame:
      </Typography>
      <Box sx={{ mt: 0.5, p: 1, minHeight: 56, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
        <ItemBox
          group={group('cmp')}
          mode="view"
          granted={grantedSet()}
          provenance={noProvenance}
          linking={benchLinking()}
        />
      </Box>
    </Box>
  ),
};

/** Edit — the full checklist, granted rows checked, ungranted dimmed. */
export const EditChecklist: Story = {
  render: () => (
    <Box sx={{ maxWidth: 420 }}>
      <ItemBox
        group={group('tx')}
        mode="edit"
        granted={grantedSet('tx.view', 'tx.refund')}
        provenance={noProvenance}
        onTogglePermission={() => {}}
        onToggleGroup={() => {}}
        linking={benchLinking()}
      />
    </Box>
  ),
};

/** Edit with linking forced — every row dimmed (what a non-matching row looks like). */
export const EditDimmedByLinking: Story = {
  render: () => (
    <Box sx={{ maxWidth: 420 }}>
      <ItemBox
        group={group('tx')}
        mode="edit"
        granted={grantedSet('tx.view', 'tx.refund')}
        provenance={noProvenance}
        onTogglePermission={() => {}}
        onToggleGroup={() => {}}
        linking={benchLinking(true)}
      />
    </Box>
  ),
};
