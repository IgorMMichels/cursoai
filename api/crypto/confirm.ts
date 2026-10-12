import type { IncomingMessage, ServerResponse } from 'node:http'
import { createBillingAdmin, getAuthenticatedUser } from '../../server/stripe/runtime.ts'
import { createSolanaConnection, getMerchantAddress } from '../../server/crypto/config.ts'
import { bearerToken, isNotConfigured, readJson, requirePost, sendJson, describeError } from '../../server/crypto/http.ts'
import { createSupabaseStore, isSignatureShape, RpcUnavailableError, settleOrder, type SolanaOrder } from '../../server/crypto/payment.ts'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Called by the checkout page after the wallet returns a signature (or while polling a QR payment).
// The browser only names an order and, optionally, a signature; the chain decides everything else.
export default async function confirmCryptoPayment(request: IncomingMessage, response: ServerResponse) {
  if (!requirePost(request, response)) return
  const accessToken = bearerToken(request)
  if (!accessToken) return sendJson(response, 401, { error: 'Entre na sua conta para continuar.' })
  let body: { orderId?: unknown; signature?: unknown }
  try {
    body = await readJson(request) as { orderId?: unknown; signature?: unknown }
  } catch {
    return sendJson(response, 400, { error: 'Pedido inválido.' })
  }
  if (typeof body.orderId !== 'string' || !UUID.test(body.orderId)) return sendJson(response, 400, { error: 'Pedido inválido.' })
  if (body.signature !== undefined && !isSignatureShape(body.signature)) return sendJson(response, 400, { error: 'Assinatura inválida.' })

  try {
    const environment = process.env
    const user = await getAuthenticatedUser(environment, accessToken)
    if (!user) return sendJson(response, 401, { error: 'Sua sessão expirou. Entre novamente.' })
    const admin = createBillingAdmin(environment)
    const { data: order, error } = await admin.from('orders')
      .select('id, currency, status, reference, amount_lamports, expires_at')
      .eq('id', body.orderId).eq('user_id', user.id).maybeSingle()
    if (error) throw error
    if (!order) return sendJson(response, 404, { error: 'Pedido não encontrado.' })

    const outcome = await settleOrder({
      connection: createSolanaConnection(environment),
      store: createSupabaseStore(admin),
      merchant: getMerchantAddress(environment),
      order: order as SolanaOrder,
      signatureHint: body.signature as string | undefined,
    })
    sendJson(response, 200, outcome)
  } catch (error) {
    console.error('[crypto] confirmation failed:', describeError(error))
    if (error instanceof RpcUnavailableError) return sendJson(response, 503, { error: 'A rede Solana não respondeu. Tentaremos de novo.', code: 'rpc_unavailable' })
    const notConfigured = isNotConfigured(error)
    sendJson(response, notConfigured ? 503 : 500, { error: 'Não foi possível confirmar o pagamento agora.', code: notConfigured ? 'not_configured' : undefined })
  }
}
