import { useState, type ReactNode } from 'react';
import { Box, Stack, Button, Typography, Tooltip, IconButton, Section } from '@betty/beam';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { WidgetSize } from './DashboardGrid';
import { Report1Chart } from './Report1Chart';
import { Report3Chart } from './Report3Chart';

/**
 * Boryana's v1.1 dashboard reports (spec: apps/gaspar/docs/specs/gaspar-dashboard-requirements.md; reconciled
 * in docs/gaspar-dashboard-notes.md). Reports 1 & 3 are the x-charts spike (live); 2, 4, 5 are honest drafts.
 * Each is a ReportSection: title band carries the title + an INFO affordance (titleAdornment, opens on keyboard
 * focus) + the view TOGGLE on the right (headerAction, §6.9 small/flat) — live on 1 & 3, disabled on drafts
 * where the spec names one. No stacked rows; legend sits above the plot inside each chart.
 */
export interface DashboardReport {
  id: string;
  title: string;
  size: WidgetSize;
  toggle: readonly [string, string] | null;
  info: string;
  live?: boolean;
}

export const REPORTS: readonly DashboardReport[] = [
  { id: 'report1', title: 'Deposits vs Withdrawals', size: 'wide', toggle: ['Value', 'Count'], live: true,
    info: 'Approved transactions only. Value and count are separate views. Timezone: pending (§10).' },
  { id: 'report2', title: 'AVG Deposits & Withdrawals per Transaction', size: 'wide', toggle: null,
    info: 'Mean value per approved transaction (denominator = approved, not attempts). Timezone: pending (§10).' },
  { id: 'report3', title: 'Deposits by Payment Provider', size: 'wide', toggle: ['Share', 'Absolute'], live: true,
    info: 'Share of approved deposit volume per provider (100% stacked); absolute view available. Provider colours fixed per entity. Timezone: pending (§10).' },
  { id: 'report4', title: 'Withdrawals by Payment Provider', size: 'wide', toggle: ['Share', 'Absolute'],
    info: 'As Report 3, for approved withdrawals. Timezone: pending (§10).' },
  { id: 'report5', title: 'Deposits Approval Rate vs Total Deposit Approval Rate by Payment Provider', size: 'full', toggle: null,
    info: 'Total = aggregate across providers, NOT the mean of the provider lines (they differ when volumes are uneven). Approval-rate denominator: pending with BI (§10). Timezone: pending.' },
];

export const reportById = new Map(REPORTS.map((r) => [r.id, r]));

/** Info affordance — opens on hover AND keyboard focus (the IconButton is focusable; Tooltip triggers on focus). */
function ReportInfo({ report }: { report: DashboardReport }) {
  return (
    <Tooltip title={report.info} enterTouchDelay={0}>
      <IconButton size="small" aria-label={`${report.title} — definition: ${report.info}`} sx={{ color: 'text.secondary' }}>
        <InfoOutlinedIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}

/** Small/flat segmented toggle (§6.9). Live → clickable; draft → disabled (the view exists in the spec). */
function Toggle({ options, active, onChange, disabled }: { options: readonly [string, string]; active: 0 | 1; onChange?: (i: 0 | 1) => void; disabled?: boolean }) {
  return (
    <Stack direction="row" sx={{ '& .MuiButton-root': { minWidth: 0, px: 1.25, borderRadius: 0 }, '& :first-of-type': { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }, '& :last-of-type': { borderTopRightRadius: 6, borderBottomRightRadius: 6 } }}>
      {options.map((opt, i) => (
        <Button key={opt} size="small" variant={active === i ? 'contained' : 'outlined'} disabled={disabled}
          aria-pressed={active === i} onClick={onChange ? () => onChange(i as 0 | 1) : undefined}>{opt}</Button>
      ))}
    </Stack>
  );
}

function ReportDraftBody() {
  return (
    <Box sx={{ aspectRatio: '16 / 7', minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1px dashed', borderColor: 'divider', borderRadius: 1, color: 'text.secondary', bgcolor: 'action.hover' }}>
      <Stack spacing={0.5} sx={{ alignItems: 'center', textAlign: 'center', px: 2 }}>
        <Typography variant="body2">Chart — draft</Typography>
        <Typography variant="caption">Definition pending</Typography>
      </Stack>
    </Box>
  );
}

/** One report, composed as a Section: title + info (inline) + toggle (right) + body. Owns the toggle state so
 *  the header control and the chart body stay in sync. */
export function ReportSection({ report }: { report: DashboardReport }) {
  const [active, setActive] = useState<0 | 1>(0);
  let body: ReactNode = <ReportDraftBody />;
  if (report.id === 'report1') body = <Report1Chart measure={active === 0 ? 'value' : 'count'} />;
  else if (report.id === 'report3') body = <Report3Chart view={active === 0 ? 'share' : 'absolute'} />;

  const headerAction = report.toggle
    ? <Toggle options={report.toggle} active={active} disabled={!report.live} onChange={report.live ? setActive : undefined} />
    : undefined;

  return (
    <Section title={report.title} titleAdornment={<ReportInfo report={report} />} headerAction={headerAction}>
      {body}
    </Section>
  );
}
