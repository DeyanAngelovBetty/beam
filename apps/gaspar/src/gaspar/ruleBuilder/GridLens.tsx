import { BeamDataTable, type BeamColumn } from '@betty/beam';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineRounded';
import { NodeKindChip } from './nodes/NodeKindChip';
import { NODE_KIND_LABEL, summarizeNode, isRemovable, type NodeConfig } from './ruleSetStore';

type GridRow = { node: NodeConfig; depth: number; removable: boolean };

/** Depth-first flatten of the containment tree into scannable rows. */
function flatten(root: NodeConfig): GridRow[] {
  const rows: GridRow[] = [];
  const walk = (n: NodeConfig, depth: number) => {
    rows.push({ node: n, depth, removable: isRemovable(root, n.id) });
    if (n.type === 'condition') {
      walk(n.trueNode, depth + 1);
      if (n.falseNode) walk(n.falseNode, depth + 1);
    } else if (n.type === 'sequence') n.nodes.forEach((c) => walk(c, depth + 1));
  };
  walk(root, 0);
  return rows;
}

/**
 * Grid lens — the SAME tree, projected as a scannable list (list-grammar). Read-only overview; the
 * graph + inspector are the editor. Rows carry "Edit in graph" (select + flip to the graph lens) and
 * "Delete" (disabled where the tree forbids removal — the root and a condition's required True branch).
 */
export function GridLens({
  root,
  onEditInGraph,
  onDelete,
}: {
  root: NodeConfig;
  onEditInGraph: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const rows = flatten(root);

  const columns: BeamColumn<GridRow>[] = [
    { key: 'kind', header: 'Kind', render: (r) => <NodeKindChip kind={r.node.type} />, getValue: (r) => NODE_KIND_LABEL[r.node.type], width: 130 },
    {
      key: 'id',
      header: 'Node',
      render: (r) => <span style={{ paddingLeft: r.depth * 14 }}>{r.node.id}</span>,
      getValue: (r) => r.node.id,
    },
    { key: 'detail', header: 'Detail', render: (r) => summarizeNode(r.node), getValue: (r) => summarizeNode(r.node) },
  ];

  return (
    <BeamDataTable<GridRow>
      columns={columns}
      rows={rows}
      getRowId={(r) => r.node.id}
      searchable
      aria-label="Rule tree nodes"
      emptyMessage="No nodes."
      rowActions={(r) => [
        { id: 'edit', label: 'Edit in graph', icon: <AccountTreeRoundedIcon fontSize="small" />, onSelect: () => onEditInGraph(r.node.id) },
        {
          id: 'delete',
          label: 'Delete',
          icon: <DeleteOutlineIcon fontSize="small" />,
          destructive: true,
          disabled: !r.removable,
          disabledReason: r.removable ? undefined : 'The root and a condition’s True branch cannot be deleted.',
          onSelect: () => onDelete(r.node.id),
        },
      ]}
    />
  );
}
