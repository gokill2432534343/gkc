// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import Help from './Help'

type CardProps = {
  title?: string
  // plain-language explanation shown with a "?" next to the title
  help?: string
  children: React.ReactNode
}

function Card({ title, help, children }: CardProps): React.JSX.Element {
  return (
    <div className="card">
      {title && (
        <div className="card-title">
          {title}
          {help && <Help text={help} />}
        </div>
      )}
      {children}
    </div>
  )
}

export default Card
