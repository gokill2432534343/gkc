// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useEffect, useState } from 'react'
import { maps } from '../content/maps'

export type MapDetectState = Awaited<ReturnType<Window['api']['mapDetect']['get']>>

export function useMapDetect(): MapDetectState | null {
  const [state, setState] = useState<MapDetectState | null>(null)
  useEffect(() => {
    void window.api.mapDetect.get().then(setState)
    return window.api.mapDetect.onState(setState)
  }, [])
  return state
}

// Mounted once in the main window: when a map is recognized, show its layout on the overlay
// and switch the ReShade preset.
export function useMapDetectApply(): void {
  useEffect(() => {
    return window.api.mapDetect.onFound((result) => {
      window.api.streak.setContext({ map: result.name })
      const entry = maps.find((item) => item.id.endsWith('/' + result.slug))
      const variant = entry?.variants[0]
      if (entry && variant) {
        window.api.overlay.setContent({
          mapUrl: variant.url,
          mapName: entry.name,
          mapVisible: true
        })
        window.api.reshade.applyMap(entry.id, entry.name)
      } else {
        // no layout image for this map yet, the ReShade default preset still applies
        window.api.overlay.setContent({ mapName: result.name })
        window.api.reshade.applyMap(null, result.name)
      }
    })
  }, [])
}
