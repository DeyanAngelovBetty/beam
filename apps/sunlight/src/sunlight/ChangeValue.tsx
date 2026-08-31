import { memo, type ReactNode } from 'react';
import { Box, alpha } from '@betty/beam';

/**
 * ChangeValue — FAITHFUL PORT from official Sunlight (Alex; features/loyalty/approvals/ChangeValue),
 * adopted as-is into Beam's approval detail (see docs/approval-grammar.md "Presentation"). Old value
 * struck through in an error tint, new value in a success tint, side by side; unchanged → the plain
 * value.
 *
 * Ported verbatim — only the imports are mechanical (MUI `Box` + `alpha` sourced through the Beam
 * barrel). The colours map 1:1 onto our existing error/success tokens, so the look is unchanged. The
 * a11y concern (change encoded by colour + line-through only, no non-colour channel) is logged as an
 * OPEN ITEM in the doctrine, deliberately NOT addressed in this port.
 */
type ChangeValueProps = {
  changed: boolean;
  before?: ReactNode;
  after?: ReactNode;
};

function ChangeValueBase({ changed, before, after }: ChangeValueProps) {
  if (!changed) {
    return <>{after ?? before}</>;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
      {before != null && (
        <Box
          component="span"
          sx={(theme) => ({
            color: 'error.main',
            backgroundColor: alpha(theme.palette.error.main, 0.12),
            opacity: 0.8,
            textDecoration: 'line-through',
            px: 0.5,
            borderRadius: 0.5,
          })}
        >
          {before}
        </Box>
      )}
      {after != null && (
        <Box
          component="span"
          sx={(theme) => ({
            color: 'success.main',
            backgroundColor: alpha(theme.palette.success.main, 0.12),
            px: 0.5,
            borderRadius: 0.5,
          })}
        >
          {after}
        </Box>
      )}
    </Box>
  );
}

export const ChangeValue = memo(ChangeValueBase);
