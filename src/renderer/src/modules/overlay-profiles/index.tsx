// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useState } from 'react'
import Card from '../../ui/Card'
import { useOverlayProfiles } from '../../core/useOverlayProfiles'
import type { OverlayProfileState } from '../../core/useOverlayProfiles'

type Profile = OverlayProfileState['profiles'][number]

function summary(profile: Profile): string {
  const parts: string[] = []
  if (profile.mapVisible) parts.push('Map')
  if (profile.showDuel) parts.push('1v1')
  if (profile.showStreak) parts.push('Streak')
  if (profile.showTimers) parts.push('Timers')
  if (profile.showBasicTimer) parts.push('Basic timer')
  if (profile.showSaveTimers) parts.push('Save timers')
  if (profile.crosshair) parts.push('Crosshair')
  if (profile.reshade) parts.push('ReShade')
  parts.push(profile.role === 'killer' ? 'Killer streak' : 'Survivor streak')
  return parts.join(' · ')
}

function OverlayProfiles(): React.JSX.Element {
  const { profiles, activeId } = useOverlayProfiles()
  const api = window.api.overlayProfiles
  const [newName, setNewName] = useState('')

  function create(): void {
    if (newName.trim() === '') return
    api.create(newName)
    setNewName('')
  }

  function remove(profile: Profile): void {
    if (window.confirm('Delete the profile "' + profile.name + '"?')) api.remove(profile.id)
  }

  return (
    <div className="module-stack">
      <Card
        title="Your profiles"
        help="A profile remembers a whole overlay setup: which panels are shown, the look, the crosshair and your streak role. Click a profile to use it."
      >
        <p className="settings-intro">
          A profile remembers which overlay panels are shown (map, 1v1, streak, timers, save timers), the map
          opacity and size, whether the crosshair is on, whether ReShade switches presets by map,
          and whether the streak tracker is on killer or survivor. Applying one sets all of that at
          once. In the game, the next and previous profile hotkeys switch between profiles (set them
          in Settings, Hotkeys).
        </p>
        {profiles.length === 0 && <div className="empty-note">No profiles yet.</div>}
        {profiles.map((profile) => (
          <div key={profile.id} className="setting-row">
            <div className="setting-text">
              <input
                className="map-filter"
                value={profile.name}
                maxLength={24}
                aria-label="Profile name"
                onChange={(event) => api.rename(profile.id, event.target.value)}
              />
              <small>
                {profile.id === activeId ? 'Active · ' : ''}
                {summary(profile)}
              </small>
            </div>
            <button className="btn primary setting-btn" onClick={() => api.apply(profile.id)}>
              Apply
            </button>
            <button
              className="btn setting-btn"
              title="Overwrite this profile with what is on the overlay right now"
              onClick={() => api.update(profile.id)}
            >
              Update
            </button>
            <button className="btn setting-btn" onClick={() => remove(profile)}>
              Delete
            </button>
          </div>
        ))}
      </Card>

      <Card
        title="Save the current setup"
        help="Gives the overlay as it looks right now a name and saves it as a profile, so you can come back to it in one click."
      >
        <p className="timer-hint">
          Set up the overlay the way you want it (panels, map, crosshair, streak role), give it a
          name and save it. Up to 10 profiles.
        </p>
        <div className="timer-actions">
          <input
            className="map-filter"
            placeholder="Profile name"
            value={newName}
            maxLength={24}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') create()
            }}
          />
          <button
            className="btn primary"
            onClick={create}
            disabled={newName.trim() === '' || profiles.length >= 10}
          >
            Save as new profile
          </button>
        </div>
      </Card>
    </div>
  )
}

export default OverlayProfiles
