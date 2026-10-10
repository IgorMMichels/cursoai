import type { IncomingMessage, ServerResponse } from 'node:http'
import Stripe from 'stripe'
import { createBillingAdmin, createStripeClient } from '../../server/stripe/runtime.ts'

export const config = { api: { bodyParser: false } }

export default async function stripeWebhook(request: IncomingMessage, response: ServerResponse) {
  response.setHeader('Cache-Control', 'private, no-store, max-age=0')
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    response.statusCode = 405
    response.end('Method not allowed')
    return
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  if (!secret) {
    response.statusCode = 503
    response.end('Webhook is not configured')
    return
  }
  let rawBody: Buffer
  try {
    rawBody = await readBody(request)
  } catch {
    response.statusCode = 400
    response.end('Invalid webhook body')
    return
  }
  let event: Stripe.Event
  try {
    const signature = request.headers['stripe-signature']
    if (typeof signature !== 'string') throw new Error('Missing Stripe signature')
    event = createStripeClient(process.env).webhooks.constructEvent(rawBody, signature, secret)
  } catch {
    response.statusCode = 400
    response.end('Invalid webhook signature')
    return
  }
  if (event.type !== 'checkout.session.completed' && event.type !== 'checkout.session.async_payment_succeeded') {
    response.statusCode = 200
    response.end(JSON.stringify({ received: true }))
    return
  }
  const session = event.data.object as Stripe.Checkout.Session
  if (session.payment_status !== 'paid') {
    response.statusCode = 200
    response.end(JSON.stringify({ received: true, pending: true }))
    return
  }
  const orderId = session.metadata?.order_id
  if (!orderId || !session.currency || session.amount_total === null) {
    response.statusCode = 400
    response.end('Checkout session is missing order details')
    return
  }
  try {
    const admin = createBillingAdmin(process.env)
    const { error } = await admin.rpc('fulfill_stripe_checkout', {
      p_event_id: event.id,
      p_event_type: event.type,
      p_order_id: orderId,
      p_session_id: session.id,
      p_amount_minor: session.amount_total,
      p_currency: session.currency,
    })
    if (error) throw error
    response.statusCode = 200
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.end(JSON.stringify({ received: true }))
  } catch {
    response.statusCode = 500
    response.end('Webhook processing failed')
  }
}

async function readBody(request: AsyncIterable<Uint8Array>) {
  const chunks: Uint8Array[] = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.byteLength
    if (size > 1_000_000) throw new Error('Request body too large')
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}
