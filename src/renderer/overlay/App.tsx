import { useEffect, useRef, useState } from 'react'
import Guide from './Guide'
import { setLocalPosition, useStore } from './store'
import { useDpr } from './useDpr'
import { useHitTest } from './useHitTest'

interface Badge {
  text: string
  x: number
  y: number
}

export default function App() {
  const { guides: allGuides, selectedId, settings } = useStore()
  const guides = allGuides.filter((g) => g.displayId === window.pauta.displayId)
  const [badge, setBadge] = useState<Badge | null>(null)
  const dragging = useRef(false)
  const dpr = useDpr()
  useHitTest(guides, dragging)

  useEffect(() => {
    document.documentElement.style.setProperty('--thickness', String(settings.thicknessPx))
  }, [settings.thicknessPx])

  return (
    <>
      {guides.map((g) => (
        <Guide
          key={g.id}
          guide={g}
          selected={g.id === selectedId}
          dpr={dpr}
          color={g.color ?? settings.defaultColor}
          opacity={settings.opacity}
          onDragStart={() => {
            dragging.current = true
            window.pauta.selectGuide(g.id)
          }}
          onDrag={(position, x, y) => {
            setLocalPosition(g.id, position)
            setBadge({ text: `${g.orientation === 'horizontal' ? 'y' : 'x'}: ${position}`, x, y })
          }}
          onDragEnd={() => {
            dragging.current = false
            setBadge(null)
            const current = useStore.getState().guides.find((o) => o.id === g.id)
            if (current) window.pauta.moveGuide(g.id, current.position)
          }}
          onDoubleClick={() => window.pauta.deleteGuide(g.id)}
          onContextMenu={() => {
            window.pauta.selectGuide(g.id)
            window.pauta.showGuideMenu(g.id)
          }}
        />
      ))}
      {badge && (
        <div
          style={{
            position: 'absolute',
            left: badge.x + 14,
            top: badge.y + 14,
            padding: '2px 6px',
            borderRadius: 3,
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            font: '11px ui-monospace, Consolas, monospace',
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          {badge.text}
        </div>
      )}
    </>
  )
}
