import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Stack,
  Box,
  Paper,
  Typography,
  Alert,
  Button,
  IconButton,
  Snackbar,
  BeamPageHeader,
  BeamEmptyState,
  DetailsPanel,
  BeamStat,
  BeamBool,
  BeamChildList,
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
 * prompt; no mode state here). Detail-page grammar governs mechanics; the Figma is authoritative for
 * content/columns. Wall Stages renders through the new BeamChildList organism (a view-only child
 * summary + drill to the stage page — the child-sections ruling: children are edited on their pages).
 */

const BASE = '/prize-wall/token-campaigns';

// Dates displayed in EASTERN TIME with an ET suffix (proposed display-timezone ruling — see
// detail-page-grammar; ties off the winners grantedAt open item). Exact format is Figma-corrected.
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

      {/* View twins (borderless view DetailsPanel; boolean via BeamBool per doctrine). */}
      <DetailsPanel aria-label="Campaign details">
        <BeamStat label="Name" value={campaign.name} />
        <BeamStat label="Start date" value={fmtDateTimeET(campaign.startDate)} />
        <BeamStat label="End date" value={fmtDateTimeET(campaign.endDate)} />
        <BeamStat label="Enabled" value={<BeamBool value={campaign.enabled} />} />
      </DetailsPanel>

      {/* Compliance T&C — a text block; scrolls if long. */}
      <Stack spacing={1}>
        <Typography variant="subtitle2" color="text.secondary">Compliance T&amp;C</Typography>
        <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflowY: 'auto' }}>
          <Typography variant="body2" color={campaign.tAndC ? 'text.primary' : 'text.disabled'} sx={{ whiteSpace: 'pre-wrap' }}>
            {campaign.tAndC || 'No terms provided.'}
          </Typography>
        </Paper>
      </Stack>

      {/* Promotional Images — a row per slot: thumbnail + Copy URL for desktop AND mobile. Asset URLs
          are dev placeholders (thumbnails may 404 → alt text). */}
      <Stack spacing={1}>
        <Typography variant="subtitle2" color="text.secondary">Promotional Images</Typography>
        <Paper variant="outlined">
          {campaign.promotionalImages.length === 0 ? (
            <Box sx={{ p: 2 }}><Typography variant="body2" color="text.secondary">No images.</Typography></Box>
          ) : (
            <Stack divider={<Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />}>
              {campaign.promotionalImages.map((im) => (
                <Box key={im.slot} sx={{ p: 2, display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Typography variant="body2" sx={{ minWidth: 160, fontWeight: 500 }}>{PROMO_IMAGE_SLOT_LABEL[im.slot]}</Typography>
                  <MediaThumb label="Desktop" url={im.desktopUrl} onCopy={copyUrl} />
                  <MediaThumb label="Mobile" url={im.mobileUrl} onCopy={copyUrl} />
                </Box>
              ))}
            </Stack>
          )}
        </Paper>
      </Stack>

      {/* Sounds — a row per slot: play affordance (stubbed) + Copy URL. */}
      <Stack spacing={1}>
        <Typography variant="subtitle2" color="text.secondary">Sounds</Typography>
        <Paper variant="outlined">
          {campaign.sounds.length === 0 ? (
            <Box sx={{ p: 2 }}><Typography variant="body2" color="text.secondary">No sounds.</Typography></Box>
          ) : (
            <Stack divider={<Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />}>
              {campaign.sounds.map((sn) => (
                <Box key={sn.slot} sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ minWidth: 160, fontWeight: 500 }}>{SOUND_SLOT_LABEL[sn.slot]}</Typography>
                  <IconButton size="small" aria-label={`Play ${SOUND_SLOT_LABEL[sn.slot]}`} onClick={() => setNotice({ severity: 'info', msg: 'Audio playback is a stub — not wired.' })}>
                    <PlayArrowIcon fontSize="small" />
                  </IconButton>
                  <Box sx={{ flex: 1 }} />
                  <Button size="small" variant="text" startIcon={<ContentCopyIcon fontSize="small" />} onClick={() => copyUrl(sn.url)}>
                    Copy URL
                  </Button>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>
      </Stack>

      {/* Wall stages — the child-list summary organism. Identity link drills to the stage page; no
          add/remove/edit affordances (children are edited on their own pages). */}
      <Stack spacing={1}>
        <Typography variant="subtitle2" color="text.secondary">Wall stages</Typography>
        <BeamChildList<WallStage>
          aria-label="Wall stages"
          rows={campaign.wallStages}
          getRowId={(s) => s.id}
          identityHeader="Stage"
          getIdentityLabel={(s) => stageLabel(s)}
          getHref={(s) => `${import.meta.env.BASE_URL}${BASE.replace(/^\//, '')}/${campaign.id}/stages/${s.id}`}
          LinkComponent={RouterIdentityLink}
          emptyMessage="No stages."
          columns={[
            { key: 'enabled', header: 'Enabled', align: 'center', width: 100, render: (s) => <BeamBool value={s.enabled} /> },
            // Additional Windows = total openingWindows (IA: windows are additive to finalOpenDate,
            // so "Additional" and the total agree — coupled to the finalOpenDate open item).
            { key: 'windows', header: 'Additional Windows', align: 'right', width: 170, render: (s) => s.openingWindows.length },
            { key: 'start', header: 'Start', align: 'right', width: 120, render: (s) => fmtDate(s.startDate) },
            { key: 'finalOpen', header: 'Final Open', align: 'right', width: 130, render: (s) => fmtDate(s.finalOpenDate) },
          ]}
        />
      </Stack>

      <Snackbar open={copied} autoHideDuration={2000} onClose={() => setCopied(false)} message="URL copied to clipboard" />
    </Stack>
  );
}

/** A media slot's desktop/mobile block: a thumbnail + a Copy URL button. Placeholder assets may 404. */
function MediaThumb({ label, url, onCopy }: { label: string; url: string; onCopy: (url: string) => void }) {
  return (
    <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
      <Box
        component="img"
        src={url}
        alt={label}
        sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 1, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}
      />
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Button size="small" variant="text" startIcon={<ContentCopyIcon fontSize="small" />} onClick={() => onCopy(url)}>
        Copy URL
      </Button>
    </Stack>
  );
}
