// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useEffect, useState } from 'react'

export type CustomTimer = {
  id: string
  name: string
  duration: number
  elapsed: number
  runningSince: number | null
}

export function useCustomTimers(): CustomTimer[] {
  const [timers, setTimers] = useState<CustomTimer[]>([])

  useEffect(() => {
    let active = true
    window.api.timers.get().then((value) => {
      if (active) setTimers(value)
    })
    const stop = window.api.timers.onState(setTimers)
    return () => {
      active = false
      stop()
    }
  }, [])

  return timers
}

// Milliseconds left on a timer, including the part that is currently running
export function remainingMs(timer: CustomTimer, now: number): number {
  const running = timer.runningSince !== null ? Math.max(now - timer.runningSince, 0) : 0
  return Math.max(timer.duration * 1000 - timer.elapsed - running, 0)
}

export function formatRemaining(ms: number): string {
  const tenths = Math.ceil(ms / 100)
  const minutes = Math.floor(tenths / 600)
  const seconds = Math.floor((tenths % 600) / 10)
  const rest = tenths % 10
  return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0') + '.' + rest
}
