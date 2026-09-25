import { useState, type DragEvent } from 'react';
import { Box, IconButton, Menu, MenuItem, Divider, Tooltip } from '@betty/beam';
import MoreVertIcon from '@mui/icons-material/MoreVertRounded';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

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

/**
 * useRowReorder — pointer-based drag-to-reorder for an `orderable` editor table (Payout / Multiplier
 * Sectors, 2026-09-25). EXPLORATION-GRADE but shippable: native HTML5 drag, no library. The drag handle
 * is the ENHANCEMENT — the kebab's Move up / Move down stays the keyboard path (never removed).
 *
 * The row is `draggable` ONLY once a pointer lands on its handle (`handleProps`), so the TextFields in a
 * row select text normally the rest of the time. Position recompute is free: sector numbers are derived
 * from array order (index + 1), so a reordered array renumbers on drop with no extra bookkeeping.
 */
export function useRowReorder<T>(rows: T[], onChange: (rows: T[]) => void) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [armed, setArmed] = useState(false); // a pointer is down on some row's handle

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= rows.length) return;
    const next = [...rows];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const rowProps = (index: number) => ({
    draggable: armed,
    onDragStart: (event: DragEvent) => {
      setDraggingIndex(index);
      event.dataTransfer.effectAllowed = 'move';
    },
    onDragOver: (event: DragEvent) => {
      event.preventDefault();
      if (draggingIndex === null || draggingIndex === index) return;
      // Live reorder as the row passes over a neighbour, then treat THAT slot as the new origin.
      move(draggingIndex, index);
      setDraggingIndex(index);
    },
    onDrop: (event: DragEvent) => event.preventDefault(),
    onDragEnd: () => {
      setDraggingIndex(null);
      setArmed(false);
    },
  });

  // The dragged row is LIFTED — the row surface + an elevation shadow (theme tokens, no new colours);
  // relative + z lifts it above its neighbours so the shadow reads.
  const liftedRowSx = {
    boxShadow: 4,
    bgcolor: 'background.paper',
    position: 'relative',
    zIndex: 1,
  } as const;

  const handleProps = {
    onPointerDown: () => setArmed(true),
    onPointerUp: () => setArmed(false),
  };

  return { draggingIndex, rowProps, handleProps, liftedRowSx };
}

/**
 * RowDragHandle — the ⠿ grip, a leading-rail citizen for `orderable` tables (convention minted with the
 * kebab, BEAM.md §6). Pointer-only: keyboard reorder lives in the kebab (Move up / Move down), so the
 * grip is `aria-hidden` and unfocusable — it adds nothing for a screen reader that the kebab lacks.
 */
export function RowDragHandle({ handleProps }: { handleProps: ReturnType<typeof useRowReorder>['handleProps'] }) {
  return (
    <Tooltip title="Drag to reorder">
      <Box
        component="span"
        aria-hidden
        {...handleProps}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          color: 'text.disabled',
          cursor: 'grab',
          touchAction: 'none',
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <DragIndicatorIcon fontSize="small" />
      </Box>
    </Tooltip>
  );
}
