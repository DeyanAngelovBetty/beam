import { Box, Stack, Button, Typography, Tooltip, IconButton } from '@betty/beam';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { WidgetSize } from './DashboardGrid';

/**
 * Boryana's v1.1 dashboard reports (spec: apps/gaspar/docs/specs/gaspar-dashboard-requirements.md; reconciled
 * in docs/gaspar-dashboard-notes.md). SCAFFOLD ONLY — no data, no real charts. Each report is an honest DRAFT:
 * the real title, the spec's toggle shown DISABLED where named (value/count · share/absolute), an info
 * affordance in the title band reading "definition pending" (the metric definitions are §10 open items with
 * BI), and a footprint-preserving draft body that is visibly a placeholder — never a chart that looks real
 * ("nothing invented", spec). The chart spike (Reports 1 & 3 on @mui/x-charts) is the next step.
 */
export interface DashboardReport {
  id: string;
  title: string;
  size: WidgetSize;
  /** The spec's named view toggle, shown DISABLED [default, alternate] — null when the report names none. */
  toggle: readonly [string, string] | null;
}

export const REPORTS: readonly DashboardReport[] = [
  { id: 'report1', title: 'Deposits vs Withdrawals', size: 'wide', toggle: ['Value', 'Count'] },
  { id: 'report2', title: 'AVG Deposits & Withdrawals per Transaction', size: 'wide', toggle: null },
  { id: 'report3', title: 'Deposits by Payment Provider', size: 'wide', toggle: ['Share', 'Absolute'] },
  { id: 'report4', title: 'Withdrawals by Payment Provider', size: 'wide', toggle: ['Share', 'Absolute'] },
  { id: 'report5', title: 'Deposits Approval Rate vs Total Deposit Approval Rate by Payment Provider', size: 'full', toggle: null },
];

export const reportById = new Map(REPORTS.map((r) => [r.id, r]));

/** Title-band controls: the spec's view toggle (disabled) + the info "definition pending" affordance. */
export function ReportControls({ report }: { report: DashboardReport }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
      {report.toggle && (
        // The named view toggle — shown DISABLED (it exists in the spec; wiring is a later step).
        <Stack direction="row" sx={{ '& .MuiButton-root': { minWidth: 0, px: 1.25, borderRadius: 0 }, '& :first-of-type': { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }, '& :last-of-type': { borderTopRightRadius: 6, borderBottomRightRadius: 6 } }}>
          <Button size="small" variant="contained" disabled aria-label={`${report.toggle[0]} view (disabled)`}>{report.toggle[0]}</Button>
          <Button size="small" variant="outlined" disabled aria-label={`${report.toggle[1]} view (disabled)`}>{report.toggle[1]}</Button>
        </Stack>
      )}
      <Tooltip title="Definition pending — the metric definition is not yet settled with BI (spec §metric definitions).">
        <IconButton size="small" aria-label={`${report.title}: definition pending`}>
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

/**
 * Honest DRAFT body — preserves the chart's footprint (so the grid doesn't reflow when real charts land) and
 * reads unmistakably as a placeholder: a dashed frame + "Chart — draft · definition pending". No axes, no
 * fake series. (Not a loading skeleton — there is no data source yet; that's the per-chart state work later.)
 */
export function ReportDraftBody() {
  return (
    <Box
      sx={{
        aspectRatio: '16 / 7',
        minHeight: 160,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 1,
        color: 'text.secondary',
        bgcolor: 'action.hover',
      }}
    >
      <Stack spacing={0.5} sx={{ alignItems: 'center', textAlign: 'center', px: 2 }}>
        <Typography variant="body2">Chart — draft</Typography>
        <Typography variant="caption">Definition pending</Typography>
      </Stack>
    </Box>
  );
}
