import ConstructionIcon from '@mui/icons-material/Construction';
import { Stack, BeamPageHeader, BeamEmptyState } from '@betty/beam';

/**
 * A not-built-yet screen: page header for orientation, then a Beam empty
 * state. Every nav placeholder routes here until it gets a real page.
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
