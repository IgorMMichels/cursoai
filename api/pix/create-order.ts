import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { plans, type PlanId } from '../../src/lib/offers.ts'
import { isValidCpf, onlyDigits } from '../../src/lib/cpf.ts'
import { createBillingAdmin, getAuthenticatedUser, getFiatOffer, getOfferAmountMajor } from '../../server/stripe/runtime.ts'
import { createAsaasClient, getAsaasConfig } from '../../server/pix/asaas.ts'
import { bearerToken, describeError, isNotConfigured, readJson, requirePost, sendJson } from '../../server/crypto/http.ts'

// Creates a one-time Pix charge at Asaas and returns the QR code. The order is confirmed only by the Asaas webhook.
export default async function createPixOrder(request: IncomingMessage, response: ServerResponse) {
  if (!requirePost(request, response)) return
  const accessToken = bearerToken(request)
  if (!accessToken) return sendJson(response, 401, { error: 'Entre na sua conta para continuar.' })

  let body: { planId?: unknown; name?: unknown; cpf?: unknown }
  try {
    body = await readJson(request) as typeof body
  } catch {
    return sendJson(response, 400, { error: 'Pedido inválido.' })
  }
  if (typeof body.planId !== 'string' || !Object.hasOwn(plans, body.planId)) return sendJson(response, 400, { error: 'Plano inválido.' })
  const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : ''
  if (name.length < 3 || name.length > 120) return sendJson(response, 400, { error: 'Informe seu nome completo.', field: 'name' })
  const cpf = typeof body.cpf === 'string' ? onlyDigits(body.cpf) : ''
  if (!isValidCpf(cpf)) return sendJson(response, 400, { error: 'CPF inválido. Confira os números.', field: 'cpf' })

  let createdOrderId: string | null = null
  try {
    const environment = process.env
    const user = await getAuthenticatedUser(environment, accessToken)
    if (!user) return sendJson(response, 401, { error: 'Sua sessão expirou. Entre novamente.' })

    const country = request.headers['x-vercel-ip-country']
    const offer = getFiatOffer((Array.isArray(country) ? country[0] : country) ?? environment.OMEGA_DEV_COUNTRY, body.planId as PlanId)
    if (!offer || offer.currency !== 'BRL') return sendJson(response, 400, { error: 'O Pix está disponível apenas para compras no Brasil.' })

    const asaas = createAsaasClient(getAsaasConfig(environment))
    const admin = createBillingAdmin(environment)
    const orderId = randomUUID()
    createdOrderId = orderId
    const amount = getOfferAmountMajor(offer)
    const { error: insertError } = await admin.from('orders').insert({
      id: orderId,
      user_id: user.id,
      plan_id: offer.planId,
      currency: 'BRL',
      amount,
      status: 'pending',
    })
    if (insertError) throw insertError

    const customerId = await asaas.findOrCreateCustomer({ name, cpfCnpj: cpf, externalReference: user.id })
    // Pix QR codes are dynamic: a due date of today (São Paulo time) is enough; the QR stays payable for months.
    const dueDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
    const payment = await asaas.createPixPayment({
      customerId,
      value: amount,
      dueDate,
      externalReference: orderId,
      description: `Ômega — ${offer.accessDays === null ? 'Acesso vitalício' : `${offer.accessDays} dias de acesso`}`,
    })
    const { error: referenceError } = await admin.from('orders').update({ provider_reference: payment.id }).eq('id', orderId)
    if (referenceError) throw referenceError
    const qrCode = await asaas.getPixQrCode(payment.id)

    sendJson(response, 200, {
      orderId,
      paymentId: payment.id,
      amount,
      payload: qrCode.payload,
      encodedImage: qrCode.encodedImage,
      expiresAt: qrCode.expirationDate,
    })
  } catch (error) {
    console.error('[pix] order creation failed:', describeError(error))
    if (createdOrderId) {
      try {
        // A pending order with no Asaas charge must not stay payable; the webhook can only confirm a matching payment.
        await createBillingAdmin(process.env).from('orders').update({ status: 'failed' }).eq('id', createdOrderId).eq('status', 'pending')
      } catch { /* The order stays pending and is harmless: no provider payment references it. */ }
    }
    const notConfigured = isNotConfigured(error)
    sendJson(response, notConfigured ? 503 : 500, { error: 'Não foi possível gerar o Pix agora. Tente novamente em instantes.', code: notConfigured ? 'not_configured' : undefined })
  }
}
