// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { IconClock, IconSearch, IconStar } from '@tabler/icons-react'
import Card from '../ui/Card'
import GettingStarted from '../ui/GettingStarted'
import { categories } from '../core/categories'
import { getIcon } from '../core/icons'
import type { GkcModule } from '../core/types'
import { useCrosshair } from '../core/useCrosshair'
import { useOverlayState } from '../core/useOverlayState'
import { useUpdate } from '../core/useUpdate'
import { formatTime, useTimer } from '../core/useTimer'

type HomeProps = {
  availableIds: string[]
  onOpenOverlay: () => void
  onOpenHotkeys: () => void
  onOpenIdeas: () => void
  favourites: GkcModule[]
  recent: GkcModule[]
  onOpen: (id: string) => void
  onSearch: () => void
}

// What people usually want to do, in plain words. Tools that are hidden (Basic mode) are skipped.
const goals = [
  {
    tool: 'crosshair',
    icon: 'crosshair',
    label: 'Use a crosshair',
    hint: 'Pick a style and colour'
  },
  {
    tool: 'duel-timer',
    icon: 'swords',
    label: 'Time a 1v1 match',
    hint: 'Names, score and timers'
  },
  { tool: 'streak-tracker', icon: 'trophy', label: 'Track my wins', hint: 'Streaks and stats' },
  {
    tool: 'build-creator',
    icon: 'adjustments',
    label: 'Build a perk loadout',
    hint: 'Pick and save perks'
  },
  { tool: 'perk-randomizer', icon: 'dice', label: 'Roll random perks', hint: 'For a challenge' },
  { tool: 'map-detection', icon: 'map', label: 'Show my map', hint: 'Detect it or pick it' },
  {
    tool: 'stream-overlays',
    icon: 'broadcast',
    label: 'Stream with OBS',
    hint: 'Overlays for your stream'
  },
  { tool: 'timer', icon: 'stopwatch', label: 'Use a timer', hint: 'Countdown on the overlay' }
]

function categoryLabel(id: string): string {
  return categories.find((category) => category.id === id)?.label ?? ''
}

function Home({
  availableIds,
  onOpenOverlay,
  onOpenHotkeys,
  onOpenIdeas,
  favourites,
  recent,
  onOpen,
  onSearch
}: HomeProps): React.JSX.Element {
  const overlay = useOverlayState()
  const crosshair = useCrosshair()
  const timer = useTimer()
  const update = useUpdate()
  const busy = update.status === 'checking' || update.status === 'downloading'
  const updateNote =
    update.status === 'available'
      ? 'Version ' + update.latest + ' is available.'
      : update.status === 'downloading'
        ? 'Downloading… ' + Math.round(update.progress * 100) + '%'
        : update.status === 'ready'
          ? 'Version ' + update.latest + ' is ready to install.'
          : update.status === 'up-to-date'
            ? 'You are up to date.'
            : update.status === 'error'
              ? update.error
              : update.status === 'checking'
                ? 'Checking…'
                : 'GKC looks for updates by itself.'

  return (
    <div>
      <div className="page-header">
        <svg
          className="page-header-art"
          width="260"
          height="56"
          viewBox="0 0 260 56"
          aria-hidden="true"
        >
          <g fill="none" stroke="#b33a3a" strokeWidth="1" opacity="0.28">
            <polyline points="260,0 210,28 260,56" />
            <polyline points="260,10 226,28 260,46" />
            <polyline points="260,20 242,28 260,36" />
            <polyline points="170,0 140,28 170,56" />
            <polyline points="170,12 152,28 170,44" />
          </g>
        </svg>
        <div className="page-title">
          <h1>Home</h1>
          <div className="page-sub">Pick what you want to do</div>
        </div>
        <button className="search" onClick={onSearch}>
          <IconSearch size={16} stroke={1.5} />
          <span>Search tools and data</span>
          <span className="kbd">Ctrl K</span>
        </button>
      </div>

      <h2 className="home-heading">What do you want to do?</h2>
      <div className="grid-4">
        {goals
          .filter((goal) => availableIds.includes(goal.tool))
          .map((goal) => {
            const Icon = getIcon(goal.icon)
            return (
              <button key={goal.tool} className="tile" onClick={() => onOpen(goal.tool)}>
                <Icon size={20} stroke={1.5} />
                <span className="tile-text">
                  {goal.label}
                  <small>{goal.hint}</small>
                </span>
              </button>
            )
          })}
      </div>

      <GettingStarted onOpenOverlay={onOpenOverlay} onOpenHotkeys={onOpenHotkeys} />

      <div className="grid-2">
        <Card title="Favourites">
          {favourites.length === 0 ? (
            <div className="empty-note">
              No favourites yet. Click the star inside a tool to add it here.
            </div>
          ) : (
            favourites.map((item) => (
              <button key={item.id} className="row row-link" onClick={() => onOpen(item.id)}>
                <IconStar size={16} stroke={1.5} />
                {item.name}
                <span className="row-meta">{categoryLabel(item.category)}</span>
              </button>
            ))
          )}
        </Card>

        <Card title="Recently used">
          {recent.length === 0 ? (
            <div className="empty-note">Tools you open will show up here.</div>
          ) : (
            recent.map((item) => (
              <button key={item.id} className="row row-link" onClick={() => onOpen(item.id)}>
                <IconClock size={16} stroke={1.5} />
                {item.name}
                <span className="row-meta">{categoryLabel(item.category)}</span>
              </button>
            ))
          )}
        </Card>
      </div>

      <div className="grid-2 home-row">
        <Card title="Updates">
          <div className="row">GKC {update.current}</div>
          <div className="empty-note">{updateNote}</div>
          <div className="btn-row">
            {update.status === 'available' ? (
              <button className="btn primary" onClick={() => window.api.update.download()}>
                Download update
              </button>
            ) : update.status === 'ready' && update.canInstall ? (
              <button className="btn primary" onClick={() => window.api.update.install()}>
                Restart and update
              </button>
            ) : (
              <button className="btn" disabled={busy} onClick={() => window.api.update.check()}>
                Check for updates
              </button>
            )}
          </div>
        </Card>

        <Card title="Quick controls">
          <div className="control-row">
            <span>Overlay</span>
            <button
              className={'sw' + (overlay.open ? ' on' : '')}
              role="switch"
              aria-checked={overlay.open}
              aria-label="Overlay"
              onClick={() => window.api.overlay.toggle()}
            />
          </div>
          <div className="control-row">
            <span>Click-through</span>
            <button
              className={'sw' + (overlay.clickThrough ? ' on' : '')}
              role="switch"
              aria-checked={overlay.clickThrough}
              aria-label="Click-through"
              onClick={() => window.api.overlay.setClickThrough(!overlay.clickThrough)}
            />
          </div>
          <div className="control-row">
            <span>Crosshair</span>
            <button
              className={'sw' + (crosshair.visible ? ' on' : '')}
              role="switch"
              aria-checked={crosshair.visible}
              aria-label="Crosshair"
              onClick={() => window.api.crosshair.set({ visible: !crosshair.visible })}
            />
          </div>
          <div className="control-row">
            <span className="control-time">{formatTime(timer.remaining)}</span>
            <span className="control-buttons">
              <button className="btn" onClick={() => window.api.timer.toggle()}>
                {timer.running ? 'Pause' : 'Start'}
              </button>
              <button className="btn" onClick={() => window.api.timer.reset()}>
                Reset
              </button>
            </span>
          </div>
        </Card>
      </div>

      <p className="timer-hint home-idea">
        Have an idea, a question about a function, or found something confusing?{' '}
        <button className="link-btn" onClick={onOpenIdeas}>
          Tell me here
        </button>
      </p>
    </div>
  )
}

export default Home
