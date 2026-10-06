import test from 'node:test'
import assert from 'node:assert/strict'
import { formatCurrency, localizedPath, marketFromBrowser, normalizeLocale } from './localization.ts'
import { getOfferAmount, getRegionalOffer } from './regional-offers.ts'

test('normalizes supported browser locale variants without accepting unsupported languages', () => {
  assert.equal(normalizeLocale('pt'), 'pt-BR')
  assert.equal(normalizeLocale('en-US'), 'en')
  assert.equal(normalizeLocale('es-MX'), 'es')
  assert.equal(normalizeLocale('fr-CA'), 'fr')
  assert.equal(normalizeLocale('de-DE'), null)
})

test('suggests only a coarse market from browser locale', () => {
  assert.equal(marketFromBrowser('en-US'), 'US')
  assert.equal(marketFromBrowser('pt-BR'), 'BR')
  assert.equal(marketFromBrowser('es-ES'), 'ES')
  assert.equal(marketFromBrowser('fr-FR'), 'FR')
  assert.equal(marketFromBrowser('es-MX'), 'OTHER')
})

test('creates locale-prefixed paths and keeps route identifiers unchanged', () => {
  assert.equal(localizedPath('/curso/aula/m1/m1l1', 'fr'), '/fr/curso/aula/m1/m1l1')
  assert.equal(localizedPath('/en/landing', 'es'), '/es/landing')
  assert.equal(localizedPath('/', 'pt-BR'), '/pt-BR/')
})

test('formats money without converting it and keeps unapproved regional prices unavailable', () => {
  assert.equal(formatCurrency(97, 'USD', 'en'), '$97.00')
  const usMonthly = getRegionalOffer('US', 'month')
  assert.equal(usMonthly && getOfferAmount(usMonthly), 97)
  assert.equal(usMonthly?.status, 'draft')
  assert.equal(getRegionalOffer('US', 'quarter'), null)
  assert.equal(getRegionalOffer('FR', 'month'), null)
})
