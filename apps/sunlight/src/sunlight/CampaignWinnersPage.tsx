import { useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Stack,
  MenuItem,
  TextField,
  BeamPageHeader,
  BeamEmptyState,
  BeamFilterBar,
  BeamDataTable,
} from '@betty/beam';
import type { BeamColumn } from '@betty/beam';
import { backTo } from './backTo';
import { RouterIdentityLink } from './RouterIdentityLink';
import { getTokenCampaign, stageLabel } from './tokenCampaigns';
import { getCampaignWinners, WINNER_REWARD_TYPES, type CampaignWinner, type WinnerRewardType } from './campaignWinners';

/**
 * CampaignWinnersPage — /prize-wall/token-campaigns/:id/winners. The FIRST TRANSACTIONAL CHILD VIEW:
 * runtime data (grants) scoped to a config entity (the campaign). VIEW-ONLY by nature — no CRUD, no
 * edit mode, no approval pipeline, no row actions, no primary action (detail-page-grammar "Drill-down
 * flows"). List-page grammar still governs the mechanics: filter bar + datagrid + pagination.
 *
 * The Stage filter's options are sourced from the PARENT (this campaign's wallStages) — a
 * cross-entity filter. OPEN ITEMS (logged in doctrine): the Player identity link targets a Players
 * section that is out of repo scope (resolves to Not-found today); `grantedAt` timezone display
 * convention; a possible Export action (ops, pending Radi).
 */

const BASE = '/prize-wall/token-campaigns';
const fmtGrantedAt = (iso: string) => iso.replace('T', ' ').slice(0, 16); // TODO(tz): display convention — open item

interface Applied {
  q: string;
  stage: 'any' | string; // wallStageId
  rewardType: 'any' | WinnerRewardType;
}
const EMPTY: Applied = { q: '', stage: 'any', rewardType: 'any' };

export function CampaignWinnersPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const campaign = getTokenCampaign(id);

  const back = backTo(navigate, `${BASE}/${id}`, campaign?.name ?? 'Campaign');

  // Stage filter options sourced from THIS campaign (cross-entity filter from the parent).
  const stageOptions = campaign?.wallStages ?? [];
  const stageIds = stageOptions.map((s) => s.id);

  const applied: Applied = {
    q: searchParams.get('q') ?? '',
    stage: stageIds.includes(searchParams.get('stage') ?? '') ? (searchParams.get('stage') as string) : 'any',
    rewardType: WINNER_REWARD_TYPES.includes(searchParams.get('rewardType') as WinnerRewardType)
      ? (searchParams.get('rewardType') as WinnerRewardType)
      : 'any',
  };
  const [draft, setDraft] = useState<Applied>(applied);

  const rows = useMemo(() => {
    const q = applied.q.trim().toLowerCase();
    return getCampaignWinners(id).filter((w) => {
      if (q && !`${w.playerId} ${w.playerName}`.toLowerCase().includes(q)) return false;
      if (applied.stage !== 'any' && w.wallStageId !== applied.stage) return false;
      if (applied.rewardType !== 'any' && w.rewardType !== applied.rewardType) return false;
      return true;
    });
  }, [id, applied.q, applied.stage, applied.rewardType]);

  const isApplied = applied.q !== '' || applied.stage !== 'any' || applied.rewardType !== 'any';

  const submit = () => {
    const p = new URLSearchParams();
    if (draft.q.trim()) p.set('q', draft.q.trim());
    if (draft.stage !== 'any') p.set('stage', draft.stage);
    if (draft.rewardType !== 'any') p.set('rewardType', draft.rewardType);
    setSearchParams(p, { replace: true });
  };
  const clearAll = () => {
    setDraft(EMPTY);
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const stageName = (stageId: string) => {
    const s = stageOptions.find((st) => st.id === stageId);
    return s ? stageLabel(s) : stageId;
  };

  if (!campaign) {
    return (
      <Stack spacing={3}>
        <BeamPageHeader title="Winners" back={backTo(navigate, BASE, 'Token Campaigns')} />
        <BeamEmptyState title={`No campaign with id ${id}`} description="It may have been removed." />
      </Stack>
    );
  }

  // View-only columns. Player is our identity-link treatment → the Players section (out of repo
  // scope: resolves to Not-found today — open item). Everything else inspects in place.
  const columns: BeamColumn<CampaignWinner>[] = [
    { key: 'playerId', header: 'Player ID', getValue: (w) => w.playerId, render: (w) => w.playerId, width: 120 },
    {
      key: 'player',
      header: 'Player',
      getValue: (w) => w.playerName,
      isIdentity: true,
      getHref: (w) => `${import.meta.env.BASE_URL}players/${w.playerId}`,
      render: (w) => w.playerName,
    },
    { key: 'stage', header: 'Stage', getValue: (w) => stageName(w.wallStageId), render: (w) => stageName(w.wallStageId), width: 120 },
    { key: 'rewardName', header: 'Reward', getValue: (w) => w.rewardName, render: (w) => w.rewardName },
    { key: 'rewardType', header: 'Reward type', getValue: (w) => w.rewardType, render: (w) => w.rewardType, width: 130 },
    // Display format corrected on Deyan's review.
    { key: 'rewardAmount', header: 'Amount', align: 'right', width: 110, getValue: (w) => w.rewardAmount ?? 0, render: (w) => (w.rewardAmount == null ? '—' : w.rewardAmount.toLocaleString()) },
    { key: 'grantedAt', header: 'Granted at', getValue: (w) => w.grantedAt, render: (w) => fmtGrantedAt(w.grantedAt), align: 'right', width: 160 },
  ];

  return (
    <Stack spacing={3}>
      {/* Child-scoped header: title "Winners", campaign name as context (subtitle), back → detail. */}
      <BeamPageHeader title="Winners" subtitle={campaign.name} back={back} />

      <BeamFilterBar
        aria-label="Winner filters"
        searchValue={draft.q}
        onSearchChange={(q) => setDraft((d) => ({ ...d, q }))}
        searchPlaceholder="Search player ID or name"
        applied={isApplied}
        onFilter={submit}
        onClearAll={clearAll}
      >
        <TextField select fullWidth size="small" label="Stage" value={draft.stage} onChange={(e) => setDraft((d) => ({ ...d, stage: e.target.value }))}>
          <MenuItem value="any">Any</MenuItem>
          {stageOptions.map((s) => (
            <MenuItem key={s.id} value={s.id}>{stageLabel(s)}</MenuItem>
          ))}
        </TextField>
        <TextField select fullWidth size="small" label="Reward type" value={draft.rewardType} onChange={(e) => setDraft((d) => ({ ...d, rewardType: e.target.value as Applied['rewardType'] }))}>
          <MenuItem value="any">Any</MenuItem>
          {WINNER_REWARD_TYPES.map((t) => (
            <MenuItem key={t} value={t}>{t}</MenuItem>
          ))}
        </TextField>
      </BeamFilterBar>

      <BeamDataTable
        columns={columns}
        rows={rows}
        getRowId={(w) => w.id}
        LinkComponent={RouterIdentityLink}
        paginated
        emptyMessage="No winners for this campaign yet."
        aria-label="Campaign winners"
      />
    </Stack>
  );
}
