import { useMemo, useState } from 'react';
import { Box, Stack, Button, Typography, useColorScheme } from '@betty/beam';
import { BarChart } from '@mui/x-charts/BarChart';
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';
import { depositsByProvider } from './aggregator';
import { providerColor } from './providerColors';

/**
 * Report 3 — Deposits by Payment Provider (x-charts spike). 100% STACKED by default; the Share/Absolute toggle
 * is LIVE (share feeds per-bucket percentages to 100 with a % axis; absolute feeds stacked CAD value). One
 * series per provider, coloured from the fixed provider palette (keyed by provider id, not rank — removing one
 * never repaints the others). Legend present (identity never colour-alone). Partial bucket marked.
 */
export function Report3Chart() {
  const { mode } = useColorScheme();
  const [view, setView] = useState<'share' | 'absolute'>('share');
  const data = useMemo(() => depositsByProvider(), []);

  // Per-bucket totals (for share%); share = provider value / bucket total × 100.
  const totalsPerBucket = useMemo(
    () => data.buckets.map((_, i) => data.series.reduce((s, ser) => s + ser.points[i].value, 0)),
    [data],
  );
  const series = data.series.map((ser) => ({
    label: ser.label,
    color: providerColor(ser.key, mode),
    stack: 'deposits',
    data: ser.points.map((p, i) =>
      view === 'share' ? (totalsPerBucket[i] ? (p.value / totalsPerBucket[i]) * 100 : 0) : p.value,
    ),
  }));

  return (
    <Stack spacing={1}>
      <Stack direction="row" sx={{ '& .MuiButton-root': { minWidth: 0, px: 1.25, borderRadius: 0 }, '& :first-of-type': { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }, '& :last-of-type': { borderTopRightRadius: 6, borderBottomRightRadius: 6 } }}>
        <Button size="small" variant={view === 'share' ? 'contained' : 'outlined'} onClick={() => setView('share')} aria-pressed={view === 'share'}>Share</Button>
        <Button size="small" variant={view === 'absolute' ? 'contained' : 'outlined'} onClick={() => setView('absolute')} aria-pressed={view === 'absolute'}>Absolute</Button>
      </Stack>
      <Box sx={{ width: '100%', aspectRatio: '16 / 7', minHeight: 200 }}>
        <BarChart
          height={240}
          xAxis={[{ scaleType: 'band', data: data.buckets, label: `Bucket (${data.bucket})` }]}
          yAxis={[view === 'share' ? { label: 'Share %', min: 0, max: 100, width: 56 } : { label: `${data.currency} value`, width: 64 }]}
          series={series}
          slotProps={{ tooltip: { trigger: 'axis' } }}
          margin={{ left: 8, right: 16, top: 8, bottom: 24 }}
        >
          {data.partial.bucketKey && (
            <ChartsReferenceLine x={data.partial.bucketKey} label="in progress" labelAlign="start" lineStyle={{ strokeDasharray: '4 3' }} />
          )}
        </BarChart>
      </Box>
      <Typography variant="caption" color="text.secondary">
        {view === 'share' ? '100% stacked — provider share of deposit volume. ' : 'Absolute deposit volume, stacked. '}
        Last bucket ({data.partial.bucketKey}) is in progress.
      </Typography>
    </Stack>
  );
}
