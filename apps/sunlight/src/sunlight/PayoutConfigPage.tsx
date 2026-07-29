import { useParams, useNavigate } from 'react-router-dom';
import { Stack, Button, BeamPageHeader } from '@betty/beam';
import { PAYOUT_CONFIGS } from './payoutConfigs';

/**
 * Payout Config deep page — STUB. The full detail (row editor + the Live Checks
 * that consume expectedAvgPayout / probabilityTotal, with BeamStat severity) is
 * a separate design round. This proves the route resolves and carries identity.
 */
export function PayoutConfigPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const config = PAYOUT_CONFIGS.find((c) => c.id === id);

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title={config ? config.name : `Config ${id}`}
        description={config ? `${config.gameType} · ${config.status}` : 'Unknown payout config'}
        secondaryActions={
          <Button variant="text" onClick={() => navigate('/payout-configs')}>
            ← Payout Configs
          </Button>
        }
      />
    </Stack>
  );
}
