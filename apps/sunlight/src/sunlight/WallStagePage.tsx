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
  addWallStage,
  stageLabel,
  REWARD_TYPES,
  type WallStage,
  type OpeningWindow,
  type QuickRule,
  type RewardItem,
  type RewardTier,
} from './tokenCampaigns';

/**
 * WallStagePage — /prize-wall/token-campaigns/:id/stages/:sid (view↔edit) AND …/stages/new (create,
 * `create` prop). The final drill level of PrizeWall (Token Campaigns → Campaign → Wall Stage → Reward
 * Item dialog). Inherits the Campaign detail edit pattern one level down (mode/draft, Cancel discards,
 * Submit is the same STUB — no CR wiring). Composition + fields are a FAITHFUL PORT of the Figma frames
 * (designs/WallStage-{View,Edit,Add}.png, RewardItem-{Edit,Add}.png). See
 * SPEC-sunlight-prizewall-wall-stage.md.
 *
 * CREATE (`create`): a create route is an EDIT SESSION WITH NO VIEW (drill-down-grammar; Wall Stage is
 * its second consumer). Lands straight in edit with an empty stage draft — one empty opening window, 3
 * empty Quick / Info rule rows, the 2 fixed Image rows, and a 12-slot reward grid of "+ ADD" tiles. A
 * Wall Stage is an ADD, not a NEW (creation grammar): it rolls up into the campaign's CR, so the primary
 * CTA is "ADD WALL STAGE" — it COMMITS the stage straight into the campaign's wallStages (in-memory),
 * NOT a Submit-for-Approval stub (that governs campaign CREATE, a NEW). Cancel → campaign; Delete absent.
 *
 * INTENT DELTA (handoff convention): the WallStage frames' headers still show DELETE/EDIT — that's
 * un-redrawn view chrome; per the spec we inherit the campaign edit-session semantics, so the header
 * swaps to [Cancel · Submit for Approval] in edit and [Cancel · Submit] in create. Recorded.
 */

const BASE = '/prize-wall/token-campaigns';
const MEDIA = 34; // fixed media-in-cell container (px), object-fit contain — established ruling
const REWARD_TIERS: RewardTier[] = ['none', 'low', 'medium', 'high'];
const REWARD_SLOTS = 12; // fixed reward grid (WallStage-Add frame + mock: 12/stage). Filled = card,
//                          empty = "+ ADD" (in-session) / inert (view). No 13th — hard cap (Deyan).
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

// Create draft — empty stage. One empty opening window + 3 empty Quick / 3 empty Info rows per the
// Add frame (mock counts). Numeric fields seed 0 (a blank-vs-0 empty-number treatment is deferred —
// the same open item across the create screens). Image rows are the 2 fixed structural slots.
const emptyRule = (id: string) => ({ id, name: '', desktopUrl: '', mobileUrl: '' });
const makeEmptyStage = (campaignId: string, order: number): Draft => {
  const draftId = `${campaignId}-draft-s${order}`;
  return {
    id: draftId,
    name: '',
    order,
    enabled: false,
    startDate: '',
    finalOpenDate: '',
    openingWindows: [{ id: `${draftId}-w1`, openDate: '', endDate: '', durationMin: 0 }],
    headerImageDesktop: '',
    headerImageMobile: '',
    backgroundImageDesktop: '',
    backgroundImageMobile: '',
    winProbabilityPct: 0,
    lossProbabilityPct: 0,
    costOfPlay: 0,
    rewardItems: [],
    quickRules: [emptyRule(`${draftId}-qr1`), emptyRule(`${draftId}-qr2`), emptyRule(`${draftId}-qr3`)],
    infoPageTitle: '',
    infoRules: [emptyRule(`${draftId}-ir1`), emptyRule(`${draftId}-ir2`), emptyRule(`${draftId}-ir3`)],
  };
};

// A blank reward for the dialog's ADD flavor. Appended to the stage draft on "Add".
const makeEmptyReward = (stageId: string, order: number): RewardItem => ({
  id: `${stageId}-r-new-${Date.now()}`,
  name: '',
  description: '',
  type: REWARD_TYPES[0],
  cashValue: 0,
  quantity: 0,
  coins: 0,
  tier: 'none',
  imgUrl: '',
  quality: '',
  rewardAmount: 0,
  order,
});

type Notice = { severity: 'success' | 'info' | 'warning' | 'error'; msg: string } | null;

export function WallStagePage({ create = false }: { create?: boolean } = {}) {
  const { id = '', sid = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const campaign = getTokenCampaign(id);
  const stage = create ? undefined : getWallStage(id, sid);
  const navState = location.state as { edit?: boolean } | null;

  const [mode, setMode] = useState<'view' | 'edit'>(create || (navState?.edit && stage) ? 'edit' : 'view');
  const [draft, setDraft] = useState<Draft | null>(() =>
    create ? makeEmptyStage(id, (campaign?.wallStages.length ?? 0) + 1) : navState?.edit && stage ? makeDraft(stage) : null,
  );
  const [notice, setNotice] = useState<Notice>(null);
  const [snack, setSnack] = useState<string | null>(null);
  const [rewardDraft, setRewardDraft] = useState<RewardItem | null>(null); // Reward Item dialog
  const [rewardIsNew, setRewardIsNew] = useState(false); // ADD flavor vs edit an existing card

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
    // In create there is no view to return to → back to the campaign (leave the session).
    if (create) {
      navigate(`${BASE}/${id}`);
      return;
    }
    setDraft(null);
    setMode('view');
  };
  const submitForApproval = () => {
    // EDIT stub — applies nothing (save-model inversion), returns to view. (FLAGGED: under the NEW/ADD
    // grammar a stage edit rolls up into the campaign, so this CTA should become Save-to-campaign — a
    // separate ruling; not changed here.)
    setDraft(null);
    setMode('view');
    setNotice({ severity: 'info', msg: 'Submit for Approval — stub. No pipeline yet; nothing was applied. (Future: creates a change request in Pending Approvals.)' });
  };
  // CREATE = ADD (creation grammar): commit the stage straight into the campaign (no CR of its own —
  // the campaign's approval covers it), then land back on the campaign so the add is visible in its
  // Wall Stages list (see below for the landing argument).
  const addWallStageAndReturn = () => {
    if (!campaign || !d) return;
    addWallStage(campaign.id, d);
    navigate(`${BASE}/${id}`);
  };
  const patch = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));

  if (!campaign || (!stage && !create)) {
    return (
      <Stack spacing={3}>
        <BeamPageHeader title={`Stage ${sid}`} back={backTo(navigate, `${BASE}/${id}`, campaign?.name ?? 'Campaign')} />
        <BeamEmptyState title="Wall stage not found" description="It may have been removed." />
      </Stack>
    );
  }

  const isEdit = create || (mode === 'edit' && draft !== null);
  const d = draft;
  // stage is defined whenever !create (guard above); create never reaches a `st`/view branch.
  const st = stage as WallStage;
  const s: WallStage = isEdit && d ? d : st;

  // Reward dialog ------------------------------------------------------------------------------------
  const openReward = (item: RewardItem) => { setRewardIsNew(false); setRewardDraft({ ...item }); };
  const openAddReward = () => { setRewardIsNew(true); setRewardDraft(makeEmptyReward(s.id, (d?.rewardItems.length ?? 0) + 1)); };
  const closeReward = () => { setRewardDraft(null); setRewardIsNew(false); };
  const saveReward = () => {
    if (!rewardDraft || !d) return;
    // ADD → append the new item to the stage draft; EDIT → replace by id. (Tile → card either way.)
    patch({ rewardItems: rewardIsNew ? [...d.rewardItems, rewardDraft] : d.rewardItems.map((r) => (r.id === rewardDraft.id ? rewardDraft : r)) });
    closeReward();
  };
  const rp = (p: Partial<RewardItem>) => setRewardDraft((r) => (r ? { ...r, ...p } : r));

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        // Create has no stage yet → a create title. (The Add frame's "Wall Stage 1" + Delete/Edit
        // chrome is View/Edit-frame residue — NOT copied.)
        title={create ? 'Create Wall Stage' : stageLabel(st)}
        back={backTo(navigate, `${BASE}/${id}`, campaign.name)}
        // Subline = the campaign's date range (per the frame).
        subtitle={`${fmtDateTimeET(campaign.startDate)} ↔ ${fmtDateTimeET(campaign.endDate)}`}
        // INTENT DELTA: inherit the campaign edit header — [Delete · Edit] ⇄ [Cancel · Submit for Approval].
        // CREATE is an ADD: [Cancel · ADD WALL STAGE], no Delete (create-mode ruling), no Submit — the
        // add commits into the campaign (creation grammar).
        action={
          create ? (
            <Button variant="contained" onClick={addWallStageAndReturn}>Add Wall Stage</Button>
          ) : isEdit ? (
            <Button variant="contained" onClick={submitForApproval}>Submit for Approval</Button>
          ) : (
            <Button variant="contained" startIcon={<EditIcon />} onClick={enterEdit}>Edit</Button>
          )
        }
        secondaryActions={
          isEdit ? (
            <Button variant="text" onClick={cancelEdit}>Cancel</Button>
          ) : (
            <Button variant="outlined" color="inherit" startIcon={<DeleteIcon />} onClick={() => setNotice({ severity: 'warning', msg: `Delete "${stageLabel(st)}" — stub. No delete pipeline yet. Nothing was removed.` })}>
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
            <BeamStat label="Win probability" value={`${st.winProbabilityPct}%`} />
            <BeamStat label="Loss probability" value={`${st.lossProbabilityPct}%`} />
            <BeamStat label="Cost of play" value={String(st.costOfPlay)} />
            <BeamStat label="Enabled" value={<BeamBool value={st.enabled} />} />
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
                {(isEdit && d ? d.openingWindows : st.openingWindows).map((w, i) => (
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
                  {/* ADD, not New — an opening window is a child of the stage (creation grammar). */}
                  Add opening window
                </Button>
              </Box>
            )}
          </BeamPaper>

          {/* Reward items — a FIXED 12-slot grid (frame + mock). Filled slot = card (opens the dialog in
              both modes). Empty slot: in-session = "+ ADD" tile (opens the dialog's ADD flavor); in view
              = inert placeholder (no add outside a session — the leaf inherits the parent's mode). */}
          <BeamPaper title="Reward items">
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              {Array.from({ length: REWARD_SLOTS }, (_, i) => {
                const items = isEdit && d ? d.rewardItems : st.rewardItems;
                const item = items[i];
                if (item) return <RewardCard key={item.id} item={item} onOpen={() => openReward(item)} />;
                return isEdit ? <AddRewardTile key={`add-${i}`} onAdd={openAddReward} /> : <EmptyRewardTile key={`empty-${i}`} />;
              })}
            </Box>
          </BeamPaper>
        </Stack>

        {/* RIGHT column */}
        <Stack spacing={3} sx={{ flex: 1, minWidth: 0, width: '100%' }}>
          {/* Quick Rules */}
          <BeamPaper title="Quick Rules" bleed>
            <RulesTable
              rows={isEdit && d ? d.quickRules : st.quickRules}
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
                <BeamStat label="Info page title" value={st.infoPageTitle} />
              )}
            </Box>
            <RulesTable
              rows={isEdit && d ? d.infoRules : st.infoRules}
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

      {/* Reward Item dialog — the estate's FIRST sanctioned dialog, THREE flavors (view / edit / add).
          Edit: a leaf sub-record edited inside the parent (wall stage) edit session. Add: a "+ ADD" tile
          opens the same surface with empty fields → appends to the stage draft. View: the SAME surface
          read-only (View-first extended to the leaf — inspectable without entering a session). */}
      <Dialog open={rewardDraft !== null} onClose={closeReward} maxWidth="sm" fullWidth>
        <DialogTitle>{rewardIsNew ? 'Add Reward Item' : isEdit ? 'Edit Reward Item' : 'Reward Item'}</DialogTitle>
        <DialogContent>
          {rewardDraft && (
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, pt: 1 }}>
              {isEdit ? (
                <>
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
                </>
              ) : (
                // Read-only view reps — mirror the page's own view-twins (BeamStat), no editable inputs.
                <>
                  <Box sx={{ gridColumn: '1 / -1' }}><BeamStat label="Name" value={rewardDraft.name} /></Box>
                  <Box sx={{ gridColumn: '1 / -1' }}><BeamStat label="Description" value={rewardDraft.description} /></Box>
                  <BeamStat label="Type" value={rewardDraft.type} />
                  <BeamStat label="Cash value" value={String(rewardDraft.cashValue)} />
                  <BeamStat label="Tier" value={cap(rewardDraft.tier)} />
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', minWidth: 0 }}>
                    <Thumb url={rewardDraft.imgUrl} />
                    <BeamStat label="Image URL" value={rewardDraft.imgUrl} />
                  </Box>
                  <BeamStat label="Quantity" value={String(rewardDraft.quantity)} />
                  <BeamStat label="Reward amount" value={String(rewardDraft.rewardAmount)} />
                  <BeamStat label="Order" value={String(rewardDraft.order)} />
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {isEdit ? (
            <>
              <Button variant="text" onClick={closeReward}>Cancel</Button>
              <Button variant="contained" onClick={saveReward}>{rewardIsNew ? 'Add' : 'Save'}</Button>
            </>
          ) : (
            <Button variant="text" onClick={closeReward}>Close</Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar open={snack !== null} autoHideDuration={2000} onClose={() => setSnack(null)} message={snack ?? ''} />
    </Stack>
  );
}

/** A quick-rule / info-rule table: NAME · DESKTOP · MOBILE. Name is a static label in view and an
 *  EDITABLE field in-session (the Add frame shows editable rule names — seeded rows must be nameable;
 *  this also makes existing-stage edit rule-names editable, a consistency change flowing from the frame).
 *  Media cells copy (view) or become URL fields (edit). */
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
            <TableCell>
              {edit ? (
                <Box sx={{ ...fieldGeometrySx }}>
                  <BeamField aria-label="Name" value={r.name} onChange={(e) => onChange(rows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} fullWidth />
                </Box>
              ) : (
                r.name
              )}
            </TableCell>
            <TableCell><MediaCell url={r.desktopUrl} edit={edit} onCopy={onCopy} onChange={(url) => onChange(rows.map((x, j) => (j === i ? { ...x, desktopUrl: url } : x)))} /></TableCell>
            <TableCell><MediaCell url={r.mobileUrl} edit={edit} onCopy={onCopy} onChange={(url) => onChange(rows.map((x, j) => (j === i ? { ...x, mobileUrl: url } : x)))} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Empty reward slot in a SESSION → a "+ ADD" tile (opens the dialog's Add flavor). Same footprint as a
 *  RewardCard so the 12-slot grid stays uniform. Keyboard: Enter/Space adds. */
function AddRewardTile({ onAdd }: { onAdd: () => void }) {
  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label="Add reward item"
      onClick={onAdd}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAdd(); } }}
      sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5,
        minHeight: 152, border: '1px dashed', borderColor: 'divider', borderRadius: 1,
        color: 'primary.main', cursor: 'pointer',
        transition: 'border-color var(--beam-motion-move), background-color var(--beam-motion-move)',
        '&:hover, &:focus-visible': { borderColor: 'primary.main', bgcolor: 'action.hover' },
      }}
    >
      <AddIcon fontSize="small" />
      <Typography variant="button">Add</Typography>
    </Box>
  );
}

/** Empty reward slot in VIEW → inert placeholder (no add affordance outside a session — the leaf
 *  inherits the parent's mode). Holds the 12-slot grid shape without inviting interaction. */
function EmptyRewardTile() {
  return <Box aria-hidden sx={{ minHeight: 152, border: '1px solid', borderColor: 'divider', borderRadius: 1, opacity: 0.4 }} />;
}

/** A reward card: ×{quantity} badge, image, {coins} × ${cashValue} caption. Clickable in BOTH modes —
 *  opens the Reward Item dialog (read-only in View, editable in Edit). Keyboard: Enter/Space opens. */
function RewardCard({ item, onOpen }: { item: RewardItem; onOpen: () => void }) {
  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label={`Reward item ${item.name}`}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
      sx={{
        position: 'relative',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        p: 1.5,
        bgcolor: 'action.hover',
        cursor: 'pointer',
        transition: 'border-color var(--beam-motion-move)',
        '&:hover, &:focus-visible': { borderColor: 'primary.main' },
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
