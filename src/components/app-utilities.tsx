import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Brand } from '@/components/brand'
import { rememberReferral } from '@/lib/storage'
import { recordReferralClick } from '@/lib/affiliate-service'

const trackedReferralClicks = new Set<string>()

export function ReferralTracker() {
  const location = useLocation()
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const code = params.get('ref')
    if (!code) return
    const key = `cripto-mentoria:tracked:${code.toUpperCase()}`
    if (trackedReferralClicks.has(key)) return
    try {
      if (window.sessionStorage.getItem(key)) return
      window.sessionStorage.setItem(key, '1')
    } catch { /* Keep referral tracking available when session storage is blocked. */ }
    trackedReferralClicks.add(key)
    rememberReferral(code)
    let visitorId: string
    try {
      const visitorKey = 'cripto-mentoria:affiliate-visitor'
      const existing = window.sessionStorage.getItem(visitorKey)
      visitorId = existing && /^[0-9a-f-]{36}$/i.test(existing) ? existing : window.crypto.randomUUID()
      window.sessionStorage.setItem(visitorKey, visitorId)
    } catch {
      visitorId = window.crypto.randomUUID()
    }
    void recordReferralClick(code, visitorId, location.pathname).catch(() => {})
  }, [location.pathname, location.search])
  return null
}

export function RouteLoading() {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const timer = window.setTimeout(() => setVisible(true), 200); return () => clearTimeout(timer) }, [])
  return <div className="omega-route-loading" role="status" aria-label="Carregando página">{visible && <><Brand vertical /><p>Preparando sua página…</p><span className="omega-loading-indicator" aria-hidden="true" /></>}</div>
}
