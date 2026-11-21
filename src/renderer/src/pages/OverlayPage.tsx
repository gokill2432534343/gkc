// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import Card from '../ui/Card'
import Help from '../ui/Help'
import { useOverlayState } from '../core/useOverlayState'
import { useOverlayContent } from '../core/useOverlayContent'
import { useCrosshair } from '../core/useCrosshair'
import { useOverlayProfiles } from '../core/useOverlayProfiles'

type OverlayPageProps = {
  onOpenTool: (id: string) => void
  // ids of tools that are currently available (Basic mode hides some)
  availableIds: string[]
  onOpenSettings: (section: string) => void
}

type SwitchRowProps = {
  label: string
  help?: string
  hint?: string
  on: boolean
  disabled?: boolean
  onChange: () => void
}

function SwitchRow({
  label,
  help,
  hint,
  on,
  disabled,
  onChange
}: SwitchRowProps): React.JSX.Element {
  return (
    <div className={'setting-row' + (disabled ? ' off' : '')}>
      <div className="setting-text">
        {label}
        {help && <Help text={help} />}
        {hint && <small>{hint}</small>}
      </div>
      <button
        className={'sw' + (on ? ' on' : '')}
        role="switch"
        aria-checked={on}
        aria-label={label}
        disabled={disabled}
        onClick={onChange}
      />
    </div>
  )
}

type SliderRowProps = {
  label: string
  help?: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
}

function SliderRow({
  label,
  help,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}: SliderRowProps): React.JSX.Element {
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
      <span className="slider-value">
        {value}
        {unit}
      </span>
    </label>
  )
}

const advanced = [
  { id: 'map-detection', label: 'Maps', hint: 'Read the map from the screen or pick it yourself' },
  { id: 'crosshair', label: 'Crosshair', hint: 'Styles, several crosshairs, killer profiles' },
  { id: 'duel-timer', label: '1v1 timer', hint: 'Rules, names, warnings' },
  { id: 'streak-tracker', label: 'Streak tracker', hint: 'Wins, losses, best streaks' },
  { id: 'multi-timers', label: 'Multi timers', hint: 'Your own countdown timers' },
  { id: 'overlay-profiles', label: 'Overlay profiles', hint: 'Save and edit full setups' }
]

function OverlayPage({
  onOpenTool,
  onOpenSettings,
  availableIds
}: OverlayPageProps): React.JSX.Element {
  const overlay = useOverlayState()
  const content = useOverlayContent()
  const crosshair = useCrosshair()
  const { profiles, activeId } = useOverlayProfiles()
  const set = window.api.overlay.setContent

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Overlay</h1>
          <div className="page-sub">
            Everything for the in-game overlay in one place. The tools have the detailed settings.
          </div>
        </div>
      </div>

      <div className="module-stack">
        <Card title="Overlay">
          <SwitchRow
            label="Show overlay"
            help="The overlay is a small see-through window that floats on top of your game. Turn this on to see it, off to hide it. You can also use the show/hide hotkey while playing. Drag the overlay to move it; GKC remembers the place."
            hint="Opens or closes the overlay window on top of your game."
            on={overlay.open}
            onChange={() => window.api.overlay.toggle()}
          />
          <SwitchRow
            label="Click-through"
            help="With this on, your mouse clicks go straight through the overlay to the game. Turn it on before you start playing. Turn it off when you want to drag or click the overlay."
            hint="Clicks go to the game instead of the overlay. Turn this on while playing."
            on={overlay.clickThrough}
            onChange={() => window.api.overlay.setClickThrough(!overlay.clickThrough)}
          />
          <div className="setting-row">
            <div className="setting-text">
              Position
              <Help text="Drag the overlay anywhere you want, even partly above the top edge of the screen, and GKC keeps it there. A small strip always stays on screen so you can grab it again. If it ends up somewhere you cannot reach, press Reset position." />
              <small>
                GKC remembers where you drag the overlay. Use this to put it back in the top right
                corner.
              </small>
            </div>
            <button className="btn setting-btn" onClick={() => window.api.overlay.resetPosition()}>
              Reset position
            </button>
          </div>
          <SwitchRow
            label="Crosshair"
            help="Draws a crosshair in the middle of your screen. Change its style, colour and extra crosshairs in the Crosshair tool."
            hint="Shows your crosshairs in the middle of the screen."
            on={crosshair.visible}
            onChange={() => window.api.crosshair.set({ visible: !crosshair.visible })}
          />
        </Card>

        <Card title="What the overlay shows">
          <SwitchRow
            label="Map"
            help="Shows the map layout on the overlay. You need a map first: let Map detection find it, or pick one yourself in the Map detection tool."
            hint={
              content.mapUrl
                ? content.mapName || 'The selected map'
                : 'No map chosen yet. Pick one in Map detection.'
            }
            on={content.mapVisible}
            disabled={!content.mapUrl}
            onChange={() => set({ mapVisible: !content.mapVisible })}
          />
          <SwitchRow
            label="1v1 timer"
            help="Shows both players' names, the score and their timers in one line. Set it up in the 1v1 timer tool."
            on={content.showDuel}
            onChange={() => set({ showDuel: !content.showDuel })}
          />
          <SwitchRow
            label="Streak tracker"
            help="Shows your current win streak and best streak. Record wins and losses in the Streak tracker tool or with the hotkeys."
            on={content.showStreak}
            onChange={() => set({ showStreak: !content.showStreak })}
          />
          <SwitchRow
            label="Basic timer"
            help="One simple countdown timer. Start and change it in the Timer tool. It is off by default, turn it on only if you want it."
            hint="The single countdown timer from the Timer tool. Off by default."
            on={content.showBasicTimer}
            onChange={() => set({ showBasicTimer: !content.showBasicTimer })}
          />
          <SwitchRow
            label="Multi timers"
            help="Shows your own named timers (for example for cooldowns). Create them in the Multi timers tool."
            on={content.showTimers}
            onChange={() => set({ showTimers: !content.showTimers })}
          />
        </Card>

        <Card title="Look">
          <SliderRow
            label="Map opacity"
            help="How see-through the map picture is. A lower number lets you see more of the game behind it. The text panels are changed with Panel background."
            value={Math.round(content.opacity * 100)}
            min={20}
            max={100}
            unit="%"
            onChange={(percent) => set({ opacity: percent / 100 })}
          />
          <SliderRow
            label="Panel background"
            help="How solid the dark panels behind the text are. Turn it down to 0 to see only the text and numbers, with the game fully visible behind them."
            value={Math.round(content.background * 100)}
            min={0}
            max={100}
            unit="%"
            onChange={(percent) => set({ background: percent / 100 })}
          />
          <SliderRow
            label="Scale (whole overlay)"
            help="Makes the whole overlay bigger or smaller, including the text. Use this if the overlay is hard to read."
            value={Math.round(content.scale * 100)}
            min={60}
            max={200}
            step={5}
            unit="%"
            onChange={(percent) => set({ scale: percent / 100 })}
          />
          <SliderRow
            label="Map size"
            help="How large the map picture is. Only changes the map, not the other panels."
            value={content.size}
            min={300}
            max={900}
            step={20}
            onChange={(size) => set({ size })}
          />
        </Card>

        {profiles.length > 0 && (
          <Card title="Quick profiles">
            <div className="timer-presets">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  className={'chip-btn' + (profile.id === activeId ? ' active' : '')}
                  onClick={() => window.api.overlayProfiles.apply(profile.id)}
                >
                  {profile.name}
                </button>
              ))}
            </div>
            <p className="timer-hint">
              A profile sets the panels, look, crosshair and streak role in one click. Edit them in
              Overlay profiles below.
            </p>
          </Card>
        )}

        <Card title="Advanced settings">
          <p className="timer-hint">Open a tool for its detailed settings.</p>
          <div className="advanced-grid">
            {advanced
              .filter((item) => availableIds.includes(item.id))
              .map((item) => (
                <button key={item.id} className="row row-link" onClick={() => onOpenTool(item.id)}>
                  <span>
                    {item.label}
                    <small className="row-sub">{item.hint}</small>
                  </span>
                </button>
              ))}
          </div>
          <div className="timer-actions">
            <button className="btn" onClick={() => onOpenSettings('hotkeys')}>
              Hotkeys
            </button>
            <button className="btn" onClick={() => onOpenSettings('overlay')}>
              Overlay help
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default OverlayPage
