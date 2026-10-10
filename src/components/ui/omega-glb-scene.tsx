import { useEffect, useRef, type MutableRefObject } from 'react'
import { createOmegaStage, type StageState } from '@/lib/omega-logo-stage'

const modelUrl = '/brand/omega/omega-logo-3d.glb'

// Estado compartilhado com a tela de loading (mutável, lido a cada frame sem re-render).
export type SpinState = StageState

interface SceneProps {
  spin: MutableRefObject<SpinState>
  frame: () => DOMRect | null | undefined
  onProgress: (fraction: number) => void
  onReady: () => void
  onFailure: () => void
}

export default function OmegaGlbScene({ spin, frame, onProgress, onReady, onFailure }: SceneProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const callbacks = useRef({ frame, onProgress, onReady, onFailure })
  useEffect(() => { callbacks.current = { frame, onProgress, onReady, onFailure } })

  useEffect(() => {
    const element = canvas.current
    if (!element) return
    const stage = createOmegaStage(element, {
      url: modelUrl,
      state: spin.current,
      frame: () => callbacks.current.frame(),
      onProgress: fraction => callbacks.current.onProgress(fraction),
      onReady: () => callbacks.current.onReady(),
      onFailure: reason => { console.error('[Omega loading] cena 3D indisponível, usando o logo 2D', reason); callbacks.current.onFailure() },
    })
    return () => stage.dispose()
  }, [spin])

  return <canvas ref={canvas} className="omega-loading-canvas" aria-hidden="true" />
}
