import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Stack,
  Box,
  Button,
  TextField,
  MenuItem,
  Typography,
  BeamPageHeader,
  BeamFilterBar,
  BeamDataTable,
  BeamStatusBadge,
} from '@betty/beam';
import type { BeamColumn, BeamRowMenuItem } from '@betty/beam';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import { RouterIdentityLink } from './RouterIdentityLink';
import {
  PAYOUT_CONFIGS,
  GAME_TYPES,
  PAYOUT_STATUSES,
  expectedAvgPayout,
  formatPayout,
  statusBadge,
  type PayoutConfig,
  type GameType,
  type PayoutStatus,
} from './payoutConfigs';

/**
 * Payout Configs — the first MetaGame back-office list, assembled from Beam
 * pieces per the list grammar. ONE list for every game type, with GameType a
 * promoted filter (the legacy Yoda split them into nav items — that's
 * navigation doing a filter's job; provisional, see docs/metagame-pages.md).
 *
 * §5 declaration: promoted filters GameType + Status · tier 3 (row click →
 * /payout-configs/:id, Name is the identity link) · rail expand+select+kebab
 * (Edit / Clone / Delete) · bulk Go Live / Delete (destructive) · no inline
 * cell control. The rail caret expands the Yoda preview (grammar §3) — tier 3
 * and expansion coexist.
 */

interface Applied {
  q: string;
  gameType: 'any' | GameType;
  status: 'any' | PayoutStatus;
}

const EMPTY: Applied = { q: '', gameType: 'any', status: 'any' };

/** Applied filters -> URL query, omitting defaults so the URL stays clean. */
function toParams(d: Applied): URLSearchParams {
  const p = new URLSearchParams();
  if (d.q.trim()) p.set('q', d.q.trim());
  if (d.gameType !== 'any') p.set('gameType', d.gameType);
  if (d.status !== 'any') p.set('status', d.status);
  return p;
}

export function PayoutConfigsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Applied filters live in the URL (shareable, refresh-proof); the draft is
  // local until the Filter button submits (list §1).
  const gameTypeParam = searchParams.get('gameType');
  const statusParam = searchParams.get('status');
  const applied: Applied = {
    q: searchParams.get('q') ?? '',
    gameType: GAME_TYPES.includes(gameTypeParam as GameType) ? (gameTypeParam as GameType) : 'any',
    status: PAYOUT_STATUSES.includes(statusParam as PayoutStatus) ? (statusParam as PayoutStatus) : 'any',
  };
  const [draft, setDraft] = useState<Applied>(applied);

  const rows = useMemo(() => {
    const q = applied.q.trim().toLowerCase();
    return PAYOUT_CONFIGS.filter((c) => {
      if (q && !`${c.name} ${c.id}`.toLowerCase().includes(q)) return false;
      if (applied.gameType !== 'any' && c.gameType !== applied.gameType) return false;
      if (applied.status !== 'any' && c.status !== applied.status) return false;
      return true;
    });
  }, [applied.q, applied.gameType, applied.status]);

  const isApplied = applied.q !== '' || applied.gameType !== 'any' || applied.status !== 'any';

  const columns: BeamColumn<PayoutConfig>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (c) => c.name,
      getValue: (c) => c.name,
      isIdentity: true,
      getHref: (c) => `${import.meta.env.BASE_URL}payout-configs/${c.id}`,
    },
    { key: 'gameType', header: 'Game type', render: (c) => c.gameType, getValue: (c) => c.gameType, width: 160 },
    {
      key: 'status',
      header: 'Status',
      width: 130,
      getValue: (c) => c.status,
      render: (c) => {
        const b = statusBadge(c.status);
        return <BeamStatusBadge status={b.status} label={b.label} size="small" />;
      },
    },
    {
      key: 'avg',
      header: 'Avg payout',
      align: 'right',
      width: 150,
      getValue: (c) => expectedAvgPayout(c),
      render: (c) => formatPayout(expectedAvgPayout(c)),
    },
    { key: 'updated', header: 'Updated', align: 'right', width: 130, getValue: (c) => c.updatedAt, render: (c) => c.updatedAt },
  ];

  // Actions are stubbed to the console — behaviour wiring is a later round;
  // only navigation is real this commit.
  const rowMenu = (c: PayoutConfig): BeamRowMenuItem[] => [
    { id: 'edit', label: 'Edit', icon: <EditIcon fontSize="small" />, onClick: () => console.log('edit', c.id) },
    { id: 'clone', label: 'Clone', icon: <ContentCopyIcon fontSize="small" />, onClick: () => console.log('clone', c.id) },
    {
      id: 'delete',
      label: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      onClick: () => console.log('delete', c.id),
      destructive: true,
    },
  ];

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title="Payout Configs"
        description="Payout tables across every MetaGame game type."
        action={
          <Button variant="contained" startIcon={<AddIcon />}>
            New config
          </Button>
        }
      />

      <BeamFilterBar
        aria-label="Payout config filters"
        searchValue={draft.q}
        onSearchChange={(q) => setDraft((d) => ({ ...d, q }))}
        searchPlaceholder="Search name or id"
        applied={isApplied}
        onFilter={() => setSearchParams(toParams(draft))}
        onClearAll={() => {
          setDraft(EMPTY);
          setSearchParams({});
        }}
      >
        <TextField
          label="Game type"
          size="small"
          select
          fullWidth
          value={draft.gameType}
          onChange={(e) => setDraft((d) => ({ ...d, gameType: e.target.value as Applied['gameType'] }))}
        >
          <MenuItem value="any">Any</MenuItem>
          {GAME_TYPES.map((g) => (
            <MenuItem key={g} value={g}>
              {g}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Status"
          size="small"
          select
          fullWidth
          value={draft.status}
          onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as Applied['status'] }))}
        >
          <MenuItem value="any">Any</MenuItem>
          {PAYOUT_STATUSES.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>
      </BeamFilterBar>

      <BeamDataTable
        columns={columns}
        rows={rows}
        getRowId={(c) => c.id}
        selectable
        bulkActions={[
          { id: 'golive', label: 'Go Live' },
          { id: 'delete', label: 'Delete', destructive: true },
        ]}
        onBulkAction={(actionId, ids) => console.log('bulk', actionId, ids)}
        rowMenu={rowMenu}
        renderExpanded={(c) => <PayoutPreview config={c} />}
        onRowClick={(c) => navigate(`/payout-configs/${c.id}`)}
        LinkComponent={RouterIdentityLink}
        paginated
        emptyMessage="No payout configs match these filters."
        aria-label="Payout configs"
      />
    </Stack>
  );
}

/**
 * Row expansion — the Yoda preview pattern: winnable payouts beside visual-only
 * entries. PLAIN scaffold; the preview's design is a later round.
 * // styling: pending design pass
 */
function PayoutPreview({ config }: { config: PayoutConfig }) {
  const winnable = config.rows.filter((r) => r.probability > 0);
  const visualOnly = config.rows.filter((r) => r.probability === 0);

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={6} sx={{ py: 1 }}>
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Winnable Payouts
        </Typography>
        <Stack spacing={0.5}>
          {winnable.map((r, i) => (
            <Stack key={i} direction="row" justifyContent="space-between" spacing={2}>
              <Typography variant="body2">{r.winMessage}</Typography>
              <Typography variant="body2" color="text.secondary">
                {formatPayout(r.prizeValue)} · {(r.probability * 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}%
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Visual Only
        </Typography>
        {visualOnly.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            None.
          </Typography>
        ) : (
          <Stack spacing={0.5}>
            {visualOnly.map((r, i) => (
              <Stack key={i} direction="row" justifyContent="space-between" spacing={2}>
                <Typography variant="body2">{r.winMessage}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatPayout(r.prizeValue)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}
