import type { StorybookConfig } from '@storybook/react-vite';
import { fileURLToPath } from 'node:url';

// Same resolution the app's vite.config uses, so app-local Lab stories
// resolve '@betty/beam' inside Storybook's Vite.
const beamSrc = fileURLToPath(new URL('../src/index.ts', import.meta.url));

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: [
    '../src/**/*.stories.@(ts|tsx)',
    '../../../apps/sunlight/src/**/*.stories.@(ts|tsx)', // Lab/ residents
    '../../../apps/gaspar/src/**/*.stories.@(ts|tsx)', // Lab/Bench residents
  ],
  addons: ['@storybook/addon-docs'],
  viteFinal: async (viteConfig) => {
    viteConfig.resolve ??= {};
    viteConfig.resolve.alias = { ...viteConfig.resolve.alias, '@betty/beam': beamSrc };
    return viteConfig;
  },
};

export default config;
