import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { ACESFilmicToneMapping, Box3, Color, Group, MathUtils, Mesh, MeshStandardMaterial, Vector3 } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

const modelUrl = '/brand/omega/loading-ascii.glb'

interface SceneProps {
  reducedMotion: boolean
  onProgress: (fraction: number) => void
  onReady: () => void
  onFailure: () => void
}

function Logo({ reducedMotion, onProgress, onReady, onFailure }: SceneProps) {
  const gltf = useLoader(GLTFLoader, modelUrl, loader => loader.setMeshoptDecoder(MeshoptDecoder), event => {
    if (event.total > 0) onProgress(Math.min(1, event.loaded / event.total))
  })
  const group = useRef<Group>(null)
  const elapsed = useRef(0)
  const { gl, scene, camera, invalidate } = useThree()
  const model = useMemo(() => {
    const copy = gltf.scene.clone(true)
    copy.updateMatrixWorld(true)
    const bounds = new Box3().setFromObject(copy)
    const center = bounds.getCenter(new Vector3())
    const size = bounds.getSize(new Vector3())
    copy.position.sub(center)
    const normalized = new Group()
    normalized.add(copy)
    normalized.scale.setScalar(2 / Math.max(size.x, size.y, size.z))
    const tint = new Color('#b493ff')
    copy.traverse(object => {
      if (!(object instanceof Mesh)) return
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      const cloned = materials.map(material => {
        const result = material.clone()
        if (result instanceof MeshStandardMaterial) {
          result.color.lerp(tint, .28)
          result.emissiveIntensity = .85
          result.roughness = .72
          result.metalness = .08
        }
        return result
      })
      object.material = Array.isArray(object.material) ? cloned : cloned[0]
    })
    return normalized
  }, [gltf.scene])

  useEffect(() => {
    let active = true
    let frame = 0
    // Compile the actual scene before signaling readiness; download completion alone is insufficient.
    gl.compileAsync(scene, camera).then(() => {
      if (!active) return
      invalidate()
      frame = requestAnimationFrame(() => { if (active) onReady() })
    }).catch(() => { if (active) onFailure() })
    return () => { active = false; cancelAnimationFrame(frame) }
  }, [camera, gl, invalidate, onFailure, onReady, scene])

  useEffect(() => () => {
    // Geometry belongs to useLoader's cache; only cloned materials belong to this instance.
    model.traverse(object => {
      if (!(object instanceof Mesh)) return
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach(material => material.dispose())
    })
  }, [model])

  useFrame((state, delta) => {
    if (!group.current || reducedMotion || document.hidden) return
    const step = Math.min(delta, .05)
    elapsed.current += step
    const time = elapsed.current
    const turn = -.28 + Math.sin(time * .58) * .32 + time * .12
    group.current.rotation.y = MathUtils.damp(group.current.rotation.y, turn + state.pointer.x * .045, 5, step)
    group.current.rotation.x = MathUtils.damp(group.current.rotation.x, Math.sin(time * .7) * .035 - state.pointer.y * .035, 5, step)
    group.current.position.y = Math.sin(time * .9) * .022
  })

  return <group ref={group} rotation={[0, reducedMotion ? 0 : -.28, 0]}><primitive object={model} dispose={null} /></group>
}

function Visibility({ reducedMotion, onFailure }: Pick<SceneProps, 'reducedMotion' | 'onFailure'>) {
  const { gl, setFrameloop, invalidate } = useThree()
  useEffect(() => {
    const update = () => {
      setFrameloop(document.hidden || reducedMotion ? 'demand' : 'always')
      if (!document.hidden) invalidate()
    }
    const lost = (event: Event) => { event.preventDefault(); onFailure() }
    update()
    document.addEventListener('visibilitychange', update)
    gl.domElement.addEventListener('webglcontextlost', lost)
    return () => {
      document.removeEventListener('visibilitychange', update)
      gl.domElement.removeEventListener('webglcontextlost', lost)
    }
  }, [gl, invalidate, onFailure, reducedMotion, setFrameloop])
  return null
}

export default function OmegaGlbScene(props: SceneProps) {
  return <Canvas
    className="omega-loading-canvas"
    frameloop={props.reducedMotion ? 'demand' : 'always'}
    camera={{ position: [0, 0, 4.25], fov: 38, near: .1, far: 20 }}
    dpr={[1, 1.5]}
    gl={{ alpha: true, antialias: true, powerPreference: 'high-performance', toneMapping: ACESFilmicToneMapping }}
    fallback={null}
    onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); gl.toneMappingExposure = 1.15 }}
  >
    <ambientLight intensity={1.1} />
    <directionalLight position={[-3, 4, 5]} intensity={1.8} color="#ede6ff" />
    <directionalLight position={[3, -1, -2]} intensity={2.4} color="#9d76ef" />
    <Visibility reducedMotion={props.reducedMotion} onFailure={props.onFailure} />
    <Suspense fallback={null}><Logo {...props} /></Suspense>
  </Canvas>
}
