import type { IncomingMessage, ServerResponse } from 'node:http'
import { createBillingAdmin } from '../../server/stripe/runtime.ts'
import { createSolanaConnection, getMerchantAddress } from '../../server/crypto/config.ts'
import { sendJson } from '../../server/crypto/http.ts'
import { createSupabaseStore, settleOrder, type SolanaOrder } from '../../server/crypto/payment.ts'

const LOOKBACK_HOURS = 48
const BATCH_SIZE = 100
const CONCURRENCY = 4

// Cron: finds SOL orders that were paid but never confirmed from the browser (tab closed, phone wallet) and expires stale ones.
export default async function reconcileCryptoOrders(request: IncomingMessage, response: ServerResponse) {
  response.setHeader('Cache-Control', 'private, no-store, max-age=0')
  if (request.method !== 'GET' && request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST')
    return sendJson(response, 405, { error: 'Method not allowed' })
  }
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret || request.headers.authorization !== `Bearer ${secret}`) return sendJson(response, 401, { error: 'Unauthorized' })

  try {
    const environment = process.env
    const admin = createBillingAdmin(environment)
    const connection = createSolanaConnection(environment)
    const merchant = getMerchantAddress(environment)
    const store = createSupabaseStore(admin)
    const since = new Date(Date.now() - LOOKBACK_HOURS * 3_600_000).toISOString()
    const { data, error } = await admin.from('orders')
      .select('id, currency, status, reference, amount_lamports, expires_at')
      .eq('currency', 'SOL').eq('status', 'pending').not('reference', 'is', null)
      .gte('created_at', since).order('created_at', { ascending: true }).limit(BATCH_SIZE)
    if (error) throw error

    const orders = (data ?? []) as SolanaOrder[]
    const totals = { checked: orders.length, confirmed: 0, expired: 0, pending: 0, invalid: 0, errors: 0 }
    let next = 0
    const worker = async () => {
      while (next < orders.length) {
        const order = orders[next++]!
        try {
          const outcome = await settleOrder({ connection, store, merchant, order })
          if (outcome.status === 'confirmed') totals.confirmed++
          else if (outcome.status === 'expired') totals.expired++
          else if (outcome.status === 'pending') totals.pending++
          else totals.invalid++
        } catch {
          totals.errors++
        }
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker))
    sendJson(response, 200, { ok: true, ...totals })
  } catch (error) {
    console.error('[crypto] reconcile failed:', error instanceof Error ? error.message : 'unknown error')
    sendJson(response, 503, { error: 'Reconcile job failed' })
  }
}
