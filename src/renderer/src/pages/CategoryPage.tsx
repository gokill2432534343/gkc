// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { getIcon } from '../core/icons'
import type { Category, GkcModule } from '../core/types'

type CategoryPageProps = {
  category: Category
  items: GkcModule[]
  onOpen: (moduleId: string) => void
}

function CategoryPage({ category, items, onOpen }: CategoryPageProps): React.JSX.Element {
  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>{category.label}</h1>
          <div className="page-sub">
            {items.length} {items.length === 1 ? 'tool' : 'tools'}
          </div>
        </div>
      </div>

      <div className="grid-3">
        {items.map((item) => {
          const Icon = getIcon(item.icon)
          return (
            <button key={item.id} className="tile" onClick={() => onOpen(item.id)}>
              <Icon size={20} stroke={1.5} />
              <span className="tile-text">
                {item.name}
                <small>{item.description}</small>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default CategoryPage
