import { translateUi } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import '@/styles/platform-loading.css'

gsap.registerPlugin(useGSAP)
const OmegaGlbScene = lazy(() => import('@/components/ui/omega-glb-scene'))
const ringLength = 2 * Math.PI * 182

function startSiteEntry() {
  const html = document.documentElement
  html.classList.add('omega-entering')
  window.setTimeout(() => html.classList.remove('omega-entering'), 1600)
}

class ModelBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onFailure() }
  render() { return this.state.failed ? null : this.props.children }
}

interface LoadingProps {
  contentReady: boolean
  onComplete: () => void
  course?: boolean
  animatedLogo?: boolean
  minimumDuration?: number
}

export function PlatformLoadingScreen({ contentReady, onComplete, course = false, minimumDuration = 2000 }: LoadingProps) {
  useUiTranslation();
  const root = useRef<HTMLDivElement>(null)
  const progressBar = useRef<HTMLDivElement>(null)
  const progressFill = useRef<HTMLSpanElement>(null)
  const percentage = useRef<HTMLSpanElement>(null)
  const progressArc = useRef<SVGCircleElement>(null)
  const progress = useRef({ value: 0 })
  const spin = useRef({ speed: .7, reveal: 0, boost: 0 })
  const anchor = useRef<HTMLDivElement>(null)
  const ringRect = useCallback(() => anchor.current?.getBoundingClientRect(), [])
  const progressTween = useRef<gsap.core.Tween | null>(null)
  const exitTimeline = useRef<gsap.core.Timeline | null>(null)
  const started = useRef(0)
  const finishing = useRef(false)
  const completion = useRef(onComplete)
  const restoreFocus = useRef<HTMLElement | null>(null)
  const [visualReady, setVisualReady] = useState(false)
  const [motion, setMotion] = useState<boolean | null>(null)
  const [modelReady, setModelReady] = useState(false)
  const [modelFailed, setModelFailed] = useState(false)
  useEffect(() => { completion.current = onComplete }, [onComplete])

  const writeProgress = useCallback(() => {
    const value = Math.min(100, Math.max(0, progress.current.value))
    if (progressFill.current) progressFill.current.style.transform = `scaleX(${value / 100})`
    if (percentage.current) percentage.current.textContent = String(Math.round(value)).padStart(2, '0')
    progressBar.current?.setAttribute('aria-valuenow', String(Math.round(value)))
    progressArc.current?.setAttribute('stroke-dashoffset', String(ringLength * (1 - value / 100)))
  }, [])

  const advance = useCallback((target: number) => {
    if (finishing.current || target <= progress.current.value) return
    progressTween.current?.kill()
    progressTween.current = gsap.to(progress.current, { value: target, duration: .65, ease: 'power3.out', onUpdate: writeProgress })
  }, [writeProgress])
  const sceneReady = useCallback(() => {
    setModelReady(true); advance(88)
    // Os glifos convergem para formar o logo assim que os shaders estão compilados.
    gsap.to(spin.current, { reveal: 1, duration: .9, ease: 'power2.out' })
  }, [advance])
  const sceneFailed = useCallback(() => { setModelFailed(true); advance(88) }, [advance])
  const assetProgress = useCallback((fraction: number) => advance(8 + fraction * 68), [advance])
  useEffect(() => {
    document.getElementById('omega-boot-screen')?.remove()
    const frame = requestAnimationFrame(() => {
      setVisualReady(true)
      if (motion === false) { spin.current.reveal = 1; spin.current.speed = 0 }
    })
    return () => cancelAnimationFrame(frame)
  }, [advance, motion])

  useGSAP(() => {
    if (motion === null) return
    const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } })
        if (motion) {
      timeline.fromTo('.omega-loading-glow', { opacity: 0, scale: .7 }, { opacity: 1, scale: 1, duration: 1.4, ease: 'power2.out' }, 0)
        .fromTo('.omega-loading-header', { opacity: 0 }, { opacity: 1, duration: .5 }, .1)
        .fromTo('.omega-loading-orbit', { opacity: 0, scale: .86 }, { opacity: 1, scale: 1, duration: 1.05, ease: 'expo.out' }, .05)
        .fromTo('.omega-loading-footer', { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: .3 }, 0)
    } else {
      gsap.set('.omega-loading-header, .omega-loading-orbit, .omega-loading-footer', { opacity: 1 })
      timeline.fromTo(root.current, { opacity: 0 }, { opacity: 1, duration: .15 })
    }
  }, { scope: root, dependencies: [motion], revertOnUpdate: true })

  const finish = useCallback(() => {
    if (finishing.current) return
    finishing.current = true
    root.current?.setAttribute('data-phase', 'exiting')
    progressTween.current?.kill()
    const timeline = gsap.timeline({ onComplete: () => completion.current() })
    exitTimeline.current = timeline
    timeline.to(progress.current, { value: 100, duration: .3, ease: 'power2.out', onUpdate: writeProgress })
    if (motion) {
      const q = gsap.utils.selector(root)
      // O logo acelera o giro, o brilho expande e a tela dissolve revelando o site, que entra em seguida.
      timeline.to(spin.current, { speed: 12, boost: 1, duration: .8, ease: 'power2.in' }, .1)
        .to(q('.omega-loading-orbit'), { scale: 1.24, duration: .85, ease: 'power3.in' }, .15)
        .to(q('.omega-loading-glow'), { scale: 2.1, duration: 1, ease: 'power2.out' }, .15)
        .to(q('.omega-loading-header, .omega-loading-footer'), { opacity: 0, duration: .3 }, .15)
        .call(startSiteEntry, [], .85)
        .to(q('.omega-loading-orbit'), { opacity: 0, duration: .3, ease: 'power1.in' }, .98)
        .to(root.current, { opacity: 0, duration: .65, ease: 'power2.inOut' }, .95)
    } else timeline.to(root.current, { opacity: 0, duration: .18 })
  }, [motion, writeProgress])
  const finishRef = useRef(finish)
  useEffect(() => { finishRef.current = finish }, [finish])

  useEffect(() => {
    started.current = performance.now()
    // A loading sempre anima: não obedece ao ajuste de acessibilidade "reduzir movimento" do sistema.
    const update = () => setMotion(true)
    update()
    const priorFocus = document.activeElement
    const dialog = root.current
    if (!restoreFocus.current && priorFocus instanceof HTMLElement && priorFocus !== dialog) restoreFocus.current = priorFocus
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    root.current?.focus({ preventScroll: true })
    advance(8)
    // A stuck animation must never hold the website indefinitely.
    const deadline = window.setTimeout(() => finishRef.current(), 9000)
    return () => {
      clearTimeout(deadline)
      progressTween.current?.kill(); exitTimeline.current?.kill()
      document.body.style.overflow = previousOverflow
      queueMicrotask(() => {
        // StrictMode's simulated cleanup leaves the dialog connected; only restore after a real unmount.
        if (!dialog?.isConnected && restoreFocus.current?.isConnected) restoreFocus.current.focus({ preventScroll: true })
      })
    }
  }, [advance])

  useEffect(() => {
    if (!visualReady || !contentReady) return
    advance(94)
    const remaining = Math.max(0, minimumDuration - (performance.now() - started.current))
    const timer = window.setTimeout(() => finishRef.current(), remaining)
    return () => clearTimeout(timer)
  }, [advance, contentReady, minimumDuration, visualReady])

  return <div ref={root} className={`omega-loading ${motion === false ? 'omega-loading-reduced' : ''}`}
    role="dialog" aria-modal="true" aria-labelledby="omega-loading-title" tabIndex={-1}
    data-phase={visualReady ? 'ready' : 'loading'} onKeyDown={event => {
      if (event.key === 'Escape') finish()
      if (event.key === 'Tab') { event.preventDefault(); root.current?.querySelector<HTMLButtonElement>('.omega-loading-skip')?.focus() }
    }}>
    <div className="omega-loading-atmosphere" aria-hidden="true"><div className="omega-loading-glow"><span /></div></div>
    <div className={`omega-loading-stage ${modelReady ? 'is-ready' : ''}`} aria-hidden="true">
      {motion !== null && !modelFailed && <ModelBoundary onFailure={sceneFailed}><Suspense fallback={null}>
        <OmegaGlbScene spin={spin} frame={ringRect} onProgress={assetProgress} onReady={sceneReady} onFailure={sceneFailed} />
      </Suspense></ModelBoundary>}
    </div>
    <header className="omega-loading-header">
      <div className="omega-loading-wordmark"><span>{translateUi("Omega")}</span></div>
      <button type="button" className="omega-loading-skip" onClick={() => finish()}>{translateUi("Continuar ")}<span aria-hidden="true">↗</span></button>
    </header>
    <div ref={anchor} className="omega-loading-orbit-anchor" aria-hidden="true">
      <div className="omega-loading-orbit">
        <div className="omega-loading-aura" />
        <svg className="omega-loading-rings" viewBox="0 0 400 400" fill="none">
          <circle cx="200" cy="200" r="182" className="omega-loading-ring-base" />
          <circle cx="200" cy="200" r="168" className="omega-loading-ring-dashed" />
          <circle ref={progressArc} cx="200" cy="200" r="182" className="omega-loading-ring-progress"
            strokeDasharray={ringLength} strokeDashoffset={ringLength} transform="rotate(-90 200 200)" />
          <path d="M200 10v7M200 383v7M10 200h7M383 200h7" className="omega-loading-ring-ticks" />
        </svg>
        {/* O logo 2D só aparece se o 3D falhar — nada de imagem girando enquanto carrega. */}
        {modelFailed && <div className="omega-loading-model"><img className="omega-loading-svg" src="/brand/omega/symbol-accent.svg" alt={translateUi("")} /></div>}
        <span className="omega-loading-orbit-caption">{translateUi("método antes do mercado")}</span>
      </div>
    </div>
    <footer className="omega-loading-footer">
      <div className="omega-loading-status"><span role="status">{translateUi(visualReady && contentReady ? 'Pronto para começar' : course ? 'Preparando sua trilha' : 'Preparando sua jornada')}</span><span className="omega-loading-number" aria-hidden="true"><span ref={percentage}>00</span><small>%</small></span></div>
      <div ref={progressBar} className="omega-loading-progress" role="progressbar" aria-label={translateUi("Preparando a experiência")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}><span ref={progressFill} /></div>
    </footer>
  </div>
}
