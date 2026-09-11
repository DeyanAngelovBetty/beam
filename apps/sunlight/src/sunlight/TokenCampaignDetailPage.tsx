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
  BeamPageHeader,
  BeamEmptyState,
  DetailsPanel,
  BeamStat,
  BeamBool,
  BeamField,
  BeamSwitchField,
  BeamPaper,
  BeamChildList,
  fieldGeometrySx,
  meta,
} from '@betty/beam';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import EmojiEventsIcon from '@mui/icons-material/EmojiEventsOutlined';
import EditIcon from '@mui/icons-material/EditRounded';
import PlayArrowIcon from '@mui/icons-material/PlayArrowRounded';
import ContentCopyIcon from '@mui/icons-material/ContentCopyRounded';
import AddIcon from '@mui/icons-material/Add';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { backTo } from './backTo';
import { RouterIdentityLink } from './RouterIdentityLink';
import {
  getTokenCampaign,
  stageLabel,
  PROMO_IMAGE_SLOTS,
  SOUND_SLOTS,
  PROMO_IMAGE_SLOT_LABEL,
  SOUND_SLOT_LABEL,
  type TokenCampaign,
  type PromoImage,
  type CampaignSound,
  type WallStage,
} from './tokenCampaigns';

/**
 * TokenCampaignDetailPage — /prize-wall/token-campaigns/:id (view↔edit) AND /new (create, `create`
 * prop). Mode mechanics per detail-page grammar (header action swap, constant geometry, field twins,
 * editability border); composition + geometry follow designs/TokenCampaign-{View,Edit,Add}.png
 * (+ designs/SPEC.md).
 *
 * DRAFT SEMANTICS: edits are held in a local draft. Submit for Approval is a STUB that applies
 * NOTHING and discards the draft — consistent with the save-model inversion (save creates a CR, never
 * applies). Cancel also discards. (SPEC.md: the stub's future shape is "create the campaign CR,
 * visible in Pending Approvals" — never an apply.)
 *
 * CREATE (`create`): a create route is an EDIT SESSION WITH NO VIEW (drill-down-grammar) — it lands
 * straight in edit with an empty draft (named slots pre-seeded empty so the tables render). Submit is
 * the SAME stub (CR-inversion — it does NOT push the campaign into the in-memory list; the notice is
 * the honest demo of the model). Wall Stages is LOCKED — you can't author a child before the parent
 * exists (sessions never nest).
 */

const BASE = '/prize-wall/token-campaigns';
const MEDIA = 34; // fixed media-in-cell container (px), object-fit: contain (SPEC.md ruling)

// Figma-authoritative subtitle/twin format: dd-MMM-yyyy hh:mm:ss AM/PM ET (both modes). The exact
// picker/format inside the edit datetime field is deferred (Figma-authoritative).
const fmtDateTimeET = (iso: string) => {
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
    .formatToParts(new Date(iso))
    .reduce<Record<string, string>>((a, part) => ((a[part.type] = part.value), a), {});
  return `${p.day}-${p.month}-${p.year} ${p.hour}:${p.minute}:${p.second} ${p.dayPeriod} ET`;
};

// datetime-local twin round-trip (timezone-naive demo — real ET picker deferred).
const toLocalInput = (iso: string) => iso.slice(0, 16); // YYYY-MM-DDTHH:mm
const fromLocalInput = (v: string) => (v ? `${v}:00.000Z` : '');

type Notice = { severity: 'success' | 'info' | 'warning' | 'error'; msg: string } | null;

// The editable slice of a campaign, deep-copied on entering edit.
interface Draft {
  name: string;
  startDate: string;
  endDate: string;
  enabled: boolean;
  tAndC: string;
  promotionalImages: PromoImage[];
  sounds: CampaignSound[];
}
const makeDraft = (c: TokenCampaign): Draft => ({
  name: c.name,
  startDate: c.startDate,
  endDate: c.endDate,
  enabled: c.enabled,
  tAndC: c.tAndC,
  promotionalImages: c.promotionalImages.map((im) => ({ ...im })),
  sounds: c.sounds.map((sn) => ({ ...sn })),
});

// Create draft — empty fields, ALL named slots pre-seeded with empty URLs so the Promotional Images /
// Sounds tables render every row (per the Add frame). Enabled defaults FALSE (the frame's Active
// toggle is off; matches the estate's "new records are Disabled" convention).
const makeEmptyDraft = (): Draft => ({
  name: '',
  startDate: '',
  endDate: '',
  enabled: false,
  tAndC: '',
  promotionalImages: PROMO_IMAGE_SLOTS.map((slot) => ({ slot, desktopUrl: '', mobileUrl: '' })),
  sounds: SOUND_SLOTS.map((slot) => ({ slot, url: '' })),
});

// A minimal draft-only wall stage appended by "+ ADD WALL STAGE". Named "Wall Stage {n}" (frame
// naming); NON-navigable until the campaign is saved (it has no page yet, and submit is a stub that
// discards). Full stage authoring is the Wall Stage route-level create session — out of this fence.
const makeDraftStage = (campaignId: string, n: number, startDate: string, endDate: string): WallStage => ({
  id: `${campaignId}-draft-s${n}`,
  name: `Wall Stage ${n}`,
  order: n,
  enabled: true,
  startDate,
  finalOpenDate: endDate,
  openingWindows: [],
  headerImageDesktop: '',
  headerImageMobile: '',
  backgroundImageDesktop: '',
  backgroundImageMobile: '',
  winProbabilityPct: 0,
  lossProbabilityPct: 0,
  costOfPlay: 0,
  rewardItems: [],
  quickRules: [],
  infoPageTitle: '',
  infoRules: [],
});

// Wall-stage vital-sign columns — shared by the view BeamChildList and the edit page-local table.
// START / FINAL OPEN are full ET datetime per the Edit frame (faithful-port pass; frame wins on
// formatting). Header for the identity column is "Name" (frame), set where these are consumed.
const stageColumns = [
  { key: 'enabled', header: 'Enabled', align: 'center' as const, width: 100, render: (s: WallStage) => <BeamBool value={s.enabled} /> },
  { key: 'windows', header: 'Additional Windows', align: 'right' as const, width: 160, render: (s: WallStage) => s.openingWindows.length },
  { key: 'start', header: 'Start', align: 'right' as const, width: 190, render: (s: WallStage) => fmtDateTimeET(s.startDate) },
  { key: 'finalOpen', header: 'Final Open', align: 'right' as const, width: 190, render: (s: WallStage) => fmtDateTimeET(s.finalOpenDate) },
];

export function TokenCampaignDetailPage({ create = false }: { create?: boolean } = {}) {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const campaign = create ? undefined : getTokenCampaign(id);
  const navState = location.state as { edit?: boolean } | null;

  const [mode, setMode] = useState<'view' | 'edit'>(create || (navState?.edit && campaign) ? 'edit' : 'view');
  const [draft, setDraft] = useState<Draft | null>(() =>
    create ? makeEmptyDraft() : navState?.edit && campaign ? makeDraft(campaign) : null,
  );
  // Draft-only wall stages appended in edit mode (page-local; not part of the CR-payload Draft, and
  // discarded on cancel/submit like everything else). Empty in view + create.
  const [addedStages, setAddedStages] = useState<WallStage[]>([]);
  const [notice, setNotice] = useState<Notice>(null);
  const [copied, setCopied] = useState(false);
  const copyUrl = (url: string) => {
    void navigator.clipboard?.writeText(url);
    setCopied(true);
  };

  const enterEdit = () => {
    if (!campaign) return;
    setNotice(null);
    setDraft(makeDraft(campaign));
    setAddedStages([]);
    setMode('edit');
  };
  const cancelEdit = () => {
    // No-confirm discard (matches the Loyalty Levels ruling; the discard-guard question is a shared
    // open item — see SPEC.md / doctrine). In create there is no view to return to → back to the list.
    setDraft(create ? makeEmptyDraft() : null);
    setAddedStages([]);
    if (create) navigate(BASE);
    else setMode('view');
  };
  const submitForApproval = () => {
    // STUB — applies nothing (save-model inversion). Future: create the campaign CR. Create is
    // identical: NO in-memory push (CR-inversion fidelity over demo continuity) — the notice IS the
    // honest demo of the model. We stay on-page and surface the notice (same as edit); create keeps its
    // draft so the notice survives (a navigate here would unmount it), and the user leaves via Cancel.
    setAddedStages([]);
    if (!create) {
      setDraft(null);
      setMode('view');
    }
    setNotice({ severity: 'info', msg: 'Submit for Approval — stub. No pipeline yet; nothing was applied. (Future: creates a campaign change request in Pending Approvals.)' });
  };
  const patch = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const addStage = () => {
    if (!campaign) return;
    const start = draft?.startDate || campaign.startDate;
    const end = draft?.endDate || campaign.endDate;
    setAddedStages((prev) => [...prev, makeDraftStage(campaign.id, campaign.wallStages.length + prev.length + 1, start, end)]);
  };

  if (!campaign && !create) {
    return (
      <Stack spacing={3}>
        <BeamPageHeader title={`Campaign ${id}`} back={backTo(navigate, BASE, 'Token Campaigns')} />
        <BeamEmptyState title={`No campaign with id ${id}`} description="It may have been removed." />
      </Stack>
    );
  }

  // campaign is defined whenever !create (guard above); create never reaches a campaign-reading branch.
  const cc = campaign as TokenCampaign;
  const isEdit = create || (mode === 'edit' && draft !== null);
  const d = draft;

  return (
    // Page-body section gap = spacing(3) = 24px on BOTH axes (the band uses 3 too — see below).
    <Stack spacing={3}>
      <BeamPageHeader
        // Create has no entity yet → a create title, no date subtitle. (The Add frame's "cveti
        // campaign" + dates are Edit-frame residue — deliberately NOT copied.)
        title={create ? 'Create Token Campaign' : cc.name}
        back={backTo(navigate, BASE, 'Token Campaigns')}
        subtitle={create ? undefined : `${fmtDateTimeET(cc.startDate)} ↔ ${fmtDateTimeET(cc.endDate)}`}
        // Actions swap by mode, constant geometry: [Delete · View Winners · Edit] ↔
        // [Cancel · View Winners · Submit for Approval]. View Winners is DISABLED in edit AND create
        // (navigating away from a draft would discard it — SPEC.md ruling; create has no winners yet.
        // The Add frame shows it active — logged as a frame divergence for the Figma side).
        action={
          isEdit ? (
            <Button variant="contained" onClick={submitForApproval}>Submit for Approval</Button>
          ) : (
            <Button variant="contained" startIcon={<EditIcon />} onClick={enterEdit}>Edit</Button>
          )
        }
        secondaryActions={
          isEdit ? (
            <>
              <Button variant="text" onClick={cancelEdit}>Cancel</Button>
              <Button variant="outlined" startIcon={<EmojiEventsIcon />} disabled>View Winners</Button>
            </>
          ) : (
            <>
              <Button variant="outlined" color="inherit" startIcon={<DeleteIcon />} onClick={() => setNotice({ severity: 'warning', msg: `Delete "${cc.name}" — stub. No delete pipeline yet (hangs on the CR-granularity ruling). Nothing was removed.` })}>
                Delete
              </Button>
              <Button variant="outlined" startIcon={<EmojiEventsIcon />} onClick={() => navigate(`${BASE}/${cc.id}/winners`)}>
                View Winners
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

      {/* View twins ⇄ edit fields (DetailsPanel editability border appears in edit). Enabled label is
          constant across modes; the frame's "Active" is the logged inconsistency (Figma fix pending). */}
      <DetailsPanel aria-label="Campaign details">
        {isEdit && d ? (
          <>
            <BeamField label="Name" value={d.name} onChange={(e) => patch({ name: e.target.value })} />
            <BeamField label="Start date" type="datetime-local" value={toLocalInput(d.startDate)} onChange={(e) => patch({ startDate: fromLocalInput(e.target.value) })} slotProps={{ inputLabel: { shrink: true } }} />
            <BeamField label="End date" type="datetime-local" value={toLocalInput(d.endDate)} onChange={(e) => patch({ endDate: fromLocalInput(e.target.value) })} slotProps={{ inputLabel: { shrink: true } }} />
            <BeamSwitchField label="Enabled" checked={d.enabled} onChange={(v) => patch({ enabled: v })} />
          </>
        ) : (
          <>
            <BeamStat label="Name" value={cc.name} />
            <BeamStat label="Start date" value={fmtDateTimeET(cc.startDate)} />
            <BeamStat label="End date" value={fmtDateTimeET(cc.endDate)} />
            <BeamStat label="Enabled" value={<BeamBool value={cc.enabled} />} />
          </>
        )}
      </DetailsPanel>

      {/* Section band — three BeamPaper surfaces side by side, gap spacing(3)=24px (both axes ruling).
          Promotional Images is the wide middle column (frame proportions). */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ alignItems: 'stretch' }}>
        {/* Compliance T&C — padded surface; text ⇄ textarea twin. */}
        <Box sx={{ flex: { md: '1 1 0' }, minWidth: 0 }}>
          <BeamPaper title="Compliance - Terms &amp; Conditions">
            {isEdit && d ? (
              <BeamField label="Terms &amp; conditions" value={d.tAndC} onChange={(e) => patch({ tAndC: e.target.value })} multiline minRows={10} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            ) : (
              <Box sx={{ maxHeight: 320, overflowY: 'auto' }}>
                <Typography variant="body2" color={cc.tAndC ? 'text.primary' : 'text.disabled'} sx={{ whiteSpace: 'pre-wrap' }}>
                  {cc.tAndC || 'No terms provided.'}
                </Typography>
              </Box>
            )}
          </BeamPaper>
        </Box>

        {/* Promotional Images — full-bleed table: NAME · DESKTOP · MOBILE (thumbnail + Copy URL ⇄ URL field). */}
        <Box sx={{ flex: { md: '3 1 0' }, minWidth: 0 }}>
          <BeamPaper title="Promotional Images" bleed>
            {(isEdit && d ? d.promotionalImages : cc.promotionalImages).length === 0 ? (
              <Box sx={{ px: 2, pb: 2 }}><Typography variant="body2" color="text.secondary">No images.</Typography></Box>
            ) : (
              <Table size="small" aria-label="Promotional images">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...meta }}>Name</TableCell>
                    <TableCell sx={{ ...meta }}>Desktop</TableCell>
                    <TableCell sx={{ ...meta }}>Mobile</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(isEdit && d ? d.promotionalImages : cc.promotionalImages).map((im, i) => (
                    <TableRow key={im.slot} hover>
                      <TableCell>{PROMO_IMAGE_SLOT_LABEL[im.slot]}</TableCell>
                      <TableCell>
                        <MediaCell url={im.desktopUrl} edit={isEdit} onCopy={copyUrl} onChange={(url) => patch({ promotionalImages: d!.promotionalImages.map((x, j) => (j === i ? { ...x, desktopUrl: url } : x)) })} />
                      </TableCell>
                      <TableCell>
                        <MediaCell url={im.mobileUrl} edit={isEdit} onCopy={copyUrl} onChange={(url) => patch({ promotionalImages: d!.promotionalImages.map((x, j) => (j === i ? { ...x, mobileUrl: url } : x)) })} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </BeamPaper>
        </Box>

        {/* Sounds — full-bleed table: NAME · URL (play affordance + Copy URL ⇄ URL field). */}
        <Box sx={{ flex: { md: '1.4 1 0' }, minWidth: 0 }}>
          <BeamPaper title="Sounds" bleed>
            {(isEdit && d ? d.sounds : cc.sounds).length === 0 ? (
              <Box sx={{ px: 2, pb: 2 }}><Typography variant="body2" color="text.secondary">No sounds.</Typography></Box>
            ) : (
              <Table size="small" aria-label="Sounds">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...meta }}>Name</TableCell>
                    <TableCell sx={{ ...meta }}>URL</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(isEdit && d ? d.sounds : cc.sounds).map((sn, i) => (
                    <TableRow key={sn.slot} hover>
                      <TableCell>{SOUND_SLOT_LABEL[sn.slot]}</TableCell>
                      <TableCell>
                        {/* Row height = the field-row height (fieldGeometrySx) both modes → no jump. */}
                        <Box sx={{ ...fieldGeometrySx, gap: 1 }}>
                          <IconButton size="small" aria-label={`Play ${SOUND_SLOT_LABEL[sn.slot]}`} onClick={() => setNotice({ severity: 'info', msg: 'Audio playback is a stub — not wired.' })}>
                            <PlayArrowIcon fontSize="small" />
                          </IconButton>
                          {isEdit && d ? (
                            <BeamField aria-label={`${SOUND_SLOT_LABEL[sn.slot]} URL`} value={sn.url} onChange={(e) => patch({ sounds: d.sounds.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} fullWidth />
                          ) : (
                            <CopyUrlButton onClick={() => copyUrl(sn.url)} />
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </BeamPaper>
        </Box>
      </Stack>

      {/* Wall stages — three renderings:
          • CREATE → LOCKED. You can't author a child before the parent exists (sessions never nest).
          • EDIT (non-create) → page-local composition hosting "+ ADD WALL STAGE". BeamChildList has no
            header-action slot (logged promotion candidate, this its motivating consumer), so the edit
            case is composed here; persisted stages keep their drill link, unsaved draft rows render
            NON-navigable (no page until saved; submit is a stub that discards).
          • VIEW → the BeamChildList summary (unchanged; borderless — no field ever). */}
      {create ? (
        <BeamPaper title="Wall Stages">
          <Typography variant="body2" color="text.secondary">
            You must create your token campaign first in order to unlock wall configurations.
          </Typography>
        </BeamPaper>
      ) : isEdit ? (
        <BeamPaper title="Wall Stages" bleed>
          <Box sx={{ px: 2, pb: 0.5 }}>
            <Button variant="text" size="small" startIcon={<AddIcon />} onClick={addStage}>Add wall stage</Button>
          </Box>
          <Table size="small" aria-label="Wall stages">
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...meta }}>Name</TableCell>
                {stageColumns.map((c) => (
                  <TableCell key={c.key} align={c.align} sx={{ ...meta, width: c.width }}>{c.header}</TableCell>
                ))}
                <TableCell aria-hidden sx={{ width: 40 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                ...cc.wallStages.map((s) => ({ stage: s, unsaved: false })),
                ...addedStages.map((s) => ({ stage: s, unsaved: true })),
              ].map(({ stage: s, unsaved }) => (
                <TableRow key={s.id} hover>
                  <TableCell component="th" scope="row">
                    {unsaved ? (
                      <Stack>
                        <Typography variant="body2">{stageLabel(s)}</Typography>
                        <Typography variant="caption" color="text.secondary">unsaved — saved stages are navigable</Typography>
                      </Stack>
                    ) : (
                      <RouterIdentityLink href={`${import.meta.env.BASE_URL}${BASE.replace(/^\//, '')}/${cc.id}/stages/${s.id}`}>
                        {stageLabel(s)}
                      </RouterIdentityLink>
                    )}
                  </TableCell>
                  {stageColumns.map((c) => (
                    <TableCell key={c.key} align={c.align}>{c.render(s)}</TableCell>
                  ))}
                  <TableCell align="right" sx={{ color: 'text.secondary' }}>
                    {!unsaved && <ChevronRightIcon fontSize="small" aria-hidden sx={{ display: 'block' }} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </BeamPaper>
      ) : (
        <BeamChildList<WallStage>
          aria-label="Wall stages"
          title="Wall stages"
          rows={cc.wallStages}
          getRowId={(s) => s.id}
          identityHeader="Name"
          getIdentityLabel={(s) => stageLabel(s)}
          getHref={(s) => `${import.meta.env.BASE_URL}${BASE.replace(/^\//, '')}/${cc.id}/stages/${s.id}`}
          LinkComponent={RouterIdentityLink}
          emptyMessage="No stages."
          columns={stageColumns}
        />
      )}

      <Snackbar open={copied} autoHideDuration={2000} onClose={() => setCopied(false)} message="URL copied to clipboard" />
    </Stack>
  );
}

/** A media cell: fixed 34×34 thumbnail (contain) + Copy URL (view) ⇄ URL field (edit). Row height =
 *  fieldGeometrySx (44px) both modes → no view↔edit jump. Placeholder assets 404 → onError hides img. */
function MediaCell({ url, edit, onCopy, onChange }: { url: string; edit: boolean; onCopy: (url: string) => void; onChange: (url: string) => void }) {
  return (
    <Box sx={{ ...fieldGeometrySx, gap: 1 }}>
      <Box
        component="img"
        src={url}
        alt=""
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
        sx={{ width: MEDIA, height: MEDIA, flexShrink: 0, objectFit: 'contain', borderRadius: 1, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}
      />
      {edit ? (
        <BeamField aria-label="URL" value={url} onChange={(e) => onChange(e.target.value)} fullWidth />
      ) : (
        <CopyUrlButton onClick={() => onCopy(url)} />
      )}
    </Box>
  );
}

function CopyUrlButton({ onClick }: { onClick: () => void }) {
  return (
    <Button size="small" variant="text" startIcon={<ContentCopyIcon fontSize="small" />} onClick={onClick} sx={{ flexShrink: 0 }}>
      Copy URL
    </Button>
  );
}
