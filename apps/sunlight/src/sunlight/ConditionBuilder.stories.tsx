import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack, Box, Typography } from '@betty/beam';
import { ConditionBuilder } from './ConditionBuilder';
import { ConditionSummary } from './ConditionSummary';
import type {
  ConditionField,
  ConditionGroup,
  ConditionNode,
  GroupOperator,
  LeafOperator,
} from './conditionTree';

/**
 * Lab bench for ConditionBuilder — the targeting-condition tree editor (the
 * flagged invention inside Georgi's Game Config editor). Controlled; the harness
 * holds the tree. Never shows raw JSON. Nesting visuals + the value lookup lists
 * are placeholders pending the design pass / lookup-API decision.
 */
const meta: Meta = {
  title: 'Lab/Sunlight/ConditionBuilder',
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj;

// Fixture builders.
const g = (operator: GroupOperator, children: ConditionNode[]): ConditionGroup => ({
  kind: 'group',
  operator,
  children,
});
const l = (
  field: ConditionField,
  operator: LeafOperator,
  values: (string | number)[]
): ConditionNode => ({ kind: 'leaf', field, operator, values });

function Harness({ initial, summary = false }: { initial: ConditionGroup; summary?: boolean }) {
  const [value, setValue] = useState<ConditionGroup>(initial);
  if (!summary) return <ConditionBuilder value={value} onChange={setValue} />;
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={6} alignItems="flex-start">
      <ConditionBuilder value={value} onChange={setValue} />
      <Box>
        <Typography variant="caption" color="text.secondary">
          Reads as
        </Typography>
        <ConditionSummary value={value} />
      </Box>
    </Stack>
  );
}

/** A single leaf inside the (always-Group) root. */
export const SingleLeaf: Story = {
  render: () => <Harness initial={g('All', [l('Audience', 'In', [1001])])} />,
};

/** Flat ALL group — the sketch's rule 1. */
export const FlatAll: Story = {
  render: () => (
    <Harness
      initial={g('All', [
        l('Audience', 'In', [1001, 1002]),
        l('LoyaltyStatus', 'In', ['VIP', 'Diamond']),
      ])}
    />
  ),
};

/** ANY group with a NotIn leaf — rule 2. */
export const AnyWithNotIn: Story = {
  render: () => <Harness initial={g('Any', [l('RccSegment', 'NotIn', ['Whale'])])} />,
};

/** Nested — the brief §7.1 example: ALL containing a leaf + an ANY group. */
export const Nested: Story = {
  render: () => (
    <Harness
      initial={g('All', [
        l('LoyaltyStatus', 'In', ['VIP']),
        g('Any', [l('Audience', 'In', [1001]), l('RccSegment', 'In', ['Regular'])]),
      ])}
    />
  ),
};

/** Invalid states — an empty group and a leaf missing values (errors inline). */
export const InvalidStates: Story = {
  render: () => (
    <Harness
      initial={g('All', [g('All', []), l('Audience', 'In', [])])}
    />
  ),
};

/** The editable builder beside its read-only prose twin, live-linked. */
export const EditableAndReadOnly: Story = {
  render: () => (
    <Harness
      summary
      initial={g('All', [
        l('LoyaltyStatus', 'In', ['VIP']),
        g('Any', [l('Audience', 'In', [1001]), l('RccSegment', 'NotIn', ['Whale'])]),
      ])}
    />
  ),
};
