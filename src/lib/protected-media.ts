import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Course audio and transcripts are private. Ask the API for short-lived signed URLs
// for the paths we need; the API checks sign-in and active course access first.
export type ProtectedMediaState = { urls: Record<string, string>; status: 'idle' | 'loading' | 'ready' | 'error' }

export async function resolveProtectedMedia(paths: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))]
  if (!unique.length) return {}
  if (!supabase) throw new Error('Serviço indisponível no momento.')
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Entre para ouvir este conteúdo.')
  const response = await fetch('/api/course-media/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ paths: unique }),
  })
  if (!response.ok) throw new Error('Conteúdo indisponível para esta conta.')
  const body = await response.json() as { urls?: Record<string, string> }
  return body.urls ?? {}
}

export function useProtectedMedia(paths: string[]): ProtectedMediaState {
  const key = [...new Set(paths.filter(Boolean))].join('|')
  const [state, setState] = useState<ProtectedMediaState>({ urls: {}, status: 'idle' })

  useEffect(() => {
    if (!key) return
    let cancelled = false
    setState({ urls: {}, status: 'loading' })
    resolveProtectedMedia(key.split('|'))
      .then((urls) => { if (!cancelled) setState({ urls, status: 'ready' }) })
      .catch(() => { if (!cancelled) setState({ urls: {}, status: 'error' }) })
    return () => { cancelled = true }
  }, [key])

  return state
}
