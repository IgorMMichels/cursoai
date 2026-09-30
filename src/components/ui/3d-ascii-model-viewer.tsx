import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AsciiEffect } from 'three-stdlib'
import { CanvasTexture, SRGBColorSpace, type Group, type WebGLRenderer } from 'three'

interface ModelProps {
  scale: number
  rotation: [number, number, number]
  position: [number, number, number]
}

function BitcoinCoin({ scale, rotation, position, speed }: ModelProps & { speed: number }) {
  const coin = useRef<Group>(null)
  const symbolTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const context = canvas.getContext('2d')
    if (context) {
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.font = '700 178px "Segoe UI Symbol", "Arial Unicode MS", sans-serif'
      context.fillStyle = '#fff0c1'
      context.shadowColor = 'rgba(255, 213, 127, .38)'
      context.shadowBlur = 14
      context.fillText('₿', 128, 132)
    }
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    return texture
  }, [])

  useEffect(() => () => symbolTexture.dispose(), [symbolTexture])

  useFrame((state) => {
    if (!coin.current) return
    coin.current.rotation.x = rotation[0] + Math.sin(state.clock.elapsedTime * 0.55) * 0.035
    coin.current.rotation.y = rotation[1] + state.clock.elapsedTime * speed
    coin.current.rotation.z = rotation[2] + Math.sin(state.clock.elapsedTime * 0.7) * 0.045
    coin.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.15) * 0.045
  })

  return <group ref={coin} position={position} scale={scale}>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.79, 0.79, 0.135, 96]} />
      <meshStandardMaterial color="#d69a3b" metalness={0.78} roughness={0.28} />
    </mesh>
    <mesh position={[0, 0, 0.069]}>
      <circleGeometry args={[0.735, 96]} />
      <meshStandardMaterial color="#8e622a" metalness={0.68} roughness={0.35} />
    </mesh>
    <mesh position={[0, 0, -0.069]} rotation={[0, Math.PI, 0]}>
      <circleGeometry args={[0.735, 96]} />
      <meshStandardMaterial color="#8e622a" metalness={0.68} roughness={0.35} />
    </mesh>
    <mesh position={[0, 0, 0.073]}>
      <torusGeometry args={[0.685, 0.018, 12, 96]} />
      <meshStandardMaterial color="#f1c56e" metalness={0.84} roughness={0.22} />
    </mesh>
    <mesh position={[0, 0, -0.073]} rotation={[0, Math.PI, 0]}>
      <torusGeometry args={[0.685, 0.018, 12, 96]} />
      <meshStandardMaterial color="#f1c56e" metalness={0.84} roughness={0.22} />
    </mesh>
    <mesh position={[0, 0, 0.076]}>
      <torusGeometry args={[0.59, 0.008, 8, 96]} />
      <meshStandardMaterial color="#d9ad5c" metalness={0.76} roughness={0.28} />
    </mesh>
    <mesh position={[0, 0, -0.076]} rotation={[0, Math.PI, 0]}>
      <torusGeometry args={[0.59, 0.008, 8, 96]} />
      <meshStandardMaterial color="#d9ad5c" metalness={0.76} roughness={0.28} />
    </mesh>
    <mesh position={[0, 0, 0.08]}>
      <planeGeometry args={[1.13, 1.13]} />
      <meshBasicMaterial map={symbolTexture} transparent depthWrite={false} />
    </mesh>
    <mesh position={[0, 0, -0.08]} rotation={[0, Math.PI, 0]}>
      <planeGeometry args={[1.13, 1.13]} />
      <meshBasicMaterial map={symbolTexture} transparent depthWrite={false} />
    </mesh>
  </group>
}

function AsciiFallback({ onReady }: { onReady?: () => void }) {
  useEffect(() => onReady?.(), [onReady])
  const art = [
    '             .-==-.',
    '         .-+*#####*+-.',
    '       :+#%#########%#+:',
    '      +%###############+',
    '     *#######==#########*',
    '    +######  ₿  #########+',
    '    *####################*',
    '    *####################*',
    '    +###################+',
    '     *#################*',
    '      +%#############%+',
    '       :+#%#######%#+:',
    '         .-+*###*+-.',
    '             `--`',
  ].join('\n')
  return <div className="ascii-fallback" aria-label="Símbolo do Bitcoin em arte ASCII">
    <pre>{art}</pre>
  </div>
}

function attachAsciiEffect(effect: AsciiEffect, gl: WebGLRenderer, fgColor: string, bgColor: string) {
  effect.domElement.style.position = 'absolute'
  effect.domElement.style.inset = '0'
  effect.domElement.style.width = '100%'
  effect.domElement.style.height = '100%'
  effect.domElement.style.pointerEvents = 'none'
  effect.domElement.style.color = fgColor
  effect.domElement.style.backgroundColor = bgColor
  gl.domElement.style.opacity = '0'
  gl.domElement.parentNode?.appendChild(effect.domElement)
  return () => {
    gl.domElement.style.opacity = '1'
    effect.domElement.remove()
  }
}

function centerAsciiGrid(effect: AsciiEffect) {
  // AsciiEffect renders one fixed-width character row per canvas row. Center
  // each row so font metrics cannot leave the coin a few pixels off-center.
  effect.domElement.querySelector('table')?.style.setProperty('text-align', 'center', 'important')
}

function DemandFrameTicker({ fps = 24 }: { fps?: number }) {
  const invalidate = useThree((state) => state.invalidate)
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    let timer: number | undefined
    let stopped = false
    let inView = true

    const stop = () => {
      if (timer !== undefined) window.clearTimeout(timer)
      timer = undefined
    }

    const tick = () => {
      stop()
      if (stopped || document.hidden || !inView) return
      invalidate()
      timer = window.setTimeout(tick, 1000 / fps)
    }

    const observer = typeof IntersectionObserver === 'undefined'
      ? undefined
      : new IntersectionObserver(([entry]) => {
          inView = entry.isIntersecting
          if (inView) tick()
          else stop()
        })

    observer?.observe(gl.domElement)

    const onVisibilityChange = () => {
      if (document.hidden) stop()
      else tick()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    tick()

    return () => {
      stopped = true
      stop()
      observer?.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [fps, gl, invalidate])

  return null
}

function AsciiRenderer({
  resolution,
  characters,
  fgColor,
  bgColor,
  invert,
}: {
  resolution: number
  characters: string
  fgColor: string
  bgColor: string
  invert: boolean
}) {
  const { size, gl, scene, camera } = useThree()
  const effect = useMemo(() => new AsciiEffect(gl, characters, { invert, color: false, resolution }), [characters, gl, invert, resolution])

  useLayoutEffect(() => attachAsciiEffect(effect, gl, fgColor, bgColor), [bgColor, effect, fgColor, gl])

  useLayoutEffect(() => {
    effect.setSize(size.width, size.height)
    centerAsciiGrid(effect)
  }, [effect, size.height, size.width])

  useFrame(() => {
    effect.render(scene, camera)
  }, 1)

  return null
}

export interface AsciiModelViewerProps {
  baseScale?: number
  position?: [number, number, number]
  resolution?: number
  characters?: string
  userScale?: number
  fgColor?: string
  bgColor?: string
  invert?: boolean
  className?: string
  autoRotateSpeed?: number
  showLoadingOverlay?: boolean
}

export default function AsciiModelViewer({
  baseScale = 1,
  position = [0, -0.05, 0],
  resolution = 0.16,
  characters = ' .,:;irsXA253hMHGS#9B&@',
  userScale = 1,
  fgColor = '#c8b6ff',
  bgColor = 'rgba(9, 9, 13, 0.18)',
  invert = false,
  className = '',
  autoRotateSpeed = 0.48,
  showLoadingOverlay = true,
}: AsciiModelViewerProps) {
  const finalScale = baseScale * userScale
  const [canvasReady, setCanvasReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!canvasReady) return
    const timer = window.setTimeout(() => setIsLoading(false), 480)
    return () => window.clearTimeout(timer)
  }, [canvasReady])

  const handleCanvasReady = useCallback(() => {
    setProgress(100)
    setCanvasReady(true)
  }, [])

  return <div className={`ascii-viewer ${className}`}>
    <Canvas
      frameloop="demand"
      camera={{ position: [0, 0, 3.25], fov: 43 }}
      dpr={[1, 1.25]}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      fallback={<AsciiFallback onReady={handleCanvasReady} />}
      onCreated={handleCanvasReady}
    >
      <ambientLight intensity={1.4} />
      <directionalLight position={[3, 4, 5]} intensity={3.2} color="#fff0cf" />
      <pointLight position={[-3, -2, 3]} intensity={2.6} color="#a98aff" />
      <pointLight position={[2, 1, -3]} intensity={2} color="#68dff0" />
      <DemandFrameTicker fps={24} />
      <BitcoinCoin scale={finalScale} rotation={[0, 0, 0]} position={position} speed={autoRotateSpeed} />
      <AsciiRenderer
        resolution={resolution}
        characters={characters}
        fgColor={fgColor}
        bgColor={bgColor}
        invert={invert}
      />
    </Canvas>
    <AnimatePresence>
      {showLoadingOverlay && isLoading && <motion.div
        className="ascii-loader"
        role="status"
        aria-live="polite"
        initial={{ opacity: 0, scale: 1.015 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.99, filter: 'blur(4px)' }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="ascii-loader-mark"><span>₿</span><i /><i /><i /></div>
        <p>PREPARANDO VISUALIZAÇÃO</p>
        <div className="ascii-loader-track"><span style={{ width: `${Math.max(8, progress)}%` }} /></div>
      </motion.div>}
    </AnimatePresence>
  </div>
}
