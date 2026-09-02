import { useParams, useNavigate } from 'react-router-dom';
import { Stack, BeamPageHeader, BeamEmptyState } from '@betty/beam';
import ConstructionIcon from '@mui/icons-material/Construction';
import { backTo } from './backTo';
import { getTokenCampaign, getWallStage, stageLabel } from './tokenCampaigns';

/**
 * Token Campaign drill-down STUBS (Prize Wall flow): campaign detail · wall stage. Each is just a
 * BeamPageHeader + a back link, registering the route skeleton so the list's identity link and row
 * actions have real targets. Real pages land in later prompts. (Winners is now a real page —
 * CampaignWinnersPage — no longer a stub here.)
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

/** Campaign detail — /prize-wall/token-campaigns/:id (stub). Back → the list. */
export function TokenCampaignDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const campaign = getTokenCampaign(id);
  return (
    <Stub
      title={campaign?.name ?? `Campaign ${id}`}
      back={backTo(navigate, BASE, 'Token Campaigns')}
      note="Campaign detail is a stub — the detail page lands in a later prompt."
    />
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

