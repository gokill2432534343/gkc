// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
// One module for everything about builds: the build creator and one roulette that rolls
// survivors, killers, items, add-ons and perks. The old tools keep their own folders (the
// roulette reuses the perk logic) but are no longer listed on their own.
import BuildCreator from '../build-creator'
import Roulette from './Roulette'
import { usePersistentState } from '../../core/usePersistentState'

type Tab = 'build' | 'roulette'

const tabs: { id: Tab; label: string }[] = [
  { id: 'build', label: 'Build creator' },
  { id: 'roulette', label: 'Roulette' }
]

function Builds(): React.JSX.Element {
  const [tab, setTab] = usePersistentState<Tab>('gkc.builds.tab', 'build')
  const current: Tab = tabs.some((item) => item.id === tab) ? tab : 'build'

  return (
    <div className="module-stack">
      <div className="seg">
        {tabs.map((item) => (
          <button
            key={item.id}
            className={current === item.id ? 'active' : ''}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {current === 'build' && <BuildCreator />}
      {current === 'roulette' && <Roulette />}
    </div>
  )
}

export default Builds
