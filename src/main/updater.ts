// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { app, BrowserWindow, ipcMain } from 'electron'
import { is } from '@electron-toolkit/utils'
import { join } from 'path'
import { createWriteStream, mkdirSync, rmSync } from 'fs'
import { createHash } from 'crypto'
import { readJson as readStored, writeJson } from './store'
import { get } from 'https'
import type { IncomingMessage } from 'http'
import { spawn } from 'child_process'

// A small self-made updater (no extra packages). It reads an update.json file from an
// https address, downloads the installer it points to, checks its SHA-256 fingerprint,
// and runs it. Your settings and data live in the app data folder, so they are kept.

export type UpdateStatus =
  'idle' | 'checking' | 'up-to-date' | 'available' | 'downloading' | 'ready' | 'error'

export type UpdateState = {
  status: UpdateStatus
  current: string
  latest: string
  notes: string
  progress: number
  error: string
  manifestUrl: string
  autoCheck: boolean
  canInstall: boolean
}

type Manifest = { version: string; url: string; sha256: string; notes: string }

type UpdateConfig = { manifestUrl: string; autoCheck: boolean }

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000

// GKC's own releases on GitHub; "latest" always points at the newest release
const DEFAULT_MANIFEST_URL =
  'https://github.com/gokill2432534343/gkc/releases/latest/download/update.json'

let config: UpdateConfig = { manifestUrl: DEFAULT_MANIFEST_URL, autoCheck: true }
let manifest: Manifest | null = null
let installerPath = ''
let state: UpdateState = makeState()

function makeState(patch: Partial<UpdateState> = {}): UpdateState {
  return {
    status: 'idle',
    current: app.getVersion(),
    latest: '',
    notes: '',
    progress: 0,
    error: '',
    manifestUrl: config.manifestUrl,
    autoCheck: config.autoCheck,
    // installing only makes sense in the built app, not while developing
    canInstall: !is.dev && process.platform === 'win32',
    ...patch
  }
}

function loadConfig(): void {
  try {
    const saved = readStored('update.json') as Partial<UpdateConfig>
    config = {
      manifestUrl: isHttps(saved.manifestUrl ?? '')
        ? (saved.manifestUrl as string)
        : DEFAULT_MANIFEST_URL,
      autoCheck: saved.autoCheck !== false
    }
  } catch {
    config = { manifestUrl: DEFAULT_MANIFEST_URL, autoCheck: true }
  }
}

function saveConfig(): void {
  try {
    writeJson('update.json', config)
  } catch {
    // saving is optional
  }
}

function isHttps(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function setState(patch: Partial<UpdateState>): void {
  state = { ...state, ...patch, current: app.getVersion() }
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('update:state', state)
  }
}

// true when a is newer than b (plain numbers like 1.2.3)
export function isNewer(a: string, b: string): boolean {
  const left = a.split('.').map(Number)
  const right = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const x = left[i] ?? 0
    const y = right[i] ?? 0
    if (x !== y) return x > y
  }
  return false
}

function request(url: string, redirects = 5): Promise<IncomingMessage> {
  return new Promise((resolveRequest, reject) => {
    const req = get(url, { headers: { 'User-Agent': 'GKC-updater' }, timeout: 20000 }, (res) => {
      const status = res.statusCode ?? 0
      if (status >= 300 && status < 400 && res.headers.location) {
        res.resume()
        if (redirects <= 0) return reject(new Error('Too many redirects.'))
        const next = new URL(res.headers.location, url).toString()
        if (!isHttps(next)) return reject(new Error('Redirect to a non-https address refused.'))
        return resolveRequest(request(next, redirects - 1))
      }
      if (status !== 200) {
        res.resume()
        return reject(new Error('The server answered with status ' + status + '.'))
      }
      resolveRequest(res)
    })
    req.on('timeout', () => req.destroy(new Error('The server did not answer in time.')))
    req.on('error', reject)
  })
}

async function readJson(url: string): Promise<unknown> {
  const res = await request(url)
  let size = 0
  const chunks: Buffer[] = []
  for await (const chunk of res) {
    size += (chunk as Buffer).length
    if (size > 200_000) throw new Error('The update file is too large.')
    chunks.push(chunk as Buffer)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf-8'))
}

function parseManifest(raw: unknown): Manifest {
  const data = raw as Partial<Manifest>
  if (
    typeof data?.version !== 'string' ||
    !/^\d+\.\d+\.\d+$/.test(data.version) ||
    typeof data.url !== 'string' ||
    !isHttps(data.url) ||
    typeof data.sha256 !== 'string' ||
    !/^[a-fA-F0-9]{64}$/.test(data.sha256)
  ) {
    throw new Error('The update file is not valid (needs version, https url and sha256).')
  }
  return {
    version: data.version,
    url: data.url,
    sha256: data.sha256.toLowerCase(),
    notes: typeof data.notes === 'string' ? data.notes.slice(0, 2000) : ''
  }
}

export async function checkForUpdate(silent = false): Promise<void> {
  if (state.status === 'checking' || state.status === 'downloading') return
  if (!config.manifestUrl) {
    setState({ status: 'error', error: 'No update address is set yet.' })
    return
  }
  setState({ status: 'checking', error: '' })
  try {
    manifest = parseManifest(await readJson(config.manifestUrl))
    if (isNewer(manifest.version, app.getVersion())) {
      setState({ status: 'available', latest: manifest.version, notes: manifest.notes })
    } else {
      manifest = null
      setState({ status: 'up-to-date', latest: app.getVersion(), notes: '' })
    }
  } catch (error) {
    manifest = null
    // a quiet background check should not show errors
    setState(silent ? { status: 'idle' } : { status: 'error', error: (error as Error).message })
  }
}

async function downloadUpdate(): Promise<void> {
  if (!manifest || state.status === 'downloading') return
  const target = manifest
  setState({ status: 'downloading', progress: 0, error: '' })
  try {
    const folder = join(app.getPath('temp'), 'gkc-update')
    mkdirSync(folder, { recursive: true })
    installerPath = join(folder, 'gkc-' + target.version + '-setup.exe')
    rmSync(installerPath, { force: true })

    const res = await request(target.url)
    const total = Number(res.headers['content-length'] ?? 0)
    const hash = createHash('sha256')
    const out = createWriteStream(installerPath)
    let received = 0

    await new Promise<void>((done, fail) => {
      res.on('data', (chunk: Buffer) => {
        received += chunk.length
        hash.update(chunk)
        if (total > 0) setState({ progress: received / total })
      })
      res.on('error', fail)
      out.on('error', fail)
      out.on('finish', () => done())
      res.pipe(out)
    })

    if (hash.digest('hex') !== target.sha256) {
      rmSync(installerPath, { force: true })
      throw new Error('The downloaded file does not match its fingerprint and was deleted.')
    }
    setState({ status: 'ready', progress: 1 })
  } catch (error) {
    setState({ status: 'error', error: (error as Error).message })
  }
}

function installUpdate(): void {
  if (state.status !== 'ready' || !installerPath || !state.canInstall) return
  // the installer closes this app's files, updates in place and starts the new version
  spawn(installerPath, [], { detached: true, stdio: 'ignore' }).unref()
  app.quit()
}

export function registerUpdaterIpc(): void {
  loadConfig()
  state = makeState()

  ipcMain.handle('update:get', () => state)
  ipcMain.on('update:check', () => void checkForUpdate(false))
  ipcMain.on('update:download', () => void downloadUpdate())
  ipcMain.on('update:install', () => installUpdate())
  ipcMain.on('update:set-url', (_event, url: string) => {
    const value = String(url ?? '').trim()
    // an empty field goes back to the default address
    const next = value === '' ? DEFAULT_MANIFEST_URL : isHttps(value) ? value : config.manifestUrl
    config = { ...config, manifestUrl: next }
    saveConfig()
    manifest = null
    setState({ status: 'idle', error: '', manifestUrl: config.manifestUrl })
  })
  ipcMain.on('update:set-auto', (_event, value: boolean) => {
    config = { ...config, autoCheck: value === true }
    saveConfig()
    setState({ autoCheck: config.autoCheck })
  })

  // quiet check shortly after start and then every few hours
  setTimeout(() => {
    if (config.autoCheck && config.manifestUrl) void checkForUpdate(true)
  }, 10000)
  setInterval(() => {
    if (config.autoCheck && config.manifestUrl) void checkForUpdate(true)
  }, CHECK_INTERVAL_MS)
}
