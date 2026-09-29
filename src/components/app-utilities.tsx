import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { Brand } from '@/components/brand'
import { trackReferralClick } from '@/lib/storage'

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

export function PlatformEntryAnimation() {
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const location = useLocation()
  useEffect(() => {
    const isLanding = location.pathname === '/landing'
    const isCourse = location.pathname.startsWith('/curso')
    if (!isLanding && !isCourse) return
    const key = `cripto-mentoria:welcome-seen:${isLanding ? 'landing' : 'course'}`
    if (sessionStorage.getItem(key)) return
    const duration = 2350
    const startedAt = performance.now()
    let hideTimeout: number | undefined
    setVisible(true)
    setProgress(0)
    const interval = window.setInterval(() => {
      const elapsed = Math.min(1, (performance.now() - startedAt) / duration)
      const eased = 1 - Math.pow(1 - elapsed, 2.1)
      const value = Math.min(100, Math.round(eased * 100))
      setProgress(value)
      if (value === 100) {
        window.clearInterval(interval)
        sessionStorage.setItem(key, '1')
        hideTimeout = window.setTimeout(() => setVisible(false), 320)
      }
    }, 28)
    return () => {
      window.clearInterval(interval)
      if (hideTimeout !== undefined) window.clearTimeout(hideTimeout)
      setVisible(false)
    }
  }, [location.pathname])
  return <AnimatePresence>{visible && <motion.div className="platform-entry fixed inset-0 z-[100] grid place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.015, transition: { duration: .42 } }}>
    <motion.div className="platform-loader-content" initial={{ opacity: 0, y: 14, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .5, ease: [.16, 1, .3, 1] }}>
      <Brand />
      <div className="platform-coin-stage" aria-hidden="true">
        <span className="platform-coin-orbit platform-coin-orbit-one" />
        <span className="platform-coin-orbit platform-coin-orbit-two" />
        <motion.span className="platform-bitcoin">₿</motion.span>
      </div>
      <div className="platform-loading-label"><span>{location.pathname === '/landing' ? 'PREPARANDO SUA JORNADA' : 'PREPARANDO SUA TRILHA'}</span><span>{progress}%</span></div>
      <div className="platform-loading-track" role="progressbar" aria-label={location.pathname === '/landing' ? 'Preparando sua jornada' : 'Preparando sua trilha'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><motion.div className="platform-loading-fill" animate={{ width: `${progress}%` }} transition={{ duration: .16, ease: 'linear' }} /></div>
      <p className="platform-loading-caption">{location.pathname === '/landing' ? 'Carregando a apresentação do curso' : 'Organizando aulas, áudio e progresso'}</p>
    </motion.div>
  </motion.div>}</AnimatePresence>
}

