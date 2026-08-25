/**
 * BeamSwitchField — the EDIT twin of a boolean BeamStat: an outlined field (44px, meta notch label)
 * hosting a MUI Switch, so a boolean's view↔edit pair shares the field geometry. NO spine — edit
 * twins carry state via the field's native states, not the spine (detail-grammar §5).
 *
 * Visuals are placeholder-approved (BeamStat v2 §3) and may iterate.
 */
export interface BeamSwitchFieldProps {
  label: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
  /** Associates the notch label with the switch input. */
  name?: string;
  disabled?: boolean;
}
