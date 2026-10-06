import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { PlatformLoadingScreen } from '@/components/platform-loading-screen'
import { markPlatformEntrySeen, shouldShowPlatformEntry } from '@/contexts/platform-entry-context'
import { rememberReferral } from '@/lib/storage'
import { recordReferralClick } from '@/lib/affiliate-service'
import { unlocalizedPath } from '@/lib/localization'

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

export function PlatformEntryAnimation({ onVisibilityChange, contentReady }: { onVisibilityChange: (visible: boolean) => void; contentReady: boolean }) {
  const location = useLocation()
  const [visible, setVisible] = useState(() => shouldShowPlatformEntry(location.pathname))
  const complete = useCallback(() => {
    markPlatformEntrySeen(location.pathname)
    setVisible(false)
  }, [location.pathname])
  useEffect(() => {
    onVisibilityChange(visible)
    return () => onVisibilityChange(false)
  }, [onVisibilityChange, visible])
  const introPath = unlocalizedPath(location.pathname)
  return visible && <PlatformLoadingScreen contentReady={contentReady} course={introPath.startsWith('/curso')} animatedLogo={introPath === '/landing'} onComplete={complete} />
}
