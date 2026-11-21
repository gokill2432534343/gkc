// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { BrowserWindow, ipcMain } from 'electron'
import { readJson, writeJson } from './store'

// How big the main window's interface is drawn. Only the main window, never the overlays.
export const SCALES = [1, 1.1, 1.2, 1.35, 1.5]
const DEFAULT_SCALE = 1.2

let scale = DEFAULT_SCALE
let mainWindow: BrowserWindow | null = null

function load(): void {
  try {
    const saved = readJson('ui.json') as { scale?: number }
    if (typeof saved.scale === 'number' && SCALES.includes(saved.scale)) scale = saved.scale
  } catch {
    scale = DEFAULT_SCALE
  }
}

function apply(): void {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.setZoomFactor(scale)
}

export function attachUiScale(window: BrowserWindow): void {
  mainWindow = window
  window.webContents.on('did-finish-load', apply)
  window.on('closed', () => {
    if (mainWindow === window) mainWindow = null
  })
}

export function registerUiScaleIpc(): void {
  load()
  ipcMain.handle('ui:get-scale', () => scale)
  ipcMain.on('ui:set-scale', (_event, value: number) => {
    if (typeof value !== 'number' || !SCALES.includes(value)) return
    scale = value
    try {
      writeJson('ui.json', { scale }, false)
    } catch {
      // saving is optional
    }
    apply()
  })
}
