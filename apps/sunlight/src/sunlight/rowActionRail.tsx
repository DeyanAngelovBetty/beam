import { useState } from 'react';
import { IconButton, Menu, MenuItem, Divider, Tooltip } from '@betty/beam';
import MoreVertIcon from '@mui/icons-material/MoreVertRounded';

/**
 * RowActionsKebab — the editor-grid row's overflow menu, the kebab half of the leading-rail convention
 * (Payout Sectors, 2026-09-25). Grammar (BEAM.md §6): the trailing action column is retired; per-row
 * controls live in the LEADING rail — the drag handle slot (added by the drag pass) + this kebab.
 *
 * Reorder items (Move up / Move down / divider) render ONLY for an `orderable` table — order is
 * data-meaningful there (positional wheel sectors); everywhere else the kebab carries Delete alone
 * (§6.7 `orderable`-is-declared). Delete is the destructive tier (error ink), below the divider.
 */
export function RowActionsKebab({
  label,
  index,
  count,
  orderable,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  /** Singular row noun for aria (e.g. 'payout sector'). */
  label: string;
  index: number;
  count: number;
  orderable: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = () => setAnchor(null);
  const run = (fn: () => void) => () => {
    fn();
    close();
  };
  return (
    <>
      <Tooltip title="Row actions">
        <IconButton
          size="small"
          aria-label={`Actions for ${label} ${index + 1}`}
          aria-haspopup="menu"
          onClick={(e) => setAnchor(e.currentTarget)}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close} slotProps={{ list: { dense: true } }}>
        {orderable && (
          <MenuItem disabled={index === 0} onClick={run(onMoveUp)}>
            Move up
          </MenuItem>
        )}
        {orderable && (
          <MenuItem disabled={index === count - 1} onClick={run(onMoveDown)}>
            Move down
          </MenuItem>
        )}
        {orderable && <Divider />}
        {/* Destructive tier — error ink (BEAM.md §6.9 grammar). */}
        <MenuItem onClick={run(onDelete)} sx={{ color: 'error.main' }}>
          Delete
        </MenuItem>
      </Menu>
    </>
  );
}
