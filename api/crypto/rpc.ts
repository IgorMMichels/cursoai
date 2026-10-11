import type { IncomingMessage, ServerResponse } from 'node:http'
import { getAuthenticatedUser } from '../../server/stripe/runtime.ts'
import { getRpcUrl } from '../../server/crypto/config.ts'
import { bearerToken, isNotConfigured, readJson, requirePost, sendJson } from '../../server/crypto/http.ts'

// The browser needs a Solana RPC to build and send the payment, but the provider key must stay on the server.
// This forwards a small allowlist of JSON-RPC methods for signed-in users and nothing else.
const allowedMethods = new Set([
  'getLatestBlockhash',
  'getBlockHeight',
  'isBlockhashValid',
  'getFeeForMessage',
  'simulateTransaction',
  'sendTransaction',
  'getSignatureStatuses',
])

type RpcCall = { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: unknown }

export default async function solanaRpcProxy(request: IncomingMessage, response: ServerResponse) {
  if (!requirePost(request, response)) return
  const accessToken = bearerToken(request)
  if (!accessToken) return sendJson(response, 401, { error: 'Unauthorized' })
  let call: RpcCall
  try {
    call = await readJson(request, 8_000) as RpcCall
  } catch {
    return sendJson(response, 400, { error: 'Invalid request' })
  }
  if (Array.isArray(call) || typeof call !== 'object' || call === null || typeof call.method !== 'string' || !allowedMethods.has(call.method)) {
    return sendJson(response, 400, { error: 'Method not allowed' })
  }
  try {
    const user = await getAuthenticatedUser(process.env, accessToken)
    if (!user) return sendJson(response, 401, { error: 'Unauthorized' })
    const upstream = await fetch(getRpcUrl(process.env), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: call.id ?? 1, method: call.method, params: call.params ?? [] }),
      signal: AbortSignal.timeout(15_000),
    })
    response.statusCode = upstream.status
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.end(await upstream.text())
  } catch (error) {
    sendJson(response, isNotConfigured(error) ? 503 : 502, { error: 'RPC unavailable' })
  }
}
