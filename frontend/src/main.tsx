import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import PublicSiteApp from './PublicSiteApp'
import { initializeTelemetry } from './telemetry'

initializeTelemetry()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PublicSiteApp />
  </StrictMode>,
)
