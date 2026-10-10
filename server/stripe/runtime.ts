import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { getOfferAmount, getRegionalCatalog, type RegionalOffer } from '../../src/lib/regional-offers.ts'
import type { PlanId } from '../../src/lib/offers.ts'

type Environment = Record<string, string | undefined>

export function createStripeClient(environment: Environment) {
  const key = environment.STRIPE_SECRET_KEY?.trim()
  if (!key) throw new Error('Stripe server key is not configured')
  return new Stripe(key, { apiVersion: '2026-08-26.dahlia' })
}

export function createBillingAdmin(environment: Environment) {
  const url = environment.SUPABASE_URL?.trim() || environment.VITE_SUPABASE_URL?.trim()
  const key = environment.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) throw new Error('Supabase server credentials are not configured')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function getAuthenticatedUser(environment: Environment, accessToken: string) {
  const url = environment.SUPABASE_URL?.trim() || environment.VITE_SUPABASE_URL?.trim()
  const key = environment.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!url || !key) throw new Error('Supabase Auth is not configured on the server')
  const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data, error } = await client.auth.getUser(accessToken)
  if (error || !data.user) return null
  return data.user
}

export function getFiatOffer(country: string | undefined, planId: PlanId): RegionalOffer | null {
  const normalizedCountry = country?.trim().toUpperCase() || null
  const catalog = getRegionalCatalog(normalizedCountry)
  return catalog.offers.find((offer) => offer.planId === planId && offer.paymentMethod === 'fiat') ?? null
}

export function getOfferAmountMajor(offer: RegionalOffer) {
  return getOfferAmount(offer)
}

export function getSiteUrl(environment: Environment) {
  const url = environment.SITE_URL?.trim()
  if (!url) throw new Error('SITE_URL is not configured')
  const parsed = new URL(url)
  if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') throw new Error('SITE_URL must use HTTPS')
  return parsed.origin
}
