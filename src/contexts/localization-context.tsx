import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getStoredValue, setStoredValue } from '@/lib/storage'
import { localeFromPath, localizationStorageKey, normalizeLocale, normalizePathname, resolveInitialLocale, serializeLocalizationPreference, uiLocales, type MarketId, type UiLocale } from '@/lib/localization'
import type { RegionalCatalog } from '@/lib/regional-offers'

const resources = {
  'pt-BR': { common: { language: 'Idioma', region: 'Região', chooseLanguage: 'Escolha o idioma', chooseRegion: 'Escolha a região' } },
  en: { common: { language: 'Language', region: 'Region', chooseLanguage: 'Choose language', chooseRegion: 'Choose region' } },
  es: { common: { language: 'Idioma', region: 'Región', chooseLanguage: 'Elige el idioma', chooseRegion: 'Elige la región' } },
} as const

void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: [...uiLocales],
  load: 'currentOnly',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
})

type LocalizationState = { locale: UiLocale; market: MarketId; marketLoading: boolean; regionalCatalog: RegionalCatalog | null; regionalOffers: RegionalCatalog['offers']; localizationReady: boolean; pricingError: boolean; setLocale: (locale: UiLocale) => void }
const LocalizationContext = createContext<LocalizationState | null>(null)

function readPreference() {
  try {
    const parsed = JSON.parse(getStoredValue(localizationStorageKey) ?? '{}') as { uiLocale?: string }
    const locale = normalizeLocale(parsed.uiLocale)
    return { locale }
  } catch {
    return { locale: null }
  }
}

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [initial] = useState(readPreference)
  const routeLocale = localeFromPath(location.pathname)
  const [locale, setLocaleState] = useState<UiLocale>(routeLocale ?? initial.locale ?? 'en')
  const activeLocale = routeLocale ?? locale
  const [regionalCatalog, setRegionalCatalog] = useState<RegionalCatalog | null>(null)
  const [marketLoading, setMarketLoading] = useState(true)
  const [regionalOfferError, setRegionalOfferError] = useState(false)
  const market = regionalCatalog?.market ?? 'OTHER'

  useEffect(() => {
    const controller = new AbortController()
    const browserLocale = typeof navigator === 'undefined' ? 'en' : resolveInitialLocale(
      null,
      navigator.languages?.[0] ?? navigator.language,
      'en',
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    )
    void fetch('/api/regional-offers', { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Regional catalog unavailable')
        return await response.json() as RegionalCatalog
      })
      .then((catalog) => {
        setRegionalCatalog(catalog)
        setRegionalOfferError(false)
        if (!initial.locale && !routeLocale) setLocaleState(catalog.country ? catalog.suggestedLocale : browserLocale)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setRegionalOfferError(true)
        if (!initial.locale && !routeLocale) setLocaleState(browserLocale)
      })
      .finally(() => { if (!controller.signal.aborted) setMarketLoading(false) })
    return () => controller.abort()
  }, [initial.locale, routeLocale])

  useEffect(() => {
    void i18n.changeLanguage(activeLocale)
    if (typeof document !== 'undefined') document.documentElement.lang = activeLocale
  }, [activeLocale])

  const save = useCallback((nextLocale: UiLocale) => {
    setStoredValue(localizationStorageKey, serializeLocalizationPreference(nextLocale))
  }, [])
  const setLocale = useCallback((next: UiLocale) => {
    const path = normalizePathname(location.pathname).replace(/^\/(pt-BR|en|es|fr)(?=\/|$)/i, '') || '/'
    save(next)
    setLocaleState(next)
    navigate(`/${next}${path.startsWith('/') ? path : `/${path}`}${location.search}${location.hash}`, { replace: true })
  }, [location.hash, location.pathname, location.search, navigate, save])
  const value = useMemo(() => ({ locale: activeLocale, market, marketLoading, regionalCatalog, regionalOffers: regionalCatalog?.offers ?? [], localizationReady: !marketLoading, pricingError: regionalOfferError, setLocale }), [activeLocale, market, marketLoading, regionalCatalog, regionalOfferError, setLocale])
  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>
}

export function useLocalization() {
  const value = useContext(LocalizationContext)
  if (!value) throw new Error('useLocalization must be used inside LocalizationProvider')
  return value
}
