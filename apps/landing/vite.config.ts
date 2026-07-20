import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// @betty/beam is consumed as SOURCE via alias — no package build step.
// See BEAM.md Appendix C (decided 2026-07-20).
const beamSrc = fileURLToPath(new URL('../../packages/beam/src/index.ts', import.meta.url));

// The landing page sits at the site root; each app gets its own subdirectory.
// PAGES_BASE lets CI derive the prefix from the repo name, so a rename does
// not break asset URLs.
const PAGES_BASE = process.env.PAGES_BASE ?? '/beam';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? `${PAGES_BASE}/` : '/',
  resolve: { alias: { '@betty/beam': beamSrc } },
  plugins: [react()],
}));
