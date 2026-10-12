import type { IncomingMessage, ServerResponse } from 'node:http'
import { createClient } from '@supabase/supabase-js'

// Course audio and transcripts live in the private `course-media` bucket.
// The caller must be signed in and hold active course access; only then do we
// mint time-limited signed URLs for the requested objects.
const BUCKET = 'course-media'
const SIGNED_URL_TTL_SECONDS = 3600
const MAX_PATHS = 40
const OBJECT_PATH = /^audio\/[A-Za-z0-9._\/-]+\.(mp3|json)$/

export default async function courseMediaSign(request: IncomingMessage, response: ServerResponse) {
  response.setHeader('Cache-Control', 'private, no-store, max-age=0')
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    response.statusCode = 405
    response.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim()
  const publishableKey = (process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim()
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (!url || !publishableKey || !serviceKey) {
    response.statusCode = 503
    response.end(JSON.stringify({ error: 'Course media is not configured.' }))
    return
  }

  const token = bearerToken(request.headers.authorization)
  if (!token) {
    response.statusCode = 401
    response.end(JSON.stringify({ error: 'Sign in required.' }))
    return
  }

  const paths = await readPaths(request)
  if (!paths) {
    response.statusCode = 400
    response.end(JSON.stringify({ error: 'Invalid media paths.' }))
    return
  }

  // Verify the token and entitlement with the caller's own identity (RLS-aware RPC).
  const userClient = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: userData, error: userError } = await userClient.auth.getUser(token)
  if (userError || !userData.user) {
    response.statusCode = 401
    response.end(JSON.stringify({ error: 'Sign in required.' }))
    return
  }
  const { data: entitled, error: entitlementError } = await userClient.rpc('has_active_course_access')
  if (entitlementError) {
    response.statusCode = 500
    response.end(JSON.stringify({ error: 'Could not verify course access.' }))
    return
  }
  if (entitled !== true) {
    response.statusCode = 403
    response.end(JSON.stringify({ error: 'Active course access required.' }))
    return
  }

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: signed, error: signError } = await admin.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL_SECONDS)
  if (signError || !signed) {
    response.statusCode = 500
    response.end(JSON.stringify({ error: 'Could not sign course media.' }))
    return
  }

  const urls: Record<string, string> = {}
  for (const item of signed) {
    // Requested paths are returned with their leading slash, as the app references them.
    if (item.signedUrl && item.path) urls[`/${item.path}`] = item.signedUrl
  }
  response.end(JSON.stringify({ urls }))
}

function bearerToken(header: string | undefined) {
  const match = /^Bearer\s+(.+)$/i.exec(header ?? '')
  return match ? match[1].trim() : ''
}

async function readPaths(request: IncomingMessage): Promise<string[] | null> {
  let body = ''
  try {
    for await (const chunk of request) body += chunk
    const parsed = JSON.parse(body) as { paths?: unknown }
    if (!Array.isArray(parsed.paths) || parsed.paths.length === 0 || parsed.paths.length > MAX_PATHS) return null
    const normalized = parsed.paths.map((item) => (typeof item === 'string' ? item.replace(/^\/+/, '') : ''))
    if (!normalized.every((item) => OBJECT_PATH.test(item) && !item.includes('..'))) return null
    return normalized
  } catch {
    return null
  }
}
