// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useEffect, useState } from 'react'

export type DuelState = {
  names: [string, string]
  scores: [number, number]
  elapsed: [number, number]
  active: 0 | 1
  runningSince: number | null
  autoScore: boolean
  winnerRule: 'lowest' | 'highest'
  warnEnabled: boolean
  warnNear: number
  warnClose: number
  blink: boolean
  precision: 'ms' | 'cs' | 's'
  title: string
  bestOf: number
  accent: string
  nameBg: 'dark' | 'black' | 'light'
}

const fallback: DuelState = {
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

export function useDuel(): DuelState {
  const [state, setState] = useState<DuelState>(fallback)

  useEffect(() => {
    let active = true
    window.api.duel.getState().then((value) => {
      if (active) setState(value)
    })
    const stop = window.api.duel.onState(setState)
    return () => {
      active = false
      stop()
    }
  }, [])

  return state
}

// Time of one side in milliseconds, including the part that is currently running
export function sideTime(state: DuelState, side: 0 | 1, now: number): number {
  const running = state.runningSince !== null && state.active === side
  return (
    state.elapsed[side] +
    (running && state.runningSince !== null ? Math.max(now - state.runningSince, 0) : 0)
  )
}

export type Proximity = {
  // milliseconds left until the active clock reaches the other clock (negative once passed)
  gap: number
  level: 'near' | 'close' | 'passed'
}

// Compares the active clock with the other side's recorded time.
// near = within 10 s, close = within 3 s (blinks), passed = the other time has been reached.
export function proximity(state: DuelState, now: number): Proximity | null {
  const other = state.active === 0 ? 1 : 0
  const target = state.elapsed[other]
  if (!state.warnEnabled || target <= 0) return null
  const gap = target - sideTime(state, state.active, now)
  if (gap > state.warnNear * 1000) return null
  if (gap <= 0) return { gap, level: 'passed' }
  return { gap, level: gap <= state.warnClose * 1000 ? 'close' : 'near' }
}

export function formatGap(gap: number): string {
  const seconds = Math.abs(gap) / 1000
  return (gap < 0 ? '+' : '−') + seconds.toFixed(1) + ' s'
}

export function formatMs(ms: number, precision: 'ms' | 'cs' | 's' = 'ms'): string {
  const total = Math.max(Math.floor(ms), 0)
  const minutes = Math.floor(total / 60000)
  const seconds = Math.floor((total % 60000) / 1000)
  const millis = total % 1000
  const base = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0')
  if (precision === 's') return base
  if (precision === 'cs') return base + '.' + String(Math.floor(millis / 10)).padStart(2, '0')
  return base + '.' + String(millis).padStart(3, '0')
}

// Re-renders about 30 times per second while the clock runs
export function useNow(active: boolean): number {
  const [now, setNow] = useState(0)

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), 33)
    return () => clearInterval(id)
  }, [active])

  return now
}
