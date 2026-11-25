// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { app, BrowserWindow, ipcMain } from 'electron'
import { createServer, IncomingMessage, Server, ServerResponse } from 'http'
import { join, resolve, sep, extname } from 'path'
import { createReadStream, existsSync, statSync } from 'fs'
import { readJson, writeJson } from './store'
import { onStateChange } from './bus'
import { getDuelState } from './duel'
import { getMatchState } from './match'
import { getStreakState } from './streak'
import { getLadderState } from './ladder'
import { getTimersState } from './customTimers'
import { getTimerState } from './timer'
import { getSaveTimersState } from './saveTimers'
import { getOverlayContent } from './overlay'
import { pageHtml, PANELS } from './obsPage'

// Serves the stream overlays on this computer only (127.0.0.1) so OBS can show them as
// browser sources. Nothing is reachable from other computers or from the internet.

export type ObsConfig = { enabled: boolean; port: number }
export type ObsStatus = { running: boolean; error: string }

const DEFAULT_PORT = 38917

let config: ObsConfig = { enabled: false, port: DEFAULT_PORT }
let status: ObsStatus = { running: false, error: '' }
let server: Server | null = null
let clients: ServerResponse[] = []
let pushTimer: NodeJS.Timeout | null = null
let stopListening: (() => void) | null = null
let heartbeat: NodeJS.Timeout | null = null

const imageTypes: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
}

function load(): void {
  try {
    const saved = readJson('obs.json') as Partial<ObsConfig>
    config = {
      enabled: saved.enabled === true,
      port: clampPort(saved.port ?? DEFAULT_PORT)
    }
  } catch {
    config = { enabled: false, port: DEFAULT_PORT }
  }
}

function save(): void {
  try {
    writeJson('obs.json', config)
  } catch {
    // saving is optional
  }
}

function clampPort(value: number): number {
  return Math.min(Math.max(Math.round(value) || DEFAULT_PORT, 1024), 65535)
}

function broadcastState(): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('obs:state', { config, status })
  }
}

function mapFile(mapUrl: string | null): string | null {
  if (!mapUrl) return null
  const relative = decodeURIComponent(mapUrl.split(/[?#]/)[0]).replace(/^\.?\//, '')
  const bases = [join(__dirname, '../renderer'), join(app.getAppPath(), 'src/renderer')]
  for (const base of bases) {
    const full = resolve(base, relative)
    if (
      full.startsWith(resolve(base) + sep) &&
      imageTypes[extname(full).toLowerCase()] &&
      existsSync(full)
    ) {
      return full
    }
  }
  return null
}

// Layouts drawn in the layout editor are sent as SVG data addresses
function svgFromDataUrl(mapUrl: string | null): string | null {
  const prefix = 'data:image/svg+xml;charset=utf-8,'
  if (!mapUrl || !mapUrl.startsWith(prefix) || mapUrl.length > 500_000) return null
  try {
    const svg = decodeURIComponent(mapUrl.slice(prefix.length))
    return svg.startsWith('<svg') ? svg : null
  } catch {
    return null
  }
}

function snapshot(): string {
  const content = getOverlayContent()
  const file = mapFile(content.mapUrl)
  return JSON.stringify({
    now: Date.now(),
    duel: getDuelState(),
    match: getMatchState(),
    streak: getStreakState(),
    ladder: getLadderState(),
    timers: getTimersState(),
    countdown: getTimerState(),
    saveTimer: getSaveTimersState(),
    map: {
      visible: content.mapVisible && (file !== null || svgFromDataUrl(content.mapUrl) !== null),
      name: content.mapName,
      opacity: content.opacity,
      version: content.mapUrl ?? ''
    }
  })
}

function pushToClients(): void {
  if (clients.length === 0 || pushTimer) return
  // groups rapid changes into one update
  pushTimer = setTimeout(() => {
    pushTimer = null
    const data = 'data: ' + snapshot() + '\n\n'
    for (const client of clients) client.write(data)
  }, 30)
}

function hostAllowed(request: IncomingMessage): boolean {
  const host = (request.headers.host ?? '').toLowerCase()
  return host === '127.0.0.1:' + config.port || host === 'localhost:' + config.port
}

function handle(request: IncomingMessage, response: ServerResponse): void {
  if (!hostAllowed(request) || request.method !== 'GET') {
    response.writeHead(403).end()
    return
  }

  const url = new URL(request.url ?? '/', 'http://127.0.0.1')

  if (url.pathname === '/events') {
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    })
    response.write('data: ' + snapshot() + '\n\n')
    clients.push(response)
    request.on('close', () => {
      clients = clients.filter((client) => client !== response)
    })
    return
  }

  if (url.pathname === '/map-image') {
    const svg = svgFromDataUrl(getOverlayContent().mapUrl)
    if (svg) {
      response.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' })
      response.end(svg)
      return
    }
    const file = mapFile(getOverlayContent().mapUrl)
    if (!file || !statSync(file).isFile()) {
      response.writeHead(404).end()
      return
    }
    response.writeHead(200, {
      'Content-Type': imageTypes[extname(file).toLowerCase()],
      'Cache-Control': 'no-cache'
    })
    createReadStream(file).pipe(response)
    return
  }

  const match = /^\/overlay\/([a-z]+)$/.exec(url.pathname)
  if (match && PANELS.some((panel) => panel.id === match[1])) {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    response.end(pageHtml(match[1]))
    return
  }

  if (url.pathname === '/') {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    response.end(
      '<!doctype html><meta charset="utf-8"><title>GKC</title><body style="font-family:sans-serif;background:#141416;color:#e8e8ea;padding:24px">GKC stream overlays are running. Open GKC, Stream overlays for the addresses.</body>'
    )
    return
  }

  response.writeHead(404).end()
}

function stop(): Promise<void> {
  return new Promise((done) => {
    if (heartbeat) clearInterval(heartbeat)
    heartbeat = null
    if (stopListening) stopListening()
    stopListening = null
    for (const client of clients) client.end()
    clients = []
    if (!server) return done()
    const closing = server
    server = null
    closing.close(() => done())
    closing.closeAllConnections?.()
  })
}

async function start(): Promise<void> {
  await stop()
  status = { running: false, error: '' }
  if (!config.enabled) {
    broadcastState()
    return
  }

  const next = createServer(handle)
  next.on('error', (error: NodeJS.ErrnoException) => {
    status = {
      running: false,
      error:
        error.code === 'EADDRINUSE'
          ? 'Port ' + config.port + ' is already in use. Choose another port.'
          : 'The server could not start: ' + error.message
    }
    server = null
    broadcastState()
  })
  next.listen(config.port, '127.0.0.1', () => {
    status = { running: true, error: '' }
    broadcastState()
  })
  server = next
  stopListening = onStateChange(pushToClients)
  // keeps connections alive and refreshes the clock offset on the pages
  heartbeat = setInterval(() => {
    for (const client of clients) client.write('data: ' + snapshot() + '\n\n')
  }, 15000)
}

export function registerObsIpc(): void {
  load()
  ipcMain.handle('obs:get', () => ({ config, status, panels: PANELS }))
  ipcMain.on('obs:set-enabled', (_event, value: boolean) => {
    config = { ...config, enabled: value === true }
    save()
    void start()
  })
  ipcMain.on('obs:set-port', (_event, value: number) => {
    config = { ...config, port: clampPort(Number(value)) }
    save()
    if (config.enabled) void start()
    else broadcastState()
  })
  if (config.enabled) void start()
}

export function stopObsServer(): void {
  void stop()
}
