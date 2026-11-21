// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useEffect, useState } from 'react'

export type ReshadeState = {
  config: {
    enabled: boolean
    activePreset: string
    defaultPreset: string
    mapPresets: Record<string, string>
    realmPresets: Record<string, string>
  }
  status: { message: string; error: boolean }
}

export function useReshade(): ReshadeState {
  const [state, setState] = useState<ReshadeState>({
    config: {
      enabled: false,
      activePreset: '',
      defaultPreset: '',
      mapPresets: {},
      realmPresets: {}
    },
    status: { message: 'Nothing applied yet.', error: false }
  })

  useEffect(() => {
    let active = true
    window.api.reshade.get().then((value) => {
      if (active) setState(value)
    })
    const stop = window.api.reshade.onState(setState)
    return () => {
      active = false
      stop()
    }
  }, [])

  return state
}
