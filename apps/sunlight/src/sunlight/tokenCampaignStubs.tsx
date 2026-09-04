import { useParams, useNavigate } from 'react-router-dom';
import { Stack, BeamPageHeader, BeamEmptyState } from '@betty/beam';
import ConstructionIcon from '@mui/icons-material/Construction';
import { backTo } from './backTo';
import { getTokenCampaign, getWallStage, stageLabel } from './tokenCampaigns';

/**
 * Token Campaign drill-down STUB (Prize Wall flow): the wall stage. Just a BeamPageHeader + a back
 * link, registering the route skeleton until the real page lands. (Campaign detail + Winners are now
 * real pages — TokenCampaignDetailPage / CampaignWinnersPage — no longer stubs here.)
 *
 * BREADCRUMBS: each level uses BeamPageHeader's single `back` link one level up — a correct back
 * CHAIN. The literal full-path trail (List / Campaign / Stage rendered at once) is a PENDING
 * BeamPageHeader design decision: it lives inside the header's constant-geometry contract (row
 * placement, truncation at depth), so it comes from Figma first — not scoped as an organism here.
 */

const BASE = '/prize-wall/token-campaigns';

function Stub({ title, back, note }: { title: string; back: ReturnType<typeof backTo>; note: string }) {
  return (
    <Stack spacing={3}>
      <BeamPageHeader title={title} back={back} />
      <BeamEmptyState icon={<ConstructionIcon />} title={`${title} — coming soon`} description={note} />
    </Stack>
  );
}

/** Wall stage — /prize-wall/token-campaigns/:id/stages/:sid (stub). Back → the campaign detail. */
export function WallStagePage() {
  const { id = '', sid = '' } = useParams();
  const navigate = useNavigate();
  const campaign = getTokenCampaign(id);
  const stage = getWallStage(id, sid);
  return (
    <Stub
      title={stage ? stageLabel(stage) : `Stage ${sid}`}
      back={backTo(navigate, `${BASE}/${id}`, campaign?.name ?? 'Campaign')}
      note="Wall stage is a stub — the stage page lands in a later prompt."
    />
  );
}

