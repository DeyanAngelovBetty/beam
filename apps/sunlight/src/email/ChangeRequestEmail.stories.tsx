import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo } from 'react';
import Handlebars from 'handlebars';
import { Box, Stack, Typography } from '@betty/beam';
// The template is imported RAW (Vite ?raw) and compiled at runtime — the bench renders the SAME .hbs
// Tzeno's mailer consumes, so what you see here is the real artifact, not a copy.
import templateSrc from '../../email/change-request.hbs?raw';

/**
 * Sunlight — Change Request approval email (bench).
 *
 * A visual harness for the compiled `apps/sunlight/email/change-request.hbs`, rendered in an isolated
 * `srcdoc` iframe at desktop (600px) and mobile widths. Controls drive the template data; the {{#equals}}
 * helper is registered here ({{#if}}/{{#each}} are Handlebars stock). Token provenance +the deliberate
 * tinted-chip rationale live in `apps/sunlight/email/email-tokens.md`.
 *
 * ⚠️ SCOPE: this bench is a VISUAL check only. Real email-client QA — Gmail / Outlook (Windows + web) /
 * Apple Mail send-tests, image-blocking, dark-mode client inversion — is a SEPARATE gate this story does
 * NOT cover (srcdoc ≠ a mail client's rendering engine).
 */

// {{#equals a b}} — the template's one custom block helper. Registered once (idempotent across HMR).
if (!Handlebars.helpers.equals) {
  Handlebars.registerHelper('equals', function (this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
    return a === b ? options.fn(this) : options.inverse(this);
  });
}
const template = Handlebars.compile(templateSrc);

type EmailArgs = {
  status: 'Applied' | 'Rejected' | 'Outdated';
  requestId: string;
  reason: string;
  description: string;
  featureType: string;
  updatedBy: string;
  updatedAt: string;
  appliedRequestsCount: number;
  requestUrl: string;
};

// Controls → the template's data shape. `appliedRequestsCount` seeds the {{#each appliedRequests}} list
// (0 exercises the no-applied-requests branch); an empty `reason` exercises the {{else}} branch.
const toData = (a: EmailArgs) => ({
  ...a,
  appliedRequests: Array.from({ length: Math.max(0, Math.floor(a.appliedRequestsCount)) }, (_, i) => ({
    id: String(Number(a.requestId) - i - 1),
    url: 'https://sunlight.betty.example/change-requests/' + String(Number(a.requestId) - i - 1),
  })),
});

function EmailFrame({ args, width, label }: { args: EmailArgs; width: number; label: string }) {
  const html = useMemo(() => template(toData(args)), [args]);
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">{label} · {width}px</Typography>
      <Box
        component="iframe"
        title={`${label} (${width}px)`}
        srcDoc={html}
        sx={{ width, height: 820, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: '#fff', display: 'block' }}
      />
    </Stack>
  );
}

const meta: Meta<EmailArgs> = {
  title: 'Sunlight/Email — Change Request',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Compiled `change-request.hbs` in an isolated srcdoc iframe. **Bench = visual only**; Gmail/Outlook/Apple Mail send-tests are a separate QA gate (image-blocking, client dark-mode, MSO quirks) this story does not cover.',
      },
    },
  },
  argTypes: {
    status: { control: 'select', options: ['Applied', 'Rejected', 'Outdated'] },
    requestId: { control: 'text' },
    reason: { control: 'text' },
    description: { control: 'text' },
    featureType: { control: 'text' },
    updatedBy: { control: 'text' },
    updatedAt: { control: 'text' },
    appliedRequestsCount: { control: { type: 'number', min: 0, max: 5 } },
    requestUrl: { control: 'text' },
  },
  args: {
    status: 'Rejected',
    requestId: '4821',
    reason: 'The proposed weekend multiplier (3×) exceeds the Gold-tier campaign cap (2.5×) set for Q4. Resubmit within the cap or request a cap exception first.',
    description: 'Increase weekend LP multiplier to 3× for Gold tier',
    featureType: 'Loyalty multiplier',
    updatedBy: 'b.petrova@betty.example',
    updatedAt: '2026-09-24 14:32',
    appliedRequestsCount: 2,
    requestUrl: 'https://sunlight.betty.example/change-requests/4821',
  },
};
export default meta;
type Story = StoryObj<EmailArgs>;

/** Interactive — drive every field from the controls; desktop + mobile side by side. */
export const Playground: Story = {
  render: (args) => (
    <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <EmailFrame args={args} width={600} label="Desktop" />
      <EmailFrame args={args} width={375} label="Mobile" />
    </Stack>
  ),
};

/** One frame per status, side by side (the docs comparison). */
export const AllStatuses: Story = {
  render: (args) => (
    <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {(['Applied', 'Rejected', 'Outdated'] as const).map((s) => (
        <EmailFrame key={s} args={{ ...args, status: s }} width={600} label={s} />
      ))}
    </Stack>
  ),
};

/** Branch coverage — empty reason ({{else}}), no applied requests (empty {{#each}}), and mobile width. */
export const EdgeCases: Story = {
  render: (args) => (
    <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <EmailFrame args={{ ...args, status: 'Rejected', reason: '', appliedRequestsCount: 0 }} width={600} label="Rejected · empty reason · no applied" />
      <EmailFrame args={{ ...args, status: 'Outdated', appliedRequestsCount: 0 }} width={600} label="Outdated · no applied" />
      <EmailFrame args={{ ...args, status: 'Applied' }} width={375} label="Applied · mobile" />
    </Stack>
  ),
};
