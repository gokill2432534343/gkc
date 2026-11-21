// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { BrowserWindow, ipcMain } from 'electron'
import { notifyChange } from './bus'

export type TimerState = {
  duration: number
  remaining: number
  running: boolean
}

type TimerCommand =
  { type: 'toggle' } | { type: 'reset' } | { type: 'set-duration'; seconds: number }

let state: TimerState = { duration: 720, remaining: 720, running: false }
let interval: NodeJS.Timeout | null = null

function broadcast(): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('timer:state', state)
  }
  notifyChange()
}

function stopTicking(): void {
  if (interval) clearInterval(interval)
  interval = null
}

function startTicking(): void {
  stopTicking()
  interval = setInterval(() => {
    const remaining = Math.max(state.remaining - 1, 0)
    state = { ...state, remaining, running: remaining > 0 }
    if (remaining === 0) stopTicking()
    broadcast()
  }, 1000)
}

export function getTimerState(): TimerState {
  return state
}

export function toggleTimer(): void {
  if (state.running) {
    state = { ...state, running: false }
    stopTicking()
  } else if (state.remaining > 0) {
    state = { ...state, running: true }
    startTicking()
  }
  broadcast()
}

export function resetTimer(): void {
  stopTicking()
  state = { ...state, remaining: state.duration, running: false }
  broadcast()
}

function setDuration(seconds: number): void {
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 6 * 3600) return
  stopTicking()
  state = { duration: Math.round(seconds), remaining: Math.round(seconds), running: false }
  broadcast()
}

export function registerTimerIpc(): void {
  ipcMain.handle('timer:get-state', () => state)
  ipcMain.on('timer:command', (_event, command: TimerCommand) => {
    if (command.type === 'toggle') toggleTimer()
    else if (command.type === 'reset') resetTimer()
    else if (command.type === 'set-duration') setDuration(command.seconds)
  })
}
