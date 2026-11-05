import type { CSSProperties } from 'react'
import type { Guide as GuideModel } from '../../types/model'
import { HIT_TOLERANCE } from './useHitTest'

const HIT_SIZE = HIT_TOLERANCE * 2 + 1
// N physical pixels regardless of display scaling.
const THICKNESS = 'calc(var(--thickness) / var(--dpr) * 1px)'

interface Props {
  guide: GuideModel
  selected: boolean
  dpr: number
  color: string // #RRGGBB
  opacity: number
  onDragStart(): void
  onDrag(position: number, x: number, y: number): void
  onDragEnd(): void
  onDoubleClick(): void
  onContextMenu(): void
}

// The visible line plus a transparent hit strip centred on it that handles the mouse.
export default function Guide(props: Props) {
  const { guide, selected, dpr, color, opacity, onDragStart, onDrag, onDragEnd, onDoubleClick, onContextMenu } = props
  const horizontal = guide.orientation === 'horizontal'
  // Snap the line to a whole physical pixel. On scaled displays an unsnapped sub-DIP line
  // can blur, or be pixel-snapped by Chromium down to zero height.
  const snapped = Math.round(guide.position * dpr) / dpr

  const line: CSSProperties = horizontal
    ? { left: 0, right: 0, top: snapped, height: THICKNESS }
    : { top: 0, bottom: 0, left: snapped, width: THICKNESS }

  const strip: CSSProperties = horizontal
    ? { left: 0, right: 0, top: guide.position - HIT_TOLERANCE, height: HIT_SIZE, cursor: 'row-resize' }
    : { top: 0, bottom: 0, left: guide.position - HIT_TOLERANCE, width: HIT_SIZE, cursor: 'col-resize' }

  return (
    <>
      <div
        style={{
          position: 'absolute',
          ...line,
          background: color,
          opacity,
          pointerEvents: 'none',
          // Soft halo marks the selected guide without changing its line.
          boxShadow: selected ? `0 0 0 2px ${color}4D` : undefined
        }}
      />
      <div
        style={{ position: 'absolute', ...strip }}
        onPointerDown={(e) => {
          if (e.button !== 0) return // right-click opens the menu, it doesn't drag
          e.currentTarget.setPointerCapture(e.pointerId)
          onDragStart()
        }}
        onPointerMove={(e) => {
          if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
          const max = horizontal ? window.innerHeight - 1 : window.innerWidth - 1
          const pos = Math.min(max, Math.max(0, Math.round(horizontal ? e.clientY : e.clientX)))
          onDrag(pos, e.clientX, e.clientY)
        }}
        // Capture is released on pointerup and on pointercancel; both end the drag.
        onLostPointerCapture={onDragEnd}
        onDoubleClick={onDoubleClick}
        onContextMenu={(e) => {
          e.preventDefault()
          onContextMenu()
        }}
      />
    </>
  )
}
