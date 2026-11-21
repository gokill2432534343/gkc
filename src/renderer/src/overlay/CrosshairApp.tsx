// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import CrosshairShape from '../ui/CrosshairShape'
import { useCrosshair } from '../core/useCrosshair'
import { allMarks, windowBox } from '../core/crosshairGeometry'

function CrosshairApp(): React.JSX.Element {
  const settings = useCrosshair()
  const box = windowBox(settings)

  return (
    <div className="crosshair-root">
      {allMarks(settings).map((mark, index) => (
        <div
          key={index}
          className="crosshair-mark"
          style={{
            left: mark.offsetX - mark.size / 2 - box.minX,
            top: mark.offsetY - mark.size / 2 - box.minY,
            width: mark.size,
            height: mark.size
          }}
        >
          <CrosshairShape {...mark} />
        </div>
      ))}
    </div>
  )
}

export default CrosshairApp
