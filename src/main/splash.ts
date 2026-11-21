// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { BrowserWindow } from 'electron'

const MIN_VISIBLE_MS = 1100

let splash: BrowserWindow | null = null
let shownAt = 0

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
    background: radial-gradient(260px 160px at 85% -10%, rgba(179,58,58,.14), transparent 70%), #141416;
    border: 1px solid #2a2a2e; border-radius: 14px;
    font-family: 'Segoe UI', system-ui, sans-serif; color: #e8e8ea; overflow: hidden;
    -webkit-app-region: drag; user-select: none;
  }
  svg { animation: pulse 1.8s ease-in-out infinite; }
  @keyframes pulse { 0%,100% { opacity: .85; transform: scale(1); } 50% { opacity: 1; transform: scale(1.04); } }
  .name { font-size: 20px; font-weight: 600; letter-spacing: .14em; }
  .sub { margin-top: -8px; font-size: 11px; color: #6b6b72; letter-spacing: .06em; }
  .bar { width: 140px; height: 3px; border-radius: 3px; background: #2a2a2e; overflow: hidden; }
  .bar i { display: block; width: 40%; height: 100%; border-radius: 3px; background: #b33a3a;
    animation: slide 1.2s ease-in-out infinite; }
  @keyframes slide { 0% { margin-left: -40%; } 100% { margin-left: 100%; } }
</style></head><body>
  <svg width="64" height="64" viewBox="0 0 180 180">
    <polyline points="122,28 58,28 28,58 28,122 58,152 122,152 152,122 152,96 116,96" fill="none" stroke="#e8e8ea" stroke-width="12"/>
    <rect x="67" y="58" width="10" height="64" fill="#e8e8ea"/>
    <polygon points="77,84 106,56 122,56 77,100" fill="#b33a3a"/>
    <polygon points="77,96 106,124 122,124 77,80" fill="#b33a3a"/>
  </svg>
  <div class="name">GKC</div>
  <div class="bar"><i></i></div>
</body></html>`

export function showSplash(): void {
  splash = new BrowserWindow({
    width: 340,
    height: 260,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    center: true,
    show: false
  })
  splash.once('ready-to-show', () => splash?.show())
  shownAt = Date.now()
  splash.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))
}

export function closeSplash(then: () => void): void {
  const wait = Math.max(MIN_VISIBLE_MS - (Date.now() - shownAt), 0)
  setTimeout(() => {
    then()
    if (splash && !splash.isDestroyed()) splash.close()
    splash = null
  }, wait)
}
