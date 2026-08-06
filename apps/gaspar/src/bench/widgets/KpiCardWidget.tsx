import { Box, Stack, Typography, BeamStat } from '@betty/beam';
import { CQ } from '../dashboardConfig';

/**
 * KpiCardWidget — the clean demonstration of the container-query grammar the
 * bench is testing. Internals adapt to the widget's OWN width (the container is
 * established by the widget shell in the registry), never the viewport:
 *   1-col (< twoCol)      → value only
 *   2-col (twoCol..three) → value + delta
 *   3-col (≥ threeCol)    → value + delta + chart
 * Same widget, same data; the estate giving it more room reveals more.
 */

// Dummy: settled volume, this week vs a 6-week trail.
const VALUE = '£4.82M';
const DELTA = '+6.4% vs last week';
const TRAIL = [3.9, 4.1, 4.0, 4.4, 4.6, 4.82]; // £M, last = current
const trailMax = Math.max(...TRAIL);

export function KpiCardWidget() {
  // Clip content HERE, on the widget's own box — NOT on the rim-bearing Paper
  // (WidgetShell), which must stay unclipped or beamGradientBorder's outward `::after`
  // rim gets sliced (same reason as the WidgetShell registry comment).
  // The height budget is fixed in the CONFIG (kpi is rowSpan 2, so the chart actually
  // fits — dashboardConfig). THIS clip is defence-in-depth, not that fix: it keeps
  // content contained on any future width/config combination that would otherwise
  // overflow, without ever reaching for overflow:hidden on the Paper.
  return (
    <Stack spacing={1} sx={{ height: '100%', minWidth: 0, overflow: 'hidden' }}>
      <BeamStat label="Settled volume" value={VALUE} />

      {/* delta — from 2-col up */}
      <Typography
        variant="caption"
        sx={{
          color: 'success.main',
          display: 'none',
          [`@container (min-width: ${CQ.twoCol}px)`]: { display: 'block' },
        }}
      >
        {DELTA}
      </Typography>

      {/* chart — from 3-col up. A labelled 6-week bar trail (not a bare
          sparkline): baseline at the trail min, current bar accented. */}
      <Box
        sx={{
          display: 'none',
          [`@container (min-width: ${CQ.threeCol}px)`]: { display: 'block' },
          mt: 'auto',
        }}
      >
        <Stack
          direction="row"
          spacing={0.5}
          sx={{ alignItems: 'flex-end', height: 40 }}
          aria-label="Settled volume, last 6 weeks"
        >
          {TRAIL.map((v, i) => {
            const last = i === TRAIL.length - 1;
            return (
              <Box
                key={i}
                sx={{
                  flex: 1,
                  height: `${(v / trailMax) * 100}%`,
                  borderRadius: 0.5,
                  backgroundColor: last ? 'primary.main' : 'primary.main',
                  opacity: last ? 1 : 0.35,
                }}
              />
            );
          })}
        </Stack>
        <Typography variant="caption" color="text.secondary">
          6-week trail
        </Typography>
      </Box>
    </Stack>
  );
}
