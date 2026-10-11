import type { IncomingMessage, ServerResponse } from 'node:http'

export function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(body))
}

export function requirePost(request: IncomingMessage, response: ServerResponse) {
  response.setHeader('Cache-Control', 'private, no-store, max-age=0')
  if (request.method === 'POST') return true
  response.setHeader('Allow', 'POST')
  sendJson(response, 405, { error: 'Method not allowed' })
  return false
}

export function bearerToken(request: IncomingMessage) {
  const authorization = request.headers.authorization
  return typeof authorization === 'string' && authorization.startsWith('Bearer ') ? authorization.slice('Bearer '.length).trim() : ''
}

export async function readJson(request: AsyncIterable<Uint8Array>, limit = 16_000): Promise<unknown> {
  const chunks: Uint8Array[] = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.byteLength
    if (size > limit) throw new Error('Request body too large')
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

// Missing server configuration is an operator problem; say so without leaking values.
export function isNotConfigured(error: unknown) {
  return error instanceof Error && /not configured|must use HTTPS/.test(error.message)
}
