import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { StageState } from '@/lib/omega-logo-stage'
import '@/styles/platform-loading.css'

const OmegaGlbScene = lazy(() => import('@/components/ui/omega-glb-scene'))

// Logo 3D do Omega em um quadro próprio (mesmo stage da tela de loading).
// `still` deixa o logo parado para quem pediu movimento reduzido.
// Se o modelo falhar, não renderiza nada: a página continua funcionando sem ele.
export function OmegaBrandScene({ className = '', still = false }: { className?: string; still?: boolean }) {
  const spin = useRef<StageState>({ speed: still ? 0 : 0.7, reveal: 1, boost: 0 })
  const shell = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const frame = useCallback(() => shell.current?.getBoundingClientRect(), [])
  const noop = useCallback(() => {}, [])
  const onFailure = useCallback(() => setFailed(true), [])
  useEffect(() => { spin.current.speed = still ? 0 : 0.7 }, [still])
  if (failed) return null
  return <div ref={shell} className={`omega-loading-stage is-ready ${className}`} aria-hidden="true">
    <Suspense fallback={null}>
      <OmegaGlbScene spin={spin} frame={frame} onProgress={noop} onReady={noop} onFailure={onFailure} />
    </Suspense>
  </div>
}
