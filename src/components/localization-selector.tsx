import { localeNames, type MarketId, type UiLocale } from '@/lib/localization'
import { useLocalization } from '@/contexts/localization-context'
import { useTranslation } from 'react-i18next'

export function LocalizationSelector({ compact = false }: { compact?: boolean }) {
  const { locale, market, setLocale, setMarket } = useLocalization()
  const { t } = useTranslation('common')
  const label = { language: t('language'), region: t('region') }
  const regions: Record<MarketId, string> = locale === 'pt-BR'
    ? { BR: 'Brasil', US: 'Estados Unidos', ES: 'Espanha', FR: 'França', OTHER: 'Outro país' }
    : locale === 'es'
      ? { BR: 'Brasil', US: 'Estados Unidos', ES: 'España', FR: 'Francia', OTHER: 'Otro país' }
      : locale === 'fr'
        ? { BR: 'Brésil', US: 'États-Unis', ES: 'Espagne', FR: 'France', OTHER: 'Autre pays' }
        : { BR: 'Brazil', US: 'United States', ES: 'Spain', FR: 'France', OTHER: 'Other country' }
  const selectClass = 'h-8 rounded-lg border border-white/10 bg-[#14141b] px-2 text-[10px] text-[#d8d4df] outline-none focus:border-[#a78bfa]/60'
  return <div className={`flex items-center gap-1.5 ${compact ? 'flex-wrap' : ''}`}>
    <label className="sr-only" htmlFor="site-language">{label.language}</label>
    <select id="site-language" aria-label={label.language} className={selectClass} value={locale} onChange={(event) => setLocale(event.target.value as UiLocale)}>
      {Object.entries(localeNames).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
    </select>
    <label className="sr-only" htmlFor="site-region">{label.region}</label>
    <select id="site-region" aria-label={label.region} className={selectClass} value={market} onChange={(event) => setMarket(event.target.value as MarketId)}>
      {Object.entries(regions).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
    </select>
  </div>
}
