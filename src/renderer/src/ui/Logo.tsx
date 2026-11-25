// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
type LogoProps = { size?: number }

function Logo({ size = 24 }: LogoProps): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 180 180" aria-hidden="true">
      <polyline
        points="122,28 58,28 28,58 28,122 58,152 122,152 152,122 152,96 116,96"
        fill="none"
        style={{ stroke: 'var(--t-hi)' }}
        strokeWidth="12"
      />
      <rect x="67" y="58" width="10" height="64" style={{ fill: 'var(--t-hi)' }} />
      <polygon points="77,84 106,56 122,56 77,100" fill="#b33a3a" />
      <polygon points="77,96 106,124 122,124 77,80" fill="#b33a3a" />
    </svg>
  )
}

export default Logo
