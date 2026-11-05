import { useEffect, useState } from 'react'

// Tracks this display's devicePixelRatio and mirrors it into the --dpr CSS variable.
export function useDpr() {
  const [dpr, setDpr] = useState(window.devicePixelRatio)

  useEffect(() => {
    document.documentElement.style.setProperty('--dpr', String(dpr))
    const mq = matchMedia(`(resolution: ${dpr}dppx)`)
    const onChange = () => setDpr(window.devicePixelRatio)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [dpr])

  return dpr
}
