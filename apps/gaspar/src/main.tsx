import React from 'react';
import ReactDOM from 'react-dom/client';
// BRAND EXPLORATION (Gaspar, 2026-09-24): self-hosted Quicksand (variable) for the heading typeface —
// diverges from Vasco's Figma (Inter), pending his review. Wired through gasparOfficialOverrides.titleFont.
import '@fontsource-variable/quicksand';
// BODY FACE (2026-09-24): self-hosted variable faces for the "thinner over smaller" body seam / Theme Lab
// Body-face dimension. Geist (previous) keeps its Google-Fonts link in index.html; the rest self-host here.
//  • Inter — the `/opsz` build (NOT the default, which is wght-ONLY and strips opsz): carries wght + opsz so
//    font-optical-sizing:auto engages. Candidate default (aligns with Vasco's Figma).
//  • IBM Plex Sans — alternate (wght only), kept in the matrix.
//  • Roboto Flex — the `/full.css` build (all axes: wght/wdth/GRAD/opsz…). The default index is wght-only,
//    so wdth/GRAD would be STRIPPED; `full` carries them (verified) — no TTF self-host needed.
import '@fontsource-variable/inter/opsz.css';
import '@fontsource-variable/ibm-plex-sans';
import '@fontsource-variable/roboto-flex/full.css';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
