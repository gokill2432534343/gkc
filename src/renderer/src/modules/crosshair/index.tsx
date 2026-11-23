// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useState } from 'react'
import { killers } from '../../content'
import { useCrosshairProfiles } from '../../core/useCrosshairProfiles'
import Card from '../../ui/Card'
import Help from '../../ui/Help'
import CrosshairShape from '../../ui/CrosshairShape'
import { crosshairStyles } from '../../core/crosshairStyles'
import { useCrosshair } from '../../core/useCrosshair'
import type { CrosshairMark } from '../../core/useCrosshair'

const defaultMark: CrosshairMark = {
  style: 'gap-cross',
  color: '#e8e8ea',
  size: 48,
  thickness: 3,
  gap: 8,
  opacity: 1,
  outline: true,
  offsetX: 0,
  offsetY: 0,
  ticks: 0,
  tickSpacing: 6
}

const swatches = ['#e8e8ea', '#ffffff', '#d46a6a', '#ff3b3b', '#ffd23f', '#3bff7a', '#3bd4ff']

type NumberFieldProps = {
  label: string
  help?: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}

// A slider and a number box for the same value, both change it.
function NumberField({
  label,
  help,
  value,
  min,
  max,
  step = 1,
  onChange
}: NumberFieldProps): React.JSX.Element {
  return (
    <label className="number-field">
      <span>
        {label}
        {help && <Help text={help} />}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <input
        className="map-filter"
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value)
          if (event.target.value !== '' && Number.isFinite(next)) {
            onChange(Math.min(Math.max(next, min), max))
          }
        }}
      />
    </label>
  )
}

function Crosshair(): React.JSX.Element {
  const settings = useCrosshair()
  const set = window.api.crosshair.set
  const [selectedIndex, setSelected] = useState(0)
  const marks: CrosshairMark[] = [settings, ...settings.extras]
  const selected = Math.min(selectedIndex, marks.length - 1)
  const current = marks[selected]

  function setMark(patch: Partial<CrosshairMark>): void {
    if (selected === 0) set(patch)
    else {
      set({
        extras: settings.extras.map((mark, index) =>
          index === selected - 1 ? { ...mark, ...patch } : mark
        )
      })
    }
  }

  function addMark(): void {
    const { style, color, size, thickness, gap, opacity, outline, ticks, tickSpacing } = current
    const offsetX = current.offsetX === 0 ? 40 : -current.offsetX
    set({
      extras: [
        ...settings.extras,
        {
          style,
          color,
          size,
          thickness,
          gap,
          opacity,
          outline,
          ticks,
          tickSpacing,
          offsetX,
          offsetY: current.offsetY
        }
      ]
    })
    setSelected(marks.length)
  }

  function removeMark(): void {
    if (selected === 0) return
    set({ extras: settings.extras.filter((_, index) => index !== selected - 1) })
    setSelected(selected - 1)
  }
  const { profiles, activeKiller } = useCrosshairProfiles()
  const [killerSearch, setKillerSearch] = useState('')

  const shownKillers = killers.filter((killer) =>
    killer.name.toLowerCase().includes(killerSearch.trim().toLowerCase())
  )
  const activeName = killers.find((killer) => killer.id === activeKiller)?.name

  function pickKiller(id: string): void {
    window.api.crosshair.selectKiller(id)
  }

  function saveProfile(): void {
    if (activeKiller) window.api.crosshair.saveProfile(activeKiller)
  }

  function removeProfile(): void {
    if (activeKiller) window.api.crosshair.removeProfile(activeKiller)
  }

  return (
    <div className="module-grid crosshair-layout">
      <div className="module-stack">
        <Card
          title="Styles"
          help="The shape of your crosshair. Click one to use it. You can change the colour, size and more further down."
        >
          <div className="crosshair-grid">
            {crosshairStyles.map((item) => (
              <button
                key={item.id}
                className={'crosshair-tile' + (current.style === item.id ? ' active' : '')}
                onClick={() => setMark({ style: item.id })}
              >
                <div className="crosshair-preview">
                  <CrosshairShape {...current} style={item.id} size={64} />
                </div>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </Card>
        <Card
          title="Killer profiles" collapsible
          help="A profile remembers your crosshair settings for one killer, because every killer aims a little differently. Pick a killer, set up the crosshair, then press Save. Next time you pick that killer the crosshair loads by itself."
        >
          <p className="settings-intro">
            Set up the crosshair you like, choose a killer, then save it for that killer. Picking
            the killer later loads their crosshair. In the game, the next and previous killer
            hotkeys (set them in Settings, Hotkeys) switch between the killers that have a saved
            profile.
          </p>
          <input
            className="map-filter"
            placeholder="Search killers"
            value={killerSearch}
            onChange={(event) => setKillerSearch(event.target.value)}
          />
          <div className="perk-pick-list">
            {shownKillers.map((killer) => (
              <button
                key={killer.id}
                className={'row row-link' + (activeKiller === killer.id ? ' selected' : '')}
                onClick={() => pickKiller(killer.id)}
              >
                {killer.name}
                {profiles[killer.id] && <span className="row-meta">Profile saved</span>}
              </button>
            ))}
            {shownKillers.length === 0 && <div className="empty-note">No killers match.</div>}
          </div>
          <div className="timer-actions">
            <button className="btn primary" onClick={saveProfile} disabled={!activeKiller}>
              {activeName ? 'Save for ' + activeName : 'Save for killer'}
            </button>
            <button
              className="btn"
              onClick={removeProfile}
              disabled={!activeKiller || !profiles[activeKiller]}
            >
              Remove profile
            </button>
          </div>
        </Card>

        <p className="timer-hint">
          The crosshair is drawn in the middle of your main screen and never blocks clicks. Show or
          hide it in the game with the crosshair hotkey (Settings, Hotkeys). Fullscreen games
          usually need borderless windowed mode. To calibrate a killer: start a custom game, show
          the crosshair, and nudge it with the move hotkeys (set them in Settings, Hotkeys) until it
          matches where that killer&apos;s power or attack lands. Then save it as that killer&apos;s
          profile. Offsets are in pixels, so redo them if you change your screen resolution.
        </p>
      </div>

      <div className="module-stack">
        <Card
          title="Crosshairs"
          help="You can show up to four crosshairs at once, for example one for each hand of a killer who throws with both. Click a tab to choose which one you are editing."
        >
          <p className="settings-intro">
            Show several crosshairs at once, for example one per hand for a killer that throws with
            both. Pick one below to edit it. Move it with the sliders or type an exact number.
          </p>
          <div className="crosshair-tabs">
            {marks.map((_, index) => (
              <button
                key={index}
                className={'chip-btn' + (index === selected ? ' active' : '')}
                onClick={() => setSelected(index)}
              >
                Crosshair {index + 1}
              </button>
            ))}
          </div>
          <div className="timer-actions">
            <button className="btn primary" onClick={addMark} disabled={marks.length >= 4}>
              Add crosshair (mirrored)
            </button>
            <button className="btn" onClick={removeMark} disabled={selected === 0}>
              Remove this one
            </button>
            <button className="btn" onClick={() => setMark({ offsetX: 0, offsetY: 0 })}>
              Reset position
            </button>
            <button className="btn" onClick={() => setMark({ ...defaultMark })}>
              Reset this crosshair
            </button>
          </div>
          <p className="timer-hint">
            A new crosshair copies the selected one and mirrors its left / right position. The move
            hotkeys only move crosshair 1. At most 4 crosshairs.
          </p>
        </Card>

        <Card
          title={'Settings for crosshair ' + (selected + 1)}
          help="These settings change only the crosshair you picked in the tabs above. Colours, size and position are saved automatically."
        >
          <div className="switch-row">
            <span>
              Show crosshairs
              <Help text="Turns all your crosshairs on or off on screen. You can also use the crosshair hotkey while playing." />
            </span>
            <button
              className={'sw' + (settings.visible ? ' on' : '')}
              role="switch"
              aria-checked={settings.visible}
              aria-label="Show crosshairs"
              onClick={() => set({ visible: !settings.visible })}
            />
          </div>

          <div className="crosshair-colors">
            {swatches.map((color) => (
              <button
                key={color}
                className={'swatch' + (current.color === color ? ' active' : '')}
                style={{ background: color }}
                aria-label={'Colour ' + color}
                onClick={() => setMark({ color })}
              />
            ))}
            <input
              type="color"
              value={current.color}
              aria-label="Custom colour"
              onChange={(event) => setMark({ color: event.target.value })}
            />
          </div>

          <NumberField
            label="Move left / right"
            help="Moves this crosshair sideways. Use it to match where your attack or power really lands. Drag the slider or type an exact number (pixels)."
            value={current.offsetX}
            min={-400}
            max={400}
            onChange={(offsetX) => setMark({ offsetX })}
          />
          <NumberField
            label="Move up / down"
            help="Moves this crosshair up or down. Drag the slider or type an exact number (pixels)."
            value={current.offsetY}
            min={-400}
            max={400}
            onChange={(offsetY) => setMark({ offsetY })}
          />
          <NumberField
            label="Size"
            help="How big the crosshair is."
            value={current.size}
            min={24}
            max={160}
            onChange={(size) => setMark({ size })}
          />
          <NumberField
            label="Thickness"
            help="How thick the lines are."
            value={current.thickness}
            min={1}
            max={8}
            step={0.5}
            onChange={(thickness) => setMark({ thickness })}
          />
          <NumberField
            label="Gap"
            help="The empty space in the middle of the crosshair, so you can see what you are aiming at."
            value={current.gap}
            min={0}
            max={30}
            onChange={(gap) => setMark({ gap })}
          />
          <NumberField
            label="Opacity %"
            help="How see-through the crosshair is. 100 is fully solid, lower lets more of the game show through."
            value={Math.round(current.opacity * 100)}
            min={30}
            max={100}
            onChange={(percent) => setMark({ opacity: percent / 100 })}
          />
          <NumberField
            label="Range marks"
            help="Small tick marks along the lines, like a ruler, to help you judge distance. Put 0 for no marks."
            value={current.ticks}
            min={0}
            max={4}
            onChange={(ticks) => setMark({ ticks })}
          />
          <NumberField
            label="Mark spacing"
            help="The distance between those tick marks."
            value={current.tickSpacing}
            min={4}
            max={12}
            onChange={(tickSpacing) => setMark({ tickSpacing })}
          />

          <div className="switch-row">
            <span>
              Dark outline
              <Help text="Adds a thin dark edge around the crosshair so you can still see it on bright backgrounds." />
            </span>
            <button
              className={'sw' + (current.outline ? ' on' : '')}
              role="switch"
              aria-checked={current.outline}
              aria-label="Dark outline"
              onClick={() => setMark({ outline: !current.outline })}
            />
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Crosshair
