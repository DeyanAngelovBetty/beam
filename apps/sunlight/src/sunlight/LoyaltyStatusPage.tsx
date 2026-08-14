import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Stack,
  Box,
  Paper,
  Button,
  TextField,
  Alert,
  BeamDataTable,
  GemIcon,
  BeamPageHeader,
  BeamTabs,
  BeamStatusBadge,
} from '@betty/beam';
import type { BeamColumn, BeamTabItem } from '@betty/beam';
import EditIcon from '@mui/icons-material/EditRounded';
import FileDownloadIcon from '@mui/icons-material/FileDownloadRounded';
import UploadFileIcon from '@mui/icons-material/UploadFileRounded';
import { RouterIdentityLink } from './RouterIdentityLink';
import { ExpandedLoyaltyPanel } from './LoyaltyExpandedPanel';
import { LOYALTY_STATUSES, toDraft, type LoyaltyStatus } from './loyaltyStatuses';
import { getPendingFor, submit } from './changeRequests';
import { getCurrentUser } from './currentUser';
import {
  serializeStatus,
  serializeList,
  validateStatusImport,
  validateListImport,
  computeListDiff,
  mergeOntoLive,
  downloadAndCopy,
  slugifyName,
  type ListDiff,
} from './loyaltyImportExport';

const TABS: BeamTabItem[] = [
  'Status', 'A Levels', 'B Levels', 'RTP Multipliers', 'Daily Gifts',
  'Wheel Settings', 'Status Perks', 'Onboarding Checklist', 'MetaGame Presets',
].map((label) => ({ id: label.toLowerCase().replace(/\s+/g, '-'), label }));

type ImportPanel = { kind: 'row'; status: LoyaltyStatus } | { kind: 'grid' };

export function LoyaltyStatusPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(TABS[0].id);
  const [, setTick] = useState(0);
  const bump = () => setTick((t) => t + 1); // refresh the Pending badges after grid submit

  // Import UI (Rule Builder import-panel precedent: validate before anything touches state).
  const [panel, setPanel] = useState<ImportPanel | null>(null);
  const [importText, setImportText] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [gridDiff, setGridDiff] = useState<ListDiff | null>(null);
  const [gridResult, setGridResult] = useState<number | null>(null);

  const openPanel = (p: ImportPanel) => {
    setPanel(p);
    setImportText('');
    setImportErrors([]);
    setGridDiff(null);
    setGridResult(null);
  };
  const closePanel = () => setPanel(null);
  const onFile = (file: File | undefined) => file?.text().then(setImportText);

  // Row import → validate → open the editor route with the payload as a DRAFT (identity re-anchored
  // to this row; import never writes the store — four-eyes runs through the editor's Submit).
  const doRowImport = (status: LoyaltyStatus) => {
    const res = validateStatusImport(importText);
    if (!res.ok) return setImportErrors(res.errors);
    navigate(`/loyalty-status/${status.id}`, { state: { importedDraft: mergeOntoLive(res.draft, status) } });
  };

  // Grid import → validate → diff (which statuses differ) → confirm → one CR per changed status.
  const reviewGridImport = () => {
    const res = validateListImport(importText);
    if (!res.ok) {
      setImportErrors(res.errors);
      setGridDiff(null);
      return;
    }
    setImportErrors([]);
    setGridDiff(computeListDiff(res.items, LOYALTY_STATUSES));
  };
  const confirmGridImport = () => {
    if (!gridDiff) return;
    const byId = new Map(LOYALTY_STATUSES.map((s) => [String(s.id), s]));
    const res = validateListImport(importText);
    if (!res.ok) return; // guarded by the review step; belt-and-braces
    let count = 0;
    for (const item of res.items) {
      const live = byId.get(String(item.id));
      if (!live) continue;
      const changed = gridDiff.changed.some((c) => c.id === String(item.id));
      if (!changed) continue; // unchanged → no CR
      submit({
        entityType: 'loyaltyStatus',
        entityId: String(live.id),
        entityName: live.name,
        baseVersion: live.version, // supersede handles any in-flight pending for this entity
        baseSnapshot: toDraft(live), // frozen before-state for the review diff
        draft: mergeOntoLive(item, live),
        submittedBy: getCurrentUser().name,
      });
      count += 1;
    }
    setGridResult(count);
    setGridDiff(null);
    setImportText('');
    bump(); // rows now wear the Pending badge
  };

  const columns: BeamColumn<LoyaltyStatus>[] = [
    { key: 'id', header: 'ID', render: (r) => r.id, getValue: (r) => r.id, width: 64 },
    {
      key: 'status',
      header: 'Loyalty status',
      getValue: (r) => r.name,
      isIdentity: true,
      getHref: (r) => `${import.meta.env.BASE_URL}loyalty-status/${r.id}`,
      render: (r) => (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <GemIcon gem={r.gem} size={20} />
          <span>{r.name}</span>
        </Stack>
      ),
    },
    { key: 'maxDays', header: 'Max days to complete', render: (r) => r.maxDays, align: 'right', width: '140px' },
    { key: 'boxes', header: 'gems', render: (r) => r.boxes, align: 'right', width: '140px' },
    { key: 'keepGems', header: 'retain status after gem #', render: (r) => r.keepGems, align: 'right', width: '140px' },
    { key: 'multiplier', header: 'Multiplier on level up', render: (r) => r.multiplier, align: 'right', width: '140px' },
    {
      // Approval state, visible on the object (BEAM §8): a pending change request shows Pending.
      key: 'approval',
      header: 'Approval',
      width: '120px',
      render: (r) => {
        const pending = getPendingFor(String(r.id));
        return pending ? <BeamStatusBadge status="pending" label="Pending" size="small" /> : null;
      },
    },
  ];

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title="Loyalty Status"
        // Grid-level export/import (list-grammar: whole-collection actions live in the page header,
        // per-row ones in the kebab). Export = the live list; Import = a governed diff → CRs.
        action={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => downloadAndCopy('loyalty-statuses.json', serializeList(LOYALTY_STATUSES))}>
              Export all
            </Button>
            <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => openPanel({ kind: 'grid' })}>
              Import…
            </Button>
          </Stack>
        }
      />

      {gridResult !== null && (
        <Alert
          severity={gridResult > 0 ? 'success' : 'info'}
          action={
            gridResult > 0 ? (
              <Button color="inherit" size="small" onClick={() => navigate('/pending-approvals')}>
                Pending Approvals
              </Button>
            ) : undefined
          }
          onClose={() => setGridResult(null)}
        >
          {gridResult > 0
            ? `${gridResult} change request${gridResult > 1 ? 's' : ''} submitted for approval.`
            : 'No changes — nothing to submit.'}
        </Alert>
      )}

      {panel && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2">
              {panel.kind === 'row' ? `Import onto “${panel.status.name}” (single status JSON)` : 'Import loyalty statuses (list JSON)'}
            </Typography>
            <TextField
              size="small"
              multiline
              minRows={4}
              placeholder="Paste JSON…"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              fullWidth
            />
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Button size="small" component="label" variant="text">
                Choose file…
                <input hidden type="file" accept="application/json" onChange={(e) => onFile(e.target.files?.[0])} />
              </Button>
              <Box sx={{ flex: 1 }} />
              <Button size="small" onClick={closePanel}>Cancel</Button>
              {panel.kind === 'row' ? (
                <Button size="small" variant="contained" disabled={!importText.trim()} onClick={() => doRowImport(panel.status)}>
                  Import → edit
                </Button>
              ) : gridDiff ? (
                <Button size="small" variant="contained" disabled={gridDiff.changed.length === 0} onClick={confirmGridImport}>
                  Submit {gridDiff.changed.length} change request{gridDiff.changed.length === 1 ? '' : 's'}
                </Button>
              ) : (
                <Button size="small" variant="contained" disabled={!importText.trim()} onClick={reviewGridImport}>
                  Review changes
                </Button>
              )}
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

            {panel.kind === 'grid' && gridDiff && (
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {gridDiff.changed.length} changed · {gridDiff.unchanged} unchanged
                  {gridDiff.unknown.length > 0 ? ` · ${gridDiff.unknown.length} unknown (skipped)` : ''}
                </Typography>
                <Stack component="ul" sx={{ m: 0, pl: 2 }}>
                  {gridDiff.changed.map((c) => (
                    <Typography key={c.id} component="li" variant="caption" color="text.secondary">
                      {c.name} — {c.changedFields} field{c.changedFields > 1 ? 's' : ''} changed
                    </Typography>
                  ))}
                </Stack>
                {gridDiff.changed.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    Submitting files one change request per changed status — unchanged statuses are left alone.
                  </Typography>
                )}
              </Paper>
            )}
          </Stack>
        </Paper>
      )}

      <BeamDataTable
        columns={columns}
        rows={LOYALTY_STATUSES}
        getRowId={(r) => String(r.id)}
        LinkComponent={RouterIdentityLink}
        paginated
        renderExpanded={(r) => (
          <ExpandedLoyaltyPanel status={r} next={LOYALTY_STATUSES[LOYALTY_STATUSES.findIndex((s) => s.id === r.id) + 1]} />
        )}
        rowActions={(r) => [
          // Edit LEADS (list-page-grammar §3, 2026-08-13) — write intent, deep-links to edit mode
          // via nav state (the seam imported drafts already ride). The identity link opens view.
          { id: 'edit', label: 'Edit', icon: <EditIcon fontSize="small" />, onSelect: () => navigate(`/loyalty-status/${r.id}`, { state: { edit: true } }) },
          { id: 'export', label: 'Export', icon: <FileDownloadIcon fontSize="small" />, onSelect: () => downloadAndCopy(`${slugifyName(r.name)}.json`, serializeStatus(r)) },
          { id: 'import', label: 'Import…', icon: <UploadFileIcon fontSize="small" />, onSelect: () => openPanel({ kind: 'row', status: r }) },
        ]}
        aria-label="Loyalty statuses"
      />
    </Stack>
  );
}
