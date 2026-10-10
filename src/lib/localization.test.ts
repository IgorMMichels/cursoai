import test from 'node:test'
import assert from 'node:assert/strict'
import { formatCurrency, localeFromCountry, localeFromPath, localeFromTimeZone, localizedPath, marketFromBrowser, marketFromCountry, normalizeLocale, normalizeMarket, normalizePathname, resolveInitialLocale, serializeLocalizationPreference, unlocalizedPath } from './localization.ts'
import { getOfferAmount, getRegionalCatalog, getRegionalOffer, getPlanIdsForMarket } from './regional-offers.ts'

test('normalizes supported browser locale variants without accepting unsupported languages', () => {
  assert.equal(normalizeLocale('pt'), 'pt-BR')
  assert.equal(normalizeLocale('pt-BR'), 'pt-BR')
  assert.equal(normalizeLocale('en-US'), 'en')
  assert.equal(normalizeLocale('es-MX'), 'es')
  assert.equal(normalizeLocale('fr-CA'), null)
  assert.equal(normalizeLocale('de-DE'), null)
})

test('suggests only a coarse market from browser locale', () => {
  assert.equal(marketFromBrowser('en-US'), 'US')
  assert.equal(marketFromBrowser('pt-BR'), 'BR')
  assert.equal(marketFromBrowser('pt-PT'), 'OTHER')
  assert.equal(marketFromBrowser('es-ES'), 'ES')
  assert.equal(marketFromBrowser('es-MX'), 'OTHER')
  assert.equal(marketFromBrowser('fr-FR'), 'OTHER')
})

test('supports exactly Portuguese, English, and Spanish route and market preferences', () => {
  assert.deepEqual(['pt-BR', 'en', 'es'].map((locale) => localeFromPath(`/${locale}/landing`)), ['pt-BR', 'en', 'es'])
  assert.equal(localeFromPath('/PT-br/landing'), 'pt-BR')
  assert.equal(localeFromPath('/fr/landing'), null)
  assert.equal(normalizeMarket('BR'), 'BR')
  assert.equal(normalizeMarket('FR'), null)
})

test('persists the selected language independently from the selected market', () => {
  assert.deepEqual(JSON.parse(serializeLocalizationPreference('es')), {
    version: 2,
    uiLocale: 'es',
    explicit: true,
  })
})

test('regional catalogs publish only the fixed fiat and Solana prices assigned to the detected market', () => {
  assert.equal(marketFromCountry('BR'), 'BR')
  assert.equal(marketFromCountry('US'), 'US')
  assert.equal(marketFromCountry('ES'), 'ES')
  assert.equal(marketFromCountry('FR'), 'ES')
  assert.equal(localeFromCountry('FR'), 'en')
  assert.equal(marketFromCountry('MX'), 'OTHER')
  assert.equal(localeFromCountry('BR'), 'pt-BR')
  assert.equal(localeFromCountry('ES'), 'es')
  assert.equal(localeFromCountry('US'), 'en')
  const brazil = getRegionalCatalog('BR')
  assert.deepEqual(brazil.offers.filter((offer) => offer.paymentMethod === 'fiat').map((offer) => [offer.planId, offer.currency, getOfferAmount(offer)]), [['month', 'BRL', 299], ['quarter', 'BRL', 549], ['lifetime', 'BRL', 699]])
  assert.deepEqual(brazil.offers.filter((offer) => offer.paymentMethod === 'crypto').map((offer) => [offer.planId, offer.currency, getOfferAmount(offer)]), [['month', 'SOL', 0.4], ['quarter', 'SOL', 0.7], ['lifetime', 'SOL', 0.9]])
  const spain = getRegionalCatalog('ES')
  assert.deepEqual(spain.offers.filter((offer) => offer.paymentMethod === 'fiat').map((offer) => [offer.planId, offer.currency, getOfferAmount(offer)]), [['month', 'EUR', 97], ['quarter', 'EUR', 247], ['lifetime', 'EUR', 297]])
  assert.deepEqual(spain.offers.filter((offer) => offer.paymentMethod === 'crypto').map((offer) => [offer.planId, getOfferAmount(offer)]), [['month', 0.8], ['quarter', 1.3], ['lifetime', 1.6]])
  const unitedStates = getRegionalCatalog('US')
  assert.deepEqual(unitedStates.offers.filter((offer) => offer.paymentMethod === 'fiat').map((offer) => [offer.planId, offer.currency, getOfferAmount(offer)]), [['month', 'USD', 97], ['quarter', 'USD', 247], ['lifetime', 'USD', 297]])
  const unknown = getRegionalCatalog(null)
  assert.equal(unknown.market, 'OTHER')
  assert.ok(unknown.offers.every((offer) => offer.paymentMethod === 'crypto' && offer.currency === 'SOL'))
  assert.deepEqual(getPlanIdsForMarket('BR'), ['month', 'quarter', 'lifetime'])
  assert.deepEqual(getPlanIdsForMarket('US'), ['month', 'quarter', 'lifetime'])
})

test('creates locale-prefixed paths and keeps route identifiers unchanged', () => {
  assert.equal(localizedPath('/curso/aula/m1/m1l1', 'pt-BR'), '/pt-BR/curso/aula/m1/m1l1')
  assert.equal(localizedPath('/en/landing', 'es'), '/es/landing')
  assert.equal(localizedPath('/pt-BR/landing', 'en'), '/en/landing')
})

test('normalizes duplicate slashes in route paths before matching or localizing', () => {
  assert.equal(normalizePathname('//landing'), '/landing')
  assert.equal(normalizePathname('/en//landing'), '/en/landing')
  assert.equal(localizedPath('//landing', 'en'), '/en/landing')
  assert.equal(unlocalizedPath('/en/landing'), '/landing')
  assert.equal(unlocalizedPath('/en'), '/')
  assert.equal(unlocalizedPath('/fr/landing'), '/landing')
})

test('formats money without converting it and returns the price for the selected payment rail', () => {
  assert.equal(formatCurrency(97, 'USD', 'en'), '$97.00')
  const usMonthly = getRegionalOffer('US', 'month', 'fiat')
  assert.equal(usMonthly && getOfferAmount(usMonthly), 97)
  assert.equal(usMonthly?.status, 'published')
  assert.equal(usMonthly?.billingMode, 'one_time')
  assert.equal(getRegionalOffer('US', 'quarter', 'fiat')?.billingMode, 'one_time')
  assert.equal(getOfferAmount(getRegionalOffer('US', 'month', 'crypto')!), 0.8)
  assert.equal(getRegionalOffer('OTHER', 'month', 'fiat'), null)
})

test('uses a saved choice first, recognizes only supported browser languages, and otherwise defaults to English', () => {
  assert.equal(resolveInitialLocale('pt-BR', 'en-US'), 'pt-BR')
  assert.equal(resolveInitialLocale(null, 'es-MX'), 'es')
  assert.equal(resolveInitialLocale(null, 'fr-FR'), 'en')
  assert.equal(resolveInitialLocale(null, 'pt-PT'), 'en')
  assert.equal(resolveInitialLocale(null, 'pt'), 'en')
  assert.equal(resolveInitialLocale(null, 'pt-BR'), 'pt-BR')
  assert.equal(resolveInitialLocale(null, 'de-DE', 'es'), 'es')
  assert.equal(resolveInitialLocale('fr', 'fr-FR', 'xx'), 'en')
})

test('uses browser timezone metadata only as a locale fallback and never changes billing market', () => {
  assert.equal(localeFromTimeZone('America/Sao_Paulo'), 'pt-BR')
  assert.equal(localeFromTimeZone('America/Mexico_City'), 'es')
  assert.equal(localeFromTimeZone('America/New_York'), null)
  assert.equal(resolveInitialLocale(null, 'en-US', 'en', 'America/Sao_Paulo'), 'pt-BR')
  assert.equal(resolveInitialLocale('es', 'en-US', 'en', 'America/Sao_Paulo'), 'es')
  assert.equal(marketFromCountry(null), 'OTHER')
})
