import { Box } from '@betty/beam';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';
import { useXAxis, useYAxis, useDrawingArea } from '@mui/x-charts/hooks';

/**
 * Shared chart TEMPLATES — the fixed Report 1/3 treatment, extracted so Reports 2/4/5 replicate the fixes.
 * Both bake in: partial period drawn distinctly (dashed hollow tail / faded last bar), `skipAnimation` (so the
 * CSS dash/opacity isn't overwritten by x-charts' draw animation), `shape:'circle'` + `showMark:'end'`, linear
 * lines, legend above the plot, and a de-labelled dashed reference line on the partial bucket.
 */
const surface = 'var(--mui-palette-background-paper)';

/** ONE chart-height token (px) — used by the chart AND its draft/skeleton state so the footprint is identical
 *  (the spec's "skeleton keeps the footprint"). Single value for now so two widgets in a row match height;
 *  could grow a `full`-size variant later if the full-width reports feel cramped. */
export const CHART_HEIGHT = 240;
const CHART_MARGIN = { left: 8, right: 76, top: 8, bottom: 28 }; // right roomy: no tick clip + direct-label gutter

/** Direct series labels at each line's end (identity never colour-alone). Rendered in the right gutter via the
 *  x-charts scale hooks; vertical collisions are pushed apart. Custom overlay — x-charts has no native labels. */
function DirectLabels({ labels }: { labels: { bucket: string; value: number; text: string; color: string }[] }) {
  const xAxis = useXAxis();
  const yAxis = useYAxis();
  const area = useDrawingArea();
  const xs = xAxis?.scale as ((v: string) => number | undefined) | undefined;
  const ys = yAxis?.scale as ((v: number) => number | undefined) | undefined;
  if (!xs || !ys) return null;
  const placed = labels
    .map((l) => ({ ...l, py: ys(l.value) }))
    .filter((l): l is typeof l & { py: number } => l.py != null)
    .sort((a, b) => a.py - b.py);
  for (let i = 1; i < placed.length; i++) if (placed[i].py - placed[i - 1].py < 13) placed[i].py = placed[i - 1].py + 13;
  const xEnd = area.left + area.width + 6;
  return (
    <g>
      {placed.map((l, i) => (
        <text key={i} x={xEnd} y={l.py} dominantBaseline="middle" fontSize={11} fontWeight={600} fill={l.color}
          style={{ paintOrder: 'stroke', stroke: surface, strokeWidth: 3 }}>{l.text}</text>
      ))}
    </g>
  );
}

export interface LineSeriesSpec { id: string; label: string; color: string; points: number[]; heavy?: boolean }

export function LineReportChart({ buckets, bucket, yLabel, partialKey, series, crosshair = true }: {
  buckets: string[]; bucket: string; yLabel: string; partialKey: string | null; series: LineSeriesSpec[]; crosshair?: boolean;
}) {
  const n = buckets.length;
  const head = (a: number[]) => a.map((v, i) => (i >= n - 1 ? null : v));
  const tail = (a: number[]) => a.map((v, i) => (i >= n - 2 ? v : null));
  const sx: Record<string, object> = { '& .MuiLineElement-root': { strokeWidth: 2.5 } };
  for (const s of series) {
    if (s.heavy) sx[`& .MuiLineElement-series-${s.id}`] = { strokeWidth: 4 };
    sx[`& .MuiLineElement-series-${s.id}Tail`] = { strokeDasharray: '6 4' };
    sx[`& .MuiMarkElement-series-${s.id}Tail`] = { fill: surface, stroke: s.color, strokeWidth: 2 };
  }
  const chartSeries = series.flatMap((s) => [
    { id: s.id, data: head(s.points), label: s.label, color: s.color, curve: 'linear' as const, shape: 'circle' as const, showMark: false as const, connectNulls: false },
    { id: `${s.id}Tail`, data: tail(s.points), color: s.color, curve: 'linear' as const, shape: 'circle' as const, showMark: 'end' as const, connectNulls: true },
  ]);
  const labels = series.map((s) => ({ bucket: buckets[n - 1], value: s.points[n - 1] ?? 0, text: s.label, color: s.color }));
  return (
    <Box sx={{ width: '100%', height: CHART_HEIGHT, ...sx }}>
      <LineChart
        height={CHART_HEIGHT}
        skipAnimation
        xAxis={[{ scaleType: 'point', data: buckets, label: `Bucket (${bucket})` }]}
        yAxis={[{ label: yLabel, width: 64 }]}
        series={chartSeries}
        axisHighlight={crosshair ? { x: 'line' } : undefined}
        slotProps={{ tooltip: { trigger: 'axis' }, legend: { position: { vertical: 'top', horizontal: 'center' } } }}
        margin={CHART_MARGIN}
      >
        {partialKey && <ChartsReferenceLine x={partialKey} lineStyle={{ strokeDasharray: '4 3', opacity: 0.5 }} />}
        <DirectLabels labels={labels} />
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
    <Box sx={{ width: '100%', height: CHART_HEIGHT, ...sx }}>
      <BarChart
        height={CHART_HEIGHT}
        skipAnimation
        xAxis={[{ scaleType: 'band', data: buckets, label: `Bucket (${bucket})` }]}
        yAxis={[{ label: yLabel, width: 64, ...(yMax != null ? { min: 0, max: yMax } : {}) }]}
        series={chartSeries}
        slotProps={{ tooltip: { trigger: 'axis' }, legend: { position: { vertical: 'top', horizontal: 'center' } } }}
        margin={CHART_MARGIN}
      >
        {partialKey && <ChartsReferenceLine x={partialKey} lineStyle={{ strokeDasharray: '4 3', opacity: 0.5 }} />}
      </BarChart>
    </Box>
  );
}
