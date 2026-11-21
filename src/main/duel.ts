// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { BrowserWindow, ipcMain } from 'electron'
import { notifyChange } from './bus'
import { readJson, writeJson } from './store'

export type WinnerRule = 'lowest' | 'highest'
export type Precision = 'ms' | 'cs' | 's'

export type DuelState = {
  names: [string, string]
  scores: [number, number]
  // time already banked for each side, in milliseconds
  elapsed: [number, number]
  active: 0 | 1
  // epoch ms when the active side started running, or null while paused
  runningSince: number | null
  autoScore: boolean
  winnerRule: WinnerRule
  warnEnabled: boolean
  warnNear: number
  warnClose: number
  blink: boolean
  precision: Precision
  title: string
  bestOf: number
  accent: string
  nameBg: 'dark' | 'black' | 'light'
}

type DuelCommand =
  | { type: 'toggle' }
  | { type: 'switch' }
  | { type: 'reset-times' }
  | { type: 'reset-all' }
  | { type: 'end-round' }
  | { type: 'set-name'; side: number; name: string }
  | { type: 'score'; side: number; delta: number }
  | { type: 'set-active'; side: number }
  | { type: 'set-auto-score'; value: boolean }
  | { type: 'set-winner-rule'; value: WinnerRule }
  | { type: 'set-warning'; enabled?: boolean; blink?: boolean; near?: number; close?: number }
  | { type: 'set-precision'; value: Precision }
  | { type: 'set-match'; title?: string; bestOf?: number }
  | { type: 'set-look'; accent?: string; nameBg?: string }

const initial: DuelState = {
  names: ['Player 1', 'Player 2'],
  scores: [0, 0],
  elapsed: [0, 0],
  active: 0,
  runningSince: null,
  autoScore: false,
  winnerRule: 'lowest',
  warnEnabled: true,
  warnNear: 10,
  warnClose: 3,
  blink: true,
  precision: 'ms',
  title: '',
  bestOf: 3,
  accent: '#b33a3a',
  nameBg: 'dark'
}

let state: DuelState = { ...initial }

function load(): void {
  try {
    const saved = readJson('duel.json') as Partial<DuelState>
    state = {
      ...initial,
      names: saved.names ?? initial.names,
      scores: saved.scores ?? initial.scores,
      autoScore: saved.autoScore ?? initial.autoScore,
      winnerRule: saved.winnerRule ?? initial.winnerRule,
      warnEnabled: saved.warnEnabled ?? initial.warnEnabled,
      warnNear: saved.warnNear ?? initial.warnNear,
      warnClose: saved.warnClose ?? initial.warnClose,
      blink: saved.blink ?? initial.blink,
      precision: saved.precision ?? initial.precision,
      title: saved.title ?? initial.title,
      bestOf: saved.bestOf ?? initial.bestOf,
      accent:
        typeof saved.accent === 'string' && /^#[0-9a-fA-F]{6}$/.test(saved.accent)
          ? saved.accent
          : initial.accent,
      nameBg: saved.nameBg === 'black' || saved.nameBg === 'light' ? saved.nameBg : initial.nameBg
    }
  } catch {
    state = { ...initial }
  }
}

function save(): void {
  try {
    const {
      names,
      scores,
      autoScore,
      winnerRule,
      warnEnabled,
      warnNear,
      warnClose,
      blink,
      precision,
      title,
      bestOf,
      accent,
      nameBg
    } = state
    writeJson('duel.json', {
      names,
      scores,
      autoScore,
      winnerRule,
      warnEnabled,
      warnNear,
      warnClose,
      blink,
      precision,
      title,
      bestOf,
      accent,
      nameBg
    })
  } catch {
    // saving is optional
  }
}

function commit(next: DuelState): void {
  state = next
  save()
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('duel:state', state)
  }
  notifyChange()
}

function bank(current: DuelState): DuelState {
  if (current.runningSince === null) return current
  const elapsed: [number, number] = [...current.elapsed]
  elapsed[current.active] += Date.now() - current.runningSince
  return { ...current, elapsed, runningSince: null }
}

export function getDuelState(): DuelState {
  return state
}

export function toggleDuel(): void {
  if (state.runningSince === null) commit({ ...state, runningSince: Date.now() })
  else commit(bank(state))
}

export function switchDuel(): void {
  const wasRunning = state.runningSince !== null
  const banked = bank(state)
  commit({
    ...banked,
    active: banked.active === 0 ? 1 : 0,
    runningSince: wasRunning ? Date.now() : null
  })
}

export function endDuelRound(): void {
  const banked = bank(state)
  const scores: [number, number] = [...banked.scores]
  const [a, b] = banked.elapsed
  if (banked.autoScore && a !== b && (a > 0 || b > 0)) {
    const firstWins = banked.winnerRule === 'lowest' ? a < b : a > b
    scores[firstWins ? 0 : 1] += 1
  }
  commit({ ...banked, scores, elapsed: [0, 0], active: 0, runningSince: null })
}

function side(value: number): 0 | 1 {
  return value === 1 ? 1 : 0
}

function handle(command: DuelCommand): void {
  switch (command.type) {
    case 'toggle':
      toggleDuel()
      break
    case 'switch':
      switchDuel()
      break
    case 'end-round':
      endDuelRound()
      break
    case 'reset-times':
      commit({ ...state, elapsed: [0, 0], active: 0, runningSince: null })
      break
    case 'reset-all':
      commit({ ...state, scores: [0, 0], elapsed: [0, 0], active: 0, runningSince: null })
      break
    case 'set-name': {
      const names: [string, string] = [...state.names]
      names[side(command.side)] = String(command.name).slice(0, 24)
      commit({ ...state, names })
      break
    }
    case 'score': {
      const scores: [number, number] = [...state.scores]
      const index = side(command.side)
      scores[index] = Math.max(0, Math.min(99, scores[index] + (command.delta > 0 ? 1 : -1)))
      commit({ ...state, scores })
      break
    }
    case 'set-active': {
      const wasRunning = state.runningSince !== null
      const banked = bank(state)
      commit({
        ...banked,
        active: side(command.side),
        runningSince: wasRunning ? Date.now() : null
      })
      break
    }
    case 'set-auto-score':
      commit({ ...state, autoScore: command.value === true })
      break
    case 'set-warning': {
      const near = Math.min(Math.max(Math.round(command.near ?? state.warnNear), 1), 60)
      const close = Math.min(Math.max(Math.round(command.close ?? state.warnClose), 1), near)
      commit({
        ...state,
        warnEnabled: command.enabled ?? state.warnEnabled,
        blink: command.blink ?? state.blink,
        warnNear: near,
        warnClose: close
      })
      break
    }
    case 'set-match':
      commit({
        ...state,
        title: command.title !== undefined ? String(command.title).slice(0, 40) : state.title,
        bestOf:
          command.bestOf !== undefined
            ? Math.min(Math.max(Math.round(command.bestOf), 1), 15)
            : state.bestOf
      })
      break
    case 'set-look':
      commit({
        ...state,
        accent:
          typeof command.accent === 'string' && /^#[0-9a-fA-F]{6}$/.test(command.accent)
            ? command.accent
            : state.accent,
        nameBg:
          command.nameBg === 'black' || command.nameBg === 'light' || command.nameBg === 'dark'
            ? command.nameBg
            : state.nameBg
      })
      break
    case 'set-precision':
      commit({
        ...state,
        precision: command.value === 's' || command.value === 'cs' ? command.value : 'ms'
      })
      break
    case 'set-winner-rule':
      commit({ ...state, winnerRule: command.value === 'highest' ? 'highest' : 'lowest' })
      break
  }
}

export function registerDuelIpc(): void {
  load()
  ipcMain.handle('duel:get-state', () => state)
  ipcMain.on('duel:command', (_event, command: DuelCommand) => handle(command))
}
