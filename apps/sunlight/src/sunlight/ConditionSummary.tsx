import type { ReactNode } from 'react';
import { Stack, Typography } from '@betty/beam';
import {
  GROUP_LABEL,
  LEAF_OP_LABEL,
  FIELD_LABEL,
  labelForValue,
  keyOf,
  type ConditionNode,
  type ConditionGroup,
} from './conditionTree';

/**
 * ConditionSummary — the read-only, compact prose rendering of a condition tree
 * (the other half of "never raw JSON", brief §7). This is what a rule row shows
 * COLLAPSED and what any future view surface uses: indented ALL / ANY /
 * is-one-of lines. Plain typography — the design pass is Deyan's.
 */
export function ConditionSummary({ value }: { value: ConditionGroup }) {
  return <Stack spacing={0.25}>{renderNode(value, 0)}</Stack>;
}

function renderNode(node: ConditionNode, depth: number): ReactNode[] {
  const indent = { pl: depth * 2 };

  if (node.kind === 'group') {
    const lines: ReactNode[] = [
      <Typography key={keyOf(node)} variant="body2" sx={{ ...indent, fontWeight: 600 }}>
        {GROUP_LABEL[node.operator]}:
      </Typography>,
    ];
    if (node.children.length === 0) {
      lines.push(
        <Typography key={`${keyOf(node)}-empty`} variant="body2" color="text.secondary" sx={{ pl: (depth + 1) * 2 }}>
          (no conditions)
        </Typography>
      );
    } else {
      node.children.forEach((child) => lines.push(...renderNode(child, depth + 1)));
    }
    return lines;
  }

  const values = node.values.length
    ? node.values.map((v) => labelForValue(node.field, v)).join(', ')
    : '…';
  return [
    <Typography key={keyOf(node)} variant="body2" sx={indent}>
      {FIELD_LABEL[node.field]} {LEAF_OP_LABEL[node.operator]} {values}
    </Typography>,
  ];
}
