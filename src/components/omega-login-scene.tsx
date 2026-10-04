import { lazy, Suspense, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Pause, Play } from 'lucide-react'
import { OmegaSymbol } from '@/components/brand'
import { omegaCopy } from '@/lib/omega-copy'

const OmegaAscii = lazy(() => import('@/components/ui/omega-login-ascii'))
function StaticSymbol() { return <div className="omega-login-static"><OmegaSymbol /></div> }

export function OmegaLoginScene() {
  const reducedMotion = useReducedMotion()
  const [paused, setPaused] = useState(false)
  return <div className="omega-login-scene">
    <div className="omega-login-model" aria-hidden="true">
      {reducedMotion ? <StaticSymbol /> : <Suspense fallback={<StaticSymbol />}><OmegaAscii paused={paused} /></Suspense>}
    </div>
    {!reducedMotion && <button type="button" className="omega-login-pause" aria-pressed={paused} onClick={() => setPaused(value => !value)}>
      {paused ? <Play size={14} /> : <Pause size={14} />}{paused ? omegaCopy.resume : omegaCopy.pause}
    </button>}
  </div>
}
