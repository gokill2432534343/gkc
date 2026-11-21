// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
type CrosshairShapeProps = {
  style: string
  color: string
  size: number
  thickness: number
  gap: number
  opacity: number
  outline: boolean
  ticks?: number
  tickSpacing?: number
}

const C = 50
const REACH = 40

function arms(gap: number, directions: [number, number][]): React.JSX.Element[] {
  return directions.map(([dx, dy], index) => (
    <line key={index} x1={C + dx * gap} y1={C + dy * gap} x2={C + dx * REACH} y2={C + dy * REACH} />
  ))
}

const straight: [number, number][] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0]
]
const diagonal: [number, number][] = [
  [0.7, -0.7],
  [0.7, 0.7],
  [-0.7, 0.7],
  [-0.7, -0.7]
]

function shapes(style: string, gap: number, thickness: number): React.JSX.Element {
  const dot = <circle cx={C} cy={C} r={thickness * 0.9} className="fill" />

  switch (style) {
    case 'dot':
      return dot
    case 'cross':
      return (
        <>
          <line x1={C - REACH} y1={C} x2={C + REACH} y2={C} />
          <line x1={C} y1={C - REACH} x2={C} y2={C + REACH} />
        </>
      )
    case 'gap-cross':
      return <>{arms(gap, straight)}</>
    case 'cross-dot':
      return (
        <>
          {arms(Math.max(gap, thickness * 2), straight)}
          {dot}
        </>
      )
    case 't-shape':
      return (
        <>
          {arms(
            gap,
            straight.filter(([, dy]) => dy !== -1)
          )}
        </>
      )
    case 'x':
      return <>{arms(gap, diagonal)}</>
    case 'circle':
      return <circle cx={C} cy={C} r={26} fill="none" />
    case 'circle-dot':
      return (
        <>
          <circle cx={C} cy={C} r={26} fill="none" />
          {dot}
        </>
      )
    case 'ring-cross':
      return (
        <>
          <circle cx={C} cy={C} r={16} fill="none" />
          {arms(16 + gap / 2, straight)}
        </>
      )
    case 'chevron':
      return <polyline points="32,60 50,40 68,60" fill="none" />
    case 'square':
      return <rect x={C - 14} y={C - 14} width={28} height={28} fill="none" />
    default:
      return dot
  }
}

function CrosshairShape({
  style,
  color,
  size,
  thickness,
  gap,
  opacity,
  outline,
  ticks = 0,
  tickSpacing = 6
}: CrosshairShapeProps): React.JSX.Element {
  const base = shapes(style, gap, thickness)
  const tickLines = Array.from({ length: ticks }, (_, index) => {
    const y = C + 12 + tickSpacing * (index + 1)
    return <line key={'tick' + index} x1={C - 5} y1={y} x2={C + 5} y2={y} />
  })
  const content = (
    <>
      {base}
      {tickLines}
    </>
  )

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity }}>
      {outline && (
        <g
          stroke="#000000"
          strokeWidth={thickness + 2.5}
          strokeLinecap="butt"
          strokeLinejoin="round"
          fill="#000000"
          className="crosshair-outline"
        >
          {content}
        </g>
      )}
      <g
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="butt"
        strokeLinejoin="round"
        fill={color}
        className="crosshair-main"
      >
        {content}
      </g>
    </svg>
  )
}

export default CrosshairShape
