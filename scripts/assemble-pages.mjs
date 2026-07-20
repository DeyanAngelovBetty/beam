/**
 * Collects the built apps and Storybook into a single dist/ tree for
 * GitHub Pages:
 *
 *   dist/            landing page (apps/landing)
 *   dist/sunlight/   dist/gaspar/   dist/midnight/
 *   dist/storybook/
 *
 * Each app's own vite.config.ts owns its base path; this script only moves
 * the results into place. Run after `npm run build` and the Storybook build
 * (see the build:pages script).
 */
import { cp, mkdir, rm, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = path.join(root, 'dist');

/** [source, destination-within-dist] — destination '' means the site root. */
const SOURCES = [
  ['apps/landing/dist', ''],
  ['apps/sunlight/dist', 'sunlight'],
  ['apps/gaspar/dist', 'gaspar'],
  ['apps/midnight-demo/dist', 'midnight'],
  ['packages/beam/storybook-static', 'storybook'],
];

const exists = async (p) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

const missing = [];
for (const [from, to] of SOURCES) {
  const src = path.join(root, from);
  if (!(await exists(src))) {
    missing.push(from);
    continue;
  }
  await cp(src, path.join(dist, to), { recursive: true });
  console.log(`  ${from} -> dist/${to || '.'}`);
}

if (missing.length) {
  console.error(`\nMissing build output:\n${missing.map((m) => `  - ${m}`).join('\n')}`);
  console.error('\nRun `npm run build:pages` rather than this script directly.');
  process.exit(1);
}

console.log('\nAssembled dist/ for GitHub Pages.');
