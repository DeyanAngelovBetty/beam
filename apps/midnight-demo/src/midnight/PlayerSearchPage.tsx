import { useState } from 'react';
import {
  Stack,
  TextField,
  MenuItem,
  Button,
  BeamPageHeader,
  BeamFilterBar,
  BeamDataTable,
  BeamStatusBadge,
} from '@betty/beam';
import type { BeamColumn } from '@betty/beam';
import { PLAYERS, type Player } from './players';

/**
 * Player Search, retrofitted.
 *
 * Same job as Midnight's screen — find a player by identity or registration
 * facts, then open them. The differences are the point: filters live in one
 * BeamFilterBar rather than a loose field grid, status is the shared badge
 * vocabulary rather than bare text, and the row opens the player instead of
 * requiring a separate action column.
 */

interface PlayerSearchPageProps {
  onOpenPlayer: (playerId: string) => void;
}

const STATUS_OPTIONS = ['Any', 'Approved', 'Pending'];

export function PlayerSearchPage({ onOpenPlayer }: PlayerSearchPageProps) {
  const [status, setStatus] = useState('Any');

  const columns: BeamColumn<Player>[] = [
    { key: 'id', header: 'Player ID', render: (p) => p.id, getValue: (p) => p.id, width: 110 },
    { key: 'email', header: 'Email', render: (p) => p.email, getValue: (p) => p.email },
    { key: 'firstName', header: 'First name', render: (p) => p.firstName, getValue: (p) => p.firstName },
    { key: 'lastName', header: 'Last name', render: (p) => p.lastName, getValue: (p) => p.lastName },
    { key: 'dob', header: 'DOB', render: (p) => p.dob, align: 'right', width: 120 },
    { key: 'registeredAt', header: 'Registered', render: (p) => p.registeredAt, align: 'right', width: 160 },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <BeamStatusBadge status={p.status} />,
      getValue: (p) => p.status,
      width: 120,
    },
    {
      key: 'open',
      header: '',
      align: 'right',
      width: 100,
      render: (p) => (
        <Button size="small" onClick={() => onOpenPlayer(p.id)}>
          Open
        </Button>
      ),
    },
  ];

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title="Player Search"
        description="Find a player by identity or registration facts."
      />

      <BeamFilterBar
        aria-label="Player search filters"
        onSearch={() => {}}
        onClear={() => setStatus('Any')}
      >
        <TextField label="Player ID" size="small" fullWidth />
        <TextField label="Email" size="small" fullWidth />
        <TextField label="First name" size="small" fullWidth />
        <TextField label="Last name" size="small" fullWidth />
        <TextField label="Phone" size="small" fullWidth />
        <TextField label="Registration IP" size="small" fullWidth />
        <TextField
          label="Status"
          size="small"
          select
          fullWidth
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUS_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      </BeamFilterBar>

      <BeamDataTable
        columns={columns}
        rows={PLAYERS}
        getRowId={(p) => p.id}
        searchable
        paginated
        aria-label="Players"
      />
    </Stack>
  );
}
