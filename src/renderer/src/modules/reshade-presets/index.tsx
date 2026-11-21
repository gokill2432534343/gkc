// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useEffect, useState } from 'react'
import Card from '../../ui/Card'
import Help from '../../ui/Help'
import { useReshade } from '../../core/useReshade'

function fileName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path
}

type PickerRowProps = {
  label: string
  path: string
  hint?: string
  onPick: () => void
  onClear?: () => void
}

function PickerRow({ label, path, hint, onPick, onClear }: PickerRowProps): React.JSX.Element {
  return (
    <div className="setting-row">
      <div className="setting-text">
        {label}
        <small title={path}>{path ? fileName(path) : (hint ?? 'Not set')}</small>
      </div>
      <button className="btn setting-btn" onClick={onPick}>
        Choose
      </button>
      {onClear && (
        <button className="btn setting-btn" onClick={onClear} disabled={!path}>
          Clear
        </button>
      )}
    </div>
  )
}

function ReshadePresets(): React.JSX.Element {
  const { config, status } = useReshade()
  const api = window.api.reshade
  const [realms, setRealms] = useState<{ slug: string; label: string }[]>([])
  const [testMaps, setTestMaps] = useState<string[]>([])
  const [testMap, setTestMap] = useState('')
  const [allMaps, setAllMaps] = useState<{ realm: string; name: string }[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    void api.realms().then(setRealms)
    void api.maps().then(setAllMaps)
  }, [api])

  // every known map, grouped by realm, narrowed down by the search box
  const search = query.trim().toLowerCase()
  const realmGroups: { realm: string; maps: string[] }[] = []
  for (const item of allMaps) {
    if (
      search &&
      !item.name.toLowerCase().includes(search) &&
      !item.realm.toLowerCase().includes(search)
    )
      continue
    const group = realmGroups.find((entry) => entry.realm === item.realm)
    if (group) group.maps.push(item.name)
    else realmGroups.push({ realm: item.realm, maps: [item.name] })
  }
  const oldRealmKeys = realms.filter((item) => config.realmPresets[item.slug])

  useEffect(() => {
    void window.api.streak.knownMaps().then((names) => {
      const sorted = [...names].sort()
      setTestMaps(sorted)
      setTestMap((current) => current || sorted[0] || '')
    })
  }, [])

  return (
    <div className="module-stack">
      <Card
        title="Please read first"
        help="Important information about using ReShade with the game. Read it before you turn the feature on."
      >
        <p className="settings-intro">
          GKC does not touch the game or ReShade. When you pick a map, it only copies one of your
          own preset files over the preset file that ReShade already uses, the same as switching
          presets by hand. Behaviour has not published a clear rule about ReShade, and their
          anti-cheat setup has been changing, so it cannot be confirmed that using it is safe. Use
          it at your own risk, and check Behaviour&apos;s current rules yourself. This is off by
          default.
        </p>
        <div className="switch-row">
          <span>
            Switch presets by map
            <Help text="When this is on, GKC writes the ReShade preset you chose for the current map into GKC_A.ini and GKC_B.ini and shows a hint at the top of the overlay. You then press your ReShade reload key once. It is off by default and turns itself off again every time GKC starts." />
          </span>
          <button
            className={'sw' + (config.enabled ? ' on' : '')}
            role="switch"
            aria-checked={config.enabled}
            aria-label="Switch presets by map"
            onClick={() => api.setEnabled(!config.enabled)}
          />
        </div>
      </Card>

      <Card
        title="Your ReShade preset file"
        help="GKC works with two preset files of its own, GKC_A.ini and GKC_B.ini, in a folder you choose. It writes the preset for your map into both. Your own preset files are only read, never changed."
      >
        <div className="setting-row">
          <div className="setting-text">
            Preset files (GKC_A.ini and GKC_B.ini)
            <Help text="GKC keeps two identical files, GKC_A.ini and GKC_B.ini, in a folder of their own and writes the new look into both, with a fresh file date so ReShade notices the change. Choose an empty folder, then in ReShade pick GKC_A.ini as your preset and set an effect reload key in ReShade's settings. After GKC shows the hint, press that reload key once." />
            <small title={config.activePreset}>
              {config.activePreset.toLowerCase().endsWith('gkc_a.ini')
                ? 'Set up: ' + config.activePreset
                : 'Not set up yet. Click Set up and choose an empty folder.'}
            </small>
          </div>
          <button className="btn setting-btn" onClick={() => void api.setupPair()}>
            Set up
          </button>
        </div>
        <div className="setting-row">
          <div className="setting-text">
            Find moved preset files
            <Help text="If your preset files were moved to another folder (for example after reinstalling), GKC reports that a preset file was not found. Choose the folder that holds them now, and GKC re-links every missing preset by its file name." />
            <small>Use this if a preset file was not found.</small>
          </div>
          <button className="btn setting-btn" onClick={() => void api.relink()}>
            Choose folder
          </button>
        </div>
        <div className="setting-row">
          <div className="setting-text">
            Try a map
            <Help text="Pick any map and apply its preset as if the game had just detected it. GKC writes the preset into GKC_A.ini and GKC_B.ini, then you press your ReShade reload key once. Good for testing without a match." />
            <small>Test the switch without playing a match.</small>
          </div>
          <select
            className="map-filter"
            value={testMap}
            onChange={(event) => setTestMap(event.target.value)}
          >
            {testMaps.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <button
            className="btn setting-btn"
            disabled={testMap === ''}
            onClick={() => api.applyMap(null, testMap)}
          >
            Apply
          </button>
        </div>
        <div className="timer-actions">
          <button className="btn" onClick={() => api.applyLast()}>
            Apply preset for the last map
          </button>
        </div>
      </Card>

      <Card
        title="Presets per map"
        help="Every map of the game, grouped by realm. Open a realm and choose a preset (.ini file) for each map, or use Set all to give every map of that realm the same preset. Use the search box to find a map or realm quickly. A map without a preset uses the default preset below."
      >
        <PickerRow
          label="Default preset"
          hint="Used for every map without its own preset"
          path={config.defaultPreset}
          onPick={() => api.pick('default')}
          onClear={() => api.clear('default')}
        />
        <input
          className="map-filter"
          placeholder="Search a map or realm"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {realmGroups.length === 0 && <div className="empty-note">No map found.</div>}
        {realmGroups.map((group) => {
          const done = group.maps.filter((name) => config.mapPresets[name]).length
          return (
            <details key={group.realm} className="realm-group" open={search !== ''}>
              <summary>
                {group.realm}
                <small>
                  {done} of {group.maps.length} set
                </small>
              </summary>
              <div className="timer-actions">
                <button className="btn" onClick={() => void api.pick('allmaps:' + group.realm)}>
                  Set all maps of this realm
                </button>
                <button className="btn" onClick={() => api.clear('allmaps:' + group.realm)}>
                  Clear all
                </button>
              </div>
              {group.maps.map((name) => (
                <PickerRow
                  key={name}
                  label={name}
                  hint="Uses the default"
                  path={config.mapPresets[name] ?? ''}
                  onPick={() => void api.pick('map:' + name)}
                  onClear={() => api.clear('map:' + name)}
                />
              ))}
            </details>
          )
        })}
      </Card>

      {oldRealmKeys.length > 0 && (
        <Card
          title="Older realm presets"
          help="Presets you saved for a whole realm in an earlier version. They still work for maps without their own preset. Clear them if you no longer want them."
        >
          {oldRealmKeys.map((item) => (
            <PickerRow
              key={item.slug}
              label={item.label}
              path={config.realmPresets[item.slug] ?? ''}
              onPick={() => api.pick('realm:' + item.slug)}
              onClear={() => api.clear('realm:' + item.slug)}
            />
          ))}
        </Card>
      )}

      <p className={'reshade-status' + (status.error ? ' error' : '')}>{status.message}</p>
    </div>
  )
}

export default ReshadePresets
