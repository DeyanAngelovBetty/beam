/**
 * The demo surfaces published to GitHub Pages, and where each one's docs, Figma,
 * and live/official versions live. This is the repo's index (a launcher), so it
 * lives in the landing app, not the design system. Adding a surface or a link is
 * a one-line edit here.
 *
 * Link honesty: only real targets — no placeholder hrefs, no dead links. Any
 * column a surface has no target for is simply omitted.
 *
 * NOTE (docs): the markdown docs are NOT published to gh-pages (assemble-pages.mjs
 * ships only the apps + Storybook), so `docs` points at the repo on github.com,
 * which renders markdown and is org-accessible — a real target, not a gh-pages 404.
 */

const REPO = 'https://github.com/DeyanAngelovBetty/beam/blob/main';

export interface FigmaRef {
  /** File name as it appears in Figma */
  file: string;
  url: string;
}

export interface Surface {
  id: string;
  name: string;
  tagline: string;
  description: string;
  /** The gh-pages route (this repo's build) — the "Open app" link. Relative to the site root. */
  href: string;
  /** Label for the Open link (default "Open app"). */
  openLabel?: string;
  /** Docs for this area (github.com — see NOTE above). */
  docs?: string;
  figma?: FigmaRef;
  /** The real, deployed product where one exists (production / QA), distinct from the demo build. */
  official?: string;
}

export const BEAM: Surface = {
  id: 'storybook',
  name: 'Beam',
  tagline: 'The design system',
  description:
    'Tokens, theme, and organisms — browsable in Storybook across every product, jurisdiction, and light/dark combination.',
  href: 'storybook/',
  openLabel: 'Storybook',
  docs: `${REPO}/BEAM.md`,
  figma: {
    file: 'Beam (MUI v9) Foundations',
    url: 'https://www.figma.com/design/9yNbolohxGitkMJKDjoyKG/Beam--MUI-v9-?node-id=4662-14',
  },
};

export const APPS: Surface[] = [
  {
    id: 'sunlight',
    name: 'Sunlight',
    tagline: 'Loyalty back office',
    description:
      'Loyalty statuses, rewards, and progression rules. The first product built on Beam, and where most organisms were born.',
    href: 'sunlight/',
    docs: `${REPO}/docs/loyalty-pages.md`,
    figma: {
      file: 'Sunlight',
      url: 'https://www.figma.com/design/erQ1X8e91k6YwRsKgnzXDY/Sunlight?node-id=0-1',
    },
    official: 'https://sunlight.qa.playbetty.com/',
  },
  {
    id: 'gaspar',
    name: 'Gaspar',
    tagline: 'Payment orchestrator back office',
    description:
      'Transactions and routing. Structurally identical to Sunlight on purpose — only the product token set differs, plus the node-graph rule builder aligned to the payment engine schema.',
    href: 'gaspar/',
    docs: `${REPO}/docs/specs/gaspar-rule-builder.md`,
    // No Gaspar Figma file yet — omitted rather than stubbed.
    official: 'https://betty-gaming.github.io/Gaspar/',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    tagline: 'Retrofit slice',
    description:
      'Player search and the player Payments tab, rebuilt in Beam. Same job as the legacy screens, none of the legacy layout.',
    href: 'midnight/',
    // No dedicated doc, Figma, or deployed product yet — Open app only.
  },
];
