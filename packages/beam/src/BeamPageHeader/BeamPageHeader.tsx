import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import type { BeamPageHeaderProps } from './BeamPageHeader.types';

export function BeamPageHeader({ title, description, actions, summary }: BeamPageHeaderProps) {
  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
      >
        <Stack spacing={0.5}>
          <Typography variant="h4" component="h1">
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Stack>
        {actions && (
          <Stack direction="row" spacing={1} alignItems="center">
            {actions}
          </Stack>
        )}
      </Stack>

      {summary && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" spacing={4} flexWrap="wrap" useFlexGap>
            {summary}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
