import { Component, useCallback, useMemo, useState, type ErrorInfo, type ReactNode } from 'react';
import {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  type Edge,
  type Connection,
  type OnConnect,
  type IsValidConnection,
} from '@xyflow/react';
import {
  Stack,
  Box,
  Paper,
  Button,
  Typography,
  TextField,
  Divider,
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
import {
  SEED_RULE_SET,
  getRuleSet,
  setRuleSet,
  serialize,
  validateRuleSet,
  computeAdvisories,
  canConnect,
  newNode,
  type NodeKind,
  type RuleNode,
  type RuleEdge,
  type RuleSet,
  type Advisory,
} from './ruleSetStore';

// ── RF ⇄ domain converters (the only boundary between the canvas's state and the store model) ──
const toFlowNode = (r: RuleNode): RuleFlowNode => ({ id: r.id, type: 'rule', position: r.position, data: { rule: r, advisories: [] } });
const toFlowEdge = (e: RuleEdge): Edge => ({ id: e.id, source: e.source, target: e.target });
const toDomainNode = (n: RuleFlowNode): RuleNode => ({ ...n.data.rule, position: n.position } as RuleNode);
const toDomainEdge = (e: Edge): RuleEdge => ({ id: e.id, source: e.source, target: e.target });

type Lens = 'graph' | 'grid';
const LENS_TABS: BeamTabItem[] = [
  { id: 'graph', label: 'Graph' },
  { id: 'grid', label: 'Grid' },
];

/** Exported page: the canvas provider + a containment boundary, so a render fault in the editor
 *  shows an inline card and the rest of the app keeps rendering (the Lab lesson, on the canvas). */
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
  const initial = getRuleSet(); // seed (or the last import), read once
  const [name, setName] = useState(initial.name);
  const [nodes, setNodes, onNodesChange] = useNodesState<RuleFlowNode>(initial.nodes.map(toFlowNode));
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges.map(toFlowEdge));
  const [lens, setLens] = useState<Lens>('graph');
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);

  // Advisories (render-time completeness) — recomputed from structure, injected into each node's
  // data so the card can show its error-pigment badge. Derived, not stored → no setState loop.
  const advByNode = useMemo(() => {
    const grouped = new Map<string, Advisory[]>();
    for (const a of computeAdvisories(nodes.map(toDomainNode), edges.map(toDomainEdge))) {
      if (a.nodeId) grouped.set(a.nodeId, [...(grouped.get(a.nodeId) ?? []), a]);
    }
    return grouped;
  }, [nodes, edges]);

  const displayNodes = useMemo(
    () => nodes.map((n) => ({ ...n, data: { ...n.data, advisories: advByNode.get(n.id) ?? [] } })),
    [nodes, advByNode],
  );

  const selected = nodes.find((n) => n.selected) ?? null;
  const selectedRule = selected ? toDomainNode(selected) : null;

  // ── grammar-gated connect (structure prevents) ──
  const isValidConnection: IsValidConnection = useCallback(
    (c: Edge | Connection) => {
      if (!c.source || !c.target || c.source === c.target) return false;
      if (edges.some((e) => e.source === c.source && e.target === c.target)) return false; // no duplicate
      const s = nodes.find((n) => n.id === c.source);
      const t = nodes.find((n) => n.id === c.target);
      return !!s && !!t && canConnect(s.data.rule.kind, t.data.rule.kind);
    },
    [nodes, edges],
  );
  const onConnect: OnConnect = useCallback((c) => setEdges((es) => addEdge(c, es)), [setEdges]);

  // ── node mutations (the store is page state; both lenses read it) ──
  const onAddNode = (kind: NodeKind) => {
    const position = { x: 80 + (nodes.length % 6) * 36, y: 80 + (nodes.length % 6) * 36 };
    setNodes((ns) => [...ns, toFlowNode(newNode(kind, position))]);
  };
  const onRename = (id: string, newName: string) =>
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, rule: { ...n.data.rule, name: newName } } } : n)));
  const onParams = (id: string, params: RuleNode['params']) =>
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, rule: { ...n.data.rule, params } as RuleNode } } : n)));
  const onDelete = (id: string) => {
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setEdges((es) => es.filter((e) => e.source !== id && e.target !== id));
  };
  const onEditInGraph = (id: string) => {
    setNodes((ns) => ns.map((n) => ({ ...n, selected: n.id === id })));
    setLens('graph');
  };

  // ── import / export ──
  const currentRuleSet = (): RuleSet => ({ version: initial.version, name, nodes: nodes.map(toDomainNode), edges: edges.map(toDomainEdge) });
  const onCopy = () => void navigator.clipboard?.writeText(serialize(currentRuleSet()));
  const onDownload = () => {
    const blob = new Blob([serialize(currentRuleSet())], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'rule-set'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const applyImport = () => {
    const res = validateRuleSet(importText);
    if (!res.ok) {
      setImportErrors(res.errors);
      return; // error card, never a crash
    }
    setNodes(res.ruleSet.nodes.map(toFlowNode));
    setEdges(res.ruleSet.edges.map(toFlowEdge));
    setName(res.ruleSet.name);
    setRuleSet(res.ruleSet); // keep the singleton coherent for a later re-mount / CR
    setImportErrors([]);
    setImportText('');
    setImportOpen(false);
  };
  const onImportFile = (file: File | undefined) => {
    if (!file) return;
    file.text().then(setImportText);
  };

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title="Rule Builder"
        description="Author payment-routing rule sets — two lenses over one store."
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
            <Typography variant="subtitle2">Import rule set (JSON v1)</Typography>
            <TextField
              size="small"
              multiline
              minRows={4}
              placeholder="Paste rule-set JSON…"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              fullWidth
            />
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Button size="small" component="label" variant="text">
                Choose file…
                <input hidden type="file" accept="application/json" onChange={(e) => onImportFile(e.target.files?.[0])} />
              </Button>
              <Box sx={{ flex: 1 }} />
              <Button size="small" onClick={() => { setImportOpen(false); setImportErrors([]); }}>
                Cancel
              </Button>
              <Button size="small" variant="contained" onClick={applyImport} disabled={!importText.trim()}>
                Import
              </Button>
            </Stack>
            {importErrors.length > 0 && (
              <Paper variant="outlined" sx={{ p: 1.5, borderColor: 'error.main' }}>
                <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                  {importErrors.length} problem{importErrors.length > 1 ? 's' : ''} — nothing was imported:
                </Typography>
                <Stack component="ul" sx={{ m: 0, pl: 2 }}>
                  {importErrors.map((err, i) => (
                    <Typography key={i} component="li" variant="caption" color="text.secondary">
                      {err}
                    </Typography>
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
            <GraphLens
              nodes={displayNodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              isValidConnection={isValidConnection}
              onAddNode={onAddNode}
            />
          </Box>
          <Paper variant="outlined" sx={{ width: 300, flexShrink: 0, alignSelf: 'flex-start' }}>
            <NodeInspector node={selectedRule} onRename={onRename} onParams={onParams} onDelete={onDelete} />
          </Paper>
        </Stack>
      ) : (
        <GridLens nodes={nodes.map(toDomainNode)} edges={edges.map(toDomainEdge)} onEditInGraph={onEditInGraph} onDelete={onDelete} />
      )}
    </Stack>
  );
}

/** App-local containment (mirrors the Lab's LabErrorBoundary): a render fault in the editor shows
 *  an inline recovery card — the product around it keeps rendering. Reset reseeds from the demo. */
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
            <Typography variant="subtitle2" color="error.main">
              Rule Builder hit an error
            </Typography>
            <Typography variant="caption" color="text.secondary">
              The editor stopped rendering — the rest of Gaspar is unaffected. Reload the page to start
              again from the last saved rule set.
            </Typography>
            <Button size="small" variant="outlined" onClick={() => { setRuleSet(JSON.parse(JSON.stringify(SEED_RULE_SET))); this.setState({ error: null }); }} sx={{ alignSelf: 'flex-start' }}>
              Reset to demo
            </Button>
          </Stack>
        </Paper>
      );
    }
    return this.props.children;
  }
}
