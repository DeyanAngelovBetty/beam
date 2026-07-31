import {
  BeamStatusBadge,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@betty/beam';
import { statusBadge } from './payoutConfigs';
import { getPayoutConfig } from './payoutConfigs';
import type { TargetingRule } from './gameConfigs';
import { conditionToGroup } from './gameConfigForm';
import { ConditionSummary } from './ConditionSummary';

export function TargetingRulesGrid({ rules }: { rules: TargetingRule[] }) {
  const orderedRules = [...rules].sort((a, b) => b.priority - a.priority);

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Table size="small" aria-label="Targeting rules">
        <TableHead>
          <TableRow>
            <TableCell align="right">Order</TableCell>
            <TableCell>Rule / Conditions</TableCell>
            <TableCell>Payout Config</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orderedRules.map((rule, index) => {
            const badge = statusBadge(rule.status);

            return (
              <TableRow key={rule.id}>
                <TableCell align="right">{index + 1}</TableCell>
                <TableCell>
                  <Stack spacing={1}>
                    {rule.condition ? (
                      <ConditionSummary value={conditionToGroup(rule.condition)} />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No condition — always matches and is evaluated last.
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
                <TableCell>{getPayoutConfig(rule.payoutConfigId)?.name ?? rule.payoutConfigId}</TableCell>
                <TableCell>
                  <BeamStatusBadge status={badge.status} label={badge.label} size="small" />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
  );
}
