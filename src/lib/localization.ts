export const uiLocales = ['pt-BR', 'en', 'es'] as const
export type UiLocale = (typeof uiLocales)[number]
export const marketIds = ['BR', 'US', 'ES', 'OTHER'] as const
export type MarketId = (typeof marketIds)[number]

export const localeNames: Record<UiLocale, string> = {
  'pt-BR': 'Português (Brasil)',
  en: 'English',
  es: 'Español',
}

export const marketNames: Record<MarketId, string> = {
  BR: 'Brasil',
  US: 'United States',
  ES: 'Euro area',
  OTHER: 'Other region',
}

export const localeFromPath = (pathname: string): UiLocale | null => {
  const segment = pathname.split('/')[1]
  if (!segment) return null
  return uiLocales.find((locale) => locale.toLowerCase() === segment.toLowerCase()) ?? null
}

export function normalizeLocale(value?: string | null): UiLocale | null {
  if (!value) return null
  const normalized = value.toLowerCase()
  if (normalized === 'pt' || normalized.startsWith('pt-')) return 'pt-BR'
  if (normalized === 'en' || normalized.startsWith('en-')) return 'en'
  if (normalized === 'es' || normalized.startsWith('es-')) return 'es'
  return null
}

export function marketFromBrowser(locale?: string | null): MarketId {
  const normalized = locale?.toLowerCase() ?? ''
  if (normalized.startsWith('en-us')) return 'US'
  if (normalized.startsWith('es-es')) return 'ES'
  if (normalized === 'pt-br') return 'BR'
  return 'OTHER'
}

export function normalizeMarket(value?: string | null): MarketId | null {
  if (!value) return null
  const normalized = value.toUpperCase()
  return marketIds.find((market) => market === normalized) ?? null
}

export function serializeLocalizationPreference(locale: UiLocale) {
  return JSON.stringify({ version: 2, uiLocale: locale, explicit: true })
}

// Country comes from the hosting platform, never a language/profile preference.
export function marketFromCountry(country?: string | null): MarketId {
  const code = country?.toUpperCase()
  if (code === 'BR') return 'BR'
  if (code === 'US') return 'US'
  // EUR prices apply throughout the euro area; language still follows the
  // actual country code in localeFromCountry.
  if (code && ['ES', 'AD', 'AT', 'BE', 'BG', 'CY', 'DE', 'EE', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MC', 'ME', 'MT', 'NL', 'PT', 'SI', 'SK', 'SM', 'VA', 'XK'].includes(code)) return 'ES'
  return 'OTHER'
}

export function localeFromCountry(country?: string | null): UiLocale {
  const code = country?.toUpperCase()
  if (code === 'BR') return 'pt-BR'
  if (code && ['ES', 'MX', 'AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV', 'GT', 'HN', 'NI', 'PA', 'PY', 'PE', 'PR', 'UY', 'VE', 'GQ'].includes(code)) return 'es'
  return 'en'
}

export function formatCurrency(amount: number, currency: string, locale: UiLocale) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
}

export function normalizePathname(pathname: string) {
  const withLeadingSlash = pathname.startsWith('/') ? pathname : `/${pathname}`
  return withLeadingSlash.replace(/\/{2,}/g, '/') || '/'
}

export function unlocalizedPath(pathname: string) {
  return normalizePathname(pathname).replace(/^\/(?:pt-BR|en|es|fr)(?=\/|$)/i, '') || '/'
}

export function localizedPath(pathname: string, locale: UiLocale) {
  const pathWithoutLocale = unlocalizedPath(pathname)
  return `/${locale}${pathWithoutLocale.startsWith('/') ? pathWithoutLocale : `/${pathWithoutLocale}`}`
}

export const localizationStorageKey = 'omega:localization:v1'

export function localeFromTimeZone(timeZone?: string | null): UiLocale | null {
  if (!timeZone) return null
  const zone = timeZone.toLowerCase()
  if (/^america\/(sao_paulo|manaus|rio_branco|belem|bahia|fortaleza|recife|araguaina|maceio|campo_grande|cuiaba|porto_velho|boa_vista|noronha|santarem)$/.test(zone)) return 'pt-BR'
  if (zone === 'europe/madrid' || zone === 'atlantic/canary') return 'es'
  if (/^america\//.test(zone) && !/^america\/(new_york|detroit|kentucky|indiana|chicago|menominee|north_dakota|denver|boise|phoenix|los_angeles|anchorage|juneau|sitka|metlakatla|yakutat|nome|adak|toronto|winnipeg|edmonton|vancouver|whitehorse|yellowknife|iqaluit|regina|halifax|st_johns|indiana\/|kentucky\/)/.test(zone)) return 'es'
  return null
}

export function resolveInitialLocale(savedLocale?: string | null, browserLanguage?: string | null, configuredDefault = 'en', timeZone?: string | null): UiLocale {
  const normalizedBrowser = browserLanguage?.toLowerCase() ?? ''
  const browser = normalizedBrowser === 'pt-br' ? 'pt-BR' : normalizedBrowser.startsWith('pt') ? null : normalizeLocale(browserLanguage)
  return normalizeLocale(savedLocale) ?? localeFromTimeZone(timeZone) ?? browser ?? normalizeLocale(configuredDefault) ?? 'en'
}
