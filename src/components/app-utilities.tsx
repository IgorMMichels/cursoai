import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Brand } from '@/components/brand'
import { markPlatformEntrySeen, shouldShowPlatformEntry } from '@/contexts/platform-entry-context'
import { trackReferralClick } from '@/lib/storage'

const AsciiModelViewer = lazy(() => import('@/components/ui/3d-ascii-model-viewer'))

export function ReferralTracker() {
  const location = useLocation()
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const code = params.get('ref')
    if (!code) return
    const key = `cripto-mentoria:tracked:${code.toUpperCase()}`
    if (sessionStorage.getItem(key)) return
    trackReferralClick(code)
    sessionStorage.setItem(key, '1')
  }, [location.pathname, location.search])
  return null
}

export function PlatformEntryAnimation({ onVisibilityChange }: { onVisibilityChange: (visible: boolean) => void }) {
  const location = useLocation()
  const [visible, setVisible] = useState(() => shouldShowPlatformEntry(location.pathname))
  const [closing, setClosing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [viewerReady, setViewerReady] = useState(false)
  useEffect(() => {
    const isLanding = location.pathname === '/landing'
    const isCourse = location.pathname.startsWith('/curso')
    if (!isLanding && !isCourse) return
    if (!shouldShowPlatformEntry(location.pathname)) { onVisibilityChange(false); return }
    const duration = 2350
    const startedAt = performance.now()
    setVisible(true)
    onVisibilityChange(true)
    setClosing(false)
    setProgress(0)
    setViewerReady(false)
    const interval = window.setInterval(() => {
      const elapsed = Math.min(1, (performance.now() - startedAt) / duration)
      const eased = 1 - Math.pow(1 - elapsed, 2.1)
      const value = Math.min(100, Math.round(eased * 100))
      setProgress(value)
      if (value === 100) {
        window.clearInterval(interval)
      }
    }, 28)
    return () => {
      window.clearInterval(interval)
      setVisible(false)
      onVisibilityChange(false)
    }
  }, [location.pathname, onVisibilityChange])
  useEffect(() => {
    if (!visible || progress < 100 || !viewerReady || closing) return
    markPlatformEntrySeen(location.pathname)
    setClosing(true)
    const hideTimeout = window.setTimeout(() => { setVisible(false); onVisibilityChange(false) }, 420)
    return () => window.clearTimeout(hideTimeout)
  }, [closing, location.pathname, onVisibilityChange, progress, viewerReady, visible])
  const onViewerReady = useCallback(() => setViewerReady(true), [])
  return visible && <div className={`platform-entry fixed inset-0 z-[100] grid place-items-center ${closing ? 'platform-entry-closing' : ''}`}>
    <div className="platform-loader-content">
      <div className="platform-loader-brand"><Brand compact /><span>Cripto do Zero</span></div>
      <div className="platform-ascii-stage" role="img" aria-label="Moeda de Bitcoin em arte ASCII">
        <div className="platform-ascii-stage-heading"><span><i /> BITCOIN · VISUALIZAÇÃO ASCII</span></div>
        <Suspense fallback={<div className="platform-ascii-pending" role="img" aria-label="Carregando esfera de Bitcoin em ASCII"><pre>{'       .,:;-=+*#*=-:,.\n    .-+*#%@@@@@@@@@%#*+-.\n  :+#%@@@@@@@₿@@@@@@@%#+:\n  :+#%@@@@@@@@@@@@@@@@@%#+:\n    .-+*#%@@@@@@@@@%#*+-.\n       .,:;-=+*#*=-:,.'}</pre></div>}>
          <AsciiModelViewer className="absolute inset-0" baseScale={1.12} interactive={false} showLoadingOverlay={false} onReady={onViewerReady} />
        </Suspense>
      </div>
      <div className="platform-loading-label"><span>{location.pathname === '/landing' ? 'PREPARANDO SUA JORNADA' : 'PREPARANDO SUA TRILHA'}</span><span>{progress}%</span></div>
      <div className="platform-loading-track" role="progressbar" aria-label={location.pathname === '/landing' ? 'Preparando sua jornada' : 'Preparando sua trilha'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="platform-loading-fill" style={{ width: `${progress}%` }} /></div>
      <p className="platform-loading-caption">{location.pathname === '/landing' ? 'Carregando a apresentação do curso' : 'Organizando aulas, áudio e progresso'}</p>
    </div>
  </div>
}

