import { Link } from 'react-router-dom'
import { cn } from 'cn'
import { brand, omegaContours } from '@/lib/omega-brand'

export function OmegaSymbol({ className, tone = 'accent' }: { className?: string; tone?: 'accent' | 'white' | 'dark' }) {
  return <svg viewBox="0 0 240 220" fill="currentColor" aria-hidden="true" focusable="false" className={cn('omega-symbol', `omega-symbol-${tone}`, className)}>
    {omegaContours.map((d) => <path key={d} d={d} />)}
  </svg>
}

export function Brand({ compact = false, className, size = 'normal', tone = 'auto', vertical = false }: {
  compact?: boolean; className?: string; size?: 'small' | 'normal' | 'large'; tone?: 'auto' | 'white' | 'dark'; vertical?: boolean
}) {
  return <Link to="/landing" aria-label={`${brand.name}, início`} className={cn('omega-brand', `omega-brand-${size}`, `omega-brand-${tone}`, vertical && 'omega-brand-vertical', className)}>
    <span className="brand-mark"><OmegaSymbol tone={tone === 'auto' ? 'accent' : tone} /></span>
    {!compact && <span className="omega-wordmark">{brand.name}</span>}
  </Link>
}
