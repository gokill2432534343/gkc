// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useEffect, useState } from 'react'
import { maps } from '../../content/maps'
import { useOverlayContent } from '../../core/useOverlayContent'
import { usePersistentState } from '../../core/usePersistentState'

function ManualMap(): React.JSX.Element {
  const content = useOverlayContent()
  const [realm, setRealm] = usePersistentState<string>('gkc.map.realm', '')
  const [mapId, setMapId] = usePersistentState<string>('gkc.map.id', '')
  const [variantId, setVariantId] = usePersistentState<string>('gkc.map.variant', '')
  const [filter, setFilter] = useState('')

  const realms = [...new Set(maps.map((item) => item.realm))]
  const activeRealm = realms.includes(realm) ? realm : (realms[0] ?? '')
  const realmMaps = maps.filter((item) => item.realm === activeRealm)
  const filtered = realmMaps.filter((item) =>
    item.name.toLowerCase().includes(filter.toLowerCase())
  )
  const selectedMap = maps.find((item) => item.id === mapId) ?? realmMaps[0]
  const selectedVariant =
    selectedMap?.variants.find((item) => item.id === variantId) ?? selectedMap?.variants[0]

  // Keep the overlay in sync when the selection changes while the map is shown
  useEffect(() => {
    if (
      selectedMap &&
      selectedVariant &&
      content.mapUrl &&
      !content.mapUrl.startsWith('data:') &&
      content.mapUrl !== selectedVariant.url
    ) {
      window.api.overlay.setContent({
        mapUrl: selectedVariant.url,
        mapName: selectedMap.name
      })
      window.api.reshade.applyMap(selectedMap.id, selectedMap.name)
    }
  }, [selectedMap, selectedVariant, content.mapUrl])

  if (maps.length === 0) {
    return (
      <div className="empty-state">
        <h3>No maps yet</h3>
        <p>
          Add map images to <code>src/renderer/src/content/maps/</code> using the folders{' '}
          <code>realm/map/layout.png</code>. They appear here automatically after a restart of{' '}
          <code>npm run dev</code>. See the README in that folder.
        </p>
      </div>
    )
  }

  function show(): void {
    if (!selectedMap || !selectedVariant) return
    window.api.overlay.setContent({
      mapUrl: selectedVariant.url,
      mapName: selectedMap.name,
      mapVisible: true
    })
    window.api.reshade.applyMap(selectedMap.id, selectedMap.name)
  }

  function hide(): void {
    window.api.overlay.setContent({ mapVisible: false })
  }

  return (
    <div>
      <div className="realm-tabs">
        {realms.map((name) => (
          <button
            key={name}
            className={'chip-btn' + (name === activeRealm ? ' active' : '')}
            onClick={() => {
              setRealm(name)
              setMapId('')
              setVariantId('')
            }}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="map-layout">
        <div className="map-list">
          <input
            className="map-filter"
            placeholder="Filter maps"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
          {filtered.map((item) => (
            <button
              key={item.id}
              className={'row row-link' + (selectedMap?.id === item.id ? ' selected' : '')}
              onClick={() => {
                setMapId(item.id)
                setVariantId('')
              }}
            >
              {item.name}
              <span className="row-meta">
                {item.variants.length} layout{item.variants.length === 1 ? '' : 's'}
              </span>
            </button>
          ))}
          {filtered.length === 0 && <div className="empty-note">No maps match.</div>}
        </div>

        <div className="map-preview">
          {selectedMap && selectedVariant && (
            <>
              <div className="timer-presets">
                {selectedMap.variants.map((variant) => (
                  <button
                    key={variant.id}
                    className={'chip-btn' + (variant.id === selectedVariant.id ? ' active' : '')}
                    onClick={() => setVariantId(variant.id)}
                  >
                    {variant.label}
                  </button>
                ))}
              </div>

              <div className="map-image-wrap">
                <img src={selectedVariant.url} alt={selectedMap.name} />
              </div>

              <div className="timer-actions">
                <button className="btn primary" onClick={show}>
                  Show on overlay
                </button>
                <button className="btn" onClick={hide} disabled={!content.mapVisible}>
                  Hide
                </button>
              </div>

              <label className="map-slider">
                Opacity
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={Math.round(content.opacity * 100)}
                  onChange={(event) =>
                    window.api.overlay.setContent({ opacity: Number(event.target.value) / 100 })
                  }
                />
              </label>
              <label className="map-slider">
                Size
                <input
                  type="range"
                  min={300}
                  max={900}
                  step={20}
                  value={content.size}
                  onChange={(event) =>
                    window.api.overlay.setContent({ size: Number(event.target.value) })
                  }
                />
              </label>
              <p className="timer-hint">
                Show or hide the map in the game with the map hotkey (see Settings, Hotkeys). Turn
                on click-through in Settings, Overlay so clicks reach the game.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ManualMap
