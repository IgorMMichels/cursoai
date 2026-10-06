export const uiLocales = ['pt-BR', 'en', 'es', 'fr'] as const
export type UiLocale = (typeof uiLocales)[number]
export const marketIds = ['BR', 'US', 'ES', 'FR', 'OTHER'] as const
export type MarketId = (typeof marketIds)[number]

export const localeNames: Record<UiLocale, string> = {
  'pt-BR': 'Português',
  en: 'English',
  es: 'Español',
  fr: 'Français',
}

export const marketNames: Record<MarketId, string> = {
  BR: 'Brasil',
  US: 'United States',
  ES: 'España',
  FR: 'France',
  OTHER: 'Other region',
}

export const localeFromPath = (pathname: string): UiLocale | null => {
  const segment = pathname.split('/')[1]
  return uiLocales.includes(segment as UiLocale) ? segment as UiLocale : null
}

export function normalizeLocale(value?: string | null): UiLocale | null {
  if (!value) return null
  const normalized = value.toLowerCase()
  if (normalized === 'pt' || normalized.startsWith('pt-')) return 'pt-BR'
  if (normalized === 'en' || normalized.startsWith('en-')) return 'en'
  if (normalized === 'es' || normalized.startsWith('es-')) return 'es'
  if (normalized === 'fr' || normalized.startsWith('fr-')) return 'fr'
  return null
}

export function marketFromBrowser(locale?: string | null): MarketId {
  const normalized = locale?.toLowerCase() ?? ''
  if (normalized === 'en-us') return 'US'
  if (normalized === 'es-es') return 'ES'
  if (normalized === 'fr-fr') return 'FR'
  if (normalized.startsWith('pt')) return 'BR'
  return 'OTHER'
}

export function formatCurrency(amount: number, currency: string, locale: UiLocale) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
}

export function localizedPath(pathname: string, locale: UiLocale) {
  const pathWithoutLocale = pathname.replace(/^\/(pt-BR|en|es|fr)(?=\/|$)/, '')
  return `/${locale}${pathWithoutLocale.startsWith('/') ? pathWithoutLocale : `/${pathWithoutLocale}`}`
}

export const localizationStorageKey = 'omega:localization:v1'
