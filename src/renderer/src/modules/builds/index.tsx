// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
// One module for everything about builds. The three tools keep their own folders and are shown
// here as tabs (their module.json files are gone, so they are no longer listed on their own).
import BuildCreator from '../build-creator'
import PerkRandomizer from '../perk-randomizer'
import KillerRandomizer from '../killer-randomizer'
import { usePersistentState } from '../../core/usePersistentState'

type Tab = 'build' | 'perks' | 'killers'

const tabs: { id: Tab; label: string }[] = [
  { id: 'build', label: 'Build creator' },
  { id: 'perks', label: 'Random perks' },
  { id: 'killers', label: 'Random killer' }
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
      {current === 'perks' && <PerkRandomizer />}
      {current === 'killers' && <KillerRandomizer />}
    </div>
  )
}

export default Builds
