import type { Currency } from '@/lib/offers'
import { supabase } from '@/lib/supabase'

export type AffiliateEvent = { id: string; type: 'click' | 'signup' | 'sale'; at: string; code: string; detail?: string; value?: number; currency?: Currency }
export type AffiliateOrder = { id: string; at: string; plan: string; currency: Currency; amount: number; status: string; code?: string }
export type Commission = { id: string; amount: number; currency: Currency; status: string; createdAt: string }
export type Payout = { id: string; amount: number; currency: Currency; status: string; createdAt: string }

function client() {
  if (!supabase) throw new Error('Supabase não está configurado neste ambiente.')
  return supabase
}

export async function recordReferralClick(code: string, visitorId: string, sourcePath: string) {
  const { error } = await client().rpc('record_affiliate_click', { p_code: code, p_visitor_id: visitorId, p_source_path: sourcePath })
  if (error) throw error
}

export async function loadAffiliateDashboard(userId: string) {
  const db = client()
  const [profileResult, eventsResult, ordersResult, commissionsResult, payoutsResult] = await Promise.all([
    db.from('affiliate_profiles').select('referral_code, commission_bps, active').eq('user_id', userId).single(),
    db.from('affiliate_events').select('id,event_type,referral_code,source_path,created_at').order('created_at', { ascending: false }).limit(250),
    db.from('orders').select('id,plan_id,currency,amount,status,referral_code,created_at').order('created_at', { ascending: false }).limit(250),
    db.from('commission_entries').select('id,amount,currency,status,created_at').eq('affiliate_user_id', userId).order('created_at', { ascending: false }).limit(250),
    db.from('payout_requests').select('id,amount,currency,status,created_at').eq('affiliate_user_id', userId).order('created_at', { ascending: false }).limit(100),
  ])
  for (const result of [profileResult, eventsResult, ordersResult, commissionsResult, payoutsResult]) if (result.error) throw result.error
  const profile = profileResult.data
  if (!profile) throw new Error('Perfil de afiliado não encontrado.')
  const affiliateCode = profile.referral_code
  return {
    profile,
    events: (eventsResult.data ?? []).filter((row) => row.referral_code === affiliateCode).map((row) => ({ id: row.id, type: row.event_type as AffiliateEvent['type'], at: row.created_at, code: row.referral_code, detail: row.source_path ?? undefined })),
    orders: (ordersResult.data ?? []).filter((row) => row.referral_code === affiliateCode).map((row) => ({ id: row.id, at: row.created_at, plan: row.plan_id, currency: row.currency as Currency, amount: Number(row.amount), status: row.status, code: row.referral_code ?? undefined })),
    commissions: (commissionsResult.data ?? []).map((row) => ({ id: row.id, amount: Number(row.amount), currency: row.currency as Currency, status: row.status, createdAt: row.created_at })),
    payouts: (payoutsResult.data ?? []).map((row) => ({ id: row.id, amount: Number(row.amount), currency: row.currency as Currency, status: row.status, createdAt: row.created_at })),
  }
}

export async function requestAffiliatePayout(currency: Currency) {
  const { data, error } = await client().rpc('request_affiliate_payout', { p_currency: currency })
  if (error) throw error
  return Array.isArray(data) ? data[0] : data
}

export async function processAffiliatePayout(payoutId: string, result: 'paid' | 'rejected') {
  const { error } = await client().rpc('process_affiliate_payout', { p_payout_id: payoutId, p_result: result })
  if (error) throw error
}
