// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { IconDownload } from '@tabler/icons-react'
import { useUpdate } from '../core/useUpdate'

type UpdateBannerProps = {
  onOpenSettings: () => void
}

function UpdateBanner({ onOpenSettings }: UpdateBannerProps): React.JSX.Element | null {
  const update = useUpdate()
  const api = window.api.update

  if (
    update.status !== 'available' &&
    update.status !== 'downloading' &&
    update.status !== 'ready'
  ) {
    return null
  }

  return (
    <div className="update-banner">
      <IconDownload size={18} stroke={1.5} />
      <div className="update-banner-text">
        {update.status === 'available' && <>Version {update.latest} is available.</>}
        {update.status === 'downloading' && (
          <>
            Downloading version {update.latest}… {Math.round(update.progress * 100)}%
          </>
        )}
        {update.status === 'ready' && <>Version {update.latest} is ready to install.</>}
      </div>
      {update.status === 'available' && (
        <button className="btn primary" onClick={() => api.download()}>
          Download
        </button>
      )}
      {update.status === 'ready' && update.canInstall && (
        <button className="btn primary" onClick={() => api.install()}>
          Restart and update
        </button>
      )}
      <button className="btn" onClick={onOpenSettings}>
        Details
      </button>
    </div>
  )
}

export default UpdateBanner
