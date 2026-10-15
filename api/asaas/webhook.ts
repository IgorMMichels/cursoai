import { timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createBillingAdmin } from '../../server/stripe/runtime.ts'
import { createAsaasClient, getAsaasConfig } from '../../server/pix/asaas.ts'
import { describeError, sendJson } from '../../server/crypto/http.ts'

const CONFIRMING_EVENTS = new Set(['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'])

export const config = { api: { bodyParser: false } }

// Asaas sends the token configured in the webhook panel in the asaas-access-token header.
export function tokenMatches(received: string | undefined, expected: string) {
  if (!expected || !received) return false
  const a = Buffer.from(received)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export default async function asaasWebhook(request: IncomingMessage, response: ServerResponse) {
  response.setHeader('Cache-Control', 'private, no-store, max-age=0')
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return sendJson(response, 405, { error: 'Method not allowed' })
  }
  let asaas: ReturnType<typeof createAsaasClient>
  let expectedToken: string
  try {
    const config = getAsaasConfig(process.env)
    expectedToken = config.webhookToken
    asaas = createAsaasClient(config)
  } catch {
    return sendJson(response, 503, { error: 'Webhook is not configured' })
  }
  const received = request.headers['asaas-access-token']
  if (!tokenMatches(typeof received === 'string' ? received : undefined, expectedToken)) return sendJson(response, 401, { error: 'Invalid webhook token' })

  let event: { id?: unknown; event?: unknown; payment?: { id?: unknown } }
  try {
    event = JSON.parse(await readBody(request)) as typeof event
  } catch {
    return sendJson(response, 400, { error: 'Invalid webhook body' })
  }
  // Other payment events (created, overdue, deleted…) are acknowledged so Asaas stops retrying them.
  if (typeof event.event !== 'string' || !CONFIRMING_EVENTS.has(event.event)) return sendJson(response, 200, { received: true })
  if (typeof event.id !== 'string' || typeof event.payment?.id !== 'string') return sendJson(response, 400, { error: 'Webhook is missing event details' })

  try {
    // Trust the API, not the webhook body: read the charge back and check its status, value and our order reference.
    const payment = await asaas.getPayment(event.payment.id)
    if (payment.status !== 'RECEIVED' && payment.status !== 'CONFIRMED') return sendJson(response, 200, { received: true, pending: true })
    if (!payment.externalReference) return sendJson(response, 400, { error: 'Payment has no order reference' })
    const admin = createBillingAdmin(process.env)
    const { error } = await admin.rpc('fulfill_asaas_pix', {
      p_event_id: event.id,
      p_event_type: event.event,
      p_order_id: payment.externalReference,
      p_payment_id: payment.id,
      p_amount_minor: Math.round(payment.value * 100),
    })
    if (error) throw error
    sendJson(response, 200, { received: true })
  } catch (error) {
    console.error('[pix] webhook processing failed:', describeError(error))
    // Any non-2xx makes Asaas retry later; a payment that cannot be verified or recorded must not release access.
    sendJson(response, 500, { error: 'Webhook processing failed' })
  }
}

async function readBody(request: AsyncIterable<Uint8Array>) {
  const chunks: Uint8Array[] = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.byteLength
    if (size > 64_000) throw new Error('Request body too large')
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}
