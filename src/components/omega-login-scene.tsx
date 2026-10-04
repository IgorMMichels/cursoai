import { lazy, Suspense, useState, useSyncExternalStore } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Pause, Play } from 'lucide-react'
import { OmegaSymbol } from '@/components/brand'
import { omegaCopy } from '@/lib/omega-copy'

const OmegaAscii = lazy(() => import('@/components/ui/omega-ascii-model-viewer'))
function StaticSymbol() { return <div className="omega-login-static"><OmegaSymbol /></div> }
function subscribeViewport(notify: () => void) {
  const query = matchMedia('(min-width: 1024px)')
  query.addEventListener('change', notify)
  return () => query.removeEventListener('change', notify)
}
const desktopSnapshot = () => matchMedia('(min-width: 1024px)').matches

export function OmegaLoginScene({ compact = false }: { compact?: boolean }) {
  const reducedMotion = useReducedMotion()
  const [paused, setPaused] = useState(false)
  const [motionRequested, setMotionRequested] = useState(false)
  const desktop = useSyncExternalStore(subscribeViewport, desktopSnapshot, () => true)
  const animated = !reducedMotion || motionRequested
  // Mount only the scene visible at this breakpoint, avoiding a hidden second canvas.
  if (compact === desktop) return null
  return <div className={`omega-login-scene${compact ? ' omega-login-scene-compact' : ''}`}>
    <div className="omega-login-model" aria-hidden="true">
      {!animated ? <StaticSymbol /> : <Suspense fallback={<StaticSymbol />}><OmegaAscii paused={paused} motionEnabled={motionRequested} resolution={compact ? .2 : .14} /></Suspense>}
    </div>
    {animated ? <button type="button" className="omega-login-pause" aria-pressed={paused} onClick={() => setPaused(value => !value)}>
      {paused ? <Play size={14} /> : <Pause size={14} />}{paused ? omegaCopy.resume : omegaCopy.pause}
    </button> : <button type="button" className="omega-login-pause" onClick={() => setMotionRequested(true)}><Play size={14} />Ativar animação</button>}
  </div>
}
