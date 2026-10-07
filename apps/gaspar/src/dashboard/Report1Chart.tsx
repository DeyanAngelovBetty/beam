import { useMemo, useState } from 'react';
import { Box, Stack, Button, Typography, useColorScheme } from '@betty/beam';
import { LineChart } from '@mui/x-charts/LineChart';
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';
import { depositsVsWithdrawals } from './aggregator';

/**
 * Report 1 — Deposits vs Withdrawals (x-charts spike). Two series over time; the Value/Count toggle is LIVE
 * (switches the measure + the y-axis). Crosshair + multi-series axis tooltip (reads both series at the x
 * point). Partial (trailing, in-progress) bucket marked with a reference line. Consumes ONLY the aggregation
 * contract. Deposits = brand primary, Withdrawals = a neutral slate (direction isn't an entity → not the
 * provider palette; semantic hues stay reserved).
 */
export function Report1Chart() {
  const { mode } = useColorScheme();
  const [measure, setMeasure] = useState<'value' | 'count'>('value');
  const data = useMemo(() => depositsVsWithdrawals(), []);
  const pick = (p: { value: number; count: number }) => (measure === 'value' ? p.value : p.count);
  const depColor = 'var(--mui-palette-primary-main)';
  const witColor = mode === 'light' ? '#475569' : '#94A3B8';

  return (
    <Stack spacing={1}>
      <Stack direction="row" sx={{ '& .MuiButton-root': { minWidth: 0, px: 1.25, borderRadius: 0 }, '& :first-of-type': { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }, '& :last-of-type': { borderTopRightRadius: 6, borderBottomRightRadius: 6 } }}>
        <Button size="small" variant={measure === 'value' ? 'contained' : 'outlined'} onClick={() => setMeasure('value')} aria-pressed={measure === 'value'}>Value</Button>
        <Button size="small" variant={measure === 'count' ? 'contained' : 'outlined'} onClick={() => setMeasure('count')} aria-pressed={measure === 'count'}>Count</Button>
      </Stack>
      <Box sx={{ width: '100%', aspectRatio: '16 / 7', minHeight: 200 }}>
        <LineChart
          height={240}
          xAxis={[{ scaleType: 'point', data: data.buckets, label: `Bucket (${data.bucket})` }]}
          yAxis={[{ label: measure === 'value' ? `${data.currency} value` : 'Count', width: 64 }]}
          series={[
            { data: data.series[0].points.map(pick), label: 'Deposits', color: depColor, curve: 'linear', showMark: true },
            { data: data.series[1].points.map(pick), label: 'Withdrawals', color: witColor, curve: 'linear', showMark: true },
          ]}
          axisHighlight={{ x: 'line' }}
          slotProps={{ tooltip: { trigger: 'axis' } }}
          margin={{ left: 8, right: 16, top: 8, bottom: 24 }}
        >
          {data.partial.bucketKey && (
            <ChartsReferenceLine x={data.partial.bucketKey} label="in progress" labelAlign="start" lineStyle={{ strokeDasharray: '4 3' }} />
          )}
        </LineChart>
      </Box>
      <Typography variant="caption" color="text.secondary">
        Last bucket ({data.partial.bucketKey}) is in progress — partial, not a completed period.
      </Typography>
    </Stack>
  );
}
