import { loadAdminReviews, type StudentReview } from '@/lib/community-service'
import { supabase } from '@/lib/supabase'
import type { Currency } from '@/lib/offers'

export type AdminOrder = { id: string; at: string; userId: string; plan: string; currency: Currency; amount: number; status: string; referralCode?: string; commission: number }
export type AdminPayout = { id: string; affiliateUserId: string; affiliateName: string; amount: number; currency: Currency; status: string; createdAt: string }
export type AdminAffiliate = { userId: string; name: string; code: string; active: boolean; commissionBps: number; clicks: number; signups: number; sales: number; commissionBrl: number; commissionSol: number }
export type AdminCourseModule = { id: string; ordinal: number; title: string; subtitle: string; published: boolean; lessons: { id: string; title: string; durationMinutes: number }[] }
export type AdminSnapshot = { events: { id: string; type: string; code: string; at: string }[]; orders: AdminOrder[]; payouts: AdminPayout[]; affiliates: AdminAffiliate[]; reviews: StudentReview[]; modules: AdminCourseModule[] }

export async function loadAdminSnapshot(): Promise<AdminSnapshot> {
  if (!supabase) throw new Error('Supabase não está configurado neste ambiente.')
  const db = supabase
  const [profiles, affiliateProfiles, events, orders, commissions, payouts, reviews, courseModules, lessons] = await Promise.all([
    db.from('profiles').select('id,display_name'),
    db.from('affiliate_profiles').select('user_id,referral_code,commission_bps,active'),
    db.from('affiliate_events').select('id,event_type,referral_code,created_at').order('created_at', { ascending: false }).limit(1000),
    db.from('orders').select('id,user_id,plan_id,currency,amount,status,referral_code,created_at').order('created_at', { ascending: false }).limit(1000),
    db.from('commission_entries').select('id,affiliate_user_id,order_id,amount,currency,status,created_at').limit(1000),
    db.from('payout_requests').select('id,affiliate_user_id,amount,currency,status,created_at').order('created_at', { ascending: false }).limit(250),
    loadAdminReviews(),
    db.from('course_modules').select('id,ordinal,title,subtitle,published').order('ordinal'),
    db.from('lessons').select('id,module_id,title,duration_minutes,ordinal').order('ordinal'),
  ])
  for (const result of [profiles, affiliateProfiles, events, orders, commissions, payouts, courseModules, lessons]) if (result.error) throw result.error

  const names = new Map((profiles.data ?? []).map((profile) => [profile.id, profile.display_name || 'Usuário']))
  const affiliates = (affiliateProfiles.data ?? []).map((affiliate) => {
    const affiliateEvents = (events.data ?? []).filter((event) => event.referral_code === affiliate.referral_code)
    const affiliateOrders = (orders.data ?? []).filter((order) => order.referral_code === affiliate.referral_code)
    const affiliateCommissions = (commissions.data ?? []).filter((commission) => commission.affiliate_user_id === affiliate.user_id && commission.status !== 'reversed')
    return {
      userId: affiliate.user_id,
      name: names.get(affiliate.user_id) ?? 'Afiliado',
      code: affiliate.referral_code,
      active: affiliate.active,
      commissionBps: affiliate.commission_bps,
      clicks: affiliateEvents.filter((event) => event.event_type === 'click').length,
      signups: affiliateEvents.filter((event) => event.event_type === 'signup').length,
      sales: affiliateOrders.length,
      commissionBrl: affiliateCommissions.filter((item) => item.currency === 'BRL').reduce((sum, item) => sum + Number(item.amount), 0),
      commissionSol: affiliateCommissions.filter((item) => item.currency === 'SOL').reduce((sum, item) => sum + Number(item.amount), 0),
    }
  })
  const adminOrders = (orders.data ?? []).map((order) => ({
    id: order.id,
    at: order.created_at,
    userId: order.user_id,
    plan: order.plan_id,
    currency: order.currency as Currency,
    amount: Number(order.amount),
    status: order.status,
    referralCode: order.referral_code ?? undefined,
    commission: (commissions.data ?? []).filter((item) => item.order_id === order.id && item.status !== 'reversed').reduce((sum, item) => sum + Number(item.amount), 0),
  }))
  const adminPayouts = (payouts.data ?? []).map((payout) => ({
    id: payout.id,
    affiliateUserId: payout.affiliate_user_id,
    affiliateName: names.get(payout.affiliate_user_id) ?? 'Afiliado',
    amount: Number(payout.amount),
    currency: payout.currency as Currency,
    status: payout.status,
    createdAt: payout.created_at,
  }))
  const moduleRows = courseModules.data ?? []
  const lessonRows = lessons.data ?? []
  const modules = moduleRows.map((module) => ({
    id: module.id,
    ordinal: module.ordinal,
    title: module.title,
    subtitle: module.subtitle,
    published: module.published,
    lessons: lessonRows.filter((lesson) => lesson.module_id === module.id).map((lesson) => ({ id: lesson.id, title: lesson.title, durationMinutes: lesson.duration_minutes })),
  }))
  return {
    events: (events.data ?? []).map((event) => ({ id: event.id, type: event.event_type, code: event.referral_code, at: event.created_at })),
    orders: adminOrders,
    payouts: adminPayouts,
    affiliates,
    reviews,
    modules,
  }
}
