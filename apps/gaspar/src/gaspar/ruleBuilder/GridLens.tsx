import { BeamDataTable, type BeamColumn } from '@betty/beam';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineRounded';
import { NodeKindChip } from './nodes/NodeKindChip';
import { NODE_KIND_LABEL, summarizeParams, type RuleNode, type RuleEdge } from './ruleSetStore';

type GridRow = { node: RuleNode; inCount: number; outCount: number };

/**
 * Grid lens — the SAME store, projected as a list (list-grammar). READ-ONLY in v1 (proposal Q4):
 * the graph is the editor; the grid is scan/overview. Rows carry the two edit affordances as
 * row-actions — "Edit in graph" (select + flip to the graph lens → inspector) and "Delete".
 */
export function GridLens({
  nodes,
  edges,
  onEditInGraph,
  onDelete,
}: {
  nodes: RuleNode[];
  edges: RuleEdge[];
  onEditInGraph: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const inCounts = new Map<string, number>();
  const outCounts = new Map<string, number>();
  for (const e of edges) {
    outCounts.set(e.source, (outCounts.get(e.source) ?? 0) + 1);
    inCounts.set(e.target, (inCounts.get(e.target) ?? 0) + 1);
  }
  const rows: GridRow[] = nodes.map((node) => ({
    node,
    inCount: inCounts.get(node.id) ?? 0,
    outCount: outCounts.get(node.id) ?? 0,
  }));

  const columns: BeamColumn<GridRow>[] = [
    {
      key: 'kind',
      header: 'Kind',
      render: (r) => <NodeKindChip kind={r.node.kind} />,
      getValue: (r) => NODE_KIND_LABEL[r.node.kind],
      width: 130,
    },
    { key: 'name', header: 'Name', render: (r) => r.node.name, getValue: (r) => r.node.name },
    {
      key: 'params',
      header: 'Parameters',
      render: (r) => summarizeParams(r.node),
      getValue: (r) => summarizeParams(r.node),
    },
    {
      key: 'connections',
      header: 'Connections',
      align: 'right',
      render: (r) => `${r.inCount} in · ${r.outCount} out`,
      getValue: (r) => r.inCount + r.outCount,
      width: 140,
    },
  ];

  return (
    <BeamDataTable<GridRow>
      columns={columns}
      rows={rows}
      getRowId={(r) => r.node.id}
      searchable
      aria-label="Rule nodes"
      emptyMessage="No nodes yet — add one in the graph lens."
      rowActions={(r) => [
        { id: 'edit', label: 'Edit in graph', icon: <AccountTreeRoundedIcon fontSize="small" />, onSelect: () => onEditInGraph(r.node.id) },
        { id: 'delete', label: 'Delete', icon: <DeleteOutlineIcon fontSize="small" />, destructive: true, onSelect: () => onDelete(r.node.id) },
      ]}
    />
  );
}
