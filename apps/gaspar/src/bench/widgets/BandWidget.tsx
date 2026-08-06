import { Box, Stack, Typography } from '@betty/beam';
import { CQ } from '../dashboardConfig';

/**
 * BandWidget — the replacement for the bare sparkline (the anti-pattern we're
 * moving away from). It tests the WIDGET GRAMMAR, not a decorative squiggle:
 *   • current value + unit
 *   • a 7-day BASELINE BAND drawn behind the series (expected range)
 *   • the series line
 *   • a visible MARKER where the series first leaves the band
 *   • axis labels (day ticks + band bounds)
 *   • a "last updated" stamp
 *
 * Colours route through tokens (`var(--mui-palette-*)`) so the widget follows
 * product / jurisdiction / mode with no per-widget wiring. Container-responsive:
 * axis labels appear once the widget has room (≥ 3-col).
 */

// Dummy 7-day series (authorization rate %). Day 6 breaches the band on purpose.
const SERIES = [98.2, 98.4, 98.1, 98.6, 98.3, 97.1, 98.5];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const LAST_UPDATED = '2m ago'; // dummy stamp

// Baseline band = mean ± 0.6 (the "expected" range). Derived from the series so
// the breach is real, not hardcoded.
const mean = SERIES.reduce((a, b) => a + b, 0) / SERIES.length;
const HALF = 0.6;
const bandLow = mean - HALF;
const bandHigh = mean + HALF;
const breachIndex = SERIES.findIndex((v) => v < bandLow || v > bandHigh);
const current = SERIES[SERIES.length - 1];

// SVG geometry (viewBox units; scales to the widget width).
const VB_W = 300;
const VB_H = 90;
const PAD_X = 8;
const PAD_Y = 10;
const domainMin = Math.min(...SERIES, bandLow) - 0.3;
const domainMax = Math.max(...SERIES, bandHigh) + 0.3;
const x = (i: number) => PAD_X + (i * (VB_W - 2 * PAD_X)) / (SERIES.length - 1);
const y = (v: number) =>
  PAD_Y + (VB_H - 2 * PAD_Y) * (1 - (v - domainMin) / (domainMax - domainMin));

const linePath = SERIES.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');

export function BandWidget() {
  return (
    <Stack spacing={1} sx={{ height: '100%', minWidth: 0 }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}
      >
        <Typography variant="caption" color="text.secondary">
          Authorization rate
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {LAST_UPDATED}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
        <Typography variant="h5" sx={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {current.toFixed(1)}%
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: breachIndex >= 0 ? 'error.main' : 'success.main' }}
        >
          band {bandLow.toFixed(1)}–{bandHigh.toFixed(1)}
        </Typography>
      </Stack>

      {/* Clip the chart HERE, on its own box — NOT on the rim-bearing Paper
          (WidgetShell), which must stay unclipped or beamGradientBorder's outward rim
          gets sliced. The SVG is overflow:visible (for its edge strokes/marker); that
          spill used to be caught by the Paper's clip, so it's contained here instead.
          The chart fits its box — this is spill containment, not a sizing fix. */}
      <Box sx={{ flex: 1, minHeight: 60, overflow: 'hidden' }}>
        <Box
          component="svg"
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`Authorization rate, 7 days. Current ${current.toFixed(1)} percent.${
            breachIndex >= 0 ? ` Left the expected band on ${DAYS[breachIndex]}.` : ''
          }`}
          sx={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
        >
          {/* baseline band */}
          <rect
            x={PAD_X}
            y={y(bandHigh)}
            width={VB_W - 2 * PAD_X}
            height={y(bandLow) - y(bandHigh)}
            fill="var(--mui-palette-primary-main)"
            fillOpacity={0.12}
            rx={2}
          />
          {/* band edges */}
          {[bandLow, bandHigh].map((v) => (
            <line
              key={v}
              x1={PAD_X}
              x2={VB_W - PAD_X}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--mui-palette-primary-main)"
              strokeOpacity={0.4}
              strokeDasharray="3 3"
              strokeWidth={0.75}
            />
          ))}
          {/* series */}
          <path
            d={linePath}
            fill="none"
            stroke="var(--mui-palette-primary-main)"
            strokeWidth={1.75}
            vectorEffect="non-scaling-stroke"
          />
          {/* breach marker — where the series leaves the band */}
          {breachIndex >= 0 && (
            <circle
              cx={x(breachIndex)}
              cy={y(SERIES[breachIndex])}
              r={3.5}
              fill="var(--mui-palette-error-main)"
              stroke="var(--mui-palette-background-paper)"
              strokeWidth={1.5}
            />
          )}
        </Box>
      </Box>

      {/* axis labels — appear once the widget has 3-col room */}
      <Stack
        direction="row"
        sx={{
          justifyContent: 'space-between',
          display: 'none',
          [`@container (min-width: ${CQ.threeCol}px)`]: { display: 'flex' },
        }}
      >
        {DAYS.map((d, i) => (
          <Typography
            key={d}
            variant="caption"
            sx={{
              color: i === breachIndex ? 'error.main' : 'text.secondary',
              fontWeight: i === breachIndex ? 600 : 400,
            }}
          >
            {d}
          </Typography>
        ))}
      </Stack>
    </Stack>
  );
}
