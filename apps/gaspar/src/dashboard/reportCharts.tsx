import { Box } from '@betty/beam';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';

/**
 * Shared chart TEMPLATES — the fixed Report 1/3 treatment, extracted so Reports 2/4/5 replicate the fixes (not
 * the bugs). Both bake in: partial period drawn DISTINCTLY (solid line stops at the second-last bucket, a
 * label-less dashed "tail" series draws the final segment with a single HOLLOW end mark / bars fade to 0.4 on
 * the last bucket); `skipAnimation` (so the CSS dash/opacity isn't overwritten by x-charts' draw animation);
 * `shape:'circle'` + `showMark:'end'` (no cycled shapes, mark only the final point); linear lines; legend
 * above the plot; a dashed reference line on the partial bucket (no on-chart label → never clips).
 */
const surface = 'var(--mui-palette-background-paper)';

export interface LineSeriesSpec { id: string; label: string; color: string; points: number[]; heavy?: boolean }

export function LineReportChart({ buckets, bucket, yLabel, partialKey, series, crosshair = true }: {
  buckets: string[]; bucket: string; yLabel: string; partialKey: string | null; series: LineSeriesSpec[]; crosshair?: boolean;
}) {
  const n = buckets.length;
  const head = (a: number[]) => a.map((v, i) => (i >= n - 1 ? null : v));
  const tail = (a: number[]) => a.map((v, i) => (i >= n - 2 ? v : null));
  const sx: Record<string, object> = {
    '& .MuiLineElement-root': { strokeWidth: 2.5 },
  };
  for (const s of series) {
    if (s.heavy) sx[`& .MuiLineElement-series-${s.id}`] = { strokeWidth: 4 };
    sx[`& .MuiLineElement-series-${s.id}Tail`] = { strokeDasharray: '6 4' };
    sx[`& .MuiMarkElement-series-${s.id}Tail`] = { fill: surface, stroke: s.color, strokeWidth: 2 };
  }
  const chartSeries = series.flatMap((s) => [
    { id: s.id, data: head(s.points), label: s.label, color: s.color, curve: 'linear' as const, shape: 'circle' as const, showMark: false as const, connectNulls: false },
    { id: `${s.id}Tail`, data: tail(s.points), color: s.color, curve: 'linear' as const, shape: 'circle' as const, showMark: 'end' as const, connectNulls: true },
  ]);
  return (
    <Box sx={{ width: '100%', aspectRatio: '16 / 7', minHeight: 200, ...sx }}>
      <LineChart
        height={240}
        skipAnimation
        xAxis={[{ scaleType: 'point', data: buckets, label: `Bucket (${bucket})` }]}
        yAxis={[{ label: yLabel, width: 64 }]}
        series={chartSeries}
        axisHighlight={crosshair ? { x: 'line' } : undefined}
        slotProps={{ tooltip: { trigger: 'axis' }, legend: { position: { vertical: 'top', horizontal: 'center' } } }}
        margin={{ left: 8, right: 16, top: 8, bottom: 24 }}
      >
        {partialKey && <ChartsReferenceLine x={partialKey} lineStyle={{ strokeDasharray: '4 3', opacity: 0.5 }} />}
      </LineChart>
    </Box>
  );
}

export interface BarSeriesSpec { id: string; label: string; color: string; data: (number | null)[] }

export function BarReportChart({ buckets, bucket, yLabel, partialKey, series, stackId = 'stack', yMax }: {
  buckets: string[]; bucket: string; yLabel: string; partialKey: string | null; series: BarSeriesSpec[]; stackId?: string; yMax?: number;
}) {
  const n = buckets.length;
  const sx: Record<string, object> = {};
  for (const s of series) sx[`& .MuiBarElement-series-${s.id}Tail`] = { opacity: 0.4 };
  const chartSeries = series.flatMap((s) => [
    { id: s.id, data: s.data.map((v, i) => (i >= n - 1 ? null : v)), label: s.label, color: s.color, stack: stackId },
    { id: `${s.id}Tail`, data: s.data.map((v, i) => (i >= n - 1 ? v : null)), color: s.color, stack: stackId },
  ]);
  return (
    <Box sx={{ width: '100%', aspectRatio: '16 / 7', minHeight: 200, ...sx }}>
      <BarChart
        height={240}
        skipAnimation
        xAxis={[{ scaleType: 'band', data: buckets, label: `Bucket (${bucket})` }]}
        yAxis={[{ label: yLabel, width: 64, ...(yMax != null ? { min: 0, max: yMax } : {}) }]}
        series={chartSeries}
        slotProps={{ tooltip: { trigger: 'axis' }, legend: { position: { vertical: 'top', horizontal: 'center' } } }}
        margin={{ left: 8, right: 16, top: 8, bottom: 24 }}
      >
        {partialKey && <ChartsReferenceLine x={partialKey} lineStyle={{ strokeDasharray: '4 3', opacity: 0.5 }} />}
      </BarChart>
    </Box>
  );
}
