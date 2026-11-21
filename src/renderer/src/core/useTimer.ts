// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useEffect, useState } from 'react'

export type TimerState = { duration: number; remaining: number; running: boolean }

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0')
}

export function useTimer(): TimerState {
  const [state, setState] = useState<TimerState>({ duration: 720, remaining: 720, running: false })

  useEffect(() => {
    let active = true
    window.api.timer.getState().then((value) => {
      if (active) setState(value)
    })
    const stop = window.api.timer.onState(setState)
    return () => {
      active = false
      stop()
    }
  }, [])

  return state
}
