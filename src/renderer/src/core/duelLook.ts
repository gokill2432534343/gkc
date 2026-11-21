// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import type { CSSProperties } from 'react'
import type { DuelState } from './useDuel'

export const accentColors = [
  '#b33a3a',
  '#e0504f',
  '#ff7a2f',
  '#e0a458',
  '#ffd23f',
  '#3bd16f',
  '#2fbfa8',
  '#3bd4ff',
  '#3b82f6',
  '#2a4a9c',
  '#8b5cf6',
  '#c45cd6',
  '#e8e8ea',
  '#6b6b72'
]

export function hexToRgba(hex: string, alpha: number): string {
  const value = parseInt(hex.slice(1), 16)
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`
}

// Look of one row of the 1v1 overlay: the active player's row uses the accent colour.
export function duelRowStyle(duel: DuelState, active: boolean): CSSProperties {
  const light = duel.nameBg === 'light'
  const idle = duel.nameBg === 'black' ? '#000000' : light ? '#ffffff' : 'transparent'
  return {
    background: active ? hexToRgba(duel.accent, 0.35) : idle,
    color: light && !active ? '#111111' : undefined
  }
}
