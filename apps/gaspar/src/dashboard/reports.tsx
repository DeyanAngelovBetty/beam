import type { ReactNode } from 'react';
import { Box, Stack, Button, Typography, Tooltip, IconButton } from '@betty/beam';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { WidgetSize } from './DashboardGrid';
import { Report1Chart } from './Report1Chart';
import { Report3Chart } from './Report3Chart';

/**
 * Boryana's v1.1 dashboard reports (spec: apps/gaspar/docs/specs/gaspar-dashboard-requirements.md; reconciled
 * in docs/gaspar-dashboard-notes.md). Reports 1 and 3 are the x-charts SPIKE (live, over the mock aggregator);
 * 2, 4, 5 stay honest drafts. Every report carries an INFO affordance in the title band — what the spec
 * already defines plus what's pending — that opens on KEYBOARD FOCUS (Tooltip on a focusable button), not
 * hover alone. The spec's view toggle is live on the spiked charts, shown DISABLED on the drafts.
 */
export interface DashboardReport {
  id: string;
  title: string;
  size: WidgetSize;
  /** The spec's named view toggle [default, alternate] — null when the report names none. */
  toggle: readonly [string, string] | null;
  /** Title-band info: spec-defined facts + what's pending (§10 open items). */
  info: string;
  /** Live x-charts spike vs honest draft. */
  live?: boolean;
}

export const REPORTS: readonly DashboardReport[] = [
  { id: 'report1', title: 'Deposits vs Withdrawals', size: 'wide', toggle: ['Value', 'Count'], live: true,
    info: 'Approved transactions only. Value and count are separate views. Timezone: pending (§10).' },
  { id: 'report2', title: 'AVG Deposits & Withdrawals per Transaction', size: 'wide', toggle: null,
    info: 'Mean value per approved transaction (denominator = approved, not attempts). Timezone: pending (§10).' },
  { id: 'report3', title: 'Deposits by Payment Provider', size: 'wide', toggle: ['Share', 'Absolute'], live: true,
    info: 'Share of approved deposit volume per provider (100% stacked); absolute view available. Provider colours are fixed per entity. Timezone: pending (§10).' },
  { id: 'report4', title: 'Withdrawals by Payment Provider', size: 'wide', toggle: ['Share', 'Absolute'],
    info: 'As Report 3, for approved withdrawals. Timezone: pending (§10).' },
  { id: 'report5', title: 'Deposits Approval Rate vs Total Deposit Approval Rate by Payment Provider', size: 'full', toggle: null,
    info: 'Total = aggregate across providers, NOT the mean of the provider lines (they differ when volumes are uneven). Approval-rate denominator: pending with BI (§10). Timezone: pending.' },
];

export const reportById = new Map(REPORTS.map((r) => [r.id, r]));

/** Title-band controls: the spec's view toggle (disabled on drafts; the live charts own their own toggle) +
 *  the info affordance. The info Tooltip opens on hover AND keyboard focus (the IconButton is focusable). */
export function ReportControls({ report }: { report: DashboardReport }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
      {report.toggle && !report.live && (
        <Stack direction="row" sx={{ '& .MuiButton-root': { minWidth: 0, px: 1.25, borderRadius: 0 }, '& :first-of-type': { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }, '& :last-of-type': { borderTopRightRadius: 6, borderBottomRightRadius: 6 } }}>
          <Button size="small" variant="contained" disabled aria-label={`${report.toggle[0]} view (disabled)`}>{report.toggle[0]}</Button>
          <Button size="small" variant="outlined" disabled aria-label={`${report.toggle[1]} view (disabled)`}>{report.toggle[1]}</Button>
        </Stack>
      )}
      <Tooltip title={report.info} enterTouchDelay={0}>
        <IconButton size="small" aria-label={`${report.title} — definition: ${report.info}`}>
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

/** Honest DRAFT body (Reports 2, 4, 5) — preserves footprint, reads unmistakably as a placeholder. */
export function ReportDraftBody() {
  return (
    <Box
      sx={{
        aspectRatio: '16 / 7', minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px dashed', borderColor: 'divider', borderRadius: 1, color: 'text.secondary', bgcolor: 'action.hover',
      }}
    >
      <Stack spacing={0.5} sx={{ alignItems: 'center', textAlign: 'center', px: 2 }}>
        <Typography variant="body2">Chart — draft</Typography>
        <Typography variant="caption">Definition pending</Typography>
      </Stack>
    </Box>
  );
}

/** The report's body: live x-charts spike for 1 & 3, honest draft for the rest. */
export function reportBody(report: DashboardReport): ReactNode {
  if (report.id === 'report1') return <Report1Chart />;
  if (report.id === 'report3') return <Report3Chart />;
  return <ReportDraftBody />;
}
