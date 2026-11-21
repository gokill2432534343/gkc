// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { readJson, writeJson } from './store'
import { is } from '@electron-toolkit/utils'

export type CrosshairMark = {
  style: string
  color: string
  size: number
  thickness: number
  gap: number
  opacity: number
  outline: boolean
  offsetX: number
  offsetY: number
  ticks: number
  tickSpacing: number
}

// The first crosshair is stored flat, more crosshairs (for example a second hand) are extras.
export type CrosshairSettings = CrosshairMark & {
  visible: boolean
  extras: CrosshairMark[]
}

const MAX_EXTRAS = 3

const defaults: CrosshairSettings = {
  visible: false,
  extras: [],
  style: 'gap-cross',
  color: '#e8e8ea',
  size: 48,
  thickness: 3,
  gap: 8,
  opacity: 1,
  outline: true,
  offsetX: 0,
  offsetY: 0,
  ticks: 0,
  tickSpacing: 6
}

export type CrosshairProfile = Omit<CrosshairSettings, 'visible'>

export type ProfileState = {
  profiles: Record<string, CrosshairProfile>
  activeKiller: string
}

let settings: CrosshairSettings = { ...defaults }
let profileState: ProfileState = { profiles: {}, activeKiller: '' }
let crosshairWindow: BrowserWindow | null = null

function load(): void {
  try {
    const saved = readJson('crosshair.json') as Partial<CrosshairSettings>
    settings = {
      ...defaults,
      ...saved,
      extras: cleanExtras(saved.extras),
      visible: false
    }
  } catch {
    settings = { ...defaults }
  }
}

function loadProfiles(): void {
  try {
    const saved = readJson('crosshair-profiles.json') as Partial<ProfileState>
    profileState = { profiles: saved.profiles ?? {}, activeKiller: saved.activeKiller ?? '' }
  } catch {
    profileState = { profiles: {}, activeKiller: '' }
  }
}

function broadcastProfiles(): void {
  try {
    writeJson('crosshair-profiles.json', profileState)
  } catch {
    // saving is optional
  }
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('crosshair:profiles', profileState)
  }
}

function save(): void {
  try {
    writeJson('crosshair.json', settings)
  } catch {
    // saving is optional
  }
}

function broadcast(): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('crosshair:state', settings)
  }
}

function allMarks(): CrosshairMark[] {
  return [settings, ...settings.extras]
}

function placeWindow(): void {
  if (!crosshairWindow || crosshairWindow.isDestroyed()) return
  const bounds = screen.getPrimaryDisplay().bounds
  // one window that covers every crosshair, the page draws each one inside it
  const marks = allMarks()
  const minX = Math.min(...marks.map((mark) => mark.offsetX - mark.size / 2))
  const maxX = Math.max(...marks.map((mark) => mark.offsetX + mark.size / 2))
  const minY = Math.min(...marks.map((mark) => mark.offsetY - mark.size / 2))
  const maxY = Math.max(...marks.map((mark) => mark.offsetY + mark.size / 2))
  crosshairWindow.setBounds({
    x: Math.round(bounds.x + bounds.width / 2 + minX),
    y: Math.round(bounds.y + bounds.height / 2 + minY),
    width: Math.max(1, Math.round(maxX - minX)),
    height: Math.max(1, Math.round(maxY - minY))
  })
}

function showWindow(): void {
  if (crosshairWindow && !crosshairWindow.isDestroyed()) return

  crosshairWindow = new BrowserWindow({
    width: settings.size,
    height: settings.size,
    transparent: true,
    frame: false,
    resizable: false,
    movable: false,
    hasShadow: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: false,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  crosshairWindow.setAlwaysOnTop(true, 'screen-saver')
  crosshairWindow.setIgnoreMouseEvents(true)
  placeWindow()

  crosshairWindow.on('ready-to-show', () => crosshairWindow?.showInactive())
  crosshairWindow.on('closed', () => {
    crosshairWindow = null
    if (settings.visible) {
      settings = { ...settings, visible: false }
      broadcast()
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    crosshairWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '#crosshair')
  } else {
    crosshairWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'crosshair' })
  }
}

function hideWindow(): void {
  if (crosshairWindow && !crosshairWindow.isDestroyed()) crosshairWindow.close()
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function cleanMark(patch: Partial<CrosshairMark>, base: CrosshairMark): CrosshairMark {
  const next = { ...base }
  if (typeof patch.style === 'string' && /^[a-z-]{1,24}$/.test(patch.style))
    next.style = patch.style
  if (typeof patch.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(patch.color))
    next.color = patch.color
  if (typeof patch.size === 'number') next.size = clamp(Math.round(patch.size), 24, 160)
  if (typeof patch.thickness === 'number') next.thickness = clamp(patch.thickness, 1, 8)
  if (typeof patch.gap === 'number') next.gap = clamp(patch.gap, 0, 30)
  if (typeof patch.opacity === 'number') next.opacity = clamp(patch.opacity, 0.3, 1)
  if (typeof patch.outline === 'boolean') next.outline = patch.outline
  if (typeof patch.offsetX === 'number') next.offsetX = clamp(Math.round(patch.offsetX), -600, 600)
  if (typeof patch.offsetY === 'number') next.offsetY = clamp(Math.round(patch.offsetY), -600, 600)
  if (typeof patch.ticks === 'number') next.ticks = clamp(Math.round(patch.ticks), 0, 4)
  if (typeof patch.tickSpacing === 'number') next.tickSpacing = clamp(patch.tickSpacing, 4, 12)
  return next
}

function markOf(source: CrosshairMark): CrosshairMark {
  return {
    style: source.style,
    color: source.color,
    size: source.size,
    thickness: source.thickness,
    gap: source.gap,
    opacity: source.opacity,
    outline: source.outline,
    offsetX: source.offsetX,
    offsetY: source.offsetY,
    ticks: source.ticks,
    tickSpacing: source.tickSpacing
  }
}

function cleanExtras(value: unknown): CrosshairMark[] {
  if (!Array.isArray(value)) return []
  return value
    .slice(0, MAX_EXTRAS)
    .map((item) => cleanMark((item ?? {}) as Partial<CrosshairMark>, markOf(defaults)))
}

function update(patch: Partial<CrosshairSettings>): void {
  const next: CrosshairSettings = { ...settings, ...cleanMark(patch, settings) }
  if (typeof patch.visible === 'boolean') next.visible = patch.visible
  if (patch.extras !== undefined) next.extras = cleanExtras(patch.extras)
  settings = next

  if (settings.visible) {
    showWindow()
    placeWindow()
  } else {
    hideWindow()
  }
  save()
  broadcast()
}

export function nudgeCrosshair(dx: number, dy: number): void {
  update({ offsetX: settings.offsetX + dx, offsetY: settings.offsetY + dy })
}

function currentProfile(): CrosshairProfile {
  return { ...markOf(settings), extras: settings.extras.map(markOf) }
}

function selectKiller(id: string): void {
  profileState = { ...profileState, activeKiller: id }
  const profile = profileState.profiles[id]
  if (profile) update({ ...profile, extras: profile.extras ?? [] })
  broadcastProfiles()
}

export function cycleCrosshairProfile(direction: 1 | -1): void {
  const ids = Object.keys(profileState.profiles).sort()
  if (ids.length === 0) return
  const index = ids.indexOf(profileState.activeKiller)
  const next =
    index === -1
      ? direction > 0
        ? 0
        : ids.length - 1
      : (index + direction + ids.length) % ids.length
  selectKiller(ids[next])
}

export function isCrosshairVisible(): boolean {
  return settings.visible
}

export function setCrosshairVisible(visible: boolean): void {
  update({ visible })
}

export function toggleCrosshair(): void {
  update({ visible: !settings.visible })
}

export function registerCrosshairIpc(): void {
  load()
  loadProfiles()
  ipcMain.handle('crosshair:get', () => settings)
  ipcMain.handle('crosshair:get-profiles', () => profileState)
  ipcMain.on('crosshair:select-killer', (_event, id: string) => {
    if (typeof id === 'string' && /^[a-z0-9-]{0,64}$/.test(id)) selectKiller(id)
  })
  ipcMain.on('crosshair:save-profile', (_event, id: string) => {
    if (typeof id !== 'string' || !/^[a-z0-9-]{1,64}$/.test(id)) return
    profileState = {
      activeKiller: id,
      profiles: { ...profileState.profiles, [id]: currentProfile() }
    }
    broadcastProfiles()
  })
  ipcMain.on('crosshair:remove-profile', (_event, id: string) => {
    const profiles = { ...profileState.profiles }
    delete profiles[id]
    profileState = { ...profileState, profiles }
    broadcastProfiles()
  })
  ipcMain.on('crosshair:set', (_event, patch: Partial<CrosshairSettings>) => update(patch))
}
