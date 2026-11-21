// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { app, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { readFileSync, rmSync, writeFileSync } from 'fs'
import { is } from '@electron-toolkit/utils'
import { timerCount } from './customTimers'
import { notifyChange } from './bus'

export type OverlayState = {
  open: boolean
  clickThrough: boolean
}

export type OverlayContent = {
  mapUrl: string | null
  mapName: string
  mapVisible: boolean
  showDuel: boolean
  showStreak: boolean
  showTimers: boolean
  showBasicTimer: boolean
  scale: number
  opacity: number
  // how solid the panels behind the text are (0 = text only, 1 = the normal look)
  background: number
  size: number
  // a short message shown at the top for a few seconds, set by GKC itself
  hint: string
}

let overlayWindow: BrowserWindow | null = null
let clickThrough = false
let content: OverlayContent = {
  mapUrl: null,
  mapName: '',
  mapVisible: false,
  showDuel: false,
  showStreak: false,
  showTimers: false,
  showBasicTimer: false,
  scale: 1,
  opacity: 0.9,
  background: 1,
  size: 480,
  hint: ''
}

function windowSize(): { width: number; height: number } {
  const mapShown = content.mapUrl !== null && content.mapVisible
  const anyPanel =
    content.showDuel || content.showStreak || content.showTimers || content.showBasicTimer
  // 26 extra pixels hold the sideways GKC mark on the left
  const width = (content.showDuel ? 560 : anyPanel ? 400 : 320) + 26

  let panels = content.hint ? 40 : 0
  panels += content.showDuel ? 56 : content.showBasicTimer ? 70 : 0
  if (content.showStreak) panels += 56
  if (content.showTimers) panels += 26 * Math.max(timerCount(), 1) + 8

  // The picture is drawn size pixels wide and 1.1 times as high (the layout images are 2000 x 2200).
  // 68 and 62 are the window frame, the sideways GKC mark and the map name line around it.
  if (mapShown)
    return {
      width: Math.max(content.size + 68, width),
      height: Math.round(content.size * 1.1) + 62 + panels
    }
  return { width, height: 64 + panels + 26 }
}

function applySize(): void {
  if (!overlayWindow || overlayWindow.isDestroyed()) return
  const { width, height } = windowSize()
  // everything in the overlay is drawn bigger or smaller, so the window grows with it
  overlayWindow.webContents.setZoomFactor(content.scale)
  overlayWindow.setSize(Math.round(width * content.scale), Math.round(height * content.scale))
}

function broadcastContent(): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('overlay:content', content)
  }
  notifyChange()
}

export function getOverlayContent(): OverlayContent {
  return content
}

export function setOverlayContent(patch: Partial<OverlayContent>): void {
  const next = { ...content, ...patch }
  next.opacity = Math.min(Math.max(next.opacity, 0.2), 1)
  next.background = Math.min(Math.max(Number(next.background) || 0, 0), 1)
  next.size = Math.min(Math.max(Math.round(next.size), 300), 900)
  next.hint = String(next.hint ?? '').slice(0, 80)
  next.scale = Math.min(Math.max(next.scale, 0.6), 2)
  content = next
  applySize()
  broadcastContent()
}

export function refreshOverlaySize(): void {
  applySize()
}

export function toggleMapVisible(): void {
  if (!content.mapUrl) return
  setOverlayContent({ mapVisible: !content.mapVisible })
  if (content.mapVisible && !getState().open) openOverlay()
}

function getState(): OverlayState {
  return { open: overlayWindow !== null && !overlayWindow.isDestroyed(), clickThrough }
}

function broadcastState(): void {
  const state = getState()
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('overlay:state', state)
  }
}

function applyClickThrough(): void {
  if (!overlayWindow || overlayWindow.isDestroyed()) return
  // forward: true keeps mouse-move events flowing so the page can still react to hovering
  overlayWindow.setIgnoreMouseEvents(clickThrough, { forward: true })
}

// The overlay remembers where you put it. Reset puts it back to the top right corner.
function positionPath(): string {
  return join(app.getPath('userData'), 'overlay-position.json')
}

function defaultPosition(): { x: number; y: number } {
  const area = screen.getPrimaryDisplay().workArea
  return { x: area.x + area.width - 340, y: area.y + 20 }
}

// A window may sit partly above the top of the screen, but at least this many pixels of it must
// stay visible so it can still be grabbed.
const GRAB = 28

function visibleEnough(x: number, y: number, width: number, height: number): boolean {
  return screen.getAllDisplays().some((display) => {
    const a = display.workArea
    return (
      x + width >= a.x + GRAB &&
      x <= a.x + a.width - GRAB &&
      y + height >= a.y + GRAB &&
      y <= a.y + a.height - GRAB
    )
  })
}

function savedPosition(): { x: number; y: number } | null {
  try {
    const data = JSON.parse(readFileSync(positionPath(), 'utf-8')) as { x?: unknown; y?: unknown }
    const { x, y } = data
    if (typeof x !== 'number' || typeof y !== 'number') return null
    // ignore it if that spot is no longer on any screen (for example a removed monitor)
    const size = windowSize()
    const ok = visibleEnough(
      x,
      y,
      Math.round(size.width * content.scale),
      Math.round(size.height * content.scale)
    )
    return ok ? { x, y } : null
  } catch {
    return null
  }
}

// Moving the overlay by hand. Windows does not let a window with a drag area leave the top of the
// screen, so the overlay is moved by GKC itself while the mouse button is held on it.
let dragTimer: ReturnType<typeof setInterval> | null = null

function stopDrag(): void {
  if (dragTimer) clearInterval(dragTimer)
  dragTimer = null
}

function startDrag(): void {
  if (!overlayWindow || overlayWindow.isDestroyed() || clickThrough) return
  stopDrag()
  const start = screen.getCursorScreenPoint()
  const bounds = overlayWindow.getBounds()
  dragTimer = setInterval(() => {
    if (!overlayWindow || overlayWindow.isDestroyed()) return stopDrag()
    const now = screen.getCursorScreenPoint()
    let x = bounds.x + now.x - start.x
    let y = bounds.y + now.y - start.y
    const area = screen.getDisplayNearestPoint(now).workArea
    // keep a strip of the window on screen
    x = Math.min(Math.max(x, area.x + GRAB - bounds.width), area.x + area.width - GRAB)
    y = Math.min(Math.max(y, area.y + GRAB - bounds.height), area.y + area.height - GRAB)
    // setBounds with the old size, so the window never changes size while it moves
    overlayWindow.setBounds({ x, y, width: bounds.width, height: bounds.height })
  }, 8)
}

let lastSaved = ''
let watchTimer: ReturnType<typeof setInterval> | null = null

// Dragging a frameless window does not always send a move event on Windows, so the position is
// also checked once a second while the overlay is open, and saved when it closes.
function rememberPosition(): void {
  if (!overlayWindow || overlayWindow.isDestroyed()) return
  const [x, y] = overlayWindow.getPosition()
  const text = JSON.stringify({ x, y })
  if (text === lastSaved) return
  try {
    writeFileSync(positionPath(), text)
    lastSaved = text
  } catch {
    // saving is optional
  }
}

function stopWatching(): void {
  if (watchTimer) clearInterval(watchTimer)
  watchTimer = null
}

export function resetOverlayPosition(): void {
  lastSaved = ''
  try {
    rmSync(positionPath(), { force: true })
  } catch {
    // nothing to delete
  }
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    const spot = defaultPosition()
    overlayWindow.setPosition(spot.x, spot.y)
  }
}

export function openOverlay(): void {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.show()
    return
  }

  const spot = savedPosition() ?? defaultPosition()

  const initial = windowSize()
  overlayWindow = new BrowserWindow({
    width: Math.round(initial.width * content.scale),
    height: Math.round(initial.height * content.scale),
    x: spot.x,
    y: spot.y,
    transparent: true,
    frame: false,
    resizable: true,
    hasShadow: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // 'screen-saver' keeps the overlay above borderless fullscreen games
  overlayWindow.setAlwaysOnTop(true, 'screen-saver')

  overlayWindow.webContents.on('did-finish-load', applySize)

  overlayWindow.on('ready-to-show', () => {
    applyClickThrough()
    overlayWindow?.showInactive()
    broadcastState()
  })

  overlayWindow.on('moved', rememberPosition)
  overlayWindow.on('close', rememberPosition)
  stopWatching()
  watchTimer = setInterval(rememberPosition, 1000)

  overlayWindow.on('closed', () => {
    stopDrag()
    stopWatching()
    overlayWindow = null
    broadcastState()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    overlayWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '#overlay')
  } else {
    overlayWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'overlay' })
  }
}

export function closeOverlay(): void {
  if (overlayWindow && !overlayWindow.isDestroyed()) overlayWindow.close()
}

export function toggleOverlay(): void {
  if (getState().open) closeOverlay()
  else openOverlay()
}

export function setClickThrough(value: boolean): void {
  clickThrough = value
  applyClickThrough()
  broadcastState()
}

export function toggleClickThrough(): void {
  setClickThrough(!clickThrough)
}

export function registerOverlayIpc(): void {
  ipcMain.handle('overlay:get-state', () => getState())
  ipcMain.handle('overlay:get-content', () => content)
  ipcMain.on('overlay:set-content', (_event, patch: Partial<OverlayContent>) => {
    const safe: Partial<OverlayContent> = {}
    if (patch.mapUrl === null || typeof patch.mapUrl === 'string') safe.mapUrl = patch.mapUrl
    if (typeof patch.mapName === 'string') safe.mapName = patch.mapName
    if (typeof patch.mapVisible === 'boolean') safe.mapVisible = patch.mapVisible
    if (typeof patch.showDuel === 'boolean') safe.showDuel = patch.showDuel
    if (typeof patch.showStreak === 'boolean') safe.showStreak = patch.showStreak
    if (typeof patch.showTimers === 'boolean') safe.showTimers = patch.showTimers
    if (typeof patch.showBasicTimer === 'boolean') safe.showBasicTimer = patch.showBasicTimer
    if (typeof patch.scale === 'number') safe.scale = patch.scale
    if (typeof patch.opacity === 'number') safe.opacity = patch.opacity
    if (typeof patch.background === 'number') safe.background = patch.background
    if (typeof patch.size === 'number') safe.size = patch.size
    setOverlayContent(safe)
    if (
      (safe.mapVisible ||
        safe.showDuel ||
        safe.showStreak ||
        safe.showTimers ||
        safe.showBasicTimer) &&
      !getState().open
    )
      openOverlay()
  })
  ipcMain.on('overlay:drag', (_event, active: boolean) =>
    active === true ? startDrag() : stopDrag()
  )
  ipcMain.on('overlay:toggle', () => toggleOverlay())
  ipcMain.on('overlay:reset-position', () => resetOverlayPosition())
  ipcMain.on('overlay:set-click-through', (_event, value: boolean) => setClickThrough(value))
}
