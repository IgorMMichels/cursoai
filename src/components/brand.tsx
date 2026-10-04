import { Link } from 'react-router-dom'
import { cn } from 'cn'

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link to="/landing" className={cn('group inline-flex items-center gap-3', className)} aria-label="Ômega, início">
      <span className="brand-mark relative grid size-10 place-items-center overflow-hidden rounded-xl border border-violet-300/25 bg-[#171321] shadow-[0_0_24px_rgba(152,120,255,.14)]">
        <img src="/brand/omega/symbol-accent.svg" alt="" className="size-[38px] object-contain transition-transform duration-500 group-hover:scale-110" />
      </span>
      {!compact && <span className="leading-tight"><span className="block font-display text-[15px] font-semibold tracking-[-.04em] text-[#f1eef7]">Ômega</span><span className="mt-1 block text-[9px] font-semibold uppercase tracking-[.18em] text-[#92909d]">método antes do mercado</span></span>}
    </Link>
  )
}
