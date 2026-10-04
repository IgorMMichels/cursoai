import { Link } from 'react-router-dom'
import { cn } from 'cn'
import { omegaContours, omegaCopy } from '@/lib/omega-copy'

export function OmegaSymbol() {
  return <svg viewBox="0 0 240 220" fill="currentColor" aria-hidden="true" focusable="false">{omegaContours.map(d => <path key={d} d={d} />)}</svg>
}

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link to="/landing" className={cn('group inline-flex items-center gap-3', className)} aria-label={`${omegaCopy.name}, início`}>
      <span className="brand-mark relative grid size-10 place-items-center">
        <img src="/brand/omega/symbol-accent.svg" alt="" className="size-[38px] object-contain transition-transform duration-500 group-hover:scale-110" />
      </span>
      {!compact && <span className="leading-tight"><span className="block font-display text-[15px] font-semibold tracking-[-.04em] text-[#f1eef7]">{omegaCopy.name}</span><span className="mt-1 block text-[9px] font-semibold uppercase tracking-[.18em] text-[#92909d]">método antes do mercado</span></span>}
    </Link>
  )
}
