import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Keypair } from '@solana/web3.js'
import { plans, type PlanId } from '../../src/lib/offers.ts'
import { createBillingAdmin, getAuthenticatedUser } from '../../server/stripe/runtime.ts'
import { getCluster, getCryptoOffer, getMerchantAddress, getRpcUrl, ORDER_TTL_MINUTES } from '../../server/crypto/config.ts'
import { bearerToken, isNotConfigured, readJson, requirePost, sendJson, describeError } from '../../server/crypto/http.ts'

type OpenOrder = { id: string; reference: string; amount_lamports: number | string; expires_at: string }

export default async function createCryptoOrder(request: IncomingMessage, response: ServerResponse) {
  if (!requirePost(request, response)) return
  const accessToken = bearerToken(request)
  if (!accessToken) return sendJson(response, 401, { error: 'Entre na sua conta para continuar.' })
  let body: { planId?: unknown }
  try {
    body = await readJson(request) as { planId?: unknown }
  } catch {
    return sendJson(response, 400, { error: 'Pedido inválido.' })
  }
  if (typeof body.planId !== 'string' || !Object.hasOwn(plans, body.planId)) return sendJson(response, 400, { error: 'Plano inválido.' })

  try {
    const environment = process.env
    const user = await getAuthenticatedUser(environment, accessToken)
    if (!user) return sendJson(response, 401, { error: 'Sua sessão expirou. Entre novamente.' })
    const country = request.headers['x-vercel-ip-country']
    const offer = getCryptoOffer((Array.isArray(country) ? country[0] : country) ?? environment.OMEGA_DEV_COUNTRY, body.planId as PlanId)
    if (!offer) return sendJson(response, 400, { error: 'Este plano não está disponível em cripto na sua região.' })

    // The merchant address and the RPC live only in server environment variables.
    const merchant = getMerchantAddress(environment)
    getRpcUrl(environment)
    const admin = createBillingAdmin(environment)
    const lamports = offer.amountMinor

    // Reuse an open order for the same plan so double clicks and reloads do not pile up references.
    const { data: open, error: openError } = await admin.from('orders')
      .select('id, reference, amount_lamports, expires_at')
      .eq('user_id', user.id).eq('plan_id', offer.planId).eq('currency', 'SOL').eq('status', 'pending')
      .eq('amount_lamports', lamports)
      .gt('expires_at', new Date(Date.now() + 2 * 60_000).toISOString())
      .order('created_at', { ascending: false }).limit(1)
    if (openError) throw openError
    let order = open?.[0] as OpenOrder | undefined

    if (!order) {
      // Only the public key is kept: the reference is a throwaway address used to find the transfer on-chain.
      const reference = Keypair.generate().publicKey.toBase58()
      const expiresAt = new Date(Date.now() + ORDER_TTL_MINUTES * 60_000).toISOString()
      const { data: created, error: insertError } = await admin.from('orders').insert({
        id: randomUUID(),
        user_id: user.id,
        plan_id: offer.planId,
        currency: 'SOL',
        amount: lamports / 1_000_000_000,
        amount_lamports: lamports,
        reference,
        expires_at: expiresAt,
        status: 'pending',
      }).select('id, reference, amount_lamports, expires_at').single()
      if (insertError) throw insertError
      order = created as OpenOrder
    }

    sendJson(response, 200, {
      orderId: order.id,
      reference: order.reference,
      recipient: merchant.toBase58(),
      amountLamports: String(order.amount_lamports),
      expiresAt: order.expires_at,
      cluster: getCluster(environment),
    })
  } catch (error) {
    console.error('[crypto] order creation failed:', describeError(error))
    const notConfigured = isNotConfigured(error)
    sendJson(response, notConfigured ? 503 : 500, { error: 'Não foi possível iniciar o pagamento. Tente novamente em instantes.', code: notConfigured ? 'not_configured' : undefined })
  }
}
