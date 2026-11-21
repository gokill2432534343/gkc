// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useEffect, useState } from 'react'
import { IconHome, IconStar, IconSettings, IconPictureInPicture } from '@tabler/icons-react'
import type { Icon } from '@tabler/icons-react'
import Logo from './ui/Logo'
import SearchDialog from './ui/SearchDialog'
import WelcomeGuide from './ui/WelcomeGuide'
import UpdateBanner from './ui/UpdateBanner'
import Home from './pages/Home'
import Favourites from './pages/Favourites'
import Settings from './pages/Settings'
import OverlayPage from './pages/OverlayPage'
import CategoryPage from './pages/CategoryPage'
import ModulePage from './pages/ModulePage'
import { categories } from './core/categories'
import { getIcon } from './core/icons'
import { getModulesByIds, modules } from './core/registry'
import { useMapDetectApply } from './core/useMapDetect'
import { usePersistentState } from './core/usePersistentState'

type View =
  | { page: 'home' }
  | { page: 'favourites' }
  | { page: 'overlay' }
  | { page: 'settings'; section?: string }
  | { page: 'category'; id: string }
  | { page: 'module'; id: string }

type NavItemProps = {
  label: string
  icon: Icon
  active: boolean
  onClick: () => void
}

function NavItem({ label, icon: IconComponent, active, onClick }: NavItemProps): React.JSX.Element {
  return (
    <button className={'nav-item' + (active ? ' active' : '')} onClick={onClick}>
      <IconComponent size={18} stroke={1.5} />
      <span className="nav-label">{label}</span>
    </button>
  )
}

function App(): React.JSX.Element {
  useMapDetectApply()
  const [view, setView] = useState<View>({ page: 'home' })
  const [searchOpen, setSearchOpen] = useState(false)
  const [welcomed, setWelcomed] = usePersistentState<boolean>('gkc.welcomed', false)
  // people who already used GKC keep everything, new people start with the essentials
  const [mode, setMode] = usePersistentState<'basic' | 'advanced'>(
    'gkc.mode',
    welcomed ? 'advanced' : 'basic'
  )
  const [guideOpen, setGuideOpen] = useState(!welcomed)
  const [favouriteIds, setFavouriteIds] = usePersistentState<string[]>('gkc.favourites', [])
  const [recentIds, setRecentIds] = usePersistentState<string[]>('gkc.recent', [])
  const [disabledIds, setDisabledIds] = usePersistentState<string[]>('gkc.disabledModules', [])

  useEffect(() => {
    function onKey(event: KeyboardEvent): void {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const [orderIds, setOrderIds] = usePersistentState<string[]>('gkc.moduleOrder', [])

  const orderedModules = [...modules].sort((a, b) => {
    const rank = (id: string): number => {
      const index = orderIds.indexOf(id)
      return index === -1 ? orderIds.length + modules.findIndex((m) => m.id === id) : index
    }
    return rank(a.id) - rank(b.id)
  })

  const enabledModules = orderedModules.filter(
    (item) => !disabledIds.includes(item.id) && (mode === 'advanced' || !item.advanced)
  )

  const visibleCategories = categories.filter((category) =>
    enabledModules.some((item) => item.category === category.id)
  )

  const currentModule =
    view.page === 'module' ? enabledModules.find((item) => item.id === view.id) : undefined

  function enabledByIds(ids: string[]): typeof modules {
    return getModulesByIds(ids).filter(
      (item) => !disabledIds.includes(item.id) && (mode === 'advanced' || !item.advanced)
    )
  }

  const activeKey =
    view.page === 'category'
      ? view.id
      : view.page === 'module'
        ? currentModule?.category
        : view.page

  function openTool(id: string): void {
    setView({ page: 'module', id })
    setRecentIds([id, ...recentIds.filter((item) => item !== id)].slice(0, 5))
  }

  function toggleFavourite(id: string): void {
    setFavouriteIds(
      favouriteIds.includes(id) ? favouriteIds.filter((item) => item !== id) : [...favouriteIds, id]
    )
  }

  function toggleModule(id: string): void {
    setDisabledIds(
      disabledIds.includes(id) ? disabledIds.filter((item) => item !== id) : [...disabledIds, id]
    )
  }

  function moveModule(id: string, direction: -1 | 1): void {
    const ids = orderedModules.map((item) => item.id)
    const from = ids.indexOf(id)
    const to = from + direction
    if (from === -1 || to < 0 || to >= ids.length) return
    ;[ids[from], ids[to]] = [ids[to], ids[from]]
    setOrderIds(ids)
  }

  function resetAll(): void {
    setOrderIds([])
    setFavouriteIds([])
    setRecentIds([])
    setDisabledIds([])
  }

  function renderContent(): React.JSX.Element {
    if (view.page === 'home') {
      return (
        <Home
          availableIds={enabledModules.map((item) => item.id)}
          onOpenOverlay={() => setView({ page: 'overlay' })}
          onOpenHotkeys={() => setView({ page: 'settings', section: 'hotkeys' })}
          onOpenIdeas={() => setView({ page: 'settings', section: 'ideas' })}
          favourites={enabledByIds(favouriteIds)}
          recent={enabledByIds(recentIds)}
          onOpen={openTool}
          onSearch={() => setSearchOpen(true)}
        />
      )
    }

    if (view.page === 'favourites') {
      return <Favourites items={enabledByIds(favouriteIds)} onOpen={openTool} />
    }

    if (view.page === 'overlay') {
      return (
        <OverlayPage
          onOpenTool={openTool}
          availableIds={enabledModules.map((item) => item.id)}
          onOpenSettings={(section) => setView({ page: 'settings', section })}
        />
      )
    }

    if (view.page === 'category') {
      const category = categories.find((item) => item.id === view.id)
      if (category) {
        return (
          <CategoryPage
            category={category}
            items={enabledModules.filter((item) => item.category === category.id)}
            onOpen={openTool}
          />
        )
      }
    }

    if (view.page === 'module' && currentModule) {
      const category = categories.find((item) => item.id === currentModule.category)
      return (
        <ModulePage
          item={currentModule}
          categoryLabel={category?.label ?? ''}
          favourite={favouriteIds.includes(currentModule.id)}
          onToggleFavourite={() => toggleFavourite(currentModule.id)}
          onBack={() => setView({ page: 'category', id: currentModule.category })}
        />
      )
    }

    if (view.page === 'settings') {
      return (
        <Settings
          key={view.section ?? 'default'}
          initialSection={view.section}
          modules={orderedModules}
          disabledIds={disabledIds}
          onMoveModule={moveModule}
          onToggleModule={toggleModule}
          onClearRecent={() => setRecentIds([])}
          onResetAll={resetAll}
          onShowGuide={() => setGuideOpen(true)}
          mode={mode}
          onChangeMode={setMode}
        />
      )
    }

    return (
      <>
        <h1>Not found</h1>
        <p>This page does not exist.</p>
      </>
    )
  }

  return (
    <div className="app">
      <header className="titlebar">
        <Logo size={16} />
        <span className="titlebar-name">GKC</span>
      </header>

      <nav className="nav">
        <div className="nav-logo">
          <Logo size={22} />
          <span className="nav-label">GKC</span>
        </div>

        <NavItem
          label="Home"
          icon={IconHome}
          active={activeKey === 'home'}
          onClick={() => setView({ page: 'home' })}
        />
        <NavItem
          label="Favourites"
          icon={IconStar}
          active={activeKey === 'favourites'}
          onClick={() => setView({ page: 'favourites' })}
        />

        <NavItem
          label="Overlay"
          icon={IconPictureInPicture}
          active={activeKey === 'overlay'}
          onClick={() => setView({ page: 'overlay' })}
        />

        {visibleCategories.map((category) => (
          <NavItem
            key={category.id}
            label={category.label}
            icon={getIcon(category.icon)}
            active={activeKey === category.id}
            onClick={() => setView({ page: 'category', id: category.id })}
          />
        ))}

        <div className="nav-spacer" />

        <NavItem
          label="Settings"
          icon={IconSettings}
          active={activeKey === 'settings'}
          onClick={() => setView({ page: 'settings' })}
        />
      </nav>

      <main className="content">
        <UpdateBanner onOpenSettings={() => setView({ page: 'settings', section: 'updates' })} />
        <div key={view.page + ('id' in view ? view.id : '')} className="page-fade">
          {renderContent()}
        </div>
      </main>

      {guideOpen && (
        <WelcomeGuide
          onClose={() => {
            setGuideOpen(false)
            setWelcomed(true)
          }}
          onOpenOverlay={() => {
            setGuideOpen(false)
            setWelcomed(true)
            setView({ page: 'overlay' })
          }}
          onOpenHotkeys={() => {
            setGuideOpen(false)
            setWelcomed(true)
            setView({ page: 'settings', section: 'hotkeys' })
          }}
        />
      )}

      {searchOpen && (
        <SearchDialog
          tools={enabledModules}
          onOpenTool={openTool}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </div>
  )
}

export default App
