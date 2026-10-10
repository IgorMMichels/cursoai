import type { IncomingMessage, ServerResponse } from 'node:http'
import { runMarketingLifecycle } from '../../server/email/lifecycle.ts'

export default async function marketingCron(request: IncomingMessage, response: ServerResponse) {
  response.setHeader('Cache-Control', 'private, no-store, max-age=0')
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  if (request.method !== 'GET' && request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST')
    response.statusCode = 405
    response.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }
  const secret = process.env.CRON_SECRET?.trim()
  const authorization = request.headers.authorization
  if (!secret || authorization !== `Bearer ${secret}`) {
    response.statusCode = 401
    response.end(JSON.stringify({ error: 'Unauthorized' }))
    return
  }
  try {
    const stats = await runMarketingLifecycle(process.env)
    response.statusCode = 200
    response.end(JSON.stringify({ ok: true, ...stats }))
  } catch (error) {
    response.statusCode = 503
    response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Marketing job failed' }))
  }
}
