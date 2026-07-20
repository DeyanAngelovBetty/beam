import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// @betty/beam is consumed as SOURCE via alias — no package build step.
// See BEAM.md Appendix B (decided 2026-07-20).
const beamSrc = fileURLToPath(new URL('../../packages/beam/src/index.ts', import.meta.url));

// GitHub Pages serves each app under /<repo>/<app>/. Dev keeps '/'.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? (process.env.BASE_PATH ?? '/beam/midnight/') : '/',
  resolve: { alias: { '@betty/beam': beamSrc } },
  plugins: [react()],
}));
