// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import type { CrosshairMark, CrosshairSettings } from './useCrosshair'

// Same maths as the main process: one window covers every crosshair.
export function allMarks(settings: CrosshairSettings): CrosshairMark[] {
  return [settings, ...settings.extras]
}

export function windowBox(settings: CrosshairSettings): { minX: number; minY: number } {
  const marks = allMarks(settings)
  return {
    minX: Math.min(...marks.map((mark) => mark.offsetX - mark.size / 2)),
    minY: Math.min(...marks.map((mark) => mark.offsetY - mark.size / 2))
  }
}
