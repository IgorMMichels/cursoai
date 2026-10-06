import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getStoredValue, setStoredValue } from '@/lib/storage'
import { localeFromPath, localizationStorageKey, marketFromBrowser, normalizeLocale, type MarketId, type UiLocale } from '@/lib/localization'

const resources = {
  'pt-BR': { common: { language: 'Idioma', region: 'Região', chooseLanguage: 'Escolha o idioma', chooseRegion: 'Escolha a região' } },
  en: { common: { language: 'Language', region: 'Region', chooseLanguage: 'Choose language', chooseRegion: 'Choose region' } },
  es: { common: { language: 'Idioma', region: 'Región', chooseLanguage: 'Elige el idioma', chooseRegion: 'Elige la región' } },
  fr: { common: { language: 'Langue', region: 'Région', chooseLanguage: 'Choisir la langue', chooseRegion: 'Choisir la région' } },
} as const

void i18n.use(initReactI18next).init({
  resources,
  lng: 'pt-BR',
  fallbackLng: 'pt-BR',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
})

type LocalizationState = { locale: UiLocale; market: MarketId; setLocale: (locale: UiLocale) => void; setMarket: (market: MarketId) => void }
const LocalizationContext = createContext<LocalizationState | null>(null)

function readPreference() {
  try {
    const parsed = JSON.parse(getStoredValue(localizationStorageKey) ?? '{}') as { uiLocale?: string; market?: string }
    const locale = normalizeLocale(parsed.uiLocale)
    const market = ['BR', 'US', 'ES', 'FR', 'OTHER'].includes(parsed.market ?? '') ? parsed.market as MarketId : null
    return { locale, market }
  } catch {
    return { locale: null, market: null }
  }
}

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [initial] = useState(readPreference)
  const routeLocale = localeFromPath(location.pathname)
  const [locale, setLocaleState] = useState<UiLocale>(routeLocale ?? initial.locale ?? normalizeLocale(navigator.language) ?? 'en')
  const activeLocale = routeLocale ?? locale
  const [market, setMarketState] = useState<MarketId>(initial.market ?? marketFromBrowser(navigator.language))

  useEffect(() => { void i18n.changeLanguage(activeLocale); document.documentElement.lang = activeLocale }, [activeLocale])

  const save = useCallback((nextLocale: UiLocale, nextMarket: MarketId) => {
    setStoredValue(localizationStorageKey, JSON.stringify({ version: 1, uiLocale: nextLocale, market: nextMarket, explicit: true }))
  }, [])
  const setLocale = useCallback((next: UiLocale) => {
    const path = location.pathname.replace(/^\/(pt-BR|en|es|fr)(?=\/|$)/, '') || '/'
    save(next, market)
    setLocaleState(next)
    navigate(`/${next}${path.startsWith('/') ? path : `/${path}`}${location.search}${location.hash}`, { replace: true })
  }, [location.hash, location.pathname, location.search, market, navigate, save])
  const setMarket = useCallback((next: MarketId) => {
    const suggested: Partial<Record<MarketId, UiLocale>> = { BR: 'pt-BR', US: 'en', ES: 'es', FR: 'fr' }
    const nextLocale = suggested[next] ?? activeLocale
    setMarketState(next)
    setLocaleState(nextLocale)
    save(nextLocale, next)
    const path = location.pathname.replace(/^\/(pt-BR|en|es|fr)(?=\/|$)/, '') || '/'
    navigate(`/${nextLocale}${path.startsWith('/') ? path : `/${path}`}${location.search}${location.hash}`, { replace: true })
  }, [activeLocale, location.hash, location.pathname, location.search, navigate, save])
  const value = useMemo(() => ({ locale: activeLocale, market, setLocale, setMarket }), [activeLocale, market, setLocale, setMarket])
  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>
}

export function useLocalization() {
  const value = useContext(LocalizationContext)
  if (!value) throw new Error('useLocalization must be used inside LocalizationProvider')
  return value
}
