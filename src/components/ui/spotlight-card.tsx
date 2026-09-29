import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from 'react'

type GlowColor = 'blue' | 'purple' | 'green' | 'red' | 'orange'
type CardSize = 'sm' | 'md' | 'lg'

interface GlowCardProps {
  children: ReactNode
  className?: string
  glowColor?: GlowColor
  size?: CardSize
  width?: string | number
  height?: string | number
  customSize?: boolean
}

const glowColors: Record<GlowColor, string> = {
  blue: '198 92% 68%',
  purple: '267 91% 75%',
  green: '157 77% 63%',
  red: '350 83% 69%',
  orange: '29 92% 66%',
}

const sizes: Record<CardSize, string> = {
  sm: 'w-48 min-h-64',
  md: 'w-64 min-h-80',
  lg: 'w-80 min-h-96',
}

export function GlowCard({
  children,
  className = '',
  glowColor = 'purple',
  size = 'md',
  width,
  height,
  customSize = false,
}: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const style: CSSProperties & Record<`--${string}`, string | number> = {
    '--spot-hue': glowColors[glowColor],
    '--spot-x': '50%',
    '--spot-y': '50%',
  }
  if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width
  if (height !== undefined) style.height = typeof height === 'number' ? `${height}px` : height

  const trackPointer = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    cardRef.current?.style.setProperty('--spot-x', `${event.clientX - bounds.left}px`)
    cardRef.current?.style.setProperty('--spot-y', `${event.clientY - bounds.top}px`)
    cardRef.current?.setAttribute('data-active', 'true')
  }

  return <div
    ref={cardRef}
    className={`spotlight-card ${customSize ? '' : sizes[size]} ${className}`}
    style={style}
    onPointerMove={trackPointer}
    onPointerLeave={() => cardRef.current?.setAttribute('data-active', 'false')}
  >
    {children}
  </div>
}
