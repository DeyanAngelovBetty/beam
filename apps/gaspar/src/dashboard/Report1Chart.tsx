import { useMemo } from 'react';
import { Box, Typography, useColorScheme } from '@betty/beam';
import { LineChart } from '@mui/x-charts/LineChart';
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';
import { depositsVsWithdrawals, FIXTURE_NOW } from './aggregator';
import { directionColor } from './providerColors';

/**
 * Report 1 — Deposits vs Withdrawals (presentational; Value/Count toggle in ReportSection). LINEAR lines
 * (weekly buckets are discrete — no smoothing). Crosshair + multi-series axis tooltip. PARTIAL period drawn
 * DISTINCTLY: the solid line stops at the second-last bucket; a label-less "tail" series draws the final
 * segment DASHED with a single HOLLOW end mark. x-charts specifics learned the hard way: `skipAnimation` so the
 * CSS dash isn't overwritten by the line-draw animation's inline stroke-dasharray; `shape:'circle'` so the tail
 * doesn't get x-charts' cycled diamond/cross; `showMark:'end'` so only the last point is marked. Direction
 * colours are fixed per entity (CVD-checked, non-semantic, not grey); lines are thick for low-contrast members.
 */
export function Report1Chart({ measure }: { measure: 'value' | 'count' }) {
  const { mode } = useColorScheme();
  const data = useMemo(() => depositsVsWithdrawals(), []);
  const n = data.buckets.length;
  const pick = (p: { value: number; count: number }) => (measure === 'value' ? p.value : p.count);
  const vals = (i: 0 | 1) => data.series[i].points.map(pick);
  const head = (a: number[]) => a.map((v, i) => (i >= n - 1 ? null : v)); // solid part (stops before partial)
  const tail = (a: number[]) => a.map((v, i) => (i >= n - 2 ? v : null)); // final segment only
  const dep = directionColor('Deposit', mode);
  const wit = directionColor('Withdrawal', mode);
  const surface = 'var(--mui-palette-background-paper)';

  return (
    <Box>
      <Box
        sx={{
          width: '100%', aspectRatio: '16 / 7', minHeight: 200,
          '& .MuiLineElement-root': { strokeWidth: 2.5 },
          '& .MuiLineElement-series-depTail, & .MuiLineElement-series-witTail': { strokeDasharray: '6 4' },
          '& .MuiMarkElement-series-depTail': { fill: surface, stroke: dep, strokeWidth: 2 },
          '& .MuiMarkElement-series-witTail': { fill: surface, stroke: wit, strokeWidth: 2 },
        }}
      >
        <LineChart
          height={240}
          skipAnimation
          xAxis={[{ scaleType: 'point', data: data.buckets, label: `Bucket (${data.bucket})` }]}
          yAxis={[{ label: measure === 'value' ? `${data.currency} value` : 'Count', width: 64 }]}
          series={[
            { id: 'dep', data: head(vals(0)), label: 'Deposits', color: dep, curve: 'linear', shape: 'circle', showMark: false, connectNulls: false },
            { id: 'wit', data: head(vals(1)), label: 'Withdrawals', color: wit, curve: 'linear', shape: 'circle', showMark: false, connectNulls: false },
            { id: 'depTail', data: tail(vals(0)), color: dep, curve: 'linear', shape: 'circle', showMark: 'end', connectNulls: true },
            { id: 'witTail', data: tail(vals(1)), color: wit, curve: 'linear', shape: 'circle', showMark: 'end', connectNulls: true },
          ]}
          axisHighlight={{ x: 'line' }}
          slotProps={{ tooltip: { trigger: 'axis' }, legend: { position: { vertical: 'top', horizontal: 'center' } } }}
          margin={{ left: 8, right: 16, top: 8, bottom: 24 }}
        >
          {data.partial.bucketKey && <ChartsReferenceLine x={data.partial.bucketKey} lineStyle={{ strokeDasharray: '4 3', opacity: 0.5 }} />}
        </LineChart>
      </Box>
      <Typography variant="caption" color="text.secondary">
        Dashed segment + hollow mark = the in-progress bucket ({data.partial.bucketKey}), a partial period. Data as of {FIXTURE_NOW.slice(0, 10)} (fixture clock).
      </Typography>
    </Box>
  );
}
