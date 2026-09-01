import { useRef, useState, type ChangeEvent } from 'react';
import { Stack, Alert, Button, BeamPageHeader, BeamTabs } from '@betty/beam';
import FileDownloadIcon from '@mui/icons-material/FileDownloadRounded';
import UploadFileIcon from '@mui/icons-material/UploadFileRounded';
import { getLoyaltyLevels, type LoyaltyLevel, type SchemeType } from './loyaltyLevels';
import { LoyaltyLevelsList } from './LoyaltyLevelsList';

/**
 * LoyaltyLevelsPage — ported from official Sunlight (features/loyalty/pages/levels). Scheme A/B tabs
 * over the level ladder, with Export All (CSV) and Import…, ported to Beam's page shell + local data.
 *
 * WHAT'S ADAPTED (backend-coupled in the source, no backend here):
 *  - Export All → a client-side CSV over the seed store (faithful, same columns as the source's toCsv).
 *  - Import… → the file picker is ported, but the source files an APPROVAL via the API. Beam's
 *    change-request store only knows `loyaltyStatus`, so this confirms receipt with an inline notice
 *    and files nothing. Onboarding levels into the approval flow (a `loyaltyLevel` CR entity) is a
 *    separate, larger task — see approval-flow.md's "onboarding the next entity type" recipe.
 *  - The source's pending-approvals alert is omitted for the same reason (no level approvals exist yet).
 */

type Notice = { severity: 'success' | 'info' | 'warning' | 'error'; msg: string } | null;

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

export function LoyaltyLevelsPage() {
  const [scheme, setScheme] = useState<SchemeType>('A');
  const [notice, setNotice] = useState<Notice>(null);
  const filePickerRef = useRef<HTMLInputElement>(null);

  const exportAll = () => downloadCsv(`Loyalty_levels_${scheme}.csv`, toCsv(getLoyaltyLevels(scheme)));

  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    // DEMO STUB (see file header): no approval is filed — Beam has no levels CR entity yet.
    setNotice({
      severity: 'info',
      msg: `Import received (${file.name}) for Scheme Type ${scheme}. Demo: no approval is filed — levels aren't wired into the approval flow yet.`,
    });
  };

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title="Loyalty Levels"
        secondaryActions={
          <>
            <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportAll}>
              Export All
            </Button>
            <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => filePickerRef.current?.click()}>
              Import…
            </Button>
          </>
        }
      />

      <input ref={filePickerRef} type="file" hidden accept=".csv,text/csv" onChange={handleImport} />

      {notice && (
        <Alert severity={notice.severity} onClose={() => setNotice(null)}>
          {notice.msg}
        </Alert>
      )}

      <BeamTabs
        items={SCHEME_TABS}
        value={scheme}
        onChange={(id) => setScheme(id as SchemeType)}
        aria-label="Loyalty level schemes"
      />

      {/* key by scheme so paging resets when the scheme changes (source parity). */}
      <LoyaltyLevelsList key={scheme} schemeType={scheme} />
    </Stack>
  );
}
