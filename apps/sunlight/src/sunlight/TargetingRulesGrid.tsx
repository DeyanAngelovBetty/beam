import {
  BeamStatusBadge,
  Chip,
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
import type { TargetingCondition, TargetingRule } from './gameConfigs';

const conditionLabel = (condition: TargetingCondition) =>
  `${condition.attribute} ${condition.operator} ${condition.values.join(', ')}`;

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
            const isFallback = !rule.condition;

            return (
              <TableRow key={rule.id}>
                <TableCell align="right">{index + 1}</TableCell>
                <TableCell>
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2">{rule.name}</Typography>
                      {isFallback && <Chip label="Fallback" size="small" variant="outlined" />}
                    </Stack>
                    {rule.condition ? (
                      <Stack spacing={0.5}>
                        <Typography variant="caption">Match {rule.condition.match.toUpperCase()}:</Typography>
                        {rule.condition.conditions.map((condition, conditionIndex) => (
                          <Typography key={`${rule.id}-${conditionIndex}`} variant="body2" color="text.secondary">
                            {conditionLabel(condition)}
                          </Typography>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No condition — always matches and is evaluated last.
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
                <TableCell>{rule.payoutConfigName}</TableCell>
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
