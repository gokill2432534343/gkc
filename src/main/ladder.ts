// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { BrowserWindow, ipcMain } from 'electron'
import { readJson, writeJson } from './store'
import { randomUUID } from 'crypto'
import { notifyChange } from './bus'

export type LadderMatch = {
  id: string
  opponent: string
  result: 'win' | 'loss'
  // free text such as "2-1" (optional)
  score: string
  at: number
}

export type LadderState = {
  title: string
  rank: number | null
  points: number
  matches: LadderMatch[]
}

type LadderCommand =
  | { type: 'set-title'; title: string }
  | { type: 'set-rank'; rank: number | null }
  | { type: 'set-points'; points: number }
  | { type: 'add-match'; opponent: string; result: 'win' | 'loss'; score?: string }
  | { type: 'remove-match'; id: string }
  | { type: 'reset' }

const initial = (): LadderState => ({ title: 'Ladder', rank: null, points: 0, matches: [] })

let state: LadderState = initial()

function load(): void {
  try {
    const saved = readJson('ladder.json') as Partial<LadderState>
    state = {
      title: typeof saved.title === 'string' ? saved.title : 'Ladder',
      rank: typeof saved.rank === 'number' ? saved.rank : null,
      points: typeof saved.points === 'number' ? saved.points : 0,
      matches: Array.isArray(saved.matches) ? saved.matches.slice(0, 50) : []
    }
  } catch {
    state = initial()
  }
}

function commit(next: LadderState): void {
  state = next
  try {
    writeJson('ladder.json', state)
  } catch {
    // saving is optional
  }
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('ladder:state', state)
  }
  notifyChange()
}

export function getLadderState(): LadderState {
  return state
}

function handle(command: LadderCommand): void {
  switch (command.type) {
    case 'set-title':
      commit({ ...state, title: String(command.title).slice(0, 30) })
      break
    case 'set-rank': {
      const rank =
        command.rank === null || !Number.isFinite(command.rank)
          ? null
          : Math.min(Math.max(Math.round(command.rank), 1), 99999)
      commit({ ...state, rank })
      break
    }
    case 'set-points':
      commit({
        ...state,
        points: Math.min(Math.max(Math.round(command.points) || 0, -99999), 999999)
      })
      break
    case 'add-match':
      commit({
        ...state,
        // newest first, keeps the last 50
        matches: [
          {
            id: randomUUID(),
            opponent: String(command.opponent || 'Opponent').slice(0, 24),
            result: command.result === 'win' ? ('win' as const) : ('loss' as const),
            score: String(command.score ?? '').slice(0, 10),
            at: Date.now()
          },
          ...state.matches
        ].slice(0, 50)
      })
      break
    case 'remove-match':
      commit({ ...state, matches: state.matches.filter((match) => match.id !== command.id) })
      break
    case 'reset':
      commit({ ...initial(), title: state.title })
      break
  }
}

export function registerLadderIpc(): void {
  load()
  ipcMain.handle('ladder:get', () => state)
  ipcMain.on('ladder:command', (_event, command: LadderCommand) => handle(command))
}
