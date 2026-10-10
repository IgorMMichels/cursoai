import { localeNames, type UiLocale } from '@/lib/localization'
import { useLocalization } from '@/contexts/localization-context'
import { useTranslation } from 'react-i18next'
import { useId } from 'react'

export function LocalizationSelector({ compact = false, onLocaleChange }: { compact?: boolean; onLocaleChange?: (locale: UiLocale) => void }) {
  const id = useId()
  const { locale, setLocale } = useLocalization()
  const { t } = useTranslation('common')

  return <div className={compact ? 'flex items-center gap-2' : 'space-y-2'}>
    <label className="block text-xs font-medium text-[#ccd5ce]" htmlFor={`${id}-language`}>{t('language')}</label>
    <select
      id={`${id}-language`}
      data-language-select
      aria-label={t('language')}
      className="h-11 w-full rounded-xl border border-white/[.1] bg-[#0e0e14] px-3.5 text-sm text-[#e6eee8] outline-none transition focus:border-[#a78bfa]/55 focus:ring-2 focus:ring-[#a78bfa]/10"
      value={locale}
      onChange={(event) => {
        const selectedLocale = event.target.value as UiLocale
        setLocale(selectedLocale)
        onLocaleChange?.(selectedLocale)
      }}
    >
      {Object.entries(localeNames).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
    </select>
  </div>
}
