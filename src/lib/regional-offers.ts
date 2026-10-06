import type { MarketId } from '@/lib/localization'
import type { PlanId } from '@/lib/offers'

export type RegionalOffer = {
  id: string
  marketId: MarketId
  planId: PlanId
  currency: 'BRL' | 'USD'
  amountMinor: number
  billingMode: 'one_time'
  accessDays: 30 | 90 | null
  version: number
  status: 'draft' | 'published' | 'retired'
}

const offers: RegionalOffer[] = [
  { id: 'br-month-v1', marketId: 'BR', planId: 'month', currency: 'BRL', amountMinor: 29900, billingMode: 'one_time', accessDays: 30, version: 1, status: 'published' },
  { id: 'br-quarter-v1', marketId: 'BR', planId: 'quarter', currency: 'BRL', amountMinor: 54900, billingMode: 'one_time', accessDays: 90, version: 1, status: 'published' },
  { id: 'br-lifetime-v1', marketId: 'BR', planId: 'lifetime', currency: 'BRL', amountMinor: 69900, billingMode: 'one_time', accessDays: null, version: 1, status: 'published' },
  // User-provided US$97 / 30 days reference. Draft until commercial/payment review.
  { id: 'us-month-v1', marketId: 'US', planId: 'month', currency: 'USD', amountMinor: 9700, billingMode: 'one_time', accessDays: 30, version: 1, status: 'draft' },
]

export function getRegionalOffer(marketId: MarketId, planId: PlanId) {
  return offers.find((offer) => offer.marketId === marketId && offer.planId === planId && offer.status !== 'retired') ?? null
}

export function getPublishedRegionalOffer(marketId: MarketId, planId: PlanId) {
  const offer = getRegionalOffer(marketId, planId)
  return offer?.status === 'published' ? offer : null
}

export function getOfferAmount(offer: RegionalOffer) {
  return offer.amountMinor / 100
}
