import { localeFromCountry, marketFromCountry, type MarketId, type UiLocale } from './localization.ts'
import type { PlanId } from './offers.ts'

export type OfferCurrency = 'BRL' | 'USD' | 'EUR' | 'SOL'
export type PaymentMethod = 'fiat' | 'crypto'
export type RegionalOffer = {
  id: string
  marketId: MarketId
  planId: PlanId
  currency: OfferCurrency
  amountMinor: number
  paymentMethod: PaymentMethod
  billingMode: 'monthly' | 'annual' | 'one_time'
  accessDays: 30 | 90 | 365 | null
  version: number
  status: 'draft' | 'published' | 'retired'
}

const publish = (offer: Omit<RegionalOffer, 'version' | 'status'>): RegionalOffer => ({ ...offer, version: 1, status: 'published' })

// Fiat amounts use cents/centavos. SOL amounts use lamports (1 SOL = 1e9 lamports).
const brazilOffers: RegionalOffer[] = [
  publish({ id: 'br-month-brl-v1', marketId: 'BR', planId: 'month', currency: 'BRL', amountMinor: 29900, paymentMethod: 'fiat', billingMode: 'one_time', accessDays: 30 }),
  publish({ id: 'br-quarter-brl-v1', marketId: 'BR', planId: 'quarter', currency: 'BRL', amountMinor: 54900, paymentMethod: 'fiat', billingMode: 'one_time', accessDays: 90 }),
  publish({ id: 'br-lifetime-brl-v1', marketId: 'BR', planId: 'lifetime', currency: 'BRL', amountMinor: 69900, paymentMethod: 'fiat', billingMode: 'one_time', accessDays: null }),
  publish({ id: 'br-month-sol-v1', marketId: 'BR', planId: 'month', currency: 'SOL', amountMinor: 400_000_000, paymentMethod: 'crypto', billingMode: 'one_time', accessDays: 30 }),
  publish({ id: 'br-quarter-sol-v1', marketId: 'BR', planId: 'quarter', currency: 'SOL', amountMinor: 700_000_000, paymentMethod: 'crypto', billingMode: 'one_time', accessDays: 90 }),
  publish({ id: 'br-lifetime-sol-v1', marketId: 'BR', planId: 'lifetime', currency: 'SOL', amountMinor: 900_000_000, paymentMethod: 'crypto', billingMode: 'one_time', accessDays: null }),
]

const internationalOffers: RegionalOffer[] = (['US', 'ES', 'OTHER'] as const).flatMap((market): RegionalOffer[] => {
  const fiatCurrency = market === 'ES' ? 'EUR' : 'USD'
  const fiatOffers = market === 'OTHER' ? [] : [
    publish({ id: `${market.toLowerCase()}-month-fiat-v1`, marketId: market, planId: 'month', currency: fiatCurrency, amountMinor: 9700, paymentMethod: 'fiat', billingMode: 'monthly', accessDays: 30 }),
    publish({ id: `${market.toLowerCase()}-annual-fiat-v1`, marketId: market, planId: 'annual', currency: fiatCurrency, amountMinor: 29700, paymentMethod: 'fiat', billingMode: 'annual', accessDays: 365 }),
  ]
  const cryptoOffers = [
    publish({ id: `${market.toLowerCase()}-month-sol-v1`, marketId: market, planId: 'month', currency: 'SOL', amountMinor: 800_000_000, paymentMethod: 'crypto', billingMode: 'one_time', accessDays: 30 }),
    publish({ id: `${market.toLowerCase()}-quarter-sol-v1`, marketId: market, planId: 'quarter', currency: 'SOL', amountMinor: 1_300_000_000, paymentMethod: 'crypto', billingMode: 'one_time', accessDays: 90 }),
    publish({ id: `${market.toLowerCase()}-annual-sol-v1`, marketId: market, planId: 'annual', currency: 'SOL', amountMinor: 1_600_000_000, paymentMethod: 'crypto', billingMode: 'one_time', accessDays: 365 }),
  ]
  return [...fiatOffers, ...cryptoOffers]
})

const offers = [...brazilOffers, ...internationalOffers]

export function getRegionalOffer(marketId: MarketId, planId: PlanId, paymentMethod?: PaymentMethod) {
  return offers.find((offer) => offer.marketId === marketId && offer.planId === planId && (!paymentMethod || offer.paymentMethod === paymentMethod) && offer.status !== 'retired') ?? null
}

export function getPublishedRegionalOffer(marketId: MarketId, planId: PlanId, paymentMethod?: PaymentMethod) {
  const offer = getRegionalOffer(marketId, planId, paymentMethod)
  return offer?.status === 'published' ? offer : null
}

export function getOfferAmount(offer: RegionalOffer) {
  return offer.currency === 'SOL' ? offer.amountMinor / 1_000_000_000 : offer.amountMinor / 100
}

export function formatRegionalOffer(offer: RegionalOffer, locale: UiLocale) {
  const amount = getOfferAmount(offer)
  if (offer.currency === 'SOL') return `${amount.toLocaleString(locale, { maximumFractionDigits: 2 })} SOL`
  return new Intl.NumberFormat(locale, { style: 'currency', currency: offer.currency, maximumFractionDigits: 0 }).format(amount)
}

export function getPlanIdsForMarket(marketId: MarketId): PlanId[] {
  const ids = [...new Set(offers.filter((offer) => offer.marketId === marketId && offer.status === 'published').map((offer) => offer.planId))]
  return (['month', 'quarter', 'annual', 'lifetime'] as const).filter((id) => ids.includes(id))
}

export type RegionalCatalog = {
  market: MarketId
  country: string | null
  suggestedLocale: ReturnType<typeof localeFromCountry>
  offers: RegionalOffer[]
}

export function getRegionalCatalog(country: string | null): RegionalCatalog {
  const market = marketFromCountry(country)
  return {
    market,
    country,
    suggestedLocale: localeFromCountry(country),
    offers: offers.filter((offer) => offer.marketId === market && offer.status === 'published'),
  }
}
