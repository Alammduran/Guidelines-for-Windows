import { useEffect, useRef, type MutableRefObject } from 'react'
import type { Guide } from '../../types/model'

export const HIT_TOLERANCE = 6

// The overlay is pass-through (with mousemove forwarding) until the cursor comes within
// HIT_TOLERANCE of a guide, then it turns interactive so the guide can be grabbed.
export function useHitTest(guides: Guide[], dragging: MutableRefObject<boolean>) {
  const guidesRef = useRef(guides)
  guidesRef.current = guides

  useEffect(() => {
    let interactive = false
    const onMove = (e: MouseEvent) => {
      if (dragging.current) return
      const near = guidesRef.current.some(
        (g) => Math.abs((g.orientation === 'horizontal' ? e.clientY : e.clientX) - g.position) <= HIT_TOLERANCE
      )
      // Only send IPC when the state changes; toggling on every move flickers and drops clicks.
      if (near !== interactive) {
        interactive = near
        window.pauta.setInteractive(near)
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [dragging])
}
