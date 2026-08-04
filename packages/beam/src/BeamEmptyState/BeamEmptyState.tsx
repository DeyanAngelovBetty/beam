import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { BeamEmptyStateProps } from './BeamEmptyState.types';

export function BeamEmptyState({ title, description, icon, action }: BeamEmptyStateProps) {
  return (
    <Stack
      component="section"
      spacing={2}
      sx={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', py: 10, px: 3 }}
    >
      {icon && (
        <Box
          sx={{
            color: 'text.disabled',
            display: 'flex',
            '& > svg': { fontSize: 48 },
          }}
        >
          {icon}
        </Box>
      )}
      <Stack spacing={0.5} sx={{ maxWidth: 420 }}>
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
      </Stack>
      {action}
    </Stack>
  );
}
