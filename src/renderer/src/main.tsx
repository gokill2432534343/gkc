// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import './assets/main.css'
import './assets/flare.css'
import './assets/palette.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import OverlayApp from './overlay/OverlayApp'
import CrosshairApp from './overlay/CrosshairApp'

import { applyTheme, getTheme } from './core/theme'

const hash = window.location.hash
const isOverlay = hash === '#overlay'
const isCrosshair = hash === '#crosshair'

// The overlay windows always use the plain look
if (hash !== '#overlay' && hash !== '#crosshair') applyTheme(getTheme())

// Errors in the app window go to the log file (Settings > Backup > Open log folder)
function report(message: string, detail?: unknown): void {
  try {
    const text = detail instanceof Error ? (detail.stack ?? detail.message) : String(detail ?? '')
    window.api?.settingsIo.reportError(
      isOverlay || isCrosshair ? 'overlay' : 'window',
      message,
      text
    )
  } catch {
    // reporting must never throw
  }
}
window.addEventListener('error', (event) => report(event.message, event.error))
window.addEventListener('unhandledrejection', (event) =>
  report('Unhandled rejection', event.reason)
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isOverlay ? <OverlayApp /> : isCrosshair ? <CrosshairApp /> : <App />}</StrictMode>
)
