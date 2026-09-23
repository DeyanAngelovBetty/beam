import React from 'react';
import ReactDOM from 'react-dom/client';
// BRAND EXPLORATION (Gaspar, 2026-09-24): self-hosted Quicksand (variable) for the heading typeface —
// diverges from Vasco's Figma (Inter), pending his review. Wired through gasparOfficialOverrides.titleFont.
import '@fontsource-variable/quicksand';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
