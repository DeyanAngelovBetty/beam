import { useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ViewColumnIcon from '@mui/icons-material/ViewColumnOutlined';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpwardRounded';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownwardRounded';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

/** A real, toggleable/reorderable column, in current order (hidden ones included). */
export interface ManagerColumn {
  id: string;
  label: string;
  visible: boolean;
}

export interface BeamColumnManagerProps {
  columns: ManagerColumn[];
  /** Disabled "awaiting data" ledger rows (option b) — never toggleable or reorderable. */
  catalog: { id: string; label: string }[];
  onToggle: (id: string) => void;
  onMove: (id: string, dir: 'up' | 'down') => void;
  /** Pointer-drag reorder: move `id` to `toIndex` (index in the list AFTER the id is removed). */
  onReorder: (id: string, toIndex: number) => void;
  onReset: () => void;
}

/**
 * BeamColumnManager — the toolbar trigger + popover for BeamDataTable's column manager. Internal to
 * the organism (not barrel-exported). Show/hide via checkbox; reorder via a pointer DRAG HANDLE
 * (mouse/touch) OR the ▲/▼ buttons. Both write the same columnOrder through the parent, so the two
 * paths can't diverge. Reset returns to declared defaults. Minimum one visible column is enforced:
 * the last visible column's checkbox is disabled.
 *
 * Drag is hand-rolled on Pointer Events (no dnd-kit) — a simple vertical list doesn't justify the
 * dependency, and the a11y story is already carried by the labelled arrows. So the handle is a
 * pointer-only affordance: `aria-hidden`, non-focusable, `touch-action: none`. Assistive tech reorders
 * with the arrows (which announce "Move X up/down"); we don't ship a half-built ARIA drag.
 */
export function BeamColumnManager({ columns, catalog, onToggle, onMove, onReorder, onReset }: BeamColumnManagerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const visibleCount = columns.filter((c) => c.visible).length;

  // Drag state. `dragId` is the row being dragged; `boundary` is where it would land — an insertion
  // index in 0..columns.length (before row `boundary`, or after the last when === length). `indicatorTop`
  // is that boundary's pixel offset within the list, for the drop line (absolute → no layout shift).
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [boundary, setBoundary] = useState<number | null>(null);
  const [indicatorTop, setIndicatorTop] = useState<number | null>(null);

  const offsetForBoundary = (b: number) => {
    const n = columns.length;
    if (b <= 0) return rowRefs.current[0]?.offsetTop ?? 0;
    if (b >= n) {
      const last = rowRefs.current[n - 1];
      return last ? last.offsetTop + last.offsetHeight : 0;
    }
    return rowRefs.current[b]?.offsetTop ?? 0;
  };

  const onHandleDown = (id: string) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragId(id);
  };

  const onHandleMove = (e: React.PointerEvent) => {
    if (dragId === null) return;
    const y = e.clientY;
    // Boundary from the nearest row midpoint (above → before it, below → after it). Clamp to the ends.
    let b = columns.length;
    for (let i = 0; i < columns.length; i++) {
      const el = rowRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (y < rect.top + rect.height / 2) {
        b = i;
        break;
      }
    }
    setBoundary(b);
    setIndicatorTop(offsetForBoundary(b));
  };

  const endDrag = (e: React.PointerEvent) => {
    if (dragId !== null && boundary !== null) {
      const from = columns.findIndex((c) => c.id === dragId);
      // Boundary → target index in the post-removal array: a boundary past `from` shifts down by one.
      if (from >= 0 && boundary !== from && boundary !== from + 1) {
        onReorder(dragId, boundary > from ? boundary - 1 : boundary);
      }
    }
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
    setDragId(null);
    setBoundary(null);
    setIndicatorTop(null);
  };

  return (
    <>
      <Tooltip title="Manage columns">
        <IconButton size="small" aria-label="Manage columns" onClick={(e) => setAnchorEl(e.currentTarget)}>
          <ViewColumnIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ minWidth: 300, py: 1 }} role="group" aria-label="Column manager">
          {/* position: relative anchors the absolute drop indicator to the reorderable list. */}
          <List dense disablePadding sx={{ position: 'relative' }}>
            {dragId !== null && indicatorTop !== null && (
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  left: 8,
                  right: 8,
                  top: indicatorTop,
                  height: 2,
                  borderRadius: 1,
                  bgcolor: 'primary.main',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              />
            )}
            {columns.map((c, i) => {
              const lockedOn = c.visible && visibleCount <= 1; // last visible — can't hide it
              const dragging = dragId === c.id;
              return (
                <ListItem
                  key={c.id}
                  ref={(el: HTMLLIElement | null) => {
                    rowRefs.current[i] = el;
                  }}
                  disableGutters
                  sx={{ pl: 0.5, pr: 0.5, opacity: dragging ? 0.4 : 1 }}
                  secondaryAction={
                    <Stack direction="row" sx={{ alignItems: 'center' }}>
                      <IconButton
                        size="small"
                        aria-label={`Move ${c.label} up`}
                        disabled={i === 0}
                        onClick={() => onMove(c.id, 'up')}
                      >
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label={`Move ${c.label} down`}
                        disabled={i === columns.length - 1}
                        onClick={() => onMove(c.id, 'down')}
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  }
                >
                  {/* Drag handle — pointer-only (mouse/touch). aria-hidden + non-focusable: the arrows
                      are the assistive-tech path (see file header). touch-action:none so touch-drag
                      doesn't scroll the popover. */}
                  <Box
                    aria-hidden
                    component="span"
                    onPointerDown={onHandleDown(c.id)}
                    onPointerMove={onHandleMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      color: 'text.disabled',
                      cursor: dragging ? 'grabbing' : 'grab',
                      touchAction: 'none',
                      mr: 0.5,
                      '&:hover': { color: 'text.secondary' },
                    }}
                  >
                    <DragIndicatorIcon fontSize="small" />
                  </Box>
                  <FormControlLabel
                    sx={{ m: 0 }}
                    control={
                      <Checkbox
                        size="small"
                        checked={c.visible}
                        disabled={lockedOn}
                        onChange={() => onToggle(c.id)}
                        slotProps={{ input: { 'aria-label': `Show ${c.label}` } }}
                      />
                    }
                    label={c.label}
                  />
                </ListItem>
              );
            })}
          </List>

          <List dense disablePadding>
            {catalog.length > 0 && <Divider sx={{ my: 1 }} />}
            {catalog.map((c) => (
              <ListItem key={c.id} disableGutters sx={{ pl: 1, pr: 0.5, opacity: 0.6 }}>
                <FormControlLabel
                  sx={{ m: 0 }}
                  control={<Checkbox size="small" checked={false} disabled />}
                  label={
                    <Stack>
                      <Typography variant="body2">{c.label}</Typography>
                      <Typography variant="caption" color="text.secondary">awaiting data</Typography>
                    </Stack>
                  }
                />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 1 }} />
          <Box sx={{ px: 2 }}>
            <Button size="small" onClick={onReset}>Reset to defaults</Button>
          </Box>
        </Box>
      </Popover>
    </>
  );
}
