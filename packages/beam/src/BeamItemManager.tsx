import { useRef, useState } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpwardRounded';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownwardRounded';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

/** A real, toggleable/reorderable entry, in current order (hidden ones included). */
export interface ManagerEntry {
  id: string;
  label: string;
  visible: boolean;
}

export interface BeamItemManagerProps {
  items: ManagerEntry[];
  /** Disabled "awaiting data" ledger rows — shown but never toggleable or reorderable. */
  catalog: { id: string; label: string }[];
  onToggle: (id: string) => void;
  onMove: (id: string, dir: 'up' | 'down') => void;
  /** Pointer-drag reorder: move `id` to `toIndex` (index in the list AFTER the id is removed). */
  onReorder: (id: string, toIndex: number) => void;
  onReset: () => void;
  /** The noun, for the trigger + aria — e.g. `"columns"` (Table) or `"widgets"` (dashboard). Default `"items"`. */
  title?: string;
  /** Trigger button style: `"text"` (table toolbar) or `"outlined"` (a page-header action). Default `"text"`. */
  triggerVariant?: 'text' | 'outlined';
  /** Extra sx for the trigger button (e.g. the Table toolbar's chrome-band seating margin). */
  triggerSx?: SxProps<Theme>;
}

/**
 * BeamItemManager — a generic show/hide + reorder popover (2026-10-06, generalized from Table's
 * `BeamColumnManager`). Two consumers: Table columns (via the `BeamColumnManager` wrapper) and the dashboard
 * widget manager. Pair it with `useItemManager` for the state/persistence. Show/hide via checkbox; reorder via
 * a pointer DRAG HANDLE (mouse/touch) OR the ▲/▼ buttons — both write the same order through the parent, so the
 * paths can't diverge. Reset returns to declared defaults. Minimum one visible entry is enforced (the last
 * visible checkbox is disabled).
 *
 * Drag is hand-rolled on Pointer Events (no dnd-kit — a simple vertical list doesn't justify the dependency;
 * the a11y path is the labelled arrows). The handle is pointer-only: `aria-hidden`, non-focusable,
 * `touch-action: none`. Assistive tech reorders with the arrows ("Move X up/down").
 *
 * The TRIGGER is a button the component renders (label "Manage {title}"); styling is the consumer's via
 * `triggerVariant`/`triggerSx`, because placement differs — the Table seats a flat text button on its toolbar
 * rail, a dashboard puts an outlined action in its page header.
 */
export function BeamItemManager({
  items,
  catalog,
  onToggle,
  onMove,
  onReorder,
  onReset,
  title = 'items',
  triggerVariant = 'text',
  triggerSx,
}: BeamItemManagerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const visibleCount = items.filter((c) => c.visible).length;

  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [boundary, setBoundary] = useState<number | null>(null);
  const [indicatorTop, setIndicatorTop] = useState<number | null>(null);

  const offsetForBoundary = (b: number) => {
    const n = items.length;
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
    let b = items.length;
    for (let i = 0; i < items.length; i++) {
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
      const from = items.findIndex((c) => c.id === dragId);
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
      <Button
        size="small"
        variant={triggerVariant}
        aria-label={`Manage ${title}`}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={triggerSx}
      >
        Manage {title}
      </Button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ minWidth: 300, py: 1 }} role="group" aria-label={`${title} manager`}>
          <List dense disablePadding sx={{ position: 'relative' }}>
            {dragId !== null && indicatorTop !== null && (
              <Box
                aria-hidden
                sx={{ position: 'absolute', left: 8, right: 8, top: indicatorTop, height: 2, borderRadius: 1, bgcolor: 'primary.main', pointerEvents: 'none', zIndex: 1 }}
              />
            )}
            {items.map((c, i) => {
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
                      <IconButton size="small" aria-label={`Move ${c.label} up`} disabled={i === 0} onClick={() => onMove(c.id, 'up')}>
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" aria-label={`Move ${c.label} down`} disabled={i === items.length - 1} onClick={() => onMove(c.id, 'down')}>
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  }
                >
                  <Box
                    aria-hidden
                    component="span"
                    onPointerDown={onHandleDown(c.id)}
                    onPointerMove={onHandleMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    sx={{ display: 'inline-flex', alignItems: 'center', color: 'text.disabled', cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none', mr: 0.5, '&:hover': { color: 'text.secondary' } }}
                  >
                    <DragIndicatorIcon fontSize="small" />
                  </Box>
                  <FormControlLabel
                    sx={{ m: 0 }}
                    control={<Checkbox size="small" checked={c.visible} disabled={lockedOn} onChange={() => onToggle(c.id)} slotProps={{ input: { 'aria-label': `Show ${c.label}` } }} />}
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
