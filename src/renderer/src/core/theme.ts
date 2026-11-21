// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
// Two looks: 'flare' (default) and 'classic' (the plain original). Only the main window uses it.
export type Theme = 'flare' | 'classic'

const KEY = 'gkc.theme'

export function getTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === 'classic' ? 'classic' : 'flare'
  } catch {
    return 'flare'
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // the choice just will not be remembered
  }
  applyTheme(theme)
}
