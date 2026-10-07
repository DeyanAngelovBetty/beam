import { useMemo } from 'react';
import { Box, Typography, useColorScheme } from '@betty/beam';
import { BarChart } from '@mui/x-charts/BarChart';
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';
import { depositsByProvider, FIXTURE_NOW } from './aggregator';
import { providerColor } from './providerColors';

/**
 * Report 3 — Deposits by Payment Provider (presentational; the Share/Absolute toggle lives in ReportSection).
 * 100% stacked (share) feeds per-bucket percentages; absolute feeds stacked CAD. One series per provider,
 * coloured by the fixed per-entity palette (keyed by id, CVD-checked). PARTIAL bucket drawn DISTINCTLY: each
 * provider is split into a complete-buckets series + a last-bucket "tail" series rendered at lower opacity
 * (x-charts has no native per-bar styling — a spike finding). Legend ABOVE the plot.
 */
export function Report3Chart({ view }: { view: 'share' | 'absolute' }) {
  const { mode } = useColorScheme();
  const data = useMemo(() => depositsByProvider(), []);
  const n = data.buckets.length;
  const totals = data.buckets.map((_, i) => data.series.reduce((s, ser) => s + ser.points[i].value, 0));
  const measure = (v: number, i: number) => (view === 'share' ? (totals[i] ? (v / totals[i]) * 100 : 0) : v);

  const series = data.series.flatMap((ser) => {
    const col = providerColor(ser.key, mode);
    const full = ser.points.map((p, i) => measure(p.value, i));
    return [
      { id: ser.key, data: full.map((v, i) => (i >= n - 1 ? null : v)), label: ser.label, color: col, stack: 'deposits' },
      { id: `${ser.key}Tail`, data: full.map((v, i) => (i >= n - 1 ? v : null)), color: col, stack: 'deposits' }, // no label
    ];
  });
  // Faded partial: the last-bucket "tail" bars at low opacity. skipAnimation so the class-based opacity lands.
  const tailDim = Object.fromEntries(data.series.map((s) => [`& .MuiBarElement-series-${s.key}Tail`, { opacity: 0.4 }]));

  return (
    <Box>
      <Box sx={{ width: '100%', aspectRatio: '16 / 7', minHeight: 200, ...tailDim }}>
        <BarChart
          height={240}
          skipAnimation
          xAxis={[{ scaleType: 'band', data: data.buckets, label: `Bucket (${data.bucket})` }]}
          yAxis={[view === 'share' ? { label: 'Share %', min: 0, max: 100, width: 56 } : { label: `${data.currency} value`, width: 64 }]}
          series={series}
          slotProps={{ tooltip: { trigger: 'axis' }, legend: { position: { vertical: 'top', horizontal: 'center' } } }}
          margin={{ left: 8, right: 16, top: 8, bottom: 24 }}
        >
          {data.partial.bucketKey && <ChartsReferenceLine x={data.partial.bucketKey} lineStyle={{ strokeDasharray: '4 3', opacity: 0.6 }} />}
        </BarChart>
      </Box>
      <Typography variant="caption" color="text.secondary">
        {view === 'share' ? '100% stacked — provider share of deposit volume. ' : 'Absolute deposit volume, stacked. '}
        Faded = the in-progress bucket ({data.partial.bucketKey}). Data as of {FIXTURE_NOW.slice(0, 10)} (fixture clock).
      </Typography>
    </Box>
  );
}
