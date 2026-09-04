import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { backTo } from './backTo';
import { RouterIdentityLink } from './RouterIdentityLink';
import {
  getTokenCampaign,
  stageLabel,
  PROMO_IMAGE_SLOT_LABEL,
  SOUND_SLOT_LABEL,
  type WallStage,
} from './tokenCampaigns';

/**
 * TokenCampaignDetailPage — /prize-wall/token-campaigns/:id. VIEW MODE only (the editor is the next
 * prompt; no mode state here). Composition follows designs/TokenCampaign-View.png; geometry stability
 * is sized against TokenCampaign-Edit.png (see designs/SPEC.md). Sections are BeamPaper surfaces
 * (titles inside; grids/tables bleed to the edge); Wall Stages is BeamChildList (composing BeamPaper).
 */

const BASE = '/prize-wall/token-campaigns';
const MEDIA = 34; // fixed media-in-cell container (px), object-fit: contain (designs/SPEC.md ruling)

// Dates in EASTERN TIME with an ET suffix (detail-page-grammar display-timezone ruling). Exact
// format is Figma-authoritative (dd-MMM-yyyy hh:mm:ss AM ET) — corrected on review.
const fmtDateTimeET = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
const fmtDate = (iso: string) => iso.slice(0, 10);

type Notice = { severity: 'success' | 'info' | 'warning' | 'error'; msg: string } | null;

export function TokenCampaignDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const campaign = getTokenCampaign(id);

  const [notice, setNotice] = useState<Notice>(null);
  const [copied, setCopied] = useState(false);
  const copyUrl = (url: string) => {
    void navigator.clipboard?.writeText(url);
    setCopied(true);
  };

  if (!campaign) {
    return (
      <Stack spacing={3}>
        <BeamPageHeader title={`Campaign ${id}`} back={backTo(navigate, BASE, 'Token Campaigns')} />
        <BeamEmptyState title={`No campaign with id ${id}`} description="It may have been removed." />
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title={campaign.name}
        back={backTo(navigate, BASE, 'Token Campaigns')}
        subtitle={`${fmtDateTimeET(campaign.startDate)} – ${fmtDateTimeET(campaign.endDate)} ET`}
        // Actions L→R: Delete · View Winners · Edit (Edit is the rightmost primary).
        action={
          <Button variant="contained" startIcon={<EditIcon />} onClick={() => setNotice({ severity: 'info', msg: 'Edit — stub. The campaign editor lands in the next prompt.' })}>
            Edit
          </Button>
        }
        secondaryActions={
          <>
            <Button variant="outlined" color="inherit" startIcon={<DeleteIcon />} onClick={() => setNotice({ severity: 'warning', msg: `Delete "${campaign.name}" — stub. No delete pipeline yet (hangs on the CR-granularity ruling). Nothing was removed.` })}>
              Delete
            </Button>
            <Button variant="outlined" startIcon={<EmojiEventsIcon />} onClick={() => navigate(`${BASE}/${campaign.id}/winners`)}>
              View Winners
            </Button>
          </>
        }
      />

      {notice && (
        <Alert severity={notice.severity} onClose={() => setNotice(null)}>
          {notice.msg}
        </Alert>
      )}

      {/* View twins (DetailsPanel — borderless view, editability border in edit; boolean via BeamBool). */}
      <DetailsPanel aria-label="Campaign details">
        <BeamStat label="Name" value={campaign.name} />
        <BeamStat label="Start date" value={fmtDateTimeET(campaign.startDate)} />
        <BeamStat label="End date" value={fmtDateTimeET(campaign.endDate)} />
        <BeamStat label="Enabled" value={<BeamBool value={campaign.enabled} />} />
      </DetailsPanel>

      {/* Section band — three BeamPaper surfaces side by side, frame proportions (Promotional Images
          is the wide middle column). Equal height via flex stretch. */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: 'stretch' }}>
        {/* Compliance T&C — padded surface; the text block scrolls if long. */}
        <Box sx={{ flex: { md: '1 1 0' }, minWidth: 0 }}>
          <BeamPaper title="Compliance - Terms &amp; Conditions">
            <Box sx={{ maxHeight: 320, overflowY: 'auto' }}>
              <Typography variant="body2" color={campaign.tAndC ? 'text.primary' : 'text.disabled'} sx={{ whiteSpace: 'pre-wrap' }}>
                {campaign.tAndC || 'No terms provided.'}
              </Typography>
            </Box>
          </BeamPaper>
        </Box>

        {/* Promotional Images — full-bleed table: NAME · DESKTOP · MOBILE, a media cell per platform. */}
        <Box sx={{ flex: { md: '3 1 0' }, minWidth: 0 }}>
          <BeamPaper title="Promotional Images" bleed>
            {campaign.promotionalImages.length === 0 ? (
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
                  {campaign.promotionalImages.map((im) => (
                    <TableRow key={im.slot} hover>
                      <TableCell>{PROMO_IMAGE_SLOT_LABEL[im.slot]}</TableCell>
                      <TableCell><MediaCell url={im.desktopUrl} onCopy={copyUrl} /></TableCell>
                      <TableCell><MediaCell url={im.mobileUrl} onCopy={copyUrl} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </BeamPaper>
        </Box>

        {/* Sounds — full-bleed table: NAME · URL (a play affordance + Copy URL). */}
        <Box sx={{ flex: { md: '1.4 1 0' }, minWidth: 0 }}>
          <BeamPaper title="Sounds" bleed>
            {campaign.sounds.length === 0 ? (
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
                  {campaign.sounds.map((sn) => (
                    <TableRow key={sn.slot} hover>
                      <TableCell>{SOUND_SLOT_LABEL[sn.slot]}</TableCell>
                      <TableCell>
                        {/* Row min-height = the field-row height (fieldGeometrySx) so view↔edit won't
                            jump when the URL becomes a field (mode-stability ruling). */}
                        <Box sx={{ ...fieldGeometrySx, gap: 1 }}>
                          <IconButton size="small" aria-label={`Play ${SOUND_SLOT_LABEL[sn.slot]}`} onClick={() => setNotice({ severity: 'info', msg: 'Audio playback is a stub — not wired.' })}>
                            <PlayArrowIcon fontSize="small" />
                          </IconButton>
                          <CopyUrlButton onClick={() => copyUrl(sn.url)} />
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

      {/* Wall stages — the child-list summary organism (composes BeamPaper: title inside, table
          full-bleed). View-only (no field ever) → the surface stays borderless even in edit mode. */}
      <BeamChildList<WallStage>
        aria-label="Wall stages"
        title="Wall stages"
        rows={campaign.wallStages}
        getRowId={(s) => s.id}
        identityHeader="Stage"
        getIdentityLabel={(s) => stageLabel(s)}
        getHref={(s) => `${import.meta.env.BASE_URL}${BASE.replace(/^\//, '')}/${campaign.id}/stages/${s.id}`}
        LinkComponent={RouterIdentityLink}
        emptyMessage="No stages."
        columns={[
          { key: 'enabled', header: 'Enabled', align: 'center', width: 100, render: (s) => <BeamBool value={s.enabled} /> },
          // Additional Windows = total openingWindows (IA: windows are additive to finalOpenDate, so
          // "Additional" and the total agree — coupled to the finalOpenDate open item).
          { key: 'windows', header: 'Additional Windows', align: 'right', width: 170, render: (s) => s.openingWindows.length },
          { key: 'start', header: 'Start', align: 'right', width: 120, render: (s) => fmtDate(s.startDate) },
          { key: 'finalOpen', header: 'Final Open', align: 'right', width: 130, render: (s) => fmtDate(s.finalOpenDate) },
        ]}
      />

      <Snackbar open={copied} autoHideDuration={2000} onClose={() => setCopied(false)} message="URL copied to clipboard" />
    </Stack>
  );
}

/** A media cell: a fixed 34×34 thumbnail (contain, uniform rows) + Copy URL. Placeholder assets 404
 *  → onError hides the broken img, leaving the neutral frame (designs/SPEC.md). Row height matches
 *  the edit field (fieldGeometrySx) so view↔edit doesn't jump. */
function MediaCell({ url, onCopy }: { url: string; onCopy: (url: string) => void }) {
  return (
    <Box sx={{ ...fieldGeometrySx, gap: 1 }}>
      <Box
        component="img"
        src={url}
        alt=""
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
        sx={{ width: MEDIA, height: MEDIA, flexShrink: 0, objectFit: 'contain', borderRadius: 1, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}
      />
      <CopyUrlButton onClick={() => onCopy(url)} />
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
