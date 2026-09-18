import { useEffect, useMemo, useRef, useState } from 'react';
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
  Collapse,
  BeamPage,
  BeamEmptyState,
  DetailsPanel,
  BeamStat,
  BeamField,
  Section,
  ActionMenu,
  meta,
} from '@betty/beam';
import type { BeamRowAction } from '@betty/beam';
import EditIcon from '@mui/icons-material/EditRounded';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import UploadIcon from '@mui/icons-material/UploadFileOutlined';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { backTo } from './backTo';
import { RouterIdentityLink } from './RouterIdentityLink';
import {
  getJackpot,
  createDraftJackpot,
  updateJackpot,
  submitJackpot,
  deleteJackpot,
  deleteMilestone,
  fmtDateTimeET,
  toLocalInput,
  fromLocalInput,
  type CommunityJackpot,
  type Milestone,
} from './communityJackpots';

/**
 * CommunityJackpotDetailPage — /community-jackpots/:id (view), /:id/edit, /new (add). Composition:
 * designs/CJ-{view,edit,add}.png. Mode mechanics per detail-page grammar (constant geometry, field
 * twins, header action swap); the jackpot header is a DetailsPanel (Name / Start / End twins), the
 * Milestones child list is a surfaceless Section holding an embedded MuiTable (no Paper-in-Paper).
 *
 * DRAFT model (task): entering /new creates a real draft record (id assigned) and redirects to
 * /:id/edit so "Add Milestone" can navigate to the milestone Add page against a live parent. Cancel on
 * a draft discards the whole record; Submit for Approval flips status (stub) + toast. Edit-mode scalar
 * fields are held in a local draft and FLUSHED to the store before any navigation that leaves the page
 * (Add Milestone / Submit), so nothing is lost across the child-create hop.
 *
 * Deviations from the PNGs (flagged): (1) the row kebab is the SINGLE Edit/Delete affordance — the edit
 * PNG's extra EDIT/DELETE text links under the expanded sub-table are dropped as redundant (task: "row
 * kebab: Edit, Delete only"). (2) Dates render in the ET form (dd-MMM-yyyy hh:mm:ss ET), not the view
 * PNG's dd-MM-yyyy two-line form — for twin + list consistency (see communityJackpots.fmtDateTimeET).
 */

const BASE = '/community-jackpots';

type Notice = { severity: 'success' | 'info' | 'warning'; msg: string } | null;

interface ScalarDraft {
  name: string;
  startDate: string;
  endDate: string;
}
const makeDraft = (j: CommunityJackpot): ScalarDraft => ({ name: j.name, startDate: j.startDate, endDate: j.endDate });

export function CommunityJackpotDetailPage({ mode }: { mode: 'view' | 'edit' | 'add' }) {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  // ADD: create the draft record once, then redirect to its edit route (so the URL carries a real
  // parent id for Add Milestone). StrictMode double-invokes effects; the ref guards a single create.
  const created = useRef(false);
  useEffect(() => {
    if (mode !== 'add' || created.current) return;
    created.current = true;
    const newId = createDraftJackpot();
    navigate(`${BASE}/${newId}/edit`, { replace: true });
  }, [mode, navigate]);

  const isEdit = mode === 'edit';
  const jackpot = mode === 'add' ? undefined : getJackpot(id);

  const [draft, setDraft] = useState<ScalarDraft | null>(() => (isEdit && jackpot ? makeDraft(jackpot) : null));
  const [notice, setNotice] = useState<Notice>(null);
  const [, forceRender] = useState(0); // bump after on-page store mutations (milestone delete)
  const onChanged = () => forceRender((n) => n + 1);

  if (mode === 'add') return null; // redirecting

  if (!jackpot) {
    return (
      <Stack spacing={3}>
        <BeamPage title={`Community Jackpot ${id}`} back={backTo(navigate, BASE, 'Community Jackpots')} />
        <BeamEmptyState title={`No community jackpot with id ${id}`} description="It may have been removed." />
      </Stack>
    );
  }

  const isDraftSession = jackpot.status === 'draft'; // an unsubmitted Add session
  const d = draft;
  const patch = (p: Partial<ScalarDraft>) => setDraft((prev) => (prev ? { ...prev, ...p } : prev));
  const flush = () => {
    if (d) updateJackpot(jackpot.id, d);
  };

  const cancel = () => {
    if (isDraftSession) {
      deleteJackpot(jackpot.id); // discard the whole draft record (task: Cancel discards the draft)
      navigate(BASE);
    } else {
      navigate(`${BASE}/${jackpot.id}`);
    }
  };
  const submit = () => {
    flush();
    submitJackpot(jackpot.id);
    setNotice({
      severity: 'info',
      msg: 'Submit for Approval — stub. No pipeline yet; nothing was applied. (Follow-up: create a change request in Pending Approvals.)',
    });
    navigate(`${BASE}/${jackpot.id}`);
  };
  const addMilestone = () => {
    flush(); // persist scalar edits before leaving for the child-create page
    navigate(`${BASE}/${jackpot.id}/milestones/new`);
  };

  const title = isEdit && d ? d.name : jackpot.name;

  return (
    <Stack spacing={3}>
      <BeamPage
        title={title}
        back={backTo(navigate, BASE, 'Community Jackpots')}
        action={
          isEdit ? (
            <Button variant="contained" onClick={submit}>Submit for Approval</Button>
          ) : (
            <Button variant="contained" startIcon={<EditIcon />} onClick={() => navigate(`${BASE}/${jackpot.id}/edit`)}>Edit</Button>
          )
        }
        secondaryActions={
          isEdit ? (
            <Button variant="text" onClick={cancel}>Cancel</Button>
          ) : (
            <>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<DeleteIcon />}
                onClick={() => setNotice({ severity: 'warning', msg: `Delete "${jackpot.name}" — stub. No delete pipeline yet; nothing was removed.` })}
              >
                Delete
              </Button>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => setNotice({ severity: 'info', msg: `Upload Theme for "${jackpot.name}" — stub. Theme upload isn't wired yet.` })}
              >
                Upload Theme
              </Button>
            </>
          )
        }
      />

      {notice && (
        <Alert severity={notice.severity} onClose={() => setNotice(null)}>
          {notice.msg}
        </Alert>
      )}

      {/* Header card — view twins ⇄ edit fields (DetailsPanel derives its editability border from the fields). */}
      <DetailsPanel aria-label="Community jackpot details">
        {isEdit && d ? (
          <>
            <BeamField label="Name" value={d.name} onChange={(e) => patch({ name: e.target.value })} />
            <BeamField label="Start Date" type="datetime-local" value={toLocalInput(d.startDate)} onChange={(e) => patch({ startDate: fromLocalInput(e.target.value) })} slotProps={{ inputLabel: { shrink: true } }} />
            <BeamField label="End Date" type="datetime-local" value={toLocalInput(d.endDate)} onChange={(e) => patch({ endDate: fromLocalInput(e.target.value) })} slotProps={{ inputLabel: { shrink: true } }} />
          </>
        ) : (
          <>
            <BeamStat label="Name" value={jackpot.name} />
            <BeamStat label="Start Date" value={fmtDateTimeET(jackpot.startDate)} />
            <BeamStat label="End Date" value={fmtDateTimeET(jackpot.endDate)} />
          </>
        )}
      </DetailsPanel>

      {/* Milestones — a surfaceless child list (Section bleed). isEdit="auto": the section holds no field
          twins (milestone fields live on the milestone page), so it stays borderless even in edit. */}
      <Section isEdit="auto" title="Milestones" bleed>
        {isEdit && (
          <Box sx={{ px: 2, pb: 0.5 }}>
            <Button variant="text" size="small" startIcon={<AddIcon />} onClick={addMilestone}>Add Milestone</Button>
          </Box>
        )}
        {jackpot.milestones.length === 0 ? (
          <Box sx={{ px: 2, pb: 2 }}>
            <Typography variant="body2" color="text.secondary">No milestones.</Typography>
          </Box>
        ) : (
          <Table size="small" aria-label="Milestones">
            <TableHead>
              <TableRow>
                <TableCell aria-hidden sx={{ width: 44 }} />
                <TableCell sx={{ ...meta }}>ID</TableCell>
                <TableCell sx={{ ...meta }}>Name</TableCell>
                <TableCell sx={{ ...meta }}>Reward Type</TableCell>
                <TableCell sx={{ ...meta }}>Reward Strategy</TableCell>
                <TableCell align="right" sx={{ ...meta }}>Threshold</TableCell>
                <TableCell align="right" sx={{ ...meta }}>Jackpot Amount</TableCell>
                <TableCell aria-hidden sx={{ width: 44 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {jackpot.milestones.map((m) => (
                <MilestoneRow
                  key={m.id}
                  jackpotId={jackpot.id}
                  milestone={m}
                  onEdit={() => navigate(`${BASE}/${jackpot.id}/milestones/${m.id}/edit`)}
                  onDelete={() => {
                    deleteMilestone(jackpot.id, m.id);
                    onChanged();
                  }}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </Section>
    </Stack>
  );
}

/** One milestone row: identity link + scalar cells, an expand caret revealing the read-only Rewards
 *  Strategy sub-table, and the Edit/Delete kebab (the single row-action affordance). */
function MilestoneRow({
  jackpotId,
  milestone,
  onEdit,
  onDelete,
}: {
  jackpotId: string;
  milestone: Milestone;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const href = `${import.meta.env.BASE_URL}${BASE.replace(/^\//, '')}/${jackpotId}/milestones/${milestone.id}`;
  const actions: BeamRowAction[] = useMemo(
    () => [
      { id: 'edit', label: 'Edit', icon: <EditIcon fontSize="small" />, onSelect: onEdit },
      { id: 'delete', label: 'Delete', icon: <DeleteIcon fontSize="small" />, destructive: true, onSelect: onDelete },
    ],
    [onEdit, onDelete],
  );

  return (
    <>
      <TableRow hover>
        <TableCell sx={{ px: 0.5 }}>
          <IconButton size="small" aria-label={open ? 'Collapse' : 'Expand'} onClick={() => setOpen((o) => !o)}>
            {open ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
          </IconButton>
        </TableCell>
        <TableCell>{milestone.id}</TableCell>
        <TableCell component="th" scope="row">
          <RouterIdentityLink href={href}>{milestone.name}</RouterIdentityLink>
        </TableCell>
        <TableCell>{milestone.rewardType}</TableCell>
        <TableCell>{milestone.rewardStrategy}</TableCell>
        <TableCell align="right">{milestone.threshold.toLocaleString()}</TableCell>
        <TableCell align="right">{milestone.jackpotAmount.toLocaleString()}</TableCell>
        <TableCell align="right" sx={{ px: 0.5 }}>
          <MilestoneKebab actions={actions} />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell sx={{ p: 0, border: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="overline" color="text.secondary">Rewards Strategy</Typography>
              <RewardsStrategyTable rows={milestone.rewardsStrategy} />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

function MilestoneKebab({ actions }: { actions: BeamRowAction[] }) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  return (
    <>
      <IconButton size="small" aria-label="Milestone actions" onClick={(e) => setAnchorEl(e.currentTarget)}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <ActionMenu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} items={actions} />
    </>
  );
}

/** The read-only "Rewards Strategy" list — shared by the jackpot-page milestone expansion and (as a
 *  Section) the milestone view page. One name across twins: "Rewards Strategy" (Figma's
 *  "Rewards Strategy Configuration" drift is unified per the twin-discipline ruling). */
export function RewardsStrategyTable({ rows }: { rows: Milestone['rewardsStrategy'] }) {
  if (rows.length === 0) {
    return <Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>No reward strategies.</Typography>;
  }
  return (
    <Table size="small" aria-label="Rewards strategy">
      <TableHead>
        <TableRow>
          <TableCell sx={{ ...meta }}>Reward Type</TableCell>
          <TableCell align="right" sx={{ ...meta }}># of Rewards</TableCell>
          <TableCell align="right" sx={{ ...meta }}>Qualification Amount</TableCell>
          <TableCell align="right" sx={{ ...meta }}>Reward Amount</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={i} hover>
            <TableCell>{r.rewardType}</TableCell>
            <TableCell align="right">{r.numRewards.toLocaleString()}</TableCell>
            <TableCell align="right">{r.qualificationAmount.toLocaleString()}</TableCell>
            <TableCell align="right">{r.rewardAmount.toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
