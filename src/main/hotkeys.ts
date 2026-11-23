// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { globalShortcut, ipcMain } from 'electron'
import { readJson, writeJson } from './store'
import { toggleClickThrough, toggleMapVisible, toggleOverlay } from './overlay'
import { recordResult, toggleStreakRole, undoResult } from './streak'
import { toggleTimerAt } from './customTimers'
import { startSaveTimerAt } from './saveTimers'
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
  | 'saveTimer1'
  | 'saveTimer2'
  | 'saveTimer3'
  | 'saveTimer4'
  | 'saveTimer5'
  | 'saveTimer6'
  | 'saveTimer7'
  | 'saveTimer8'
  | 'saveTimer9'
  | 'saveTimer10'
  | 'nudgeUp'
  | 'nudgeDown'
  | 'nudgeLeft'
  | 'nudgeRight'
export type HotkeyMap = Record<HotkeyAction, string>

// New installs start without hotkeys, so nothing clashes with other programs. Every hotkey is
// set by the player in Settings, Hotkeys. Keys the player sets are kept between starts.
const defaults: HotkeyMap = {
  toggleOverlay: '',
  toggleClickThrough: '',
  toggleTimer: '',
  resetTimer: '',
  toggleMap: '',
  toggleCrosshair: '',
  detectMap: '',
  unhookTimer: '',
  profileNext: '',
  profilePrev: '',
  duelToggle: '',
  duelSwitch: '',
  duelEndRound: '',
  crosshairNextKiller: '',
  crosshairPrevKiller: '',
  streakWin: '',
  streakLoss: '',
  streakUndo: '',
  streakRole: '',
  customTimer1: '',
  customTimer2: '',
  customTimer3: '',
  customTimer4: '',
  saveTimer1: '',
  saveTimer2: '',
  saveTimer3: '',
  saveTimer4: '',
  saveTimer5: '',
  saveTimer6: '',
  saveTimer7: '',
  saveTimer8: '',
  saveTimer9: '',
  saveTimer10: '',
  nudgeUp: '',
  nudgeDown: '',
  nudgeLeft: '',
  nudgeRight: ''
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
  saveTimer1: () => startSaveTimerAt(0),
  saveTimer2: () => startSaveTimerAt(1),
  saveTimer3: () => startSaveTimerAt(2),
  saveTimer4: () => startSaveTimerAt(3),
  saveTimer5: () => startSaveTimerAt(4),
  saveTimer6: () => startSaveTimerAt(5),
  saveTimer7: () => startSaveTimerAt(6),
  saveTimer8: () => startSaveTimerAt(7),
  saveTimer9: () => startSaveTimerAt(8),
  saveTimer10: () => startSaveTimerAt(9),
  nudgeUp: () => nudgeCrosshair(0, -1),
  nudgeDown: () => nudgeCrosshair(0, 1),
  nudgeLeft: () => nudgeCrosshair(-1, 0),
  nudgeRight: () => nudgeCrosshair(1, 0)
}

let current: HotkeyMap = { ...defaults }

function load(): HotkeyMap {
  try {
    // one time only: earlier versions saved their old default keys, so everything starts unset
    if (!readJson('hotkeys-cleared.json')) {
      writeJson('hotkeys-cleared.json', { done: true })
      writeJson('hotkeys.json', defaults)
      return { ...defaults }
    }
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
