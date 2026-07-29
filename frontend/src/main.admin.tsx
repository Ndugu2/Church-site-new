import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { initializeTelemetry } from './telemetry';

initializeTelemetry();

if (!window.location.hash || window.location.hash === '#') {
  window.history.replaceState(null, '', '#/admin');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
