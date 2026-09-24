import React from 'react';
import ReactDOM from 'react-dom/client';
// BRAND EXPLORATION (Gaspar, 2026-09-24): self-hosted Quicksand (variable) for the heading typeface —
// diverges from Vasco's Figma (Inter), pending his review. Wired through gasparOfficialOverrides.titleFont.
import '@fontsource-variable/quicksand';
// BODY FACE (2026-09-24): self-hosted variable Inter (candidate default, aligns with Vasco's Figma) + IBM
// Plex Sans (alternate) for the "thinner over smaller" body seam / Theme Lab Body-face dimension. Geist (the
// previous face, the third option) keeps its Google-Fonts link in index.html. Wired through
// gasparOfficialOverrides.bodyFont + gasparBodyFont. Variable axes carry the fractional 380/340 weights.
import '@fontsource-variable/inter';
import '@fontsource-variable/ibm-plex-sans';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
