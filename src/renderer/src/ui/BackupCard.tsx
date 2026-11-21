// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useEffect, useState } from 'react'
import type { SettingsGroup } from '../../../preload/index.d'
import Card from './Card'
import Help from './Help'

// Export / import of settings. Local (browser) values are collected here, files are handled by the main process.
function BackupCard(): React.JSX.Element {
  const [groups, setGroups] = useState<SettingsGroup[]>([])
  const [picked, setPicked] = useState<string[]>([])
  const [importGroups, setImportGroups] = useState<string[] | null>(null)
  const [importPicked, setImportPicked] = useState<string[]>([])
  const [status, setStatus] = useState('')

  useEffect(() => {
    void window.api.settingsIo.groups().then((list) => {
      setGroups(list)
      setPicked(list.map((g) => g.id))
    })
  }, [])

  function toggle(list: string[], set: (v: string[]) => void, id: string): void {
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  }

  async function doExport(): Promise<void> {
    const local: Record<string, string> = {}
    for (const group of groups) {
      if (!picked.includes(group.id)) continue
      for (const key of group.local) {
        try {
          const value = localStorage.getItem(key)
          if (value !== null) local[key] = value
        } catch {
          // ignore
        }
      }
    }
    const result = await window.api.settingsIo.export(picked, local)
    setStatus(result.message)
  }

  async function doOpen(): Promise<void> {
    const result = await window.api.settingsIo.importOpen()
    setStatus(result.message)
    if (result.ok && result.groups) {
      setImportGroups(result.groups)
      setImportPicked(result.groups)
    }
  }

  async function doApply(): Promise<void> {
    const ok = window.confirm(
      'Import these settings? They replace your current ones and GKC restarts.'
    )
    if (!ok) return
    const result = await window.api.settingsIo.importApply(importPicked)
    if (!result.ok) {
      setStatus(result.message)
      return
    }
    for (const [key, value] of Object.entries(result.local ?? {})) {
      try {
        localStorage.setItem(key, value)
      } catch {
        // ignore
      }
    }
    window.api.settingsIo.relaunch()
  }

  async function doReset(): Promise<void> {
    const ok = window.confirm(
      'Reset ALL settings to defaults? A safety copy is saved first, then GKC restarts.'
    )
    if (!ok) return
    const result = await window.api.settingsIo.reset()
    setStatus(result.message)
    if (result.ok) window.api.settingsIo.relaunch()
  }

  function list(ids: string[], selected: string[], set: (v: string[]) => void): React.JSX.Element {
    return (
      <>
        {groups
          .filter((g) => ids.includes(g.id))
          .map((g) => (
            <label key={g.id} className="setting-row">
              <input
                type="checkbox"
                checked={selected.includes(g.id)}
                onChange={() => toggle(selected, set, g.id)}
              />
              <div className="setting-text">
                {g.label}
                <small>{g.hint}</small>
              </div>
            </label>
          ))}
      </>
    )
  }

  return (
    <>
      <p className="settings-intro">
        Save your setup to a file to keep it safe, move it to a new PC or share it. ReShade folders,
        the OBS port and update settings are never included because they belong to this PC.
      </p>
      <Card>
        <h3>Export</h3>
        {list(
          groups.map((g) => g.id),
          picked,
          setPicked
        )}
        <div className="setting-row">
          <div className="setting-text">
            Save to file
            <Help text="Pick what to include with the ticks, then press Export and choose where to save the .gkc file. Copy it to another PC or send it to a friend." />
            <small>Creates a .gkc file you choose the place for.</small>
          </div>
          <button className="btn setting-btn" disabled={picked.length === 0} onClick={doExport}>
            Export
          </button>
        </div>
      </Card>
      <Card>
        <h3>Import</h3>
        <div className="setting-row">
          <div className="setting-text">
            Open a .gkc file
            <Help text="Choose a settings file you exported before. You can untick parts you do not want. Nothing changes until you press Import, and GKC restarts afterwards." />
            <small>You can pick what to take over before anything changes.</small>
          </div>
          <button className="btn setting-btn" onClick={doOpen}>
            Open file
          </button>
        </div>
        {importGroups && (
          <>
            {list(importGroups, importPicked, setImportPicked)}
            <div className="setting-row">
              <div className="setting-text">
                Apply
                <small>GKC restarts afterwards to load everything.</small>
              </div>
              <button
                className="btn setting-btn"
                disabled={importPicked.length === 0}
                onClick={doApply}
              >
                Import
              </button>
            </div>
          </>
        )}
      </Card>
      <Card>
        <h3>Safety net</h3>
        <div className="setting-row">
          <div className="setting-text">
            Save a safety copy now
            <Help text="GKC also saves a copy of all settings every time it starts and keeps the last 10. Use this before you try something risky." />
            <small>Copies all settings files into the app data folder.</small>
          </div>
          <button
            className="btn setting-btn"
            onClick={async () => setStatus((await window.api.settingsIo.snapshot()).message)}
          >
            Save copy
          </button>
        </div>
        <div className="setting-row">
          <div className="setting-text">
            Open log folder
            <Help text="Errors are written to gkc.log. Send this file when you report a problem." />
            <small>Shows what went wrong, for example when ReShade does not switch.</small>
          </div>
          <button
            className="btn setting-btn"
            onClick={async () => {
              const result = await window.api.settingsIo.openLogs()
              if (!result.ok) setStatus(result.message)
            }}
          >
            Open
          </button>
        </div>
        <div className="setting-row">
          <div className="setting-text">
            Reset all settings to defaults
            <Help text="Puts every tool back to how it was on first start. A copy of your current settings is saved first, and GKC restarts." />
            <small>Hotkeys, crosshairs, timers, stats, ReShade folders and more.</small>
          </div>
          <button className="btn setting-btn" onClick={doReset}>
            Reset
          </button>
        </div>
      </Card>
      {status && <p className="settings-intro">{status}</p>}
    </>
  )
}

export default BackupCard
