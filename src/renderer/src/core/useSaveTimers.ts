// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useEffect, useState } from 'react'

export type SaveTimer = {
  id: string
  name: string
  target: number
  lead: number
  ready: number
  hold: number
}

export type SaveTimersState = {
  presets: SaveTimer[]
  runningId: string | null
  startedAt: number | null
}

export function useSaveTimers(): SaveTimersState {
  const [state, setState] = useState<SaveTimersState>({
    presets: [],
    runningId: null,
    startedAt: null
  })

  useEffect(() => {
    let active = true
    window.api.saveTimers.get().then((value) => {
      if (active) setState(value)
    })
    const stop = window.api.saveTimers.onState(setState)
    return () => {
      active = false
      stop()
    }
  }, [])

  return state
}

export type SavePhase = 'wait' | 'ready' | 'now' | 'late'

export const phaseLabel: Record<SavePhase, string> = {
  wait: 'Wait',
  ready: 'Get ready',
  now: 'NOW',
  late: 'Too late'
}

// red (wait), yellow (get ready), green (now), red again (too late)
export function savePhase(timer: SaveTimer, elapsedMs: number): SavePhase {
  const cue = Math.max(timer.target - timer.lead, 0)
  const seconds = elapsedMs / 1000
  if (seconds < Math.max(cue - timer.ready, 0)) return 'wait'
  if (seconds < cue) return 'ready'
  if (seconds < cue + timer.hold) return 'now'
  return 'late'
}

export function elapsedMs(startedAt: number | null, now: number): number {
  return startedAt === null ? 0 : Math.max(now - startedAt, 0)
}
