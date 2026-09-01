import { useRef, useState, type ChangeEvent } from 'react';
import { Stack, Box, Alert, Button, MenuItem, BeamPageHeader, BeamTabs, BeamField, DetailsPanel } from '@betty/beam';
import FileDownloadIcon from '@mui/icons-material/FileDownloadRounded';
import UploadFileIcon from '@mui/icons-material/UploadFileRounded';
import ScienceIcon from '@mui/icons-material/ScienceOutlined';
import { getLoyaltyLevels, type LoyaltyLevel, type SchemeType } from './loyaltyLevels';
import { LoyaltyLevelsList } from './LoyaltyLevelsList';

/**
 * LoyaltyLevelsPage — ported from official Sunlight (features/loyalty/pages/levels), reworked so the
 * SIMPLE case is the default and A/B testing is an explicit MODE.
 *
 * A/B tests are the ~10% case, so permanent Scheme A/B tabs were the wrong default. Default mode now
 * shows the ONE live scheme (no tabs). "A/B Test" enters a feature MODE that reuses our view↔edit
 * grammar (detail-page-grammar §2): the header actions swap ([A/B Test]/[Export]/[Import] →
 * [Cancel]/[Submit for A/B Test]) with CONSTANT geometry, an edit-mode DetailsPanel appears (mode
 * border via `:has`), the Scheme A/B tabs appear, and Export/Import move to tab level. This is the
 * FIRST non-edit use of the mode mechanic — recorded in doctrine.
 *
 * The A/B test fields (Parity Type, Start Date) sit ABOVE the tabs, not inside Scheme B — a
 * deliberate divergence from Midnight: they describe the TEST, not Scheme B. Submit is a stub (no
 * backend). Open questions (persistence of a running test, end lifecycle, data model, maker-checker,
 * mid-test import) are logged in detail-page-grammar, not solved here.
 */

// Which scheme is "live" is backend-owned state (open item (3)); the demo hardcodes A.
const LIVE_SCHEME: SchemeType = 'A';

type Notice = { severity: 'success' | 'info' | 'warning' | 'error'; msg: string } | null;
type ParityType = 'None' | 'Odd' | 'Even';

// CSV columns faithful to the source's toCsv (Level · StartPoints · EndPoints · PrizeType ·
// PrizeAmount · IsSpecial · PrizeDelivery · ExpiryHours).
const CSV_COLUMNS: { header: string; value: (l: LoyaltyLevel) => string | number | boolean }[] = [
  { header: 'Level', value: (l) => l.level },
  { header: 'StartPoints', value: (l) => l.startPoints },
  { header: 'EndPoints', value: (l) => l.endPoints },
  { header: 'PrizeType', value: (l) => l.prizeType },
  { header: 'PrizeAmount', value: (l) => l.prizeAmount },
  { header: 'IsSpecial', value: (l) => l.isSpecial },
  { header: 'PrizeDelivery', value: (l) => l.prizeDelivery },
  { header: 'ExpiryHours', value: (l) => l.expiryHours ?? '' },
];

function toCsv(rows: LoyaltyLevel[]): string {
  const escape = (v: string | number | boolean) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = CSV_COLUMNS.map((c) => c.header).join(',');
  const body = rows.map((r) => CSV_COLUMNS.map((c) => escape(c.value(r))).join(',')).join('\n');
  return `${head}\n${body}`;
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const SCHEME_TABS = [
  { id: 'A', label: 'Scheme Type A' },
  { id: 'B', label: 'Scheme Type B' },
];
const PARITY_OPTIONS: ParityType[] = ['None', 'Odd', 'Even'];

export function LoyaltyLevelsPage() {
  const [mode, setMode] = useState<'default' | 'abtest'>('default');
  const [scheme, setScheme] = useState<SchemeType>('A');
  const [parityType, setParityType] = useState<ParityType>('None');
  const [startDate, setStartDate] = useState('');
  const [notice, setNotice] = useState<Notice>(null);

  // One hidden file input; the click sets which scheme the pick targets.
  const filePickerRef = useRef<HTMLInputElement>(null);
  const importSchemeRef = useRef<SchemeType>(LIVE_SCHEME);

  const exportScheme = (s: SchemeType) => downloadCsv(`Loyalty_levels_${s}.csv`, toCsv(getLoyaltyLevels(s)));

  const openImport = (s: SchemeType) => {
    importSchemeRef.current = s;
    filePickerRef.current?.click();
  };
  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    // DEMO STUB: no approval is filed — Beam has no levels CR entity yet.
    setNotice({
      severity: 'info',
      msg: `Import received (${file.name}) for Scheme Type ${importSchemeRef.current}. Demo: no approval is filed — levels aren't wired into the approval flow yet.`,
    });
  };

  const enterAbTest = () => {
    setNotice(null);
    setMode('abtest');
  };
  const cancelAbTest = () => {
    // No-confirm discard (the discard guard isn't part of the mode mechanic): reset + exit.
    setParityType('None');
    setStartDate('');
    setScheme('A');
    setMode('default');
  };
  const submitAbTest = () => {
    // TODO(ab-test): wire to backend — likely through maker-checker (open item (4)). Stub for now:
    // report + exit the mode. A submitted test is persistent state, not this ephemeral mode (item (1)).
    setNotice({ severity: 'warning', msg: 'Submit for A/B Test is a stub — no backend yet (TODO). The mode was exited without starting a test.' });
    cancelAbTest();
  };

  // Header actions swap by mode; geometry is constant (BeamPageHeader's fixed rows — only this node
  // changes). Default: least→most important L→R. A/B mode: the cancel/submit pair.
  const headerActions =
    mode === 'default' ? (
      <>
        <Button variant="outlined" startIcon={<ScienceIcon />} onClick={enterAbTest}>
          A/B Test
        </Button>
        <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => exportScheme(LIVE_SCHEME)}>
          Export All
        </Button>
        <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => openImport(LIVE_SCHEME)}>
          Import…
        </Button>
      </>
    ) : (
      <>
        <Button variant="text" onClick={cancelAbTest}>
          Cancel
        </Button>
        <Button variant="contained" onClick={submitAbTest}>
          Submit for A/B Test
        </Button>
      </>
    );

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title="Loyalty Levels"
        subtitle={mode === 'abtest' ? 'Configuring an A/B test — Scheme A vs Scheme B.' : undefined}
        secondaryActions={headerActions}
      />

      <input ref={filePickerRef} type="file" hidden accept=".csv,text/csv" onChange={handleImport} />

      {notice && (
        <Alert severity={notice.severity} onClose={() => setNotice(null)}>
          {notice.msg}
        </Alert>
      )}

      {mode === 'default' ? (
        // The simple, 90% case: one datagrid, the live scheme. No tabs.
        <LoyaltyLevelsList schemeType={LIVE_SCHEME} />
      ) : (
        <>
          {/* Test-level fields, ABOVE the tabs (they describe the TEST, not Scheme B). Edit-mode
              DetailsPanel → mode border via :has; both are 44px field twins (edit half). */}
          <DetailsPanel aria-label="A/B test configuration">
            <BeamField
              select
              label="Parity Type"
              value={parityType}
              onChange={(e) => setParityType(e.target.value as ParityType)}
            >
              {PARITY_OPTIONS.map((p) => (
                <MenuItem key={p} value={p}>
                  {p}
                </MenuItem>
              ))}
            </BeamField>
            <BeamField
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </DetailsPanel>

          <BeamTabs
            items={SCHEME_TABS}
            value={scheme}
            onChange={(id) => setScheme(id as SchemeType)}
            aria-label="Loyalty level schemes"
          />

          {/* Export/Import move to tab level, per scheme (LEFT-aligned above the grid — list-grammar
              §3: nothing below page altitude aligns right). */}
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => exportScheme(scheme)}>
                Export All
              </Button>
              <Button size="small" variant="outlined" startIcon={<UploadFileIcon />} onClick={() => openImport(scheme)}>
                Import…
              </Button>
            </Box>
            {/* key by scheme so paging resets when the scheme changes (source parity). */}
            <LoyaltyLevelsList key={scheme} schemeType={scheme} />
          </Stack>
        </>
      )}
    </Stack>
  );
}
