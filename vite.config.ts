import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves this repo under /<repo>/, so built asset URLs need that
// prefix. Dev keeps '/' — override with BASE_PATH if the repo is ever renamed.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? (process.env.BASE_PATH ?? '/beam/') : '/',
  plugins: [react()],
}));
