import { useTranslation } from 'react-i18next'
import { translateUi } from '@/lib/ui-translation'

export function FounderBadge({ isFounder, className = '' }: { isFounder: boolean; className?: string }) {
  useTranslation()
  if (!isFounder) return null
  return <span className={`inline-flex items-center gap-1 rounded-full border border-[#e4bc76]/35 bg-[#e4bc76]/[.1] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#f0ce88] ${className}`} title={translateUi('Founder · um dos 25 primeiros apoiadores')}>✦ {translateUi('Founder')}</span>
}
