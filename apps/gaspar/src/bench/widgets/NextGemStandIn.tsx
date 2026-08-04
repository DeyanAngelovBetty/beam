import { Box, Stack, Typography } from '@betty/beam';

/**
 * NextGemStandIn — a DUMMY stand-in for Sunlight's NextGemPanel. NextGemPanel
 * lives in the Sunlight app; importing it into Gaspar would be a cross-app
 * dependency, so the bench uses this shape-alike instead (progress-to-next-
 * milestone). Dummy data only. Payments-flavoured: progress to the next
 * settlement window.
 */

const PROGRESS = 0.68; // 0..1
const CURRENT = '£3.28M';
const TARGET = '£4.80M';

export function NextGemStandIn() {
  return (
    <Stack spacing={1.5} sx={{ height: '100%', minWidth: 0, justifyContent: 'center' }}>
      <Typography variant="caption" color="text.secondary">
        Next settlement window
      </Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
        <Typography variant="h6" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {CURRENT}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          of {TARGET}
        </Typography>
      </Stack>

      {/* progress track — token-driven, radius from the scale */}
      <Box
        role="progressbar"
        aria-valuenow={Math.round(PROGRESS * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        sx={{
          height: 8,
          borderRadius: 1,
          backgroundColor: 'action.hover',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: `${PROGRESS * 100}%`,
            height: '100%',
            borderRadius: 1,
            backgroundColor: 'primary.main',
          }}
        />
      </Box>
      <Typography variant="caption" color="text.secondary">
        {Math.round(PROGRESS * 100)}% to cutoff · closes 17:00 UTC
      </Typography>
    </Stack>
  );
}
