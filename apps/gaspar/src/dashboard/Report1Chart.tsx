import { useMemo } from 'react';
import { Box, Typography, useColorScheme } from '@betty/beam';
import { LineChart } from '@mui/x-charts/LineChart';
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';
import { depositsVsWithdrawals, FIXTURE_NOW } from './aggregator';
import { directionColor } from './providerColors';

/**
 * Report 1 — Deposits vs Withdrawals (presentational; the Value/Count toggle state lives in ReportSection).
 * Crosshair + multi-series axis tooltip. PARTIAL period drawn DISTINCTLY: the main line stops at the
 * second-last bucket (solid), a dashed "tail" series draws into the partial bucket with a HOLLOW end mark —
 * achieved by splitting each series + targeting x-charts' per-series line/mark classes via sx (no native
 * per-segment styling in x-charts — a spike finding). Legend renders ABOVE the plot. Direction colours are
 * fixed entity colours (CVD-checked), never semantic, withdrawal never grey.
 */
export function Report1Chart({ measure }: { measure: 'value' | 'count' }) {
  const { mode } = useColorScheme();
  const data = useMemo(() => depositsVsWithdrawals(), []);
  const n = data.buckets.length;
  const pick = (p: { value: number; count: number }) => (measure === 'value' ? p.value : p.count);
  const vals = (i: 0 | 1) => data.series[i].points.map(pick);
  // main = all but the last point (solid); tail = only the last segment (dashed + hollow mark).
  const head = (a: number[]) => a.map((v, i) => (i >= n - 1 ? null : v));
  const tail = (a: number[]) => a.map((v, i) => (i >= n - 2 ? v : null));
  const dep = directionColor('Deposit', mode);
  const wit = directionColor('Withdrawal', mode);
  const surface = 'var(--mui-palette-background-paper)';

  return (
    <Box>
      <Box
        sx={{
          width: '100%', aspectRatio: '16 / 7', minHeight: 200,
          // dashed partial tails + hollow end marks (x-charts per-series classes).
          '& .MuiLineElement-series-depTail, & .MuiLineElement-series-witTail': { strokeDasharray: '5 4' },
          '& .MuiMarkElement-series-depTail, & .MuiMarkElement-series-witTail': { fill: surface },
        }}
      >
        <LineChart
          height={240}
          xAxis={[{ scaleType: 'point', data: data.buckets, label: `Bucket (${data.bucket})` }]}
          yAxis={[{ label: measure === 'value' ? `${data.currency} value` : 'Count', width: 64 }]}
          series={[
            { id: 'dep', data: head(vals(0)), label: 'Deposits', color: dep, showMark: true, connectNulls: false },
            { id: 'wit', data: head(vals(1)), label: 'Withdrawals', color: wit, showMark: true, connectNulls: false },
            { id: 'depTail', data: tail(vals(0)), color: dep, showMark: true, connectNulls: true }, // no label → no legend dup
            { id: 'witTail', data: tail(vals(1)), color: wit, showMark: true, connectNulls: true },
          ]}
          axisHighlight={{ x: 'line' }}
          slotProps={{ tooltip: { trigger: 'axis' }, legend: { position: { vertical: 'top', horizontal: 'center' } } }}
          margin={{ left: 8, right: 16, top: 8, bottom: 24 }}
        >
          {data.partial.bucketKey && <ChartsReferenceLine x={data.partial.bucketKey} lineStyle={{ strokeDasharray: '4 3', opacity: 0.6 }} />}
        </LineChart>
      </Box>
      <Typography variant="caption" color="text.secondary">
        Dashed = the in-progress bucket ({data.partial.bucketKey}), a partial period. Data as of {FIXTURE_NOW.slice(0, 10)} (fixture clock).
      </Typography>
    </Box>
  );
}
