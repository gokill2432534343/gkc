// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useEffect, useState } from 'react'
import Card from '../ui/Card'
import Help from '../ui/Help'
import AboutPanel from '../ui/AboutPanel'
import BackupCard from '../ui/BackupCard'
import IdeaPanel from '../ui/IdeaPanel'
import HotkeyInput from '../ui/HotkeyInput'
import {
  DENSITIES, PALETTES, ROUNDS, exportLook, getAccent, getDensity, getGlow, getPalette, getRound,
  getTheme, importLook, setAccent, setDensity, setGlow, setPalette, setRound, setTheme
} from '../core/theme'
import type { Density, Palette, Round, Theme } from '../core/theme'
import { useUpdate } from '../core/useUpdate'
import { categories } from '../core/categories'
import { getIcon } from '../core/icons'
import type { GkcModule } from '../core/types'
import { useOverlayState } from '../core/useOverlayState'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'

type Section =
  'general' | 'modules' | 'overlay' | 'hotkeys' | 'backup' | 'ideas' | 'updates' | 'about'

type SettingsProps = {
  initialSection?: string
  modules: GkcModule[]
  onMoveModule: (id: string, direction: -1 | 1) => void
  disabledIds: string[]
  onToggleModule: (id: string) => void
  onClearRecent: () => void
  onResetAll: () => void
  onShowGuide: () => void
}

const sections: { id: Section; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'modules', label: 'Modules' },
  { id: 'overlay', label: 'Overlay' },
  { id: 'hotkeys', label: 'Hotkeys' },
  { id: 'backup', label: 'Backup' },
  { id: 'ideas', label: 'Ideas and questions' },
  { id: 'updates', label: 'Updates' },
  { id: 'about', label: 'About GKC' }
]

const scaleOptions = [1, 1.1, 1.2, 1.35, 1.5]

const hotkeyActions = [
  { action: 'toggleOverlay', label: 'Show or hide overlay', hint: 'Opens or closes the overlay.' },
  {
    action: 'toggleClickThrough',
    label: 'Toggle click-through',
    hint: 'Switches the overlay between clickable and click-through.'
  },
  { action: 'toggleTimer', label: 'Basic timer: start or pause', hint: 'Controls the basic timer.' },
  { action: 'resetTimer', label: 'Basic timer: reset', hint: 'Sets the basic timer back to its start time.' },
  { action: 'duelToggle', label: '1v1 timer: start or pause', hint: 'Starts or pauses the clock of the active player.' },
  { action: 'duelSwitch', label: '1v1 timer: switch side', hint: 'Switches to the other player. A running clock keeps running.' },
  { action: 'duelEndRound', label: '1v1 timer: end round', hint: 'Ends the round and resets both times. Gives the point if auto-score is on.' },
  { action: 'customTimer1', label: 'Multi timer 1: start or pause', hint: 'The first timer in Multi timers.' },
  { action: 'customTimer2', label: 'Multi timer 2: start or pause', hint: 'The second timer in Multi timers.' },
  { action: 'customTimer3', label: 'Multi timer 3: start or pause', hint: 'The third timer in Multi timers.' },
  { action: 'customTimer4', label: 'Multi timer 4: start or pause', hint: 'The fourth timer in Multi timers.' },
  ...Array.from({ length: 10 }, (_, index) => ({
    action: 'saveTimer' + (index + 1),
    label: 'Save timer ' + (index + 1) + ': start',
    hint: 'Starts save timer ' + (index + 1) + ' from the Save timers tool. Press again to start over.'
  })),
  { action: 'streakWin', label: 'Streak: record a win', hint: 'Adds a win to the streak tracker.' },
  { action: 'streakLoss', label: 'Streak: record a loss', hint: 'Adds a loss to the streak tracker.' },
  { action: 'streakUndo', label: 'Streak: undo last result', hint: 'Removes the last recorded result.' },
  { action: 'streakRole', label: 'Streak: switch role', hint: 'Switches between survivor and killer.' },
  { action: 'crosshairNextKiller', label: 'Crosshair: next killer', hint: 'Switches to the next killer crosshair profile.' },
  { action: 'crosshairPrevKiller', label: 'Crosshair: previous killer', hint: 'Switches to the previous killer crosshair profile.' },
  {
    action: 'profileNext',
    label: 'Next overlay profile',
    hint: 'Switches to the next saved overlay profile.'
  },
  {
    action: 'profilePrev',
    label: 'Previous overlay profile',
    hint: 'Switches to the previous saved overlay profile.'
  },
  {
    action: 'detectMap',
    label: 'Detect map',
    hint: 'Reads the map name from the screen and switches layout and ReShade preset.'
  },
  {
    action: 'unhookTimer',
    label: 'Start unhook timer',
    hint: 'Killer: starts the countdown for a survivor who was just unhooked.'
  },
  {
    action: 'toggleMap',
    label: 'Show or hide map',
    hint: 'Shows or hides the selected map on the overlay.'
  },
  {
    action: 'toggleCrosshair',
    label: 'Show or hide crosshair',
    hint: 'Shows or hides the crosshair in the middle of the screen.'
  },
  {
    action: 'nudgeUp',
    label: 'Crosshair: move up',
    hint: 'Moves the crosshair 1 pixel (for calibrating).'
  },
  { action: 'nudgeDown', label: 'Crosshair: move down', hint: 'Moves the crosshair 1 pixel.' },
  { action: 'nudgeLeft', label: 'Crosshair: move left', hint: 'Moves the crosshair 1 pixel.' },
  { action: 'nudgeRight', label: 'Crosshair: move right', hint: 'Moves the crosshair 1 pixel.' }
]

function categoryLabel(id: string): string {
  return categories.find((category) => category.id === id)?.label ?? id
}

function Settings({
  initialSection,
  modules,
  onMoveModule,
  disabledIds,
  onToggleModule,
  onClearRecent,
  onResetAll,
  onShowGuide
}: SettingsProps): React.JSX.Element {
  const [section, setSection] = useState<Section>(
    sections.some((item) => item.id === initialSection) ? (initialSection as Section) : 'general'
  )
  const overlay = useOverlayState()
  const update = useUpdate()
  const [updateUrl, setUpdateUrl] = useState<string | null>(null)
  const [hotkeys, setHotkeys] = useState<Record<string, string>>({})
  const [hotkeyError, setHotkeyError] = useState('')

  const [uiScale, setUiScale] = useState(1.2)
  const [theme, setThemeState] = useState<Theme>(getTheme())
  const [palette, setPaletteState] = useState<Palette>(getPalette())
  const [glow, setGlowState] = useState(getGlow())
  const [accent, setAccentState] = useState(getAccent())
  const [density, setDensityState] = useState<Density>(getDensity())
  const [round, setRoundState] = useState<Round>(getRound())
  const [code, setCode] = useState('')
  const [codeNote, setCodeNote] = useState('')

  useEffect(() => {
    window.api.hotkeys.get().then(setHotkeys)
    void window.api.ui.getScale().then(setUiScale)
  }, [])

  function changeTheme(value: Theme): void {
    setThemeState(value)
    setTheme(value)
  }

  function changePalette(value: Palette): void {
    setPaletteState(value)
    setPalette(value)
  }

  function changeGlow(value: number): void {
    setGlowState(value)
    setGlow(value)
  }

  function changeAccent(value: string): void {
    setAccentState(value)
    setAccent(value)
  }

  function changeDensity(value: Density): void {
    setDensityState(value)
    setDensity(value)
  }

  function changeRound(value: Round): void {
    setRoundState(value)
    setRound(value)
  }

  function copyCode(): void {
    void navigator.clipboard.writeText(exportLook())
    setCodeNote('Copied. Send it to a friend.')
  }

  function applyCode(): void {
    if (!importLook(code)) {
      setCodeNote('That code does not work.')
      return
    }
    setThemeState(getTheme())
    setPaletteState(getPalette())
    setGlowState(getGlow())
    setAccentState(getAccent())
    setDensityState(getDensity())
    setRoundState(getRound())
    setCode('')
    setCodeNote('Look applied.')
  }

  function changeScale(value: number): void {
    setUiScale(value)
    window.api.ui.setScale(value)
  }

  async function changeHotkey(action: string, accelerator: string): Promise<void> {
    const result = await window.api.hotkeys.set(action, accelerator)
    if (result.ok && result.hotkeys) {
      setHotkeys(result.hotkeys)
      setHotkeyError('')
    } else {
      setHotkeyError(result.error ?? 'Could not change the shortcut.')
    }
  }

  async function resetHotkeys(): Promise<void> {
    setHotkeys(await window.api.hotkeys.reset())
    setHotkeyError('')
  }

  function confirmReset(): void {
    const ok = window.confirm(
      'Reset GKC? This clears your favourites, recently used tools and module settings.'
    )
    if (ok) onResetAll()
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Settings</h1>
          <div className="page-sub">Your changes are saved automatically</div>
        </div>
      </div>

      <div className="settings">
        <div className="settings-nav">
          {sections.map((item) => (
            <button
              key={item.id}
              className={section === item.id ? 'active' : ''}
              onClick={() => setSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div>
          {section === 'general' && (
            <Card>
              <div className="setting-row">
                <div className="setting-text">
                  Colors
                  <Help text="Changes the colors of this window. Classic is the original red. The overlays are not changed." />
                  <small>Pick a color theme for this window. The overlays keep their own look.</small>
                </div>
                <div className="timer-presets">
                  {PALETTES.map((option) => (
                    <button
                      key={option}
                      className={'chip-btn' + (palette === option ? ' active' : '')}
                      onClick={() => changePalette(option)}
                    >
                      {option === 'classic' ? 'Classic' : option[0].toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-text">
                  Glow
                  <Help text="How strong the soft colored light in the corners of the window is. Set it to 0 to turn it off." />
                  <small>Strength of the colored light in the corners.</small>
                </div>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={glow}
                  onChange={(e) => changeGlow(Number(e.target.value))}
                />
              </div>
              <div className="setting-row">
                <div className="setting-text">
                  Accent color
                  <Help text="Replaces the main color of the theme with your own. Reset goes back to the theme's color." />
                  <small>Your own main color on top of the theme.</small>
                </div>
                <div className="timer-presets">
                  <input
                    type="color"
                    value={accent || '#c0414a'}
                    onChange={(e) => changeAccent(e.target.value)}
                  />
                  <button className="chip-btn" disabled={!accent} onClick={() => changeAccent('')}>
                    Reset
                  </button>
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-text">
                  Spacing
                  <Help text="Compact fits more on screen. Roomy leaves more space around things." />
                  <small>How much space there is around things.</small>
                </div>
                <div className="timer-presets">
                  {DENSITIES.map((option) => (
                    <button
                      key={option}
                      className={'chip-btn' + (density === option ? ' active' : '')}
                      onClick={() => changeDensity(option)}
                    >
                      {option[0].toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-text">
                  Corners
                  <Help text="How round the corners of cards and buttons are." />
                  <small>How round cards and buttons are.</small>
                </div>
                <div className="timer-presets">
                  {ROUNDS.map((option) => (
                    <button
                      key={option}
                      className={'chip-btn' + (round === option ? ' active' : '')}
                      onClick={() => changeRound(option)}
                    >
                      {option[0].toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-text">
                  Share your look
                  <Help text="Copy a short code of your colors and spacing and send it to a friend. To use a friend's look, paste their code and press Apply." />
                  <small>{codeNote || 'Copy your look as a code, or paste a friend\'s code.'}</small>
                </div>
                <div className="timer-presets">
                  <button className="chip-btn" onClick={copyCode}>
                    Copy code
                  </button>
                  <input
                    className="map-filter"
                    placeholder="Paste a code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                  <button className="chip-btn" disabled={!code.trim()} onClick={applyCode}>
                    Apply
                  </button>
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-text">
                  Shape
                  <Help text="Sharp has slanted buttons and square corners. Soft is the plain design with rounded corners." />
                  <small>Sharp is angular. Soft is plain and rounded.</small>
                </div>
                <div className="timer-presets">
                  {(['flare', 'classic'] as Theme[]).map((option) => (
                    <button
                      key={option}
                      className={'chip-btn' + (theme === option ? ' active' : '')}
                      onClick={() => changeTheme(option)}
                    >
                      {option === 'flare' ? 'Sharp' : 'Soft'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-text">
                  Interface size
                  <Help text="Makes text and buttons in this window bigger or smaller. If things are hard to read, pick a larger size. The overlay is not affected, it has its own Scale slider on the Overlay page." />
                  <small>
                    Makes everything in this window bigger or smaller. The overlay is not changed.
                  </small>
                </div>
                <div className="timer-presets">
                  {scaleOptions.map((option) => (
                    <button
                      key={option}
                      className={'chip-btn' + (uiScale === option ? ' active' : '')}
                      onClick={() => changeScale(option)}
                    >
                      {Math.round(option * 100)}%
                    </button>
                  ))}
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-text">
                  Welcome guide
                  <Help text="Shows the short introduction you saw when you first started GKC." />
                  <small>Show the short introduction to GKC again.</small>
                </div>
                <button className="btn setting-btn" onClick={onShowGuide}>
                  Show
                </button>
              </div>
              <div className="setting-row">
                <div className="setting-text">
                  Recently used
                  <Help text="Clears the list of tools shown on the Home page. Your settings are not touched." />
                  <small>Clear the list of tools shown on Home.</small>
                </div>
                <button className="btn setting-btn" onClick={onClearRecent}>
                  Clear
                </button>
              </div>
              <div className="setting-row">
                <div className="setting-text">
                  Reset GKC
                  <Help text="Clears your favourites, tool order, hidden tools and recently used list. Your overlay, crosshair and other tool settings are kept." />
                  <small>Clears favourites, recently used tools and module settings.</small>
                </div>
                <button className="btn setting-btn" onClick={confirmReset}>
                  Reset
                </button>
              </div>
            </Card>
          )}

          {section === 'backup' && <BackupCard />}

          {section === 'ideas' && <IdeaPanel />}

          {section === 'modules' && (
            <>
              <p className="settings-intro">
                Turn tools on or off and use the arrows to change their order (it decides what shows
                first on Home and in lists). A tool that is off disappears from the sidebar, Home
                and Favourites. A category without active tools is hidden.
              </p>
              <Card>
                {modules.map((item, index) => {
                  const Icon = getIcon(item.icon)
                  const enabled = !disabledIds.includes(item.id)
                  return (
                    <div key={item.id} className={'setting-row' + (enabled ? '' : ' off')}>
                      <Icon size={18} stroke={1.5} className="setting-icon" />
                      <div className="setting-text">
                        {item.name}
                        <small>
                          {categoryLabel(item.category)} · {item.version}
                        </small>
                      </div>
                      <button
                        className="icon-btn"
                        aria-label={'Move ' + item.name + ' up'}
                        disabled={index === 0}
                        onClick={() => onMoveModule(item.id, -1)}
                      >
                        <IconChevronUp size={16} stroke={1.5} />
                      </button>
                      <button
                        className="icon-btn"
                        aria-label={'Move ' + item.name + ' down'}
                        disabled={index === modules.length - 1}
                        onClick={() => onMoveModule(item.id, 1)}
                      >
                        <IconChevronDown size={16} stroke={1.5} />
                      </button>
                      <button
                        className={'sw' + (enabled ? ' on' : '')}
                        role="switch"
                        aria-checked={enabled}
                        aria-label={item.name}
                        onClick={() => onToggleModule(item.id)}
                      />
                    </div>
                  )
                })}
              </Card>
            </>
          )}

          {section === 'overlay' && (
            <>
              <p className="settings-intro">
                The overlay is a small transparent window that stays on top of the game. Overlay
                tools will show up there. For the game to receive your clicks, turn on
                click-through. Fullscreen games usually need borderless windowed mode.
              </p>
              <Card>
                <div className="setting-row">
                  <div className="setting-text">
                    Show overlay
                    <Help text="The key combination that shows or hides the overlay while you play. Click the box, then press the keys you want." />
                    <small>Opens or closes the overlay window.</small>
                  </div>
                  <button
                    className={'sw' + (overlay.open ? ' on' : '')}
                    role="switch"
                    aria-checked={overlay.open}
                    aria-label="Show overlay"
                    onClick={() => window.api.overlay.toggle()}
                  />
                </div>
                <div className="setting-row">
                  <div className="setting-text">
                    Click-through
                    <Help text="The key combination that switches click-through on or off, so clicks reach the game or the overlay." />
                    <small>Mouse clicks pass through the overlay to the window below.</small>
                  </div>
                  <button
                    className={'sw' + (overlay.clickThrough ? ' on' : '')}
                    role="switch"
                    aria-checked={overlay.clickThrough}
                    aria-label="Click-through"
                    onClick={() => window.api.overlay.setClickThrough(!overlay.clickThrough)}
                  />
                </div>
              </Card>
            </>
          )}

          {section === 'hotkeys' && (
            <>
              <p className="settings-intro">
                Hotkeys work everywhere, also while the game is in focus. Click a shortcut, then
                press the new keys (also with Ctrl, Alt or Shift). Backspace clears it, Esc cancels.
                A single key such as F8 works too, but GKC then takes that key from every other app,
                so avoid keys you use in the game or while typing.
              </p>
              <Card>
                {hotkeyActions.map((item) => (
                  <div key={item.action} className="setting-row">
                    <div className="setting-text">
                      {item.label}
                      <small>{item.hint}</small>
                    </div>
                    <HotkeyInput
                      value={hotkeys[item.action] ?? ''}
                      onChange={(value) => changeHotkey(item.action, value)}
                    />
                  </div>
                ))}
                {hotkeyError !== '' && <div className="hotkey-error">{hotkeyError}</div>}
                <div className="setting-row">
                  <div className="setting-text">
                    Clear all
                    <Help text="Removes every hotkey, so you can start again. GKC comes without hotkeys, you set the ones you want above." />
                    <small>Remove all shortcuts.</small>
                  </div>
                  <button className="btn setting-btn" onClick={resetHotkeys}>
                    Clear
                  </button>
                </div>
              </Card>
            </>
          )}

          {section === 'updates' && (
            <>
              <p className="settings-intro">
                GKC looks for a newer version on GitHub by itself. When one is out, a bar appears at
                the top: press Download, then Restart and update. The download is checked before it
                is installed, and your favourites, builds, hotkeys and other settings are kept.
              </p>
              <Card>
                <div className="setting-row">
                  <div className="setting-text">
                    Installed version
                    <small>
                      {update.current}
                      {update.status === 'up-to-date' ? ' · up to date' : ''}
                      {update.status === 'available' ? ' · ' + update.latest + ' available' : ''}
                    </small>
                  </div>
                  <button
                    className="btn setting-btn"
                    onClick={() => window.api.update.check()}
                    disabled={update.status === 'checking' || update.status === 'downloading'}
                  >
                    {update.status === 'checking' ? 'Checking…' : 'Check for updates'}
                  </button>
                </div>

                {update.status === 'available' && (
                  <div className="setting-row">
                    <div className="setting-text">
                      Version {update.latest}
                      <small>{update.notes || 'No release notes.'}</small>
                    </div>
                    <button
                      className="btn primary setting-btn"
                      onClick={() => window.api.update.download()}
                    >
                      Download
                    </button>
                  </div>
                )}

                {update.status === 'downloading' && (
                  <div className="setting-row">
                    <div className="setting-text">
                      Downloading version {update.latest}
                      <div className="progress">
                        <i style={{ width: Math.round(update.progress * 100) + '%' }} />
                      </div>
                    </div>
                  </div>
                )}

                {update.status === 'ready' && (
                  <div className="setting-row">
                    <div className="setting-text">
                      Version {update.latest} is ready
                      <small>
                        {update.canInstall
                          ? 'GKC closes, installs the update and starts again.'
                          : 'Installing only works in the installed app, not in development.'}
                      </small>
                    </div>
                    <button
                      className="btn primary setting-btn"
                      onClick={() => window.api.update.install()}
                      disabled={!update.canInstall}
                    >
                      Restart and update
                    </button>
                  </div>
                )}

                {update.status === 'error' && <div className="hotkey-error">{update.error}</div>}

                <div className="setting-row">
                  <div className="setting-text">
                    Check automatically
                    <Help text="GKC looks for a new version when it starts and tells you if one is available." />
                    <small>Looks for updates a few seconds after start and every few hours.</small>
                  </div>
                  <button
                    className={'sw' + (update.autoCheck ? ' on' : '')}
                    role="switch"
                    aria-checked={update.autoCheck}
                    aria-label="Check automatically"
                    onClick={() => window.api.update.setAuto(!update.autoCheck)}
                  />
                </div>
              </Card>

              <Card title="Update address (advanced)">
                <div className="build-save">
                  <input
                    className="map-filter"
                    placeholder="https://example.com/downloads/update.json"
                    value={updateUrl ?? update.manifestUrl}
                    onChange={(event) => setUpdateUrl(event.target.value)}
                  />
                  <button
                    className="btn setting-btn"
                    disabled={updateUrl === null || updateUrl === update.manifestUrl}
                    onClick={() => {
                      window.api.update.setUrl(updateUrl ?? '')
                      setUpdateUrl(null)
                    }}
                  >
                    Save
                  </button>
                </div>
                <p className="timer-hint">
                  This is already set to GKC&apos;s releases on GitHub, so you do not need to change
                  it. Empty the field and press Save to go back to it. A different address must
                  start with https and point to an <code>update.json</code> file. Only use addresses
                  you trust: the installer it points to gets started on your computer.
                </p>
              </Card>
            </>
          )}

          {section === 'about' && <AboutPanel version={update.current} />}
        </div>
      </div>
    </div>
  )
}

export default Settings
