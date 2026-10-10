import type { IncomingMessage, ServerResponse } from 'node:http'
import { getRegionalCatalog } from '../src/lib/regional-offers.ts'

export default function regionalOffers(request: IncomingMessage, response: ServerResponse) {
  response.setHeader('Cache-Control', 'private, no-store, max-age=0')
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Vary', 'X-Vercel-IP-Country')
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    response.statusCode = 405
    response.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }
  // Vercel replaces this header at its edge. Local development ignores supplied headers.
  const header = process.env.VERCEL === '1' ? request.headers['x-vercel-ip-country'] : (process.env.OMEGA_DEV_COUNTRY || 'BR')
  const country = typeof header === 'string' && /^[A-Z]{2}$/i.test(header) ? header.toUpperCase() : null
  response.end(JSON.stringify(getRegionalCatalog(country)))
}
