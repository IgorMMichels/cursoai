import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

const interactiveSelector = 'a, button, input, textarea, select, [role="button"], [data-cursor="interactive"]'

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [pressed, setPressed] = useState(false)
  const pointerX = useMotionValue(-100)
  const pointerY = useMotionValue(-100)
  const ringX = useSpring(pointerX, { stiffness: 520, damping: 38, mass: 0.45 })
  const ringY = useSpring(pointerY, { stiffness: 520, damping: 38, mass: 0.45 })

  useEffect(() => {
    const pointerQuery = window.matchMedia('(pointer: fine)')
    const syncMode = () => setEnabled(pointerQuery.matches)
    syncMode()
    pointerQuery.addEventListener('change', syncMode)
    return () => {
      pointerQuery.removeEventListener('change', syncMode)
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      document.documentElement.classList.remove('has-custom-cursor')
      return
    }

    document.documentElement.classList.add('has-custom-cursor')
    const move = (event: PointerEvent) => {
      pointerX.set(event.clientX)
      pointerY.set(event.clientY)
    }
    const over = (event: PointerEvent) => {
      setHovering(Boolean((event.target as HTMLElement | null)?.closest(interactiveSelector)))
    }
    const down = () => setPressed(true)
    const up = () => setPressed(false)
    const leave = () => {
      setHovering(false)
      setPressed(false)
    }

    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerover', over, { passive: true })
    window.addEventListener('pointerdown', down, { passive: true })
    window.addEventListener('pointerup', up, { passive: true })
    document.addEventListener('pointerleave', leave)
    return () => {
      document.documentElement.classList.remove('has-custom-cursor')
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerover', over)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      document.removeEventListener('pointerleave', leave)
    }
  }, [enabled, pointerX, pointerY])

  if (!enabled) return null

  return <div className="custom-cursor-layer" aria-hidden="true">
    <motion.span className={`custom-cursor-ring${hovering ? ' is-hovering' : ''}${pressed ? ' is-pressed' : ''}`} style={{ left: ringX, top: ringY }} />
    <motion.span className={`custom-cursor-core${pressed ? ' is-pressed' : ''}`} style={{ left: pointerX, top: pointerY }} />
  </div>
}
