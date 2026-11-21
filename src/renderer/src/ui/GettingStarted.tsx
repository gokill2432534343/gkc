// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useEffect } from 'react'
import { IconCircle, IconCircleCheck } from '@tabler/icons-react'
import Card from './Card'
import { usePersistentState } from '../core/usePersistentState'
import { useCrosshair } from '../core/useCrosshair'
import { useOverlayState } from '../core/useOverlayState'

type GettingStartedProps = {
  onOpenOverlay: () => void
  onOpenHotkeys: () => void
}

// Home card: a short checklist that ticks itself off.
function GettingStarted({ onOpenOverlay, onOpenHotkeys }: GettingStartedProps): React.JSX.Element {
  const overlay = useOverlayState()
  const crosshair = useCrosshair()
  const [done, setDone] = usePersistentState<string[]>('gkc.setup', [])
  const [hidden, setHidden] = usePersistentState<boolean>('gkc.setup.hidden', false)

  function mark(id: string): void {
    setDone((old) => (old.includes(id) ? old : [...old, id]))
  }

  useEffect(() => {
    if (overlay.open) mark('overlay')
    if (crosshair.visible) mark('crosshair')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlay.open, crosshair.visible])

  const steps = [
    { id: 'overlay', label: 'Turn the overlay on', action: onOpenOverlay, button: 'Open Overlay' },
    { id: 'crosshair', label: 'Turn the crosshair on', action: undefined },
    {
      id: 'hotkeys',
      label: 'Look at your hotkeys',
      action: () => {
        mark('hotkeys')
        onOpenHotkeys()
      },
      button: 'Show hotkeys'
    }
  ]
  const allDone = steps.every((step) => done.includes(step.id))

  return (
    <div className="home-row">
      {!hidden && (
        <Card title={allDone ? 'All set!' : 'Getting started'}>
          {steps.map((step) => {
            const ok = done.includes(step.id)
            return (
              <div key={step.id} className={'setup-step' + (ok ? ' done' : '')}>
                {ok ? (
                  <IconCircleCheck size={18} stroke={1.5} />
                ) : (
                  <IconCircle size={18} stroke={1.5} />
                )}
                <span>{step.label}</span>
                {!ok && step.action && (
                  <button className="btn setting-btn" onClick={step.action}>
                    {step.button}
                  </button>
                )}
              </div>
            )
          })}
          <button className="btn setting-btn" onClick={() => setHidden(true)}>
            {allDone ? 'Done' : 'Hide this'}
          </button>
        </Card>
      )}
    </div>
  )
}

export default GettingStarted
