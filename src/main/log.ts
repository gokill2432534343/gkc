// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { app, ipcMain, shell } from 'electron'
import { join } from 'path'
import { appendFileSync, existsSync, mkdirSync, renameSync, statSync } from 'fs'

// One log file for the whole app: <app data>/logs/gkc.log
// When it passes 512 KB it is moved to gkc.old.log (the previous old log is replaced).

const MAX_BYTES = 512 * 1024

function folder(): string {
  return join(app.getPath('userData'), 'logs')
}

export function logPath(): string {
  return join(folder(), 'gkc.log')
}

function describe(value: unknown): string {
  if (value instanceof Error) return value.stack ?? value.message
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function write(level: string, scope: string, message: string, detail?: unknown): void {
  try {
    mkdirSync(folder(), { recursive: true })
    const file = logPath()
    if (existsSync(file) && statSync(file).size > MAX_BYTES) {
      renameSync(file, join(folder(), 'gkc.old.log'))
    }
    const extra = detail === undefined ? '' : ' | ' + describe(detail)
    appendFileSync(
      file,
      `${new Date().toISOString()} ${level.padEnd(5)} [${scope}] ${message}${extra}\n`
    )
  } catch {
    // logging must never crash the app
  }
}

export function logInfo(scope: string, message: string, detail?: unknown): void {
  write('INFO', scope, message, detail)
}

export function logWarn(scope: string, message: string, detail?: unknown): void {
  write('WARN', scope, message, detail)
}

export function logError(scope: string, message: string, detail?: unknown): void {
  write('ERROR', scope, message, detail)
}

// Call once, as early as possible in the main process.
export function initLogging(): void {
  logInfo('app', `GKC ${app.getVersion()} starting (Electron ${process.versions.electron})`)
  process.on('uncaughtException', (error) => logError('crash', 'Uncaught exception', error))
  process.on('unhandledRejection', (reason) => logError('crash', 'Unhandled rejection', reason))
  app.on('render-process-gone', (_event, _contents, details) =>
    logError('crash', 'Renderer process gone', details)
  )
  app.on('child-process-gone', (_event, details) =>
    logError('crash', 'Child process gone', details)
  )
}

export function registerLogIpc(): void {
  ipcMain.handle('log:open-folder', async () => {
    mkdirSync(folder(), { recursive: true })
    const problem = await shell.openPath(folder())
    return { ok: problem === '', message: problem }
  })
  // The app window can report its own errors here.
  ipcMain.on('log:error', (_event, scope: unknown, message: unknown, detail: unknown) => {
    logError(
      typeof scope === 'string' ? scope.slice(0, 40) : 'renderer',
      typeof message === 'string' ? message.slice(0, 500) : 'error',
      typeof detail === 'string' ? detail.slice(0, 2000) : undefined
    )
  })
}
