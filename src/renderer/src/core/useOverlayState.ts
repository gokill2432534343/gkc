// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useEffect, useState } from 'react'

export type OverlayState = { open: boolean; clickThrough: boolean }

export function useOverlayState(): OverlayState {
  const [state, setState] = useState<OverlayState>({ open: false, clickThrough: false })

  useEffect(() => {
    let active = true
    window.api.overlay.getState().then((value) => {
      if (active) setState(value)
    })
    const stop = window.api.overlay.onState(setState)
    return () => {
      active = false
      stop()
    }
  }, [])

  return state
}
