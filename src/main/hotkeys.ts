// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { globalShortcut, ipcMain } from 'electron'
import { readJson, writeJson } from './store'
import { toggleClickThrough, toggleMapVisible, toggleOverlay } from './overlay'
import { recordResult, toggleStreakRole, undoResult } from './streak'
import { toggleTimerAt } from './customTimers'
import { startUnhookTimer } from './unhook'
import { endDuelRound, switchDuel, toggleDuel } from './duel'
import { cycleCrosshairProfile, nudgeCrosshair, toggleCrosshair } from './crosshair'
import { cycleOverlayProfile } from './overlayProfiles'
import { runManualDetect } from './mapDetect'
import { resetTimer, toggleTimer } from './timer'

export type HotkeyAction =
  | 'toggleOverlay'
  | 'toggleClickThrough'
  | 'toggleTimer'
  | 'resetTimer'
  | 'toggleMap'
  | 'toggleCrosshair'
  | 'detectMap'
  | 'unhookTimer'
  | 'profileNext'
  | 'profilePrev'
  | 'duelToggle'
  | 'duelSwitch'
  | 'duelEndRound'
  | 'crosshairNextKiller'
  | 'crosshairPrevKiller'
  | 'streakWin'
  | 'streakLoss'
  | 'streakUndo'
  | 'streakRole'
  | 'customTimer1'
  | 'customTimer2'
  | 'customTimer3'
  | 'customTimer4'
  | 'nudgeUp'
  | 'nudgeDown'
  | 'nudgeLeft'
  | 'nudgeRight'
export type HotkeyMap = Record<HotkeyAction, string>

const defaults: HotkeyMap = {
  toggleOverlay: 'Control+Shift+O',
  toggleClickThrough: 'Control+Shift+C',
  toggleTimer: 'Control+Shift+T',
  resetTimer: 'Control+Shift+R',
  toggleMap: 'Control+Shift+M',
  toggleCrosshair: 'Control+Shift+X',
  detectMap: 'Control+Shift+D',
  unhookTimer: 'Control+Alt+U',
  profileNext: 'Control+Alt+P',
  profilePrev: 'Control+Alt+O',
  duelToggle: 'Control+Shift+1',
  duelSwitch: 'Control+Shift+2',
  duelEndRound: 'Control+Shift+3',
  crosshairNextKiller: 'Control+Alt+PageDown',
  crosshairPrevKiller: 'Control+Alt+PageUp',
  streakWin: 'Control+Alt+W',
  streakLoss: 'Control+Alt+L',
  streakUndo: 'Control+Alt+Z',
  streakRole: 'Control+Alt+R',
  customTimer1: 'Control+Alt+1',
  customTimer2: 'Control+Alt+2',
  customTimer3: 'Control+Alt+3',
  customTimer4: 'Control+Alt+4',
  nudgeUp: 'Control+Alt+num8',
  nudgeDown: 'Control+Alt+num2',
  nudgeLeft: 'Control+Alt+num4',
  nudgeRight: 'Control+Alt+num6'
}

const handlers: Record<HotkeyAction, () => void> = {
  toggleOverlay,
  toggleClickThrough,
  toggleTimer,
  resetTimer,
  toggleMap: toggleMapVisible,
  toggleCrosshair,
  detectMap: () => void runManualDetect(),
  unhookTimer: () => startUnhookTimer(),
  profileNext: () => cycleOverlayProfile(1),
  profilePrev: () => cycleOverlayProfile(-1),
  duelToggle: toggleDuel,
  duelSwitch: switchDuel,
  duelEndRound: endDuelRound,
  crosshairNextKiller: () => cycleCrosshairProfile(1),
  crosshairPrevKiller: () => cycleCrosshairProfile(-1),
  streakWin: () => recordResult('win'),
  streakLoss: () => recordResult('loss'),
  streakUndo: undoResult,
  streakRole: toggleStreakRole,
  customTimer1: () => toggleTimerAt(0),
  customTimer2: () => toggleTimerAt(1),
  customTimer3: () => toggleTimerAt(2),
  customTimer4: () => toggleTimerAt(3),
  nudgeUp: () => nudgeCrosshair(0, -1),
  nudgeDown: () => nudgeCrosshair(0, 1),
  nudgeLeft: () => nudgeCrosshair(-1, 0),
  nudgeRight: () => nudgeCrosshair(1, 0)
}

let current: HotkeyMap = { ...defaults }

function load(): HotkeyMap {
  try {
    const saved = readJson('hotkeys.json') as Partial<HotkeyMap>
    // mouse button hotkeys from older versions are gone, those actions go back to their default
    for (const key of Object.keys(saved) as HotkeyAction[]) {
      if (/Mouse[345]$/.test(String(saved[key]))) delete saved[key]
    }
    return { ...defaults, ...saved }
  } catch {
    return { ...defaults }
  }
}

function save(): void {
  try {
    writeJson('hotkeys.json', current)
  } catch {
    // saving is optional, the hotkeys keep working for this session
  }
}

function register(action: HotkeyAction, accelerator: string): boolean {
  if (accelerator === '') return true
  try {
    return globalShortcut.register(accelerator, handlers[action])
  } catch {
    return false
  }
}

function unregister(accelerator: string): void {
  if (accelerator !== '' && globalShortcut.isRegistered(accelerator)) {
    globalShortcut.unregister(accelerator)
  }
}

export function registerHotkeys(): void {
  current = load()
  for (const action of Object.keys(current) as HotkeyAction[]) {
    register(action, current[action])
  }

  ipcMain.handle('hotkeys:get', () => current)

  ipcMain.handle('hotkeys:set', (_event, action: HotkeyAction, accelerator: string) => {
    if (!(action in handlers)) return { ok: false, error: 'Unknown action.' }
    if (typeof accelerator !== 'string' || accelerator.length > 60) {
      return { ok: false, error: 'This shortcut is not valid.' }
    }

    const other = (Object.keys(current) as HotkeyAction[]).find(
      (key) => key !== action && current[key] !== '' && current[key] === accelerator
    )
    if (other) return { ok: false, error: 'This shortcut is already used by another action.' }

    const previous = current[action]
    unregister(previous)
    if (!register(action, accelerator)) {
      register(action, previous)
      return {
        ok: false,
        error: 'This shortcut is not available. Another app may be using it.'
      }
    }
    current = { ...current, [action]: accelerator }
    save()
    return { ok: true, hotkeys: current }
  })

  ipcMain.handle('hotkeys:reset', () => {
    for (const action of Object.keys(current) as HotkeyAction[]) unregister(current[action])
    current = { ...defaults }
    for (const action of Object.keys(current) as HotkeyAction[]) register(action, current[action])
    save()
    return current
  })
}

export function unregisterHotkeys(): void {
  globalShortcut.unregisterAll()
}
