// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
// Style: 'flare' (default, sharp) or 'classic' (plain). Palette: the colours. Glow: 0 to 2.
// Only the main window uses these, the overlays always keep the plain look.
export type Theme = 'flare' | 'classic'
export const PALETTES = ['classic', 'night', 'amber', 'forest', 'violet', 'mono', 'daylight'] as const
export type Palette = (typeof PALETTES)[number]

const KEY = 'gkc.theme'
const PALETTE_KEY = 'gkc.palette'
const GLOW_KEY = 'gkc.glow'
const ACCENT_KEY = 'gkc.accent'
const DENSITY_KEY = 'gkc.density'
const ROUND_KEY = 'gkc.round'

export const DENSITIES = ['compact', 'cozy', 'roomy'] as const
export type Density = (typeof DENSITIES)[number]
export const ROUNDS = ['square', 'default', 'round'] as const
export type Round = (typeof ROUNDS)[number]
const HEX = /^#[0-9a-f]{6}$/i

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // the choice just will not be remembered
  }
}

export function getTheme(): Theme {
  return read(KEY) === 'classic' ? 'classic' : 'flare'
}

export function getPalette(): Palette {
  const value = read(PALETTE_KEY)
  return PALETTES.find((p) => p === value) ?? 'classic'
}

export function getGlow(): number {
  const value = Number(read(GLOW_KEY) ?? 1)
  return Number.isFinite(value) ? Math.min(2, Math.max(0, value)) : 1
}

export function getAccent(): string {
  const value = read(ACCENT_KEY)
  return value && HEX.test(value) ? value : ''
}

export function getDensity(): Density {
  return DENSITIES.find((d) => d === read(DENSITY_KEY)) ?? 'cozy'
}

export function getRound(): Round {
  return ROUNDS.find((r) => r === read(ROUND_KEY)) ?? 'default'
}

const rgb = (hex: string): number[] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const mix = (hex: string, to: number, t: number): string =>
  rgb(hex)
    .map((v) => Math.round(v + (to - v) * t))
    .join(', ')
const toHex = (c: string): string =>
  '#' + c.split(', ').map((v) => Number(v).toString(16).padStart(2, '0')).join('')

// Every variable a custom accent colour replaces (the palette values come back when it is cleared)
const ACCENT_VARS = [
  '--accent', '--accent-hover', '--accent-soft', '--accent-bg', '--accent-rgb', '--hot-rgb',
  '--accent-hot', '--accent-text', '--accent-deep', '--hot-soft', '--btn-top', '--btn-bot',
  '--hot-top', '--hot-bot', '--on-accent'
]

function applyAccent(root: HTMLElement, accent: string): void {
  if (!accent) {
    ACCENT_VARS.forEach((name) => root.style.removeProperty(name))
    return
  }
  const [r, g, b] = rgb(accent)
  const light = (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55
  const hot = mix(accent, 255, 0.18)
  const set: Record<string, string> = {
    '--accent': accent,
    '--accent-hover': toHex(hot),
    '--accent-soft': toHex(mix(accent, 255, 0.35)),
    '--accent-bg': `rgba(${r}, ${g}, ${b}, 0.16)`,
    '--accent-rgb': `${r}, ${g}, ${b}`,
    '--hot-rgb': hot,
    '--accent-hot': toHex(hot),
    '--accent-text': getPalette() === 'daylight' ? accent : toHex(mix(accent, 255, 0.3)),
    '--accent-deep': toHex(mix(accent, 0, 0.4)),
    '--hot-soft': toHex(mix(accent, 255, 0.3)),
    '--btn-top': toHex(mix(accent, 255, 0.1)),
    '--btn-bot': toHex(mix(accent, 0, 0.2)),
    '--hot-top': toHex(mix(accent, 255, 0.1)),
    '--hot-bot': toHex(mix(accent, 0, 0.2)),
    '--on-accent': light ? '#111' : '#fff'
  }
  Object.entries(set).forEach(([name, value]) => root.style.setProperty(name, value))
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  root.dataset.theme = theme
  root.dataset.palette = getPalette()
  root.dataset.density = getDensity()
  root.dataset.round = getRound()
  root.style.setProperty('--glow-k', String(getGlow()))
  applyAccent(root, getAccent())
}

export function setTheme(theme: Theme): void {
  write(KEY, theme)
  applyTheme(theme)
}

export function setPalette(palette: Palette): void {
  write(PALETTE_KEY, palette)
  applyTheme(getTheme())
}

export function setGlow(glow: number): void {
  write(GLOW_KEY, String(glow))
  applyTheme(getTheme())
}

export function setAccent(accent: string): void {
  write(ACCENT_KEY, HEX.test(accent) ? accent : '')
  applyTheme(getTheme())
}

export function setDensity(density: Density): void {
  write(DENSITY_KEY, density)
  applyTheme(getTheme())
}

export function setRound(round: Round): void {
  write(ROUND_KEY, round)
  applyTheme(getTheme())
}

// A share code is "GKC1:" plus the look as base64 JSON. Reading one checks every field.
export function exportLook(): string {
  const look = { t: getTheme(), p: getPalette(), g: getGlow(), a: getAccent(), d: getDensity(), r: getRound() }
  return 'GKC1:' + btoa(JSON.stringify(look))
}

export function importLook(code: string): boolean {
  try {
    const text = code.trim()
    if (!text.startsWith('GKC1:')) return false
    const look = JSON.parse(atob(text.slice(5)))
    const palette = PALETTES.find((x) => x === look.p)
    const density = DENSITIES.find((x) => x === look.d)
    const round = ROUNDS.find((x) => x === look.r)
    const glow = Number(look.g)
    const accent = look.a === '' || HEX.test(look.a) ? look.a : null
    if (!palette || !density || !round || accent === null || !Number.isFinite(glow)) return false
    write(KEY, look.t === 'classic' ? 'classic' : 'flare')
    write(PALETTE_KEY, palette)
    write(GLOW_KEY, String(Math.min(2, Math.max(0, glow))))
    write(ACCENT_KEY, accent)
    write(DENSITY_KEY, density)
    write(ROUND_KEY, round)
    applyTheme(getTheme())
    return true
  } catch {
    return false
  }
}
