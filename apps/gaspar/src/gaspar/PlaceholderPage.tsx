import ConstructionIcon from '@mui/icons-material/Construction';
import { Stack, BeamPageHeader, BeamEmptyState } from '@betty/beam';

/**
 * A not-built-yet screen: page header for orientation, then a Beam empty state.
 * The Administration nav targets (Users / Roles / Permissions) route here — they
 * are nav destinations for the demo, not features (mirrors Sunlight's PlaceholderPage).
 */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <Stack spacing={3}>
      <BeamPageHeader title={title} />
      <BeamEmptyState
        icon={<ConstructionIcon />}
        title={`${title} is coming soon`}
        description="This screen hasn't been built yet — it's a placeholder in the Beam demo."
      />
    </Stack>
  );
}
