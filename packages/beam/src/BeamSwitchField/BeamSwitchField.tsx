import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import { meta } from '../theme/textStyles';
import { fieldGeometrySx } from '../theme/tokens';
import type { BeamSwitchFieldProps } from './BeamSwitchField.types';

/**
 * BeamSwitchField — the edit twin of a boolean BeamStat. An outlined field matching TextField
 * geometry (44px, meta notch label) hosting a MUI Switch. Same height token as BeamStat (§2), so the
 * boolean view↔edit pair aligns per row. NO spine (detail-grammar §5). Placeholder visuals.
 */
export function BeamSwitchField({ label, checked, onChange, name, disabled }: BeamSwitchFieldProps) {
  return (
    <Box
      sx={{
        // The field-height mixin (dogfooding fieldGeometrySx) → this custom control is a 44px twin.
        ...fieldGeometrySx,
        display: 'inline-flex',
        position: 'relative',
        minWidth: 132,
        // Track x-alignment (bench, Deyan): paddingLeft 4 + MUI Switch's 12px internal touch-target
        // padding lands the track at ~the input's 14px text inset, so the switch left-aligns with
        // where the twin TextField's text sits. (The Switch's own margin-left is removed at source.)
        pl: 0.5,
        pr: 0.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {/* Notch label — meta voice, on the top border, masked by the surface (assumes surface-1/paper,
          the usual form surface). A placeholder for the notched-outline look without a fieldset. */}
      <Box
        component="label"
        htmlFor={name}
        sx={{ ...meta, position: 'absolute', top: 0, left: 10, transform: 'translateY(-50%)', px: 0.5, lineHeight: 1, bgcolor: 'background.paper', pointerEvents: 'none' }}
      >
        {label}
      </Box>
      <Switch
        id={name}
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
    </Box>
  );
}
