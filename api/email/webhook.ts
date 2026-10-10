import type { IncomingMessage, ServerResponse } from 'node:http'
import { createAdminClient, readRawBody, verifyResendWebhook } from '../../server/email/runtime.ts'
import { recordResendWebhook } from '../../server/email/lifecycle.ts'

// Vercel's Node function parser must stay off so Svix verifies the exact bytes
// Resend signed, rather than a re-serialized request body.
export const config = { api: { bodyParser: false } }

export default async function resendWebhook(request: IncomingMessage, response: ServerResponse) {
  return handleResendWebhook(request, response, {
    secret: process.env.RESEND_WEBHOOK_SECRET?.trim(),
    record: (event) => recordResendWebhook(process.env, event, createAdminClient(process.env)),
  })
}

export async function handleResendWebhook(request: IncomingMessage, response: ServerResponse, dependencies: {
  secret?: string
  record: (event: { id: string; type: string; created_at?: string; data?: Record<string, unknown> }) => Promise<void>
}) {
  response.setHeader('Cache-Control', 'private, no-store, max-age=0')
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    response.statusCode = 405
    response.end('Method not allowed')
    return
  }
  const secret = dependencies.secret?.trim()
  if (!secret) {
    response.statusCode = 503
    response.end('Webhook is not configured')
    return
  }
  let body: string
  try {
    body = await readRawBody(request)
  } catch {
    response.statusCode = 400
    response.end('Invalid webhook body')
    return
  }
  const id = request.headers['svix-id']
  const timestamp = request.headers['svix-timestamp']
  const signature = request.headers['svix-signature']
  let valid = false
  try {
    valid = await verifyResendWebhook({
      body,
      id: typeof id === 'string' ? id : undefined,
      timestamp: typeof timestamp === 'string' ? timestamp : undefined,
      signature: typeof signature === 'string' ? signature : undefined,
      secret,
    })
    if (!valid) {
      response.statusCode = 400
      response.end('Invalid webhook signature')
      return
    }
  } catch {
    response.statusCode = 400
    response.end('Invalid webhook request')
    return
  }
  let event: { type?: string; created_at?: string; data?: Record<string, unknown> }
  try {
    event = JSON.parse(body) as { type?: string; created_at?: string; data?: Record<string, unknown> }
  } catch {
    response.statusCode = 400
    response.end('Invalid webhook event')
    return
  }
  if (!event.type || typeof id !== 'string') {
    response.statusCode = 400
    response.end('Invalid webhook event')
    return
  }
  try {
    await dependencies.record({ id, type: event.type, created_at: event.created_at, data: event.data })
  } catch {
    response.statusCode = 500
    response.end('Webhook processing failed')
    return
  }
  response.statusCode = 200
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify({ received: true }))
}
