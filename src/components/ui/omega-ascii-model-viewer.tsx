import { Component, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AsciiEffect, SVGLoader } from 'three-stdlib'
import { ExtrudeGeometry, type Group, type WebGLRenderer } from 'three'
import { OmegaSymbol } from '@/components/brand'
import { omegaContours } from '@/lib/omega-copy'

export interface AsciiModelViewerProps {
  className?: string; paused?: boolean; baseScale?: number; userScale?: number
  motionEnabled?: boolean
  resolution?: number; characters?: string; fgColor?: string; bgColor?: string
  invert?: boolean; autoRotateSpeed?: number; position?: [number, number, number]
  showLoadingOverlay?: boolean
}

function StaticMark() { return <div className="omega-ascii-static"><OmegaSymbol /></div> }
function attachEffect(effect: AsciiEffect, gl: WebGLRenderer, foreground: string, background: string) {
  Object.assign(effect.domElement.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', color: foreground, backgroundColor: background })
  gl.domElement.style.opacity = '0'
  gl.domElement.parentNode?.append(effect.domElement)
  return () => { gl.domElement.style.opacity = '1'; effect.domElement.remove() }
}
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <StaticMark /> : this.props.children }
}

function Trajectory({ scale, paused, speed }: { scale: number; paused: boolean; speed: number }) {
  const group = useRef<Group>(null)
  const phase = useRef(0)
  const geometries = useMemo(() => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg">${omegaContours.map(d => `<path d="${d}"/>`).join('')}</svg>`
    return new SVGLoader().parse(svg).paths.flatMap(path => SVGLoader.createShapes(path as unknown as Parameters<typeof SVGLoader.createShapes>[0]).map(shape => {
      const geometry = new ExtrudeGeometry(shape, { depth: 20, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 1, bevelThickness: 1, curveSegments: 24 })
      geometry.translate(-120, -110, -10)
      return geometry
    }))
  }, [])
  useEffect(() => () => geometries.forEach(g => g.dispose()), [geometries])
  useFrame((_, delta) => {
    if (!group.current || paused) return
    phase.current += Math.min(delta, .1) * speed
    group.current.rotation.y = Math.sin(phase.current) * .55
    group.current.rotation.x = Math.sin(phase.current * .65) * .1
  })
  // AsciiEffect maps bright pixels to spaces; keep the material dark enough
  // to retain the silhouette while lighting reveals the extruded edges.
  return <group ref={group} scale={[.01 * scale, -.01 * scale, .01 * scale]}>{geometries.map((geometry, i) => <mesh key={i} geometry={geometry}><meshStandardMaterial color="#302638" roughness={.7} metalness={0} /></mesh>)}</group>
}

function AsciiRenderer({ resolution, characters, fgColor, bgColor, invert, paused }: Required<Pick<AsciiModelViewerProps, 'resolution' | 'characters' | 'fgColor' | 'bgColor' | 'invert' | 'paused'>>) {
  const { gl, size, scene, camera, invalidate } = useThree()
  const effect = useMemo(() => new AsciiEffect(gl, characters, { invert, resolution }), [gl, characters, invert, resolution])
  useLayoutEffect(() => attachEffect(effect, gl, fgColor, bgColor), [effect, gl, fgColor, bgColor])
  useLayoutEffect(() => { effect.setSize(size.width, size.height); effect.domElement.querySelector('table')?.style.setProperty('text-align', 'center'); invalidate() }, [effect, size, invalidate])
  useEffect(() => {
    let timer: number | undefined
    let inView = true
    let stopped = false
    const stop = () => { clearTimeout(timer); timer = undefined }
    const tick = () => {
      stop()
      if (stopped || paused || document.hidden || !inView) return
      invalidate()
      timer = window.setTimeout(tick, 1000 / 24)
    }
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; if (inView) tick(); else stop() })
    observer.observe(gl.domElement)
    const visibility = () => { if (document.hidden) stop(); else tick() }
    document.addEventListener('visibilitychange', visibility)
    invalidate(); tick()
    return () => { stopped = true; stop(); observer.disconnect(); document.removeEventListener('visibilitychange', visibility) }
  }, [gl, invalidate, paused])
  useFrame(() => effect.render(scene, camera), 1)
  return null
}

export default function AsciiModelViewer({ className = '', paused = false, motionEnabled = false, baseScale = 1, userScale = 1, resolution = .14, characters = ' .:+###', fgColor = '#bca5f6', bgColor = 'transparent', invert = false, autoRotateSpeed = .85 }: AsciiModelViewerProps) {
  const [staticMode, ready] = useStaticMode(motionEnabled)
  return <div className={`ascii-viewer ${className}`} aria-hidden="true">
    {!ready || staticMode ? <StaticMark /> : <SceneBoundary><Canvas frameloop="demand" dpr={1} camera={{ position: [0, 0, 3.4], fov: 43 }} gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }} fallback={<StaticMark />}>
      <ambientLight intensity={.8} /><directionalLight position={[2, 3, 5]} intensity={1.5} color="#e2d7fa" />
      <Trajectory scale={baseScale * userScale} paused={paused} speed={autoRotateSpeed} />
      <AsciiRenderer resolution={resolution} characters={characters} fgColor={fgColor} bgColor={bgColor} invert={invert} paused={paused} />
    </Canvas></SceneBoundary>}
  </div>
}

// Render a deterministic flat fallback first, including SSR and reduced-motion devices.
function useStaticMode(motionEnabled: boolean) {
  const [value, setValue] = useState<[boolean, boolean]>([true, false])
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      setValue([query.matches && !motionEnabled, true])
    }
    update(); query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [motionEnabled])
  return value
}
