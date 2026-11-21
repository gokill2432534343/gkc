// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { BrowserWindow, ipcMain } from 'electron'
import { readJson, writeJson } from './store'
import { notifyChange } from './bus'

// Tournament / league match: two teams, a list of sets (one killer game each) with the
// result of each set. The set score is counted from the winners you pick. GKC does not
// enforce any scoring rules, you enter what your league's rules give.

export type MatchSet = {
  id: string
  killer: string
  player: string
  map: string
  stages: number
  frees: number
  winner: 0 | 1 | null
}

export type MatchState = {
  title: string
  teams: [string, string]
  bestOf: number
  sets: MatchSet[]
}

export type MatchCommand =
  | { type: 'set-title'; title: string }
  | { type: 'set-team'; index: 0 | 1; name: string }
  | { type: 'set-best-of'; value: number }
  | { type: 'add-set' }
  | { type: 'update-set'; id: string; patch: Partial<Omit<MatchSet, 'id'>> }
  | { type: 'remove-set'; id: string }
  | { type: 'clear-sets' }

const MAX_SETS = 12

const initial = (): MatchState => ({
  title: '',
  teams: ['Team A', 'Team B'],
  bestOf: 3,
  sets: []
})

let state: MatchState = initial()

function text(value: unknown, max: number, fallback = ''): string {
  return typeof value === 'string' ? value.slice(0, max) : fallback
}

function number(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(Math.max(Math.round(value), min), max)
    : fallback
}

function cleanSet(value: unknown): MatchSet | null {
  const item = value as Partial<MatchSet> | null
  if (!item || typeof item.id !== 'string') return null
  return {
    id: item.id.slice(0, 64),
    killer: text(item.killer, 40),
    player: text(item.player, 30),
    map: text(item.map, 40),
    stages: number(item.stages, 0, 99, 0),
    frees: number(item.frees, 0, 4, 0),
    winner: item.winner === 0 || item.winner === 1 ? item.winner : null
  }
}

function load(): void {
  try {
    const saved = readJson('match.json') as Partial<MatchState>
    const teams = Array.isArray(saved.teams) ? saved.teams : []
    state = {
      title: text(saved.title, 50),
      teams: [text(teams[0], 30, 'Team A'), text(teams[1], 30, 'Team B')],
      bestOf: number(saved.bestOf, 1, 9, 3),
      sets: (Array.isArray(saved.sets) ? saved.sets : [])
        .map(cleanSet)
        .filter((item): item is MatchSet => item !== null)
        .slice(0, MAX_SETS)
    }
  } catch {
    state = initial()
  }
}

function commit(next: MatchState): void {
  state = next
  try {
    writeJson('match.json', state)
  } catch {
    // saving is optional
  }
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('match:state', state)
  }
  notifyChange()
}

function handle(command: MatchCommand): void {
  switch (command.type) {
    case 'set-title':
      return commit({ ...state, title: text(command.title, 50) })
    case 'set-team': {
      const teams: [string, string] = [...state.teams]
      teams[command.index === 1 ? 1 : 0] = text(command.name, 30)
      return commit({ ...state, teams })
    }
    case 'set-best-of':
      return commit({ ...state, bestOf: number(command.value, 1, 9, state.bestOf) })
    case 'add-set': {
      if (state.sets.length >= MAX_SETS) return
      const created: MatchSet = {
        id: crypto.randomUUID(),
        killer: '',
        player: '',
        map: '',
        stages: 0,
        frees: 0,
        winner: null
      }
      return commit({ ...state, sets: [...state.sets, created] })
    }
    case 'update-set':
      return commit({
        ...state,
        sets: state.sets.map((item) =>
          item.id === command.id
            ? (cleanSet({ ...item, ...command.patch, id: item.id }) ?? item)
            : item
        )
      })
    case 'remove-set':
      return commit({ ...state, sets: state.sets.filter((item) => item.id !== command.id) })
    case 'clear-sets':
      return commit({ ...state, sets: [] })
  }
}

export function getMatchState(): MatchState {
  return state
}

export function registerMatchIpc(): void {
  load()
  ipcMain.handle('match:get', () => state)
  ipcMain.on('match:command', (_event, command: MatchCommand) => {
    if (command && typeof command.type === 'string') handle(command)
  })
}
