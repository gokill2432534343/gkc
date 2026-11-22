// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import Card from '../../ui/Card'
import Help from '../../ui/Help'
import ManualMap from './ManualMap'
import { useMapDetect } from '../../core/useMapDetect'

type Area = [number, number, number, number]
const areaNames = ['x', 'y', 'width', 'height']

function AreaEditor(props: {
  title: string
  help: string
  value: Area
  onChange: (value: Area) => void
}): React.JSX.Element {
  return (
    <div className="setting-row">
      <div className="setting-text">
        {props.title}
        <Help text="Four numbers between 0 and 1. x and y are where the search box starts (0 is the left or top edge, 1 is the right or bottom edge). width and height are how big the box is. Only change them if the map is not found." />
        <small>{props.help}</small>
      </div>
      <div className="timer-actions">
        {props.value.map((number, index) => (
          <label key={areaNames[index]} className="layout-field">
            {areaNames[index]}
            <input
              className="map-filter"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={number}
              onChange={(event) => {
                const next = Number(event.target.value)
                if (!Number.isFinite(next) || next < 0 || next > 1) return
                const copy = [...props.value] as Area
                copy[index] = next
                props.onChange(copy)
              }}
            />
          </label>
        ))}
      </div>
    </div>
  )
}

function MapDetection(): React.JSX.Element {
  const state = useMapDetect()
  if (!state) return <div className="empty-note">Loading...</div>
  const set = window.api.mapDetect.set

  return (
    <div className="module-grid">
      <div className="module-stack">
        <Card
          title="Detect the map"
          help="GKC can read the map name from your screen and then show that map's layout and switch your ReShade preset. Open the in-game menu where the map name is visible, then press the detect hotkey or the button."
        >
          <p className="timer-hint">
            Open the in-game menu (the map line is shown at the bottom) and press the detect hotkey
            (set it in Settings, Hotkeys). GKC takes a screenshot of your primary monitor, reads the
            map name and switches the map layout and prepares the ReShade preset (then you press
            your ReShade reload key). Run the game in windowed or borderless mode. English game
            language only for now.
          </p>
          <div className="timer-actions">
            <button
              className="btn primary"
              disabled={state.busy}
              onClick={() => void window.api.mapDetect.run()}
            >
              {state.busy ? 'Reading...' : 'Detect now'}
            </button>
          </div>
          <div className={'hotkey-error' + (state.error ? '' : ' ok')}>{state.message}</div>
          {state.last && (
            <p className="timer-hint">
              Last map: {state.last.name} ({state.last.realm}){state.last.auto ? ', auto' : ''}
            </p>
          )}
        </Card>

        <Card
          title="Auto mode"
          help="Lets GKC check the screen by itself at the start of a match, so you do not need to press anything. It is experimental and uses some processor power, so it turns itself off when GKC restarts."
        >
          <span className="switch-row">
            <span>
              Read the map name at the start of a match
              <Help text="Turns the automatic checking on or off." />
            </span>
            <button
              className={'sw' + (state.config.autoEnabled ? ' on' : '')}
              role="switch"
              aria-checked={state.config.autoEnabled}
              aria-label="Auto mode"
              onClick={() => set({ autoEnabled: !state.config.autoEnabled })}
            />
          </span>
          <p className="timer-hint">
            Experimental. It checks the screen about every 1.5 seconds while on, which uses some
            processor time. Auto mode turns itself off when GKC restarts. The first start downloads
            the English text data once, so it needs internet.
          </p>
        </Card>

        <Card
          title="Tuning"
          help="Only change these if detection does not find your map. They tell GKC where on the screen to look."
        >
          <AreaEditor
            title="Menu line area"
            help="Where the realm and map line is in the in-game menu (fractions of the screen)."
            value={state.config.menuArea}
            onChange={(menuArea) => set({ menuArea })}
          />
          <AreaEditor
            title="Match start area"
            help="Where the map name appears when a match starts."
            value={state.config.startArea}
            onChange={(startArea) => set({ startArea })}
          />
          <span className="switch-row">
            <span>
              Save the captured strip as an image
              <Help text="For finding problems. GKC saves the picture it read, so you can see if the map name was really inside the search box." />
            </span>
            <button
              className={'sw' + (state.config.saveDebug ? ' on' : '')}
              role="switch"
              aria-checked={state.config.saveDebug}
              aria-label="Save captured strip"
              onClick={() => set({ saveDebug: !state.config.saveDebug })}
            />
          </span>
          <p className="timer-hint">
            With this on, the last strip GKC read is saved as strip.png and strip-processed.png in
            the folder map-detect-debug inside GKC&apos;s data folder. Look at them if a map is not
            recognised, then adjust the areas above.
          </p>
        </Card>
        <Card
          title="Choose a map yourself"
          help="If detection picks the wrong map or you prefer to choose, pick a realm, then a map, and press Show on overlay."
        >
          <ManualMap />
        </Card>
      </div>
    </div>
  )
}

export default MapDetection
