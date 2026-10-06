import React from 'react';
import ReactDOM from 'react-dom/client';
import { bootChromeTreatment } from '@betty/beam';
import { App } from './App';

// Apply the persisted chrome treatment BEFORE first paint (no flash / layout jump — geometry follows it).
bootChromeTreatment();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
