// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { BrowserWindow, ipcMain } from 'electron'
import { readJson, writeJson } from './store'
import { getOverlayContent, openOverlay, setOverlayContent } from './overlay'
import { isCrosshairVisible, setCrosshairVisible } from './crosshair'
import { getStreakState, setStreakRole } from './streak'
import { isReshadeEnabled, setReshadeEnabled } from './reshade'
import { starterProfiles } from './starterProfiles'
import type { Role } from './streak'

// An overlay profile is a saved setup of the overlay: which panels are shown, the map opacity
// and size, whether the crosshair is on, whether ReShade switches presets by map, and whether the
// streak tracker is on killer or survivor.

export type OverlayProfile = {
  id: string
  name: string
  mapVisible: boolean
  showDuel: boolean
  showStreak: boolean
  showTimers: boolean
  showBasicTimer: boolean
  showSaveTimers: boolean
  saveTimersAlways: boolean
  scale: number
  opacity: number
  size: number
  background: number
  crosshair: boolean
  // switch ReShade presets by map while this profile is active
  reshade: boolean
  role: Role
}

export type OverlayProfileState = {
  profiles: OverlayProfile[]
  activeId: string
}

const MAX_PROFILES = 10

function starter(): OverlayProfileState {
  return { activeId: '', profiles: starterProfiles() }
}

let state: OverlayProfileState = { profiles: [], activeId: '' }

function clean(value: unknown): OverlayProfile | null {
  const item = value as Partial<OverlayProfile> | null
  if (!item || typeof item.id !== 'string' || typeof item.name !== 'string') return null
  return {
    id: item.id.slice(0, 64),
    name: item.name.slice(0, 24) || 'Profile',
    mapVisible: item.mapVisible === true,
    showDuel: item.showDuel === true,
    showStreak: item.showStreak === true,
    showTimers: item.showTimers === true,
    showBasicTimer: item.showBasicTimer === true,
    showSaveTimers: item.showSaveTimers === true,
    saveTimersAlways: item.saveTimersAlways !== false,
    scale: typeof item.scale === 'number' ? Math.min(Math.max(item.scale, 0.6), 2) : 1,
    opacity: typeof item.opacity === 'number' ? Math.min(Math.max(item.opacity, 0.2), 1) : 0.9,
    size: typeof item.size === 'number' ? Math.min(Math.max(Math.round(item.size), 150), 900) : 480,
    background: typeof item.background === 'number' ? Math.min(Math.max(item.background, 0), 1) : 1,
    crosshair: item.crosshair === true,
    reshade: item.reshade === true,
    role: item.role === 'survivor' ? 'survivor' : 'killer'
  }
}

function load(): void {
  try {
    const saved = readJson('overlay-profiles.json') as Partial<OverlayProfileState>
    const profiles = (saved.profiles ?? [])
      .map(clean)
      .filter((item): item is OverlayProfile => item !== null)
      .slice(0, MAX_PROFILES)
    state = { profiles, activeId: typeof saved.activeId === 'string' ? saved.activeId : '' }
  } catch {
    state = starter()
  }
}

function commit(next: OverlayProfileState): void {
  state = next
  try {
    writeJson('overlay-profiles.json', state)
  } catch {
    // saving is optional
  }
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('oprofiles:state', state)
  }
}

function snapshot(id: string, name: string, crosshair: boolean): OverlayProfile {
  const content = getOverlayContent()
  return {
    id,
    name: name.trim().slice(0, 24) || 'Profile',
    mapVisible: content.mapVisible,
    showDuel: content.showDuel,
    showStreak: content.showStreak,
    showTimers: content.showTimers,
    showBasicTimer: content.showBasicTimer,
    showSaveTimers: content.showSaveTimers,
    saveTimersAlways: content.saveTimersAlways,
    scale: content.scale,
    opacity: content.opacity,
    size: content.size,
    background: content.background,
    crosshair,
    reshade: isReshadeEnabled(),
    role: getStreakState().role
  }
}

export function applyOverlayProfile(id: string): void {
  const profile = state.profiles.find((item) => item.id === id)
  if (!profile) return
  const hasMap = getOverlayContent().mapUrl !== null
  setOverlayContent({
    mapVisible: profile.mapVisible && hasMap,
    showDuel: profile.showDuel,
    showStreak: profile.showStreak,
    showTimers: profile.showTimers,
    showBasicTimer: profile.showBasicTimer,
    showSaveTimers: profile.showSaveTimers,
    saveTimersAlways: profile.saveTimersAlways,
    scale: profile.scale,
    opacity: profile.opacity,
    size: profile.size,
    background: profile.background
  })
  setCrosshairVisible(profile.crosshair)
  setReshadeEnabled(profile.reshade)
  setStreakRole(profile.role)
  if (
    profile.showDuel ||
    profile.showStreak ||
    profile.showTimers ||
    profile.showBasicTimer ||
    profile.showSaveTimers ||
    (profile.mapVisible && hasMap)
  )
    openOverlay()
  commit({ ...state, activeId: id })
}

export function cycleOverlayProfile(direction: 1 | -1): void {
  const count = state.profiles.length
  if (count === 0) return
  const index = state.profiles.findIndex((item) => item.id === state.activeId)
  const next = index === -1 ? (direction > 0 ? 0 : count - 1) : (index + direction + count) % count
  applyOverlayProfile(state.profiles[next].id)
}

export function registerOverlayProfilesIpc(): void {
  load()

  ipcMain.handle('oprofiles:get', () => state)
  ipcMain.on('oprofiles:apply', (_event, id: string) => {
    if (typeof id === 'string') applyOverlayProfile(id)
  })
  // overwrite an existing profile with what is on screen now
  ipcMain.on('oprofiles:update', (_event, id: string) => {
    const old = state.profiles.find((item) => item.id === id)
    if (!old) return
    commit({
      ...state,
      profiles: state.profiles.map((item) =>
        item.id === id ? snapshot(id, old.name, isCrosshairVisible()) : item
      )
    })
  })
  ipcMain.on('oprofiles:create', (_event, name: string) => {
    if (typeof name !== 'string' || state.profiles.length >= MAX_PROFILES) return
    const id = crypto.randomUUID()
    commit({
      profiles: [...state.profiles, snapshot(id, name, isCrosshairVisible())],
      activeId: id
    })
  })
  ipcMain.on('oprofiles:rename', (_event, id: string, name: string) => {
    if (typeof id !== 'string' || typeof name !== 'string') return
    commit({
      ...state,
      profiles: state.profiles.map((item) =>
        item.id === id ? { ...item, name: name.trim().slice(0, 24) || item.name } : item
      )
    })
  })
  ipcMain.on('oprofiles:remove', (_event, id: string) => {
    commit({
      profiles: state.profiles.filter((item) => item.id !== id),
      activeId: state.activeId === id ? '' : state.activeId
    })
  })
}
