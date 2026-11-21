// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useState } from 'react'
import { IconCheck, IconCopy } from '@tabler/icons-react'
import Card from '../../ui/Card'
import Help from '../../ui/Help'
import { useObs } from '../../core/useObs'

function StreamOverlays(): React.JSX.Element {
  const { config, status, panels = [] } = useObs()
  const [port, setPort] = useState<string>('')
  const [copied, setCopied] = useState('')

  const shownPort = port !== '' ? port : String(config.port)
  const base = 'http://127.0.0.1:' + config.port

  function copy(url: string, id: string): void {
    void navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(''), 1500)
  }

  return (
    <div className="module-stack">
      <Card
        title="Local server"
        help="OBS cannot see GKC directly, so GKC starts a tiny web page on your own computer that OBS can load. Nobody else can reach it. Turn it on here, then add the addresses below to OBS."
      >
        <p className="settings-intro">
          This starts a small web server that only your own computer can reach. OBS loads the
          overlays from it as browser sources. It is off by default and stops when you close GKC.
        </p>
        <div className="switch-row">
          <span>
            Run stream overlays
            <Help text="Starts or stops that web page. OBS only shows the overlays while this is on." />
          </span>
          <button
            className={'sw' + (config.enabled ? ' on' : '')}
            role="switch"
            aria-checked={config.enabled}
            aria-label="Run stream overlays"
            onClick={() => window.api.obs.setEnabled(!config.enabled)}
          />
        </div>
        <div className="switch-row">
          <span>
            Port
            <Help text="A number that is part of the address. Leave it as it is unless another program already uses it. If you change it, press Apply and use the new addresses in OBS." />
          </span>
          <span className="build-save">
            <input
              className="multi-seconds"
              type="number"
              min={1024}
              max={65535}
              value={shownPort}
              aria-label="Port"
              onChange={(event) => setPort(event.target.value)}
            />
            <button
              className="btn setting-btn"
              onClick={() => {
                window.api.obs.setPort(Number(shownPort))
                setPort('')
              }}
              disabled={shownPort === String(config.port)}
            >
              Apply
            </button>
          </span>
        </div>
        <p className={'reshade-status' + (status.error ? ' error' : '')}>
          {status.error
            ? status.error
            : status.running
              ? 'Running on ' + base
              : config.enabled
                ? 'Starting…'
                : 'Off'}
        </p>
      </Card>

      <Card
        title="Overlay gallery"
        help="All overlays you can use on stream. Each tile shows a preview. Press Copy and paste the address into an OBS Browser source."
      >
        <p className="settings-intro">
          Every overlay with a live preview. Press Copy and paste the address into an OBS Browser
          source.
        </p>
        <div className="gallery">
          {panels.map((panel) => {
            const url = base + '/overlay/' + panel.id
            return (
              <div key={panel.id} className="gallery-tile">
                <div className="gallery-preview">
                  {status.running ? (
                    <iframe
                      className="gallery-frame"
                      src={url + '?bg=1'}
                      title={panel.label + ' preview'}
                      tabIndex={-1}
                      loading="lazy"
                    />
                  ) : (
                    <span className="gallery-off">Turn on &quot;Run stream overlays&quot;</span>
                  )}
                </div>
                <div className="gallery-info">
                  <div className="setting-text">
                    {panel.label}
                    <small>{url}</small>
                  </div>
                  <button className="btn setting-btn" onClick={() => copy(url, panel.id)}>
                    {copied === panel.id ? (
                      <IconCheck size={14} stroke={1.5} />
                    ) : (
                      <IconCopy size={14} stroke={1.5} />
                    )}
                    {copied === panel.id ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card
        title="How to use in OBS"
        help="Step by step: turn on the server, add a Browser source in OBS, paste an address, set the size."
      >
        <ol className="obs-steps">
          <li>Turn on &quot;Run stream overlays&quot; above.</li>
          <li>In OBS, add a source of the type Browser and paste an address from the list.</li>
          <li>
            Set the width and height of the source to fit it (the 1v1 timer is one wide line, about
            900 by 100; the others fit in about 700 by 200), and leave the custom CSS empty. The
            background is transparent.
          </li>
          <li>
            Optional: add <code>?scale=1.5</code> to the address to make it bigger, or{' '}
            <code>?bg=1</code> to get a dark panel behind it.
          </li>
        </ol>
        <p className="timer-hint">
          The overlays show the same data as the in-game overlay, so use the 1v1 timer, streak
          tracker, multi timers and map modules to control them. For the scoreboard, set the match
          title and the best-of number in the 1v1 timer module.
        </p>
      </Card>
    </div>
  )
}

export default StreamOverlays
