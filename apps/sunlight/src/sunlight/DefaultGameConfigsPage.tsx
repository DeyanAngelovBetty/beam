import { useMemo, useState } from 'react';
import {
  BeamDataTable,
  BeamPageHeader,
  BeamStatusBadge,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@betty/beam';
import type { BeamColumn } from '@betty/beam';
import { GAME_CONFIGS, type GameConfig } from './gameConfigs';
import { GAME_TYPES, statusBadge, type GameType } from './payoutConfigs';
import {
  getDefaultGameConfigs,
  putDefaultGameConfig,
} from './defaultGameConfigs';
import {
  disabledGameConfigWarning,
  filterGameConfigsByGameType,
  isDefaultGameConfigChanged,
} from './defaultGameConfigHelpers';

interface DefaultGameConfigRow {
  gameType: GameType;
}

function selectionsFromMappings(): Partial<Record<GameType, string>> {
  return Object.fromEntries(
    getDefaultGameConfigs().map((mapping) => [mapping.gameType, mapping.gameConfigId])
  ) as Partial<Record<GameType, string>>;
}

export function DefaultGameConfigsPage() {
  const rows = useMemo<DefaultGameConfigRow[]>(
    () => [...GAME_TYPES].sort((left, right) => left.localeCompare(right)).map((gameType) => ({ gameType })),
    []
  );
  const [savedSelections, setSavedSelections] = useState<Partial<Record<GameType, string>>>(selectionsFromMappings);
  const [selections, setSelections] = useState<Partial<Record<GameType, string>>>(selectionsFromMappings);
  const [savedRow, setSavedRow] = useState<GameType | null>(null);

  const selectedConfig = (gameType: GameType): GameConfig | undefined =>
    GAME_CONFIGS.find((config) => config.id === selections[gameType]);

  const selectConfig = (gameType: GameType, gameConfigId: string) => {
    setSelections((current) => ({ ...current, [gameType]: gameConfigId }));
    setSavedRow((current) => (current === gameType ? null : current));
  };

  const saveMapping = (gameType: GameType) => {
    const gameConfigId = selections[gameType];
    if (!gameConfigId || !isDefaultGameConfigChanged(savedSelections[gameType] ?? '', gameConfigId)) return;
    putDefaultGameConfig(gameType, gameConfigId);
    setSavedSelections((current) => ({ ...current, [gameType]: gameConfigId }));
    setSavedRow(gameType);
  };

  const columns: BeamColumn<DefaultGameConfigRow>[] = [
    {
      key: 'gameType',
      header: 'Game Type',
      width: 180,
      getValue: (row) => row.gameType,
      render: (row) => row.gameType,
    },
    {
      key: 'gameConfig',
      header: 'Default Game Config',
      width: 520,
      render: (row) => {
        const options = filterGameConfigsByGameType(GAME_CONFIGS, row.gameType);
        const config = selectedConfig(row.gameType);
        const warning = disabledGameConfigWarning(config);
        return (
          <Stack spacing={0.75} sx={{ py: 0.5 }}>
            <TextField
              select
              size="small"
              value={selections[row.gameType] ?? ''}
              onChange={(event) => selectConfig(row.gameType, event.target.value)}
              slotProps={{
                htmlInput: { 'aria-label': `${row.gameType} Default Game Config` },
                select: {
                  displayEmpty: true,
                  renderValue: (selected) => {
                    const option = options.find((candidate) => candidate.id === selected);
                    return option ? `${option.code} — ${option.status}` : 'Not configured';
                  },
                },
              }}
              sx={{ minWidth: 360, maxWidth: 480 }}
            >
              {options.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.code} — {option.status}
                </MenuItem>
              ))}
            </TextField>
            {warning && (
              <Typography variant="body2" color="warning.main" role="status">
                {warning}
              </Typography>
            )}
          </Stack>
        );
      },
    },
    {
      key: 'configStatus',
      header: 'Config Status',
      width: 150,
      render: (row) => {
        const config = selectedConfig(row.gameType);
        if (!config) return 'Not configured';
        const badge = statusBadge(config.status);
        return <BeamStatusBadge status={badge.status} label={badge.label} size="small" />;
      },
    },
    {
      key: 'action',
      header: 'Action',
      width: 150,
      render: (row) => {
        const selectedId = selections[row.gameType] ?? '';
        const changed = isDefaultGameConfigChanged(savedSelections[row.gameType] ?? '', selectedId);
        return (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button size="small" variant="outlined" disabled={!changed} onClick={() => saveMapping(row.gameType)}>
              Save
            </Button>
            {savedRow === row.gameType && (
              <Typography variant="body2" color="success.main" role="status">
                Saved
              </Typography>
            )}
          </Stack>
        );
      },
    },
  ];

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title="Default Game Configs"
        description="Choose the GameConfig used for each game type when a game is awarded without a Preset."
      />
      <BeamDataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.gameType}
        emptyMessage="No game types available."
        aria-label="Default game configs"
      />
    </Stack>
  );
}
