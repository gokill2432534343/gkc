// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useEffect, useState } from 'react'
import type { UnhookState } from '../../../preload/index.d'

export function useUnhook(): UnhookState | null {
  const [state, setState] = useState<UnhookState | null>(null)
  useEffect(() => {
    let active = true
    void window.api.unhook.get().then((value) => {
      if (active) setState(value)
    })
    const stop = window.api.unhook.onState(setState)
    return () => {
      active = false
      stop()
    }
  }, [])
  return state
}
