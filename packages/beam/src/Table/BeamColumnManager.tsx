import { BUTTON_PAD_X } from '../theme/tokens';
import { BeamItemManager, type ManagerEntry } from '../BeamItemManager';

/** A real, toggleable/reorderable column, in current order (hidden ones included). (= generic `ManagerEntry`.) */
export type ManagerColumn = ManagerEntry;

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
 * BeamColumnManager — Table's toolbar trigger + popover for the column manager, now a THIN WRAPPER over the
 * generic `BeamItemManager` (2026-10-06). It fixes the table-toolbar presentation: a flat TEXT button labelled
 * "Manage columns", seated on the chrome-band rail via a `-BUTTON_PAD_X` margin (BEAM.md §6.9) so the label
 * shares one vertical with the bulk strip's EXPORT label and the row checkboxes. All the show/hide/reorder/
 * drag logic lives in BeamItemManager; the dashboard widget manager uses that directly with `title="widgets"`.
 */
export function BeamColumnManager({ columns, catalog, onToggle, onMove, onReorder, onReset }: BeamColumnManagerProps) {
  return (
    <BeamItemManager
      items={columns}
      catalog={catalog}
      onToggle={onToggle}
      onMove={onMove}
      onReorder={onReorder}
      onReset={onReset}
      title="columns"
      triggerVariant="text"
      // The label — not the button box — seats on the control-rail line; this cancels the text button's own
      // left padding so "Manage columns" lands on the seat (BEAM.md §6.9). Off the constant so it holds if the pad changes.
      triggerSx={{ ml: `${-BUTTON_PAD_X}px` }}
    />
  );
}
