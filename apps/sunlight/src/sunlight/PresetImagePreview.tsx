import { useState } from 'react';
import { Box, Paper, Stack, Typography } from '@betty/beam';
import SportsEsportsOutlinedIcon from '@mui/icons-material/SportsEsportsOutlined';
import { presetImagePreviewMode } from './metaGamePresetHelpers';

export function PresetImagePreview({
  imageUrl,
  alt,
  width = 160,
  height = 96,
}: {
  imageUrl: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = presetImagePreviewMode(imageUrl, Boolean(imageUrl && failedUrl === imageUrl)) === 'image';

  return (
    <Paper variant="outlined" sx={{ width, height, overflow: 'hidden', flexShrink: 0 }}>
      {showImage ? (
        <Box
          component="img"
          src={imageUrl ?? undefined}
          alt={alt}
          onError={() => setFailedUrl(imageUrl ?? null)}
          sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 1 }}
        />
      ) : (
        <Stack spacing={0.5} sx={{ alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <SportsEsportsOutlinedIcon color="disabled" />
          <Typography variant="body2" color="text.secondary">No image</Typography>
        </Stack>
      )}
    </Paper>
  );
}
