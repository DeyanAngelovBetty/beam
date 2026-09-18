import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Stack,
  Box,
  Typography,
  Alert,
  Button,
  IconButton,
  MuiTable as Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  MenuItem,
  BeamPage,
  BeamEmptyState,
  DetailsPanel,
  BeamStat,
  BeamField,
  Section,
  meta,
} from '@betty/beam';
import EditIcon from '@mui/icons-material/EditRounded';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import AddIcon from '@mui/icons-material/Add';
import RemoveCircleIcon from '@mui/icons-material/DoNotDisturbOnOutlined';
import { backTo } from './backTo';
import { RewardsStrategyTable } from './CommunityJackpotDetailPage';
import {
  getJackpot,
  getMilestone,
  addMilestone,
  updateMilestone,
  deleteMilestone,
  makeEmptyMilestone,
  fmtDateTimeET,
  REWARD_STRATEGY_OPTIONS,
  REWARD_ROW_TYPE_OPTIONS,
  type Milestone,
  type RewardStrategyRow,
} from './communityJackpots';

/**
 * CommunityJackpotMilestonePage — /community-jackpots/:id/milestones/:mid (view), /…/edit, /…/new (add).
 * Composition: designs/CJ-Milestone-{view,edit,add}.png. Breadcrumb → the parent jackpot. The header is
 * a DetailsPanel (Name / Reward Strategy / Threshold / Jackpot Amount twins); "Rewards Strategy" is a
 * Section (read-only table in view; inline editable field-list in edit/add); "Milestone Winners" is a
 * read-only Section.
 *
 * RULINGS applied (deviations from the PNGs, flagged):
 *  • Winners are OPERATIONAL, not config — no Approve/Reject actions and no editable winner fields in
 *    EDIT. The milestone-edit PNG's "APPROVE LIST"/"REJECT LIST" CTAs and its editable SCREEN NAME are
 *    dropped; winners render read-only in every mode (the PNG predates the ruling).
 *  • Twin discipline: the section title is "Rewards Strategy" in BOTH twins (Figma's "Rewards Strategy
 *    Configuration" drift unified to one name). isEdit is passed EXPLICITLY (this page genuinely mixes
 *    an editable Rewards Strategy with a read-only Winners section).
 *  • The edit PNG's two typed CTAs ("ADD PRIZE" / "ADD MILESTONE FLIP") are unified to the add PNG's
 *    single "ADD REWARD STRATEGY" CTA (task ruling); each row's Reward Type is a select.
 */

const BASE = '/community-jackpots';

type Notice = { severity: 'success' | 'info' | 'warning'; msg: string } | null;

interface MilestoneDraft {
  name: string;
  rewardStrategy: string;
  threshold: number;
  jackpotAmount: number;
  rewardsStrategy: RewardStrategyRow[];
}
const draftFrom = (m: Milestone | Omit<Milestone, 'id'>): MilestoneDraft => ({
  name: m.name,
  rewardStrategy: m.rewardStrategy,
  threshold: m.threshold,
  jackpotAmount: m.jackpotAmount,
  rewardsStrategy: m.rewardsStrategy.map((r) => ({ ...r })),
});

export function CommunityJackpotMilestonePage({ mode }: { mode: 'view' | 'edit' | 'add' }) {
  const { id = '', mid = '' } = useParams();
  const navigate = useNavigate();
  const isEdit = mode !== 'view';

  const jackpot = getJackpot(id);
  const milestone = mode === 'add' ? undefined : getMilestone(id, mid);

  const [draft, setDraft] = useState<MilestoneDraft>(() =>
    mode === 'add' ? draftFrom(makeEmptyMilestone()) : milestone ? draftFrom(milestone) : draftFrom(makeEmptyMilestone()),
  );
  const [notice, setNotice] = useState<Notice>(null);

  const jackpotBack = backTo(navigate, `${BASE}/${id}`, jackpot?.name ?? 'Community Jackpot');

  if (!jackpot) {
    return (
      <Stack spacing={3}>
        <BeamPage title="Milestone" back={backTo(navigate, BASE, 'Community Jackpots')} />
        <BeamEmptyState title={`No community jackpot with id ${id}`} description="It may have been removed." />
      </Stack>
    );
  }
  if (mode !== 'add' && !milestone) {
    return (
      <Stack spacing={3}>
        <BeamPage title="Milestone" back={jackpotBack} />
        <BeamEmptyState title={`No milestone with id ${mid}`} description="It may have been removed." />
      </Stack>
    );
  }

  const patch = (p: Partial<MilestoneDraft>) => setDraft((prev) => ({ ...prev, ...p }));
  const patchRow = (i: number, p: Partial<RewardStrategyRow>) =>
    setDraft((prev) => ({ ...prev, rewardsStrategy: prev.rewardsStrategy.map((r, j) => (j === i ? { ...r, ...p } : r)) }));
  const addRow = () =>
    setDraft((prev) => ({ ...prev, rewardsStrategy: [...prev.rewardsStrategy, { rewardType: 'Prize', numRewards: 1, qualificationAmount: 0, rewardAmount: 0 }] }));
  const removeRow = (i: number) =>
    setDraft((prev) => ({ ...prev, rewardsStrategy: prev.rewardsStrategy.filter((_, j) => j !== i) }));

  const save = () => {
    if (draft.rewardsStrategy.length < 1) {
      setNotice({ severity: 'warning', msg: 'Add at least one reward strategy before saving.' }); // min 1 row
      return;
    }
    if (mode === 'add') {
      addMilestone(id, { ...makeEmptyMilestone(), ...draft, winners: [] });
      navigate(`${BASE}/${id}/edit`); // return to the jackpot edit session
    } else {
      updateMilestone(id, mid, draft);
      navigate(`${BASE}/${id}/milestones/${mid}`); // back to the milestone view
    }
  };
  const remove = () => {
    if (mode === 'add') {
      navigate(`${BASE}/${id}/edit`); // discard the unsaved milestone, back to the jackpot edit
    } else {
      deleteMilestone(id, mid);
      navigate(`${BASE}/${id}`); // deleted → back to the jackpot
    }
  };

  const winners = milestone?.winners ?? [];

  return (
    <Stack spacing={3}>
      <BeamPage
        title={isEdit ? draft.name : (milestone as Milestone).name}
        back={jackpotBack}
        action={
          isEdit ? (
            <Button variant="contained" onClick={save}>Save</Button>
          ) : (
            <Button variant="contained" startIcon={<EditIcon />} onClick={() => navigate(`${BASE}/${id}/milestones/${mid}/edit`)}>Edit</Button>
          )
        }
        secondaryActions={
          <Button variant="outlined" color="inherit" startIcon={<DeleteIcon />} onClick={remove}>Delete</Button>
        }
      />

      {notice && (
        <Alert severity={notice.severity} onClose={() => setNotice(null)}>
          {notice.msg}
        </Alert>
      )}

      {/* Header twins: Name / Reward Strategy (scalar) / Threshold / Jackpot Amount. */}
      <DetailsPanel aria-label="Milestone details">
        {isEdit ? (
          <>
            <BeamField label="Name" value={draft.name} onChange={(e) => patch({ name: e.target.value })} />
            <BeamField select label="Reward Strategy" value={draft.rewardStrategy} onChange={(e) => patch({ rewardStrategy: e.target.value })}>
              {REWARD_STRATEGY_OPTIONS.map((o) => (
                <MenuItem key={o} value={o}>{o}</MenuItem>
              ))}
            </BeamField>
            <BeamField label="Threshold" type="number" value={draft.threshold} onChange={(e) => patch({ threshold: Number(e.target.value) || 0 })} />
            <BeamField label="Jackpot Amount" type="number" value={draft.jackpotAmount} onChange={(e) => patch({ jackpotAmount: Number(e.target.value) || 0 })} />
          </>
        ) : (
          <>
            <BeamStat label="Name" value={(milestone as Milestone).name} />
            <BeamStat label="Reward Strategy" value={(milestone as Milestone).rewardStrategy} />
            <BeamStat label="Threshold" value={(milestone as Milestone).threshold.toLocaleString()} />
            <BeamStat label="Jackpot Amount" value={(milestone as Milestone).jackpotAmount.toLocaleString()} />
          </>
        )}
      </DetailsPanel>

      {/* Rewards Strategy — read-only table (view) ⇄ inline editable field-list (edit/add). isEdit explicit. */}
      <Section isEdit={isEdit} title="Rewards Strategy" bleed>
        {isEdit ? (
          <Box sx={{ px: 2, pb: 2 }}>
            <Button variant="text" size="small" startIcon={<AddIcon />} onClick={addRow} sx={{ mb: 1 }}>Add Reward Strategy</Button>
            {draft.rewardsStrategy.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No reward strategies yet — add at least one.</Typography>
            ) : (
              <Stack spacing={1.5}>
                {draft.rewardsStrategy.map((r, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: 'grid',
                      gap: 1.5,
                      alignItems: 'center',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr)) auto', md: 'repeat(4, minmax(0, 1fr)) auto' },
                    }}
                  >
                    <BeamField select label="Reward Type" value={r.rewardType} onChange={(e) => patchRow(i, { rewardType: e.target.value })} fullWidth>
                      {REWARD_ROW_TYPE_OPTIONS.map((o) => (
                        <MenuItem key={o} value={o}>{o}</MenuItem>
                      ))}
                    </BeamField>
                    <BeamField label="# of Rewards" type="number" value={r.numRewards} onChange={(e) => patchRow(i, { numRewards: Number(e.target.value) || 0 })} fullWidth />
                    <BeamField label="Qualification Amount" type="number" value={r.qualificationAmount} onChange={(e) => patchRow(i, { qualificationAmount: Number(e.target.value) || 0 })} fullWidth />
                    <BeamField label="Reward Amount" type="number" value={r.rewardAmount} onChange={(e) => patchRow(i, { rewardAmount: Number(e.target.value) || 0 })} fullWidth />
                    <IconButton
                      aria-label="Remove reward strategy"
                      color="error"
                      onClick={() => removeRow(i)}
                      disabled={draft.rewardsStrategy.length <= 1}
                    >
                      <RemoveCircleIcon />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        ) : (
          <Box sx={{ px: 2, pb: 1 }}>
            <RewardsStrategyTable rows={(milestone as Milestone).rewardsStrategy} />
          </Box>
        )}
      </Section>

      {/* Milestone Winners — OPERATIONAL, read-only in EVERY mode (ruling). Omitted on Add (no winners
          exist for an unsaved milestone). */}
      {mode !== 'add' && (
        <Section isEdit={false} title="Milestone Winners" bleed>
          {winners.length === 0 ? (
            <Box sx={{ px: 2, pb: 2 }}>
              <Typography variant="body2" color="text.secondary">No winners yet.</Typography>
            </Box>
          ) : (
            <Table size="small" aria-label="Milestone winners">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...meta }}>Player ID</TableCell>
                  <TableCell sx={{ ...meta }}>Screen Name</TableCell>
                  <TableCell sx={{ ...meta }}>Player Reward ID</TableCell>
                  <TableCell align="right" sx={{ ...meta }}>Win Amount</TableCell>
                  <TableCell sx={{ ...meta }}>Win Type</TableCell>
                  <TableCell sx={{ ...meta }}>Loyalty Status</TableCell>
                  <TableCell sx={{ ...meta }}>Reward Status</TableCell>
                  <TableCell align="right" sx={{ ...meta }}>Awarded At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {winners.map((w, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{w.playerId}</TableCell>
                    <TableCell>{w.screenName}</TableCell>
                    <TableCell>{w.playerRewardId}</TableCell>
                    <TableCell align="right">{w.winAmount.toLocaleString()}</TableCell>
                    <TableCell>{w.winType}</TableCell>
                    <TableCell>{w.loyaltyStatus}</TableCell>
                    <TableCell>{w.rewardStatus}</TableCell>
                    <TableCell align="right">{fmtDateTimeET(w.awardedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Section>
      )}
    </Stack>
  );
}
