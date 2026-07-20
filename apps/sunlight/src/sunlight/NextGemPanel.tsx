import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BlockIcon from '@mui/icons-material/Block';
import { GemIcon, Tooltip } from '@betty/beam';
import type { GemName } from '@betty/beam';

/**
 * Sunlight-specific pattern mirroring the player loyalty widget, made
 * legible for the BO: the ring is a static frame (no player progress in a
 * BO), gems (milestones) are 1:1 with the reward rows and hover-linked to
 * them, and the next status is a quiet tooltip'd destination — except for
 * assigned-only statuses (VIP), where the slot teaches the corner case.
 */
export interface GemMilestone {
  /** Must match the reward row id it corresponds to */
  id: string;
}

export interface NextStatusInfo {
  gem: GemName;
  name: string;
  /** e.g. VIP: assigned by the business, not reachable by progression */
  assignedOnly?: boolean;
}

export interface NextGemPanelProps {
  currentGem: GemName;
  nextStatus?: NextStatusInfo;
  /** Points required per gem — model data shown under the crystal */
  milestoneCost?: number;
  /** One node per reward row, same order */
  milestones: GemMilestone[];
  highlightId?: string | null;
  onMilestoneHover?: (id: string | null) => void;
}

const SIZE = 180;
const STROKE = 6;
const R = (SIZE - STROKE) / 2;

export function NextGemPanel({
  currentGem,
  nextStatus,
  milestoneCost = 2000,
  milestones,
  highlightId = null,
  onMilestoneHover,
}: NextGemPanelProps) {
  const [nextHover, setNextHover] = useState(false);

  return (
    <Stack spacing={3} alignItems="center" sx={{ minWidth: 240, pt: 1 }}>
      <Box sx={{ position: 'relative', width: SIZE, height: SIZE }}>
        <Box component="svg" viewBox={`0 0 ${SIZE} ${SIZE}`} sx={{ width: '100%', height: '100%' }}>
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none"
            stroke="var(--mui-palette-divider)" strokeWidth={STROKE}
          />
        </Box>
        <Stack spacing={0.25} alignItems="center" sx={{ position: 'absolute', inset: 0, justifyContent: 'center' }}>
          <GemIcon gem={currentGem} size={72} />
          <Typography variant="caption" fontWeight={600}>Next Gem</Typography>
          <Typography variant="caption" color="text.secondary">
            {milestoneCost.toLocaleString()} pts.
          </Typography>
        </Stack>
      </Box>

      {/* Gem track — 1:1 with reward rows, hover-linked; all unselected by default */}
      <Stack direction="row" alignItems="center">
        {milestones.map((m, i) => (
          <Stack key={m.id} direction="row" alignItems="center">
            {i > 0 && <Box sx={{ width: 20, height: 2, bgcolor: 'divider' }} />}
            <Box
              onMouseEnter={onMilestoneHover ? () => onMilestoneHover(m.id) : undefined}
              onMouseLeave={onMilestoneHover ? () => onMilestoneHover(null) : undefined}
              sx={{
                filter: highlightId === m.id ? 'none' : 'grayscale(1) opacity(0.45)',
                transform: highlightId === m.id ? 'scale(1.35)' : 'scale(1)',
                transition: 'transform 120ms ease, filter 120ms ease',
              }}
            >
              <GemIcon gem={currentGem} size={22} />
            </Box>
          </Stack>
        ))}

        {nextStatus && (
          <>
            <ChevronRightIcon sx={{ color: 'text.disabled', fontSize: 18, mx: 0.5 }} />
            <Tooltip
              title={
                nextStatus.assignedOnly
                  ? `can't progress to ${nextStatus.name} — assigned only, hidden to players`
                  : `next ${nextStatus.name}`
              }
            >
              <Stack
                alignItems="center"
                onMouseEnter={() => setNextHover(true)}
                onMouseLeave={() => setNextHover(false)}
              >
                {nextStatus.assignedOnly ? (
                  <BlockIcon sx={{ color: 'text.disabled', fontSize: 24 }} />
                ) : (
                  <Box sx={{ filter: nextHover ? 'none' : 'grayscale(1) opacity(0.5)', transition: 'filter 150ms ease' }}>
                    <GemIcon gem={nextStatus.gem} size={24} />
                  </Box>
                )}
              </Stack>
            </Tooltip>
          </>
        )}
      </Stack>
    </Stack>
  );
}
