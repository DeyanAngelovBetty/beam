import { useMemo } from 'react';
import { Box, Typography, useColorScheme } from '@betty/beam';
import {
  depositsVsWithdrawals, avgPerTransaction, depositsByProvider, withdrawalsByProvider,
  depositApprovalRateByProvider, FIXTURE_NOW, type AggregationResponse,
} from './aggregator';
import { directionColor, providerColor } from './providerColors';
import { LineReportChart, BarReportChart, type LineSeriesSpec, type BarSeriesSpec } from './reportCharts';

const asOf = () => FIXTURE_NOW.slice(0, 10);
const Caption = ({ children }: { children: React.ReactNode }) => (
  <Typography variant="caption" color="text.secondary">{children}</Typography>
);

/** Share%/absolute bar series (R3/R4) from a by-provider response + the current view. */
function providerBars(data: AggregationResponse, view: 'share' | 'absolute', mode: string | undefined): BarSeriesSpec[] {
  const totals = data.buckets.map((_, i) => data.series.reduce((s, ser) => s + ser.points[i].value, 0));
  return data.series.map((ser) => ({
    id: ser.key, label: ser.label, color: providerColor(ser.key, mode),
    data: ser.points.map((p, i) => (view === 'share' ? (totals[i] ? (p.value / totals[i]) * 100 : 0) : p.value)),
  }));
}

// ── Report 1 — Deposits vs Withdrawals (lines, Value/Count) ──────────────────
export function Report1Chart({ measure }: { measure: 'value' | 'count' }) {
  const { mode } = useColorScheme();
  const data = useMemo(() => depositsVsWithdrawals(), []);
  const pick = (p: { value: number; count: number }) => (measure === 'value' ? p.value : p.count);
  const series: LineSeriesSpec[] = [
    { id: 'dep', label: 'Deposits', color: directionColor('Deposit', mode), points: data.series[0].points.map(pick) },
    { id: 'wit', label: 'Withdrawals', color: directionColor('Withdrawal', mode), points: data.series[1].points.map(pick) },
  ];
  return (
    <Box>
      <LineReportChart buckets={data.buckets} bucket={data.bucket} partialKey={data.partial.bucketKey}
        yLabel={measure === 'value' ? `${data.currency} value` : 'Count'} series={series} />
      <Caption>Approved only. Dashed + hollow mark = the in-progress bucket ({data.partial.bucketKey}). Data as of {asOf()} (fixture clock).</Caption>
    </Box>
  );
}

// ── Report 2 — AVG per transaction (lines, one CAD axis, no toggle) ──────────
export function Report2Chart() {
  const { mode } = useColorScheme();
  const data = useMemo(() => avgPerTransaction(), []);
  const series: LineSeriesSpec[] = [
    { id: 'dep', label: 'AVG Deposit', color: directionColor('Deposit', mode), points: data.series[0].points.map((p) => p.value) },
    { id: 'wit', label: 'AVG Withdrawal', color: directionColor('Withdrawal', mode), points: data.series[1].points.map((p) => p.value) },
  ];
  return (
    <Box>
      <LineReportChart buckets={data.buckets} bucket={data.bucket} partialKey={data.partial.bucketKey}
        yLabel={`${data.currency} / txn`} series={series} />
      <Caption>Mean value per APPROVED transaction (denominator = approved, not attempts). Dashed = in-progress ({data.partial.bucketKey}). Data as of {asOf()}.</Caption>
    </Box>
  );
}

// ── Report 3 — Deposits by Provider (bars, Share/Absolute) ───────────────────
export function Report3Chart({ view }: { view: 'share' | 'absolute' }) {
  const { mode } = useColorScheme();
  const data = useMemo(() => depositsByProvider(), []);
  return (
    <Box>
      <BarReportChart buckets={data.buckets} bucket={data.bucket} partialKey={data.partial.bucketKey}
        yLabel={view === 'share' ? 'Share %' : `${data.currency} value`} yMax={view === 'share' ? 100 : undefined}
        series={providerBars(data, view, mode)} />
      <Caption>{view === 'share' ? '100% stacked — provider share of approved deposit volume. ' : 'Absolute approved deposit volume, stacked. '}Faded = in-progress ({data.partial.bucketKey}). Data as of {asOf()}.</Caption>
    </Box>
  );
}

// ── Report 4 — Withdrawals by Provider (mirror of R3) ────────────────────────
export function Report4Chart({ view }: { view: 'share' | 'absolute' }) {
  const { mode } = useColorScheme();
  const data = useMemo(() => withdrawalsByProvider(), []);
  return (
    <Box>
      <BarReportChart buckets={data.buckets} bucket={data.bucket} partialKey={data.partial.bucketKey}
        yLabel={view === 'share' ? 'Share %' : `${data.currency} value`} yMax={view === 'share' ? 100 : undefined}
        series={providerBars(data, view, mode)} />
      <Caption>{view === 'share' ? '100% stacked — provider share of approved withdrawal volume. ' : 'Absolute approved withdrawal volume, stacked. '}Faded = in-progress ({data.partial.bucketKey}). Data as of {asOf()}.</Caption>
    </Box>
  );
}

// ── Report 5 — Approval Rate per provider + a heavier neutral TOTAL line ──────
export function Report5Chart() {
  const { mode } = useColorScheme();
  const data = useMemo(() => depositApprovalRateByProvider('broad'), []); // PROVISIONAL denominator (§10)
  const series: LineSeriesSpec[] = data.series.map((ser) =>
    ser.key === 'Total'
      ? { id: 'total', label: 'Total (aggregate)', color: 'var(--mui-palette-text-primary)', points: ser.points.map((p) => p.value), heavy: true }
      : { id: ser.key, label: ser.label, color: providerColor(ser.key, mode), points: ser.points.map((p) => p.value) },
  );
  return (
    <Box>
      <LineReportChart buckets={data.buckets} bucket={data.bucket} partialKey={data.partial.bucketKey}
        yLabel="Approval rate %" series={series} />
      <Caption>
        Total = AGGREGATE across providers (Σapproved / Σdenominator), not the mean of the provider lines.
        Denominator is PROVISIONAL (broad — all deposit rows); see notes §5 for both candidates. Dashed = in-progress ({data.partial.bucketKey}). Data as of {asOf()}.
      </Caption>
    </Box>
  );
}
