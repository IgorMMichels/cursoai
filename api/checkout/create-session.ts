import { randomBytes, randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { plans, type PlanId } from '../../src/lib/offers.ts'
import { createBillingAdmin, createStripeClient, getAuthenticatedUser, getFiatOffer, getOfferAmountMajor, getSiteUrl } from '../../server/stripe/runtime.ts'

export default async function createCheckoutSession(request: IncomingMessage, response: ServerResponse) {
  response.setHeader('Cache-Control', 'private, no-store, max-age=0')
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    response.statusCode = 405
    response.end('Method not allowed')
    return
  }
  const authorization = request.headers.authorization
  const accessToken = typeof authorization === 'string' && authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : ''
  if (!accessToken) {
    response.statusCode = 401
    response.end(JSON.stringify({ error: 'Entre na sua conta para continuar.' }))
    return
  }
  let body: { planId?: unknown; locale?: unknown }
  try {
    body = JSON.parse(await readBody(request)) as { planId?: unknown }
  } catch {
    response.statusCode = 400
    response.end(JSON.stringify({ error: 'Pedido inválido.' }))
    return
  }
  if (typeof body.planId !== 'string' || !Object.hasOwn(plans, body.planId)) {
    response.statusCode = 400
    response.end(JSON.stringify({ error: 'Plano inválido.' }))
    return
  }

  let createdOrderId: string | null = null
  let createdSession: string | null = null
  try {
    const environment = process.env
    const user = await getAuthenticatedUser(environment, accessToken)
    if (!user) {
      response.statusCode = 401
      response.end(JSON.stringify({ error: 'Sua sessão expirou. Entre novamente.' }))
      return
    }
    const country = request.headers['x-vercel-ip-country']
    const countryCode = Array.isArray(country) ? country[0] : country
    const offer = getFiatOffer(countryCode ?? environment.OMEGA_DEV_COUNTRY, body.planId as PlanId)
    if (!offer) {
      response.statusCode = 400
      response.end(JSON.stringify({ error: 'Este plano não está disponível para pagamento em dinheiro na sua região.' }))
      return
    }

    const admin = createBillingAdmin(environment)
    const orderId = randomUUID()
    createdOrderId = orderId
    const amount = getOfferAmountMajor(offer)
    const { error: insertError } = await admin.from('orders').insert({
      id: orderId,
      user_id: user.id,
      plan_id: offer.planId,
      currency: offer.currency,
      amount,
      status: 'pending',
    })
    if (insertError) throw insertError

    const stripe = createStripeClient(environment)
    const siteUrl = getSiteUrl(environment)
    const locale = body.locale === 'pt-BR' || body.locale === 'es' ? body.locale : 'en'
    const planName = {
      month: { 'pt-BR': '1 mês', en: '1 month', es: '1 mes' },
      quarter: { 'pt-BR': '3 meses', en: '3 months', es: '3 meses' },
      lifetime: { 'pt-BR': 'Vitalício', en: 'Lifetime', es: 'De por vida' },
    }[offer.planId][locale]
    const productDescription = {
      'pt-BR': offer.accessDays === null ? 'Acesso vitalício ao curso Ômega. Pagamento único, sem renovação automática.' : `${offer.accessDays} dias de acesso ao curso Ômega. Pagamento único, sem renovação automática.`,
      en: offer.accessDays === null ? 'Lifetime access to the Omega course. One-time payment, no automatic renewal.' : `${offer.accessDays} days of access to the Omega course. One-time payment, no automatic renewal.`,
      es: offer.accessDays === null ? 'Acceso de por vida al curso Omega. Pago único, sin renovación automática.' : `${offer.accessDays} días de acceso al curso Omega. Pago único, sin renovación automática.`,
    }[locale]
    const suffixAlphabet = 'abcdefghjkmnpqrstuvwxyz'
    const suffix = [...randomBytes(8)].map((byte) => suffixAlphabet[byte % suffixAlphabet.length]).join('')
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: offer.currency.toLowerCase(),
          unit_amount: Math.round(amount * 100),
          product_data: {
            name: `Ômega — ${planName}`,
            description: productDescription,
            images: [`${siteUrl}/omega-checkout-orbits.webp`],
          },
        },
      }],
      locale,
      branding_settings: {
        background_color: '#080c0b',
        border_style: 'rounded',
        button_color: '#d8b66d',
        display_name: 'Ômega',
        font_family: 'montserrat',
        icon: { type: 'url', url: `${siteUrl}/brand/omega/symbol-accent.svg` },
      },
      client_reference_id: orderId,
      customer_email: user.email,
      metadata: { order_id: orderId, user_id: user.id, plan_id: offer.planId },
      success_url: `${siteUrl}/checkout?plan=${offer.planId}&payment=fiat&status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout?plan=${offer.planId}&payment=fiat&status=cancelled`,
      integration_identifier: `omega_web_${suffix}`,
    })
    createdSession = session.id
    if (!session.url) throw new Error('Stripe did not return a Checkout URL')
    const { error: updateError } = await admin.from('orders').update({ provider_reference: session.id }).eq('id', orderId)
    if (updateError) throw updateError

    response.statusCode = 200
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.end(JSON.stringify({ url: session.url }))
  } catch {
    if (createdOrderId) {
      try {
        const admin = createBillingAdmin(process.env)
        await admin.from('orders').update({ status: 'failed' }).eq('id', createdOrderId).eq('status', 'pending')
        if (createdSession) await createStripeClient(process.env).checkout.sessions.expire(createdSession)
      } catch { /* A later reconciliation can handle an order if a provider is temporarily unavailable. */ }
    }
    response.statusCode = 500
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.end(JSON.stringify({ error: 'Não foi possível iniciar o pagamento. Tente novamente em instantes.' }))
  }
}

async function readBody(request: AsyncIterable<Uint8Array>) {
  const chunks: Uint8Array[] = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.byteLength
    if (size > 16_000) throw new Error('Request body too large')
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}
