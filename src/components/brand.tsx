import { translateUi, translateTemplate } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { LocalizedLink as Link } from '@/components/localized-router'
import { cn } from 'cn'
import { omegaContours, omegaCopy } from '@/lib/omega-copy'

export function OmegaSymbol() {
  useUiTranslation();
  return <svg viewBox="0 0 240 220" fill="currentColor" aria-hidden="true" focusable="false">{omegaContours.map(d => <path key={d} d={d} />)}</svg>
}

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  useUiTranslation();
  return (
    <Link to="/landing" className={cn('group inline-flex items-center gap-3', className)} aria-label={translateUi(translateTemplate("{{value0}}, início", [omegaCopy.name]))}>
      <span className="brand-mark relative grid size-10 place-items-center">
        <img src="/brand/omega/symbol-accent.svg" alt={translateUi("")} className="size-[38px] object-contain transition-transform duration-500 group-hover:scale-110" />
      </span>
      {!compact && <span className="leading-tight"><span className="block font-display text-[15px] font-semibold tracking-[-.04em] text-[#f1eef7]">{translateUi(omegaCopy.name)}</span><span className="mt-1 block text-[9px] font-semibold uppercase tracking-[.18em] text-[#92909d]">{translateUi("método antes do mercado")}</span></span>}
    </Link>
  )
}
