// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { IconStar, IconStarFilled } from '@tabler/icons-react'
import type { GkcModule } from '../core/types'

type ModulePageProps = {
  item: GkcModule
  categoryLabel: string
  favourite: boolean
  onToggleFavourite: () => void
  onBack: () => void
}

function ModulePage({
  item,
  categoryLabel,
  favourite,
  onToggleFavourite,
  onBack
}: ModulePageProps): React.JSX.Element {
  const Content = item.component

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <div className="crumbs">
            <button className="crumb-link" onClick={onBack}>
              {categoryLabel}
            </button>{' '}
            / {item.name}
          </div>
          <h1>{item.name}</h1>
        </div>
        <button
          className={'icon-btn' + (favourite ? ' on' : '')}
          onClick={onToggleFavourite}
          aria-label={favourite ? 'Remove from favourites' : 'Add to favourites'}
        >
          {favourite ? <IconStarFilled size={18} /> : <IconStar size={18} stroke={1.5} />}
        </button>
      </div>
      <Content />
    </div>
  )
}

export default ModulePage
