// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import Card from './Card'
import Logo from './Logo'
import { credits } from '../content/credits'

type AboutPanelProps = { version: string }

// Where ideas came from. Only ideas, no code or artwork was copied from these projects.
const inspirations = [
  {
    name: 'dbd-overlay by H4RDC0RN',
    what: 'The idea of reading the map name from the screen and switching the map layout and ReShade filter automatically.'
  },
  {
    name: 'DBD Overlay Tools',
    what: 'The idea of a 1v1 timer with different looks, and tournament result panels for streams.'
  },
  {
    name: 'Dead by Daylight timer overlays from the community',
    what: 'Ideas for timers and stream panels that players already use in tournaments and on stream.'
  }
]

const builtWith = [
  'Electron, React and TypeScript for the app',
  'Tesseract.js to read text on screen for map detection',
  'Tabler Icons for the icons'
]

function AboutPanel({ version }: AboutPanelProps): React.JSX.Element {
  return (
    <div className="module-stack">
      <Card>
        <div className="about-head">
          <Logo size={40} />
          <div>
            <div className="about-name">GKC</div>
            <div className="about-sub">Version {version}</div>
          </div>
        </div>
        <p className="about-text">
          GKC is a toolkit for Dead by Daylight players, from newcomers to tournament players and
          streamers. It brings the small tools you would otherwise run separately into one place:
          timers, a crosshair, map layouts, a 1v1 timer, stats, builds and stream overlays. It is
          made by one person who plays the game, and it grows with feedback from players.
        </p>
        <p className="about-text">
          GKC runs on your computer and does not read or change the game's files or memory. Map
          detection only looks at a screenshot of your screen. GKC does not press keys or move the
          mouse for you. Your settings stay on your PC.
        </p>
      </Card>

      <Card title="What inspired GKC">
        <p className="about-text">
          GKC is built on ideas that the Dead by Daylight community has already shown to be useful.
          No code or artwork was copied from these projects, everything in GKC is written and
          designed from scratch.
        </p>
        {inspirations.map((item) => (
          <div key={item.name} className="about-item">
            <strong>{item.name}</strong>
            <span>{item.what}</span>
          </div>
        ))}
      </Card>

      {credits.length > 0 && (
        <Card title="Credits">
          {credits.map((credit) => (
            <div key={credit.name} className="about-item">
              <strong>{credit.name}</strong>
              <span>
                {credit.what}
                {credit.url ? ' · ' + credit.url : ''}
              </span>
            </div>
          ))}
        </Card>
      )}

      <Card title="Built with">
        <ul className="about-list">
          {builtWith.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="about-text">
          Perk and killer names were compiled with the Dead by Daylight Wiki
          (deadbydaylight.wiki.gg) as a reference.
        </p>
      </Card>

      <Card title="Legal">
        <p className="about-text">
          Copyright (c) 2026 gokill. GKC is licensed under the PolyForm Noncommercial License 1.0.0:
          you may use and change it for noncommercial purposes and share it with this notice kept,
          but not sell it or present it as your own.
        </p>
        <p className="about-text">
          GKC is an independent fan project. It is not affiliated with, endorsed by or sponsored by
          Behaviour Interactive. Dead by Daylight and all related names belong to Behaviour
          Interactive Inc. GKC is free and non-commercial: it has no payments, donations or paid
          versions. Game artwork shown in GKC belongs to Behaviour Interactive. ReShade and OBS are
          third-party software, so check their rules and the game&apos;s current rules before you
          use them together.
        </p>
      </Card>
    </div>
  )
}

export default AboutPanel
