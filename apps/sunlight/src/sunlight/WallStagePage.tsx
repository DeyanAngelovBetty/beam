import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Stack,
  Box,
  Typography,
  Alert,
  Button,
  IconButton,
  Snackbar,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  BeamPageHeader,
  BeamEmptyState,
  DetailsPanel,
  BeamStat,
  BeamBool,
  BeamField,
  BeamSwitchField,
  BeamPaper,
  fieldGeometrySx,
  meta,
} from '@betty/beam';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/EditRounded';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutlineRounded';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopyRounded';
import { backTo } from './backTo';
import {
  getTokenCampaign,
  getWallStage,
  stageLabel,
  REWARD_TYPES,
  type WallStage,
  type OpeningWindow,
  type QuickRule,
  type RewardItem,
  type RewardTier,
} from './tokenCampaigns';

/**
 * WallStagePage — /prize-wall/token-campaigns/:id/stages/:sid. The final drill level of PrizeWall
 * (Token Campaigns → Campaign → Wall Stage → Reward Item dialog). VIEW ↔ EDIT, inheriting the Campaign
 * detail edit pattern one level down (mode/draft, Cancel discards, Submit for Approval is the same STUB
 * — no CR wiring this pass). Composition + fields are a FAITHFUL PORT of the Figma frames
 * (designs/WallStage-{View,Edit}.png, RewardItem-Edit.png). See SPEC-sunlight-prizewall-wall-stage.md.
 *
 * INTENT DELTA (handoff convention): the WallStage-Edit frame's header still shows DELETE/EDIT — that's
 * un-redrawn view chrome; per the spec we inherit the campaign edit-session semantics, so the header
 * swaps to [Cancel · Submit for Approval] in edit. Deliberate divergence, recorded.
 */

const BASE = '/prize-wall/token-campaigns';
const MEDIA = 34; // fixed media-in-cell container (px), object-fit contain — established ruling
const REWARD_TIERS: RewardTier[] = ['none', 'low', 'medium', 'high'];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const fmtDateTimeET = (iso: string) => {
  if (!iso) return '—';
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  })
    .formatToParts(new Date(iso))
    .reduce<Record<string, string>>((a, part) => ((a[part.type] = part.value), a), {});
  return `${p.day}-${p.month}-${p.year} ${p.hour}:${p.minute}:${p.second} ${p.dayPeriod} ET`;
};
const toDateInput = (iso: string) => (iso ? iso.slice(0, 10) : ''); // yyyy-mm-dd
const fromDateInput = (v: string) => (v ? `${v}T00:00:00.000Z` : '');

type Draft = WallStage;
const makeDraft = (s: WallStage): Draft => ({
  ...s,
  openingWindows: s.openingWindows.map((w) => ({ ...w })),
  quickRules: s.quickRules.map((r) => ({ ...r })),
  infoRules: s.infoRules.map((r) => ({ ...r })),
  rewardItems: s.rewardItems.map((r) => ({ ...r })),
});

type Notice = { severity: 'success' | 'info' | 'warning' | 'error'; msg: string } | null;

export function WallStagePage() {
  const { id = '', sid = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const campaign = getTokenCampaign(id);
  const stage = getWallStage(id, sid);
  const navState = location.state as { edit?: boolean } | null;

  const [mode, setMode] = useState<'view' | 'edit'>(navState?.edit && stage ? 'edit' : 'view');
  const [draft, setDraft] = useState<Draft | null>(() => (navState?.edit && stage ? makeDraft(stage) : null));
  const [notice, setNotice] = useState<Notice>(null);
  const [snack, setSnack] = useState<string | null>(null);
  const [rewardDraft, setRewardDraft] = useState<RewardItem | null>(null); // Reward Item dialog

  const copyUrl = (url: string) => {
    void navigator.clipboard?.writeText(url);
    setSnack('URL copied to clipboard');
  };
  const enterEdit = () => {
    if (!stage) return;
    setNotice(null);
    setDraft(makeDraft(stage));
    setMode('edit');
  };
  const cancelEdit = () => {
    setDraft(null);
    setMode('view');
  };
  const submitForApproval = () => {
    // STUB — same as Campaign detail: applies nothing, discards (save-model inversion).
    setDraft(null);
    setMode('view');
    setNotice({ severity: 'info', msg: 'Submit for Approval — stub. No pipeline yet; nothing was applied. (Future: creates a change request in Pending Approvals.)' });
  };
  const patch = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));

  if (!campaign || !stage) {
    return (
      <Stack spacing={3}>
        <BeamPageHeader title={`Stage ${sid}`} back={backTo(navigate, `${BASE}/${id}`, campaign?.name ?? 'Campaign')} />
        <BeamEmptyState title="Wall stage not found" description="It may have been removed." />
      </Stack>
    );
  }

  const isEdit = mode === 'edit' && draft !== null;
  const d = draft;
  const s = isEdit && d ? d : stage;

  // Reward dialog ------------------------------------------------------------------------------------
  const openReward = (item: RewardItem) => setRewardDraft({ ...item });
  const saveReward = () => {
    if (!rewardDraft || !d) return;
    patch({ rewardItems: d.rewardItems.map((r) => (r.id === rewardDraft.id ? rewardDraft : r)) });
    setRewardDraft(null);
  };
  const rp = (p: Partial<RewardItem>) => setRewardDraft((r) => (r ? { ...r, ...p } : r));

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title={stageLabel(stage)}
        back={backTo(navigate, `${BASE}/${id}`, campaign.name)}
        // Subline = the campaign's date range (per the frame).
        subtitle={`${fmtDateTimeET(campaign.startDate)} ↔ ${fmtDateTimeET(campaign.endDate)}`}
        // INTENT DELTA: inherit the campaign edit header — [Delete · Edit] ⇄ [Cancel · Submit for Approval].
        action={
          isEdit ? (
            <Button variant="contained" onClick={submitForApproval}>Submit for Approval</Button>
          ) : (
            <Button variant="contained" startIcon={<EditIcon />} onClick={enterEdit}>Edit</Button>
          )
        }
        secondaryActions={
          isEdit ? (
            <Button variant="text" onClick={cancelEdit}>Cancel</Button>
          ) : (
            <Button variant="outlined" color="inherit" startIcon={<DeleteIcon />} onClick={() => setNotice({ severity: 'warning', msg: `Delete "${stageLabel(stage)}" — stub. No delete pipeline yet. Nothing was removed.` })}>
              Delete
            </Button>
          )
        }
      />

      {notice && (
        <Alert severity={notice.severity} onClose={() => setNotice(null)}>{notice.msg}</Alert>
      )}

      {/* Stat band — view twins ⇄ edit fields (DetailsPanel editability border appears in edit). */}
      <DetailsPanel aria-label="Wall stage stats">
        {isEdit && d ? (
          <>
            <BeamField label="Win probability" value={String(d.winProbabilityPct)} onChange={(e) => patch({ winProbabilityPct: Number(e.target.value) || 0 })} />
            <BeamField label="Loss probability" value={String(d.lossProbabilityPct)} onChange={(e) => patch({ lossProbabilityPct: Number(e.target.value) || 0 })} />
            <BeamField label="Cost of play" type="number" value={String(d.costOfPlay)} onChange={(e) => patch({ costOfPlay: Number(e.target.value) || 0 })} />
            <BeamSwitchField label="Enabled" checked={d.enabled} onChange={(v) => patch({ enabled: v })} />
          </>
        ) : (
          <>
            <BeamStat label="Win probability" value={`${stage.winProbabilityPct}%`} />
            <BeamStat label="Loss probability" value={`${stage.lossProbabilityPct}%`} />
            <BeamStat label="Cost of play" value={String(stage.costOfPlay)} />
            <BeamStat label="Enabled" value={<BeamBool value={stage.enabled} />} />
          </>
        )}
      </DetailsPanel>

      {/* Two-column BeamPaper masonry (frame layout). */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
        {/* LEFT column */}
        <Stack spacing={3} sx={{ flex: 1, minWidth: 0, width: '100%' }}>
          {/* Opening Windows */}
          <BeamPaper title="Opening Windows" bleed>
            <Table size="small" aria-label="Opening windows">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...meta }}>Open</TableCell>
                  <TableCell sx={{ ...meta }}>Duration</TableCell>
                  <TableCell sx={{ ...meta }}>End</TableCell>
                  {isEdit && <TableCell aria-hidden sx={{ width: 40 }} />}
                </TableRow>
              </TableHead>
              <TableBody>
                {(isEdit && d ? d.openingWindows : stage.openingWindows).map((w, i) => (
                  <TableRow key={w.id} hover>
                    {isEdit && d ? (
                      <>
                        <TableCell>
                          <BeamField label="Start date" type="date" value={toDateInput(w.openDate)} onChange={(e) => patch({ openingWindows: d.openingWindows.map((x, j) => (j === i ? { ...x, openDate: fromDateInput(e.target.value) } : x)) })} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
                        </TableCell>
                        <TableCell>
                          <BeamField label="Duration (min)" type="number" value={String(w.durationMin)} onChange={(e) => patch({ openingWindows: d.openingWindows.map((x, j) => (j === i ? { ...x, durationMin: Number(e.target.value) || 0 } : x)) })} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
                        </TableCell>
                        <TableCell>
                          <BeamField label="End date" type="date" value={toDateInput(w.endDate)} onChange={(e) => patch({ openingWindows: d.openingWindows.map((x, j) => (j === i ? { ...x, endDate: fromDateInput(e.target.value) } : x)) })} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="error" aria-label="Remove opening window" onClick={() => patch({ openingWindows: d.openingWindows.filter((_, j) => j !== i) })}>
                            <RemoveCircleOutlineIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{fmtDateTimeET(w.openDate)}</TableCell>
                        <TableCell>{w.durationMin} min</TableCell>
                        <TableCell>{fmtDateTimeET(w.endDate)}</TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {isEdit && d && (
              <Box sx={{ px: 2, py: 1.5 }}>
                <Button
                  variant="text"
                  startIcon={<AddIcon />}
                  onClick={() => patch({ openingWindows: [...d.openingWindows, { id: `${d.id}-w${d.openingWindows.length + 1}-${Date.now()}`, openDate: '', endDate: '', durationMin: 5 }] })}
                >
                  New opening window
                </Button>
              </Box>
            )}
          </BeamPaper>

          {/* Reward items — card grid; Edit → cards open the Reward Item dialog. */}
          <BeamPaper title="Reward items">
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              {(isEdit && d ? d.rewardItems : stage.rewardItems).map((item) => (
                <RewardCard key={item.id} item={item} edit={isEdit} onOpen={() => openReward(item)} />
              ))}
            </Box>
          </BeamPaper>
        </Stack>

        {/* RIGHT column */}
        <Stack spacing={3} sx={{ flex: 1, minWidth: 0, width: '100%' }}>
          {/* Quick Rules */}
          <BeamPaper title="Quick Rules" bleed>
            <RulesTable
              rows={isEdit && d ? d.quickRules : stage.quickRules}
              edit={isEdit}
              onCopy={copyUrl}
              onChange={(next) => patch({ quickRules: next })}
            />
          </BeamPaper>

          {/* Info Page Rules — a title field/stat, then the rules table. */}
          <BeamPaper title="Info Page Rules" bleed>
            <Box sx={{ px: 2, pb: 1 }}>
              {isEdit && d ? (
                <BeamField label="Info page title" value={d.infoPageTitle} onChange={(e) => patch({ infoPageTitle: e.target.value })} fullWidth />
              ) : (
                <BeamStat label="Info page title" value={stage.infoPageTitle} />
              )}
            </Box>
            <RulesTable
              rows={isEdit && d ? d.infoRules : stage.infoRules}
              edit={isEdit}
              onCopy={copyUrl}
              onChange={(next) => patch({ infoRules: next })}
            />
          </BeamPaper>

          {/* Images — Header + Background × desktop/mobile. */}
          <BeamPaper title="Images" bleed>
            <Table size="small" aria-label="Images">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...meta }}>Name</TableCell>
                  <TableCell sx={{ ...meta }}>Desktop</TableCell>
                  <TableCell sx={{ ...meta }}>Mobile</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow hover>
                  <TableCell>Header Image</TableCell>
                  <TableCell><MediaCell url={s.headerImageDesktop} edit={isEdit} onCopy={copyUrl} onChange={(url) => patch({ headerImageDesktop: url })} /></TableCell>
                  <TableCell><MediaCell url={s.headerImageMobile} edit={isEdit} onCopy={copyUrl} onChange={(url) => patch({ headerImageMobile: url })} /></TableCell>
                </TableRow>
                <TableRow hover>
                  <TableCell>Background Image</TableCell>
                  <TableCell><MediaCell url={s.backgroundImageDesktop} edit={isEdit} onCopy={copyUrl} onChange={(url) => patch({ backgroundImageDesktop: url })} /></TableCell>
                  <TableCell><MediaCell url={s.backgroundImageMobile} edit={isEdit} onCopy={copyUrl} onChange={(url) => patch({ backgroundImageMobile: url })} /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </BeamPaper>
        </Stack>
      </Stack>

      {/* Reward Item dialog — the estate's FIRST sanctioned dialog: a leaf sub-record edited inside the
          parent (wall stage) edit session, where navigating away would discard the parent's draft. */}
      <Dialog open={rewardDraft !== null} onClose={() => setRewardDraft(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Reward Item</DialogTitle>
        <DialogContent>
          {rewardDraft && (
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, pt: 1 }}>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <BeamField label="Name" value={rewardDraft.name} onChange={(e) => rp({ name: e.target.value })} fullWidth />
              </Box>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <BeamField label="Description" value={rewardDraft.description} onChange={(e) => rp({ description: e.target.value })} multiline minRows={2} fullWidth />
              </Box>
              <BeamField select label="Type" value={rewardDraft.type} onChange={(e) => rp({ type: e.target.value as RewardItem['type'] })} fullWidth>
                {REWARD_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </BeamField>
              <BeamField label="Cash value" type="number" value={String(rewardDraft.cashValue)} onChange={(e) => rp({ cashValue: Number(e.target.value) || 0 })} fullWidth />
              <BeamField select label="Tier" value={rewardDraft.tier} onChange={(e) => rp({ tier: e.target.value as RewardTier })} fullWidth>
                {REWARD_TIERS.map((t) => <MenuItem key={t} value={t}>{cap(t)}</MenuItem>)}
              </BeamField>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Thumb url={rewardDraft.imgUrl} />
                <BeamField label="URL" value={rewardDraft.imgUrl} onChange={(e) => rp({ imgUrl: e.target.value })} fullWidth />
              </Box>
              <BeamField label="Quantity" type="number" value={String(rewardDraft.quantity)} onChange={(e) => rp({ quantity: Number(e.target.value) || 0 })} fullWidth />
              <BeamField label="Reward amount" type="number" value={String(rewardDraft.rewardAmount)} onChange={(e) => rp({ rewardAmount: Number(e.target.value) || 0 })} fullWidth />
              <BeamField label="Order" type="number" value={String(rewardDraft.order)} onChange={(e) => rp({ order: Number(e.target.value) || 0 })} fullWidth />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setRewardDraft(null)}>Cancel</Button>
          <Button variant="contained" onClick={saveReward}>Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack !== null} autoHideDuration={2000} onClose={() => setSnack(null)} message={snack ?? ''} />
    </Stack>
  );
}

/** A quick-rule / info-rule table: NAME · DESKTOP · MOBILE. Name is static; media cells copy (view) or
 *  become URL fields (edit). */
function RulesTable({ rows, edit, onCopy, onChange }: { rows: QuickRule[]; edit: boolean; onCopy: (url: string) => void; onChange: (next: QuickRule[]) => void }) {
  return (
    <Table size="small" aria-label="Rules">
      <TableHead>
        <TableRow>
          <TableCell sx={{ ...meta }}>Name</TableCell>
          <TableCell sx={{ ...meta }}>Desktop</TableCell>
          <TableCell sx={{ ...meta }}>Mobile</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={r.id} hover>
            <TableCell>{r.name}</TableCell>
            <TableCell><MediaCell url={r.desktopUrl} edit={edit} onCopy={onCopy} onChange={(url) => onChange(rows.map((x, j) => (j === i ? { ...x, desktopUrl: url } : x)))} /></TableCell>
            <TableCell><MediaCell url={r.mobileUrl} edit={edit} onCopy={onCopy} onChange={(url) => onChange(rows.map((x, j) => (j === i ? { ...x, mobileUrl: url } : x)))} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** A reward card: ×{quantity} badge, image, {coins} × ${cashValue} caption. In Edit it's a button that
 *  opens the Reward Item dialog. */
function RewardCard({ item, edit, onOpen }: { item: RewardItem; edit: boolean; onOpen: () => void }) {
  return (
    <Box
      role={edit ? 'button' : undefined}
      tabIndex={edit ? 0 : undefined}
      onClick={edit ? onOpen : undefined}
      onKeyDown={edit ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } } : undefined}
      sx={{
        position: 'relative',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        p: 1.5,
        bgcolor: 'action.hover',
        cursor: edit ? 'pointer' : 'default',
        transition: 'border-color var(--beam-motion-move)',
        ...(edit && { '&:hover, &:focus-visible': { borderColor: 'primary.main' } }),
      }}
    >
      <Box component="span" sx={{ ...meta, position: 'absolute', top: 8, left: 10 }}>×{item.quantity}</Box>
      <Box
        component="img"
        src={item.imgUrl}
        alt=""
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
        sx={{ display: 'block', width: '100%', height: 96, objectFit: 'contain', mt: 1 }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
        {item.coins} × ${item.cashValue}
      </Typography>
    </Box>
  );
}

/** Media cell: 34×34 thumb + Copy URL (view) ⇄ URL field (edit). Row height = fieldGeometrySx (44px) so
 *  view↔edit doesn't jump. Placeholder assets 404 → onError hides the img. */
function MediaCell({ url, edit, onCopy, onChange }: { url: string; edit: boolean; onCopy: (url: string) => void; onChange: (url: string) => void }) {
  return (
    <Box sx={{ ...fieldGeometrySx, gap: 1 }}>
      <Thumb url={url} />
      {edit ? (
        <BeamField aria-label="URL" value={url} onChange={(e) => onChange(e.target.value)} fullWidth />
      ) : url ? (
        <Button size="small" variant="text" startIcon={<ContentCopyIcon fontSize="small" />} onClick={() => onCopy(url)} sx={{ flexShrink: 0 }}>Copy URL</Button>
      ) : (
        <Box component="span" sx={{ color: 'text.disabled' }}>—</Box>
      )}
    </Box>
  );
}

function Thumb({ url }: { url: string }) {
  return (
    <Box
      component="img"
      src={url}
      alt=""
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
      sx={{ width: MEDIA, height: MEDIA, flexShrink: 0, objectFit: 'contain', borderRadius: 1, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}
    />
  );
}
