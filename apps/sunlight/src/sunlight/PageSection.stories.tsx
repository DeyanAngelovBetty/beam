import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack, Typography } from '@betty/beam';
import { PageSection } from './PageSection';
import { SECTIONS, sectionPermissionIds } from './userDetail';
import type { Linking } from './useLinking';

/**
 * Lab bench for PageSection — the outer level of the two-level hierarchy
 * (detail-page §5–7): a collapsible section header over a grid of ItemBoxes.
 * The section checkbox (edit only) selects every permission in every box;
 * its tri-state rolls up the boxes.
 *
 * A Lab entry is a question, not a home (BEAM.md §9).
 */

const noop = { onMouseEnter: () => {}, onMouseLeave: () => {}, onFocus: () => {}, onBlur: () => {} };
function benchLinking(dim = false): Linking {
  return {
    active: null,
    roleProps: () => noop,
    permissionProps: () => noop,
    roleDimmed: () => dim,
    permissionDimmed: () => dim,
  };
}

const PLAYER_INFO = SECTIONS[0]; // Player Info Page: Player Overview + Transactions
const PLAYER_OPS = SECTIONS[1]; // Player Operations: Loyalty + Compliance + Content
const noProvenance = new Map<string, string[]>();

/** A granted set covering everything up to `count` permissions of a section. */
const firstN = (section: (typeof SECTIONS)[number], count: number) =>
  new Set(sectionPermissionIds(section).slice(0, count));
const all = (section: (typeof SECTIONS)[number]) => new Set(sectionPermissionIds(section));

// Render-only bench (no controls): meta stays untyped to the component so the
// fixed-state stories don't have to satisfy PageSection's required args.
const meta: Meta = {
  title: 'Lab/Sunlight/PageSection',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

/** Expanded, view — the section over its boxes (Player Info Page = 2 boxes). */
export const Expanded: Story = {
  render: () => (
    <PageSection
      section={PLAYER_INFO}
      mode="view"
      granted={firstN(PLAYER_INFO, 5)}
      provenance={noProvenance}
      linking={benchLinking()}
    />
  ),
};

/** Collapsed — header only. */
export const Collapsed: Story = {
  render: () => (
    <PageSection
      section={PLAYER_INFO}
      mode="view"
      granted={firstN(PLAYER_INFO, 5)}
      provenance={noProvenance}
      linking={benchLinking()}
      defaultOpen={false}
    />
  ),
};

/** Header tri-state (edit) — full / partial / none, rolled up across boxes. */
export const HeaderTriState: Story = {
  render: () => (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">
          full — every permission granted
        </Typography>
        <PageSection
          section={PLAYER_INFO}
          mode="edit"
          granted={all(PLAYER_INFO)}
          provenance={noProvenance}
          onTogglePermission={() => {}}
          onToggleGroup={() => {}}
          linking={benchLinking()}
        />
      </Stack>
      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">
          partial — some granted
        </Typography>
        <PageSection
          section={PLAYER_INFO}
          mode="edit"
          granted={firstN(PLAYER_INFO, 3)}
          provenance={noProvenance}
          onTogglePermission={() => {}}
          onToggleGroup={() => {}}
          linking={benchLinking()}
        />
      </Stack>
      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">
          none — nothing granted
        </Typography>
        <PageSection
          section={PLAYER_INFO}
          mode="edit"
          granted={new Set<string>()}
          provenance={noProvenance}
          onTogglePermission={() => {}}
          onToggleGroup={() => {}}
          linking={benchLinking()}
        />
      </Stack>
    </Stack>
  ),
};

/** Edit — three boxes as checklists, section checkbox visible. */
export const EditMode: Story = {
  render: () => (
    <PageSection
      section={PLAYER_OPS}
      mode="edit"
      granted={firstN(PLAYER_OPS, 4)}
      provenance={noProvenance}
      onTogglePermission={() => {}}
      onToggleGroup={() => {}}
      linking={benchLinking()}
    />
  ),
};
