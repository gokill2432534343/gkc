// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useEffect, useState } from 'react'
import Logo from './Logo'

type WelcomeGuideProps = {
  onClose: () => void
  onOpenOverlay: () => void
  onOpenHotkeys: () => void
}

const steps = [
  {
    title: 'Welcome to GKC',
    text: 'GKC is a toolkit for Dead by Daylight: timers, a crosshair, map layouts, builds, a 1v1 timer, stream overlays and more. It is an independent fan project and not affiliated with Behaviour Interactive. Everything stays on your computer.'
  },
  {
    title: 'The overlay',
    text: 'The overlay is a small transparent window on top of your game. Open the Overlay page in the sidebar to switch it on, choose what it shows and change its size. Turn on click-through so your mouse still reaches the game. Fullscreen games usually need borderless windowed mode.'
  },
  {
    title: 'Hotkeys',
    text: 'Most things work with hotkeys while you play, for example showing the map, starting the timer or switching crosshairs. GKC starts without hotkeys: set the ones you want in Settings, Hotkeys.'
  },
  {
    title: 'Tools for you',
    text: 'Playing killer? Try the Crosshair (profiles per killer) and the 1v1 timer. Playing survivor? Try Map detection and the Build creator. Streaming? Try the stream overlays. ReShade presets are under Maps and visuals. Press Ctrl+K any time to search for a tool.'
  },
  {
    title: 'Good to know',
    text: "Map detection and ReShade switching are optional and off by default. GKC never changes the game and never presses keys or moves the mouse for you. ReShade is third-party software, so check Behaviour's current rules before you use it. You can open this guide again in Settings, General."
  }
]

function WelcomeGuide({
  onClose,
  onOpenOverlay,
  onOpenHotkeys
}: WelcomeGuideProps): React.JSX.Element {
  const [index, setIndex] = useState(0)
  const step = steps[index]
  const last = index === steps.length - 1

  useEffect(() => {
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="search-backdrop" onClick={onClose}>
      <div
        className="welcome-dialog"
        role="dialog"
        aria-label="Welcome guide"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="welcome-head">
          <Logo size={34} />
          <div className="welcome-step">
            Step {index + 1} of {steps.length}
          </div>
        </div>
        <h2>{step.title}</h2>
        <p>{step.text}</p>

        {index === 1 && (
          <button className="btn" onClick={onOpenOverlay}>
            Open the Overlay page
          </button>
        )}
        {index === 2 && (
          <button className="btn" onClick={onOpenHotkeys}>
            Open Hotkeys
          </button>
        )}

        <div className="welcome-dots">
          {steps.map((item, dot) => (
            <button
              key={item.title}
              className={'welcome-dot' + (dot === index ? ' active' : '')}
              aria-label={'Go to step ' + (dot + 1)}
              onClick={() => setIndex(dot)}
            />
          ))}
        </div>

        <div className="welcome-actions">
          <button className="btn" onClick={onClose}>
            {last ? 'Close' : 'Skip'}
          </button>
          <span className="welcome-spacer" />
          {index > 0 && (
            <button className="btn" onClick={() => setIndex(index - 1)}>
              Back
            </button>
          )}
          <button className="btn primary" onClick={() => (last ? onClose() : setIndex(index + 1))}>
            {last ? 'Get started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default WelcomeGuide
