import { Component, useMemo, useState, type ErrorInfo, type ReactNode } from 'react';
import { ReactFlowProvider, type Edge } from '@xyflow/react';
import {
  Stack,
  Box,
  Paper,
  Button,
  Typography,
  TextField,
  BeamPageHeader,
  BeamTabs,
  type BeamTabItem,
} from '@betty/beam';
import UploadFileIcon from '@mui/icons-material/UploadFileRounded';
import ContentCopyIcon from '@mui/icons-material/ContentCopyRounded';
import FileDownloadIcon from '@mui/icons-material/FileDownloadRounded';
import { GraphLens } from './GraphLens';
import { GridLens } from './GridLens';
import { NodeInspector } from './NodeInspector';
import type { RuleFlowNode } from './nodes/RuleNodeCard';
import { layoutTree, type EdgeKind } from './io/layoutTree';
import { importRuleTree } from './io/importRuleTree';
import {
  getRuleTree,
  getRuleMeta,
  setRuleTree,
  resetToSeed,
  serialize,
  findNode,
  updateNode,
  removeNode,
  isRemovable,
  addSequenceChild,
  setFalseBranch,
  unknownFactAdvisories,
  newCondition,
  newAction,
  newSequence,
  type NodeConfig,
  type ConditionConfig,
  type ActionConfig,
  type FactAdvisory,
} from './ruleSetStore';

type Lens = 'graph' | 'grid';
const LENS_TABS: BeamTabItem[] = [
  { id: 'graph', label: 'Graph' },
  { id: 'grid', label: 'Grid' },
];

// Edge stroke by branch kind — True (success) / False (error) / sequence step (muted).
const EDGE_STROKE: Record<EdgeKind, string> = {
  true: 'var(--mui-palette-success-main)',
  false: 'var(--mui-palette-error-main)',
  step: 'var(--mui-palette-text-disabled)',
};

export function RuleBuilderPage() {
  return (
    <RuleBuilderErrorBoundary>
      <ReactFlowProvider>
        <RuleBuilderBody />
      </ReactFlowProvider>
    </RuleBuilderErrorBoundary>
  );
}

function RuleBuilderBody() {
  const [root, setRootState] = useState<NodeConfig>(getRuleTree);
  const [name, setName] = useState(getRuleMeta().name);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lens, setLens] = useState<Lens>('graph');
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);

  // Any mutation: update React state AND the store singleton (keeps it coherent for a re-mount / CR).
  const commit = (next: NodeConfig) => {
    setRootState(next);
    setRuleTree(next);
  };

  // The canvas is a PROJECTION of the tree — derived on every change (io/layoutTree).
  const advisories = useMemo(() => {
    const byId = new Map<string, FactAdvisory[]>();
    for (const a of unknownFactAdvisories(root)) byId.set(a.nodeId, [...(byId.get(a.nodeId) ?? []), a]);
    return byId;
  }, [root]);

  const { nodes, edges } = useMemo(() => {
    const laid = layoutTree(root);
    const rf: RuleFlowNode[] = laid.nodes.map((n) => ({
      id: n.id,
      type: 'rule',
      position: n.position,
      data: { node: n.node, advisories: advisories.get(n.id) ?? [], selected: n.id === selectedId },
    }));
    const rfEdges: Edge[] = laid.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label || undefined,
      type: 'smoothstep',
      style: { stroke: EDGE_STROKE[e.kind] },
      labelStyle: { fontSize: 11, fontWeight: 600, fill: 'var(--mui-palette-text-secondary)' },
      labelBgStyle: { fill: 'var(--mui-palette-background-paper)' },
    }));
    return { nodes: rf, edges: rfEdges };
  }, [root, advisories, selectedId]);

  const selectedNode = selectedId ? findNode(root, selectedId) ?? null : null;
  const removable = selectedId ? isRemovable(root, selectedId) : false;

  // ── edit ops (mutate the tree by id) ──
  const onUpdateCondition = (id: string, condition: ConditionConfig) =>
    commit(updateNode(root, id, (n) => (n.type === 'condition' ? { ...n, condition } : n)));
  const onUpdateActions = (id: string, actions: ActionConfig[]) =>
    commit(updateNode(root, id, (n) => (n.type === 'action' ? { ...n, actions } : n)));
  const onAddChild = (seqId: string, kind: 'condition' | 'action' | 'sequence') => {
    const child = kind === 'condition' ? newCondition() : kind === 'action' ? newAction() : newSequence();
    commit(addSequenceChild(root, seqId, child));
    setSelectedId(child.id);
  };
  const onToggleFalse = (condId: string) => {
    const node = findNode(root, condId);
    if (node?.type !== 'condition') return;
    commit(setFalseBranch(root, condId, node.falseNode ? undefined : newAction()));
  };
  const onDelete = (id: string) => {
    commit(removeNode(root, id));
    setSelectedId(null);
  };
  const onEditInGraph = (id: string) => {
    setSelectedId(id);
    setLens('graph');
  };

  // ── import / export (native engine schema) ──
  const onCopy = () => void navigator.clipboard?.writeText(serialize(root));
  const onDownload = () => {
    const blob = new Blob([serialize(root)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(root.id || name || 'rule-tree').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const applyImport = () => {
    const res = importRuleTree(importText);
    if (!res.ok) {
      setImportErrors(res.errors);
      setImportWarnings([]);
      return; // panel shows errors; nothing imported
    }
    commit(res.root);
    setName(res.root.id);
    setSelectedId(null);
    setImportErrors([]);
    setImportWarnings(res.warnings);
    setImportText('');
    if (res.warnings.length === 0) setImportOpen(false);
  };
  const onImportFile = (file: File | undefined) => {
    if (!file) return;
    void file.text().then(setImportText);
  };

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title="Rule Builder"
        description="Author payment-routing rule trees — the engine's schema, two lenses over one tree."
        action={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => setImportOpen((o) => !o)}>
              Import
            </Button>
            <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={onCopy}>
              Copy JSON
            </Button>
            <Button variant="contained" startIcon={<FileDownloadIcon />} onClick={onDownload}>
              Export
            </Button>
          </Stack>
        }
      />

      {importOpen && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2">Import a rule tree (engine JSON, or a v1 rule set)</Typography>
            <TextField size="small" multiline minRows={4} placeholder="Paste rule JSON…" value={importText} onChange={(e) => setImportText(e.target.value)} fullWidth />
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Button size="small" component="label" variant="text">
                Choose file…
                <input hidden type="file" accept="application/json,.json" onChange={(e) => onImportFile(e.target.files?.[0])} />
              </Button>
              <Box sx={{ flex: 1 }} />
              <Button size="small" onClick={() => { setImportOpen(false); setImportErrors([]); setImportWarnings([]); }}>Cancel</Button>
              <Button size="small" variant="contained" onClick={applyImport} disabled={!importText.trim()}>Import</Button>
            </Stack>
            {importErrors.length > 0 && (
              <Paper variant="outlined" sx={{ p: 1.5, borderColor: 'error.main' }}>
                <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                  {importErrors.length} problem{importErrors.length > 1 ? 's' : ''} — nothing imported:
                </Typography>
                <Stack component="ul" sx={{ m: 0, pl: 2 }}>
                  {importErrors.map((err, i) => (
                    <Typography key={i} component="li" variant="caption" color="text.secondary">{err}</Typography>
                  ))}
                </Stack>
              </Paper>
            )}
            {importWarnings.length > 0 && (
              <Paper variant="outlined" sx={{ p: 1.5, borderColor: 'warning.main' }}>
                <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                  Imported with {importWarnings.length} note{importWarnings.length > 1 ? 's' : ''} (v1 migration is best-effort):
                </Typography>
                <Stack component="ul" sx={{ m: 0, pl: 2 }}>
                  {importWarnings.map((w, i) => (
                    <Typography key={i} component="li" variant="caption" color="text.secondary">{w}</Typography>
                  ))}
                </Stack>
              </Paper>
            )}
          </Stack>
        </Paper>
      )}

      <BeamTabs items={LENS_TABS} value={lens} onChange={(id) => setLens(id as Lens)} aria-label="Rule Builder lens" />

      {lens === 'graph' ? (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'stretch' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <GraphLens nodes={nodes} edges={edges} onSelectNode={setSelectedId} />
          </Box>
          <Paper variant="outlined" sx={{ width: 320, flexShrink: 0, alignSelf: 'flex-start' }}>
            <NodeInspector
              node={selectedNode}
              removable={removable}
              onUpdateCondition={onUpdateCondition}
              onUpdateActions={onUpdateActions}
              onAddChild={onAddChild}
              onToggleFalse={onToggleFalse}
              onDelete={onDelete}
            />
          </Paper>
        </Stack>
      ) : (
        <GridLens root={root} onEditInGraph={onEditInGraph} onDelete={onDelete} />
      )}
    </Stack>
  );
}

/** App-local containment (mirrors the Lab's boundary): a render fault shows an inline card; reset
 *  reseeds from the demo. */
class RuleBuilderErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('[RuleBuilder] render error — contained by the page boundary:', error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <Paper variant="outlined" role="alert" sx={{ p: 3, m: 2, borderColor: 'error.main', maxWidth: 520 }}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2" color="error.main">Rule Builder hit an error</Typography>
            <Typography variant="caption" color="text.secondary">
              The editor stopped rendering — the rest of Gaspar is unaffected. Reset to start again from the demo.
            </Typography>
            <Button size="small" variant="outlined" onClick={() => { resetToSeed(); this.setState({ error: null }); }} sx={{ alignSelf: 'flex-start' }}>
              Reset to demo
            </Button>
          </Stack>
        </Paper>
      );
    }
    return this.props.children;
  }
}
