/**
 * The demo surfaces published to GitHub Pages, and their Figma counterparts.
 *
 * This is the repo's index, not a Beam concern — it lives in the landing app
 * rather than in the design system. Adding a surface or filling in a Figma
 * link is a one-line edit here.
 *
 * Paths are relative so the site works under any base path.
 */

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
  /** Relative to the site root */
  href: string;
  figma?: FigmaRef;
  /** Shown when the Figma file doesn't exist yet — an honest gap, not a blank */
  figmaPending?: string;
}

export const BEAM: Surface = {
  id: 'storybook',
  name: 'Beam',
  tagline: 'The design system',
  description:
    'Tokens, theme, and organisms — browsable in Storybook across every product, jurisdiction, and light/dark combination.',
  href: 'storybook/',
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
    figma: {
      file: 'Sunlight',
      url: 'https://www.figma.com/design/erQ1X8e91k6YwRsKgnzXDY/Sunlight?node-id=0-1',
    },
  },
  {
    id: 'gaspar',
    name: 'Gaspar',
    tagline: 'Payment orchestrator back office',
    description:
      'Transactions and routing. Structurally identical to Sunlight on purpose — only the product token set differs. The node-graph rule builder is still to come.',
    href: 'gaspar/',
    figmaPending: 'Design pass pending — current tokens are demo placeholders.',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    tagline: 'Retrofit slice',
    description:
      'Player search and the player Payments tab, rebuilt in Beam. Same job as the legacy screens, none of the legacy layout.',
    href: 'midnight/',
    figmaPending: 'Retrofit not yet designed in Figma.',
  },
];
