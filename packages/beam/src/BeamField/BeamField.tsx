import TextField, { type TextFieldProps } from '@mui/material/TextField';

/**
 * BeamField — a THIN preset over MUI TextField that forces `size="small"` + `variant="outlined"`
 * and forwards everything else (select, multiline, value, onChange, …). NO styles of its own and NO
 * API of its own: it exists so a twin panel can STATE intent — "this is a field twin" — and cannot
 * accidentally ask for a medium field.
 *
 * It is SUGAR over the theme default, not the mechanism: the 44px field geometry lives in the
 * `MuiOutlinedInput` theme override and applies to every small outlined field whether it comes
 * through BeamField or a plain `<TextField size="small">`. BeamField just removes the footgun.
 */
export type BeamFieldProps = Omit<TextFieldProps, 'variant' | 'size'>;

export function BeamField(props: BeamFieldProps) {
  return <TextField {...(props as TextFieldProps)} size="small" variant="outlined" />;
}
