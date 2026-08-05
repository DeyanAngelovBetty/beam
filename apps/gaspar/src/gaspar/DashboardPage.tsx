import { Stack, BeamPageHeader } from '@betty/beam';
import { BenchDashboardStatic } from '../bench/BenchDashboardStatic';

/**
 * Dashboard — Gaspar's landing page. A read-only operator overview of payment
 * health, promoted from the Lab: Variant 1 (the static CSS-grid) won the
 * dashboard-bench comparison, so it graduates into a real page while the bench
 * stays put as the record of that decision (Lab exit, BEAM §9).
 *
 * Renders the static grid from the SHARED `dashboardConfig` + widget registry —
 * one source, the bench (Lab/Bench/Dashboard) is the other consumer. No variant
 * tabs, no visibleWidgetIds chips: those are bench instrumentation. The page
 * renders the role's configured widget set directly. Read-only, so the header's
 * actions slot is empty.
 */
export function DashboardPage() {
  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title="Dashboard"
        description="Routing, settlement, and gateway health at a glance."
      />
      <BenchDashboardStatic gradientBorder />
    </Stack>
  );
}
