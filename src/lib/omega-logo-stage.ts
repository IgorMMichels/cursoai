import {
  ACESFilmicToneMapping, Color, DirectionalLight, DoubleSide, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry,
  PMREMGenerator, Scene, Vector2, WebGLRenderer, type Texture,
} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { createOmegaRig, type OmegaRig } from './omega-logo-rig'

// Palco three.js puro: carrega o GLB, ilumina com um "estúdio" procedural, aplica bloom e
// enquadra o logo no centro do anel da tela de loading (o canvas ocupa a tela inteira).
const FOV = 30
const BACKGROUND = 0x07060c

export interface StageState { speed: number; reveal: number; boost: number }
export interface StageOptions {
  url: string
  state: StageState
  frame?: () => DOMRect | null | undefined      // área (anel) onde o logo deve ficar centralizado
  onProgress?: (fraction: number) => void
  onReady: () => void
  onFailure: (reason: unknown) => void
}

// Ambiente de estúdio: painéis de luz que viram reflexos no corpo metálico enquanto ele gira.
function studioEnvironment(renderer: WebGLRenderer): Texture {
  const scene = new Scene()
  scene.background = new Color(0x050409)
  const geometry = new PlaneGeometry(1, 1)
  const materials: MeshBasicMaterial[] = []
  const panel = (w: number, h: number, color: string, intensity: number, x: number, y: number, z: number) => {
    const material = new MeshBasicMaterial({ color: new Color(color).multiplyScalar(intensity), side: DoubleSide })
    materials.push(material)
    const mesh = new Mesh(geometry, material)
    mesh.scale.set(w, h, 1); mesh.position.set(x, y, z); mesh.lookAt(0, 0, 0)
    scene.add(mesh)
  }
  panel(6, 1.2, '#ffffff', 1.8, 0, 5, 1.5)        // softbox superior
  panel(.6, 7, '#b197ff', 3.6, -5, .5, 1.5)      // faixa lilás à esquerda
  panel(.6, 7, '#6d5cff', 2.6, 5, .2, -1.5)        // faixa violeta à direita/trás
  panel(4, .35, '#efe6ff', 1.2, 0, -1.5, 5)        // luz de preenchimento frontal baixa
  panel(1.4, 1.4, '#ff9de2', .9, 3.5, 3, 3)      // toque rosado para variar o reflexo
  panel(6, 3.2, '#b9a4ff', .42, 0, 2.4, 6)        // softbox frontal larga: degradê na face quando encara a câmera
  const generator = new PMREMGenerator(renderer)
  const texture = generator.fromScene(scene, .02).texture
  generator.dispose(); geometry.dispose(); materials.forEach(m => m.dispose())
  return texture
}

export function createOmegaStage(canvas: HTMLCanvasElement, options: StageOptions) {
  let disposed = false
  let renderer: WebGLRenderer
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' })
  } catch (error) {
    options.onFailure(error)
    return { dispose() {} }
  }
  renderer.setClearColor(BACKGROUND, 1)
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05

  const scene = new Scene()
  scene.background = new Color(BACKGROUND)
  const environment = studioEnvironment(renderer)
  scene.environment = environment
  scene.environmentIntensity = 0
  const rim = new DirectionalLight(0x9c7bff, 0); rim.position.set(2.5, 1.5, -3)
  const key = new DirectionalLight(0xffffff, 0); key.position.set(-2, 3, 4)
  scene.add(rim, key)

  const camera = new PerspectiveCamera(FOV, 1, .1, 60)
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new Vector2(256, 256), .5, .35, .92)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())
  let useBloom = true

  let rig: OmegaRig | null = null
  let angle = -.35, clock = 0, last = performance.now(), raf = 0
  let baseDistance = 8
  const pointer = { x: 0, y: 0 }, tilt = { x: 0, y: 0 }
  const frameTimes: number[] = []

  const pixelRatio = () => Math.min(window.devicePixelRatio || 1, useBloom ? 1.5 : 1.25)
  const resize = () => {
    const width = canvas.clientWidth, height = canvas.clientHeight
    if (!width || !height) return
    renderer.setPixelRatio(pixelRatio())
    renderer.setSize(width, height, false)
    composer.setPixelRatio(pixelRatio())
    composer.setSize(width, height)
    // Enquadra o logo dentro do anel: altura do logo ≈ 56% do diâmetro, centro no centro do anel.
    const box = canvas.getBoundingClientRect()
    const target = options.frame?.()
    const ring = target && target.width > 0 ? target : null
    const cx = ring ? ring.left + ring.width / 2 - box.left : width / 2
    const cy = ring ? ring.top + ring.height / 2 - box.top : height / 2
    const logoPx = (ring ? ring.height : Math.min(width, height) * .5) * .56
    baseDistance = height / (Math.tan((FOV * Math.PI) / 360) * logoPx)
    camera.aspect = width / height
    camera.setViewOffset(width, height, width / 2 - cx, height / 2 - cy, width, height)
    camera.updateProjectionMatrix()
  }

  const draw = () => {
    if (!rig) return
    const { reveal, boost } = options.state
    tilt.x += (-pointer.y * .12 - tilt.x) * .05
    tilt.y += (pointer.x * .18 - tilt.y) * .05
    const lit = Math.min(1, Math.max(0, (reveal - .3) / .6))
    scene.environmentIntensity = lit * (.9 + boost * .6)
    key.intensity = lit * .6; rim.intensity = lit * 2.2
    bloom.strength = .5 + boost * .55
    const distance = baseDistance * (1 - boost * .16)
    camera.position.set(0, distance * .04, distance)
    camera.lookAt(0, 0, 0)
    rig.update({ time: clock, angle, tiltX: tilt.x + Math.sin(clock * .7) * .03, tiltY: tilt.y, reveal, boost, pixelRatio: renderer.getPixelRatio() })
    if (useBloom) composer.render(); else renderer.render(scene, camera)
  }
  const frame = (now: number) => {
    if (disposed) return
    const delta = now - last
    last = now
    if (!document.hidden && rig) {
      const step = Math.min(delta / 1000, .05)
      clock += step; angle += step * options.state.speed
      draw()
      // Guarda de performance: se a máquina não sustenta ~40 fps com bloom, desliga o bloom.
      if (useBloom && frameTimes.length < 50) {
        frameTimes.push(delta)
        if (frameTimes.length === 50) {
          const sorted = [...frameTimes].sort((a, b) => a - b)
          if (sorted[25] > 25) { useBloom = false; resize() }
        }
      }
    }
    raf = requestAnimationFrame(frame)
  }
  const onPointer = (event: PointerEvent) => { pointer.x = (event.clientX / window.innerWidth) * 2 - 1; pointer.y = -((event.clientY / window.innerHeight) * 2 - 1) }
  const onLost = (event: Event) => { event.preventDefault(); if (!disposed) options.onFailure(new Error('Contexto WebGL perdido')) }

  const observer = new ResizeObserver(resize)
  observer.observe(canvas)
  window.addEventListener('resize', resize)
  resize()
  canvas.addEventListener('webglcontextlost', onLost)
  window.addEventListener('pointermove', onPointer, { passive: true })

  new GLTFLoader().load(options.url, gltf => {
    if (disposed) return
    try {
      rig = createOmegaRig(gltf.scene)
      scene.add(rig.root)
      // Compila com tudo aceso para não engasgar quando o corpo acender.
      scene.environmentIntensity = 1; key.intensity = 1; rim.intensity = 1
      try { renderer.compile(scene, camera) } catch (error) { console.warn('[Omega loading] pré-compilação ignorada', error) }
      resize()
      draw()
      last = performance.now()
      raf = requestAnimationFrame(frame)
      requestAnimationFrame(() => { if (!disposed) options.onReady() })
    } catch (error) {
      options.onFailure(error)
    }
  }, event => { if (event.total > 0) options.onProgress?.(Math.min(1, event.loaded / event.total)) },
  error => { if (!disposed) options.onFailure(error) })

  return {
    dispose() {
      disposed = true
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('webglcontextlost', onLost)
      window.removeEventListener('pointermove', onPointer)
      rig?.dispose()
      environment.dispose()
      composer.dispose()
      renderer.dispose()
    },
  }
}
