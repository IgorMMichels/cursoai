import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { localeNames, type UiLocale } from '@/lib/localization'
import { useLocalization } from '@/contexts/localization-context'

// Troca de idioma compacta para cabeçalhos (site e curso). Não altera preços nem planos.
export function HeaderLanguageSelect({ className = '' }: { className?: string }) {
  const id = useId()
  const { locale, setLocale } = useLocalization()
  const { t } = useTranslation('common')
  return <label htmlFor={id} className={`relative inline-flex h-9 items-center rounded-full border border-white/[.1] bg-white/[.02] pl-3 pr-7 text-xs text-[#c9c4d6] transition hover:border-white/25 hover:text-white focus-within:border-[#b49cff]/55 ${className}`}>
    <span className="sr-only">{t('language')}</span>
    <select
      id={id}
      data-language-select
      value={locale}
      onChange={(event) => setLocale(event.target.value as UiLocale)}
      className="appearance-none bg-transparent pr-1 outline-none [&>option]:bg-[#0e0e14] [&>option]:text-[#e6eee8]"
    >
      {Object.entries(localeNames).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
    </select>
    <svg aria-hidden="true" viewBox="0 0 12 12" className="pointer-events-none absolute right-2.5 size-3 text-[#8b8793]"><path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </label>
}
