import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Group, Mesh, MeshStandardMaterial,
  Object3D, PlaneGeometry, Points, ShaderMaterial, type Material,
} from 'three'

// Monta a cena do logo Omega 3D a partir do GLB: corpo de obsidiana, filete de luz animado,
// brilho de fundo e poeira de luz. Só depende do three.

export interface RigState { time: number; angle: number; tiltX: number; tiltY: number; reveal: number; boost: number; pixelRatio: number }
export interface OmegaRig { root: Group; update: (state: RigState) => void; dispose: () => void }

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }

const glowFragment = /* glsl */`
uniform float uTime, uReveal, uBoost;
varying vec2 vUv;
void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  float r = length(p * vec2(1.0, 1.25));
  float breathe = 0.92 + 0.08 * sin(uTime * 1.4);
  float core = exp(-r * r * 10.0) * 0.17 + exp(-r * r * 3.0) * 0.08;
  float a = core * breathe * (0.25 + 0.75 * smoothstep(0.0, 0.9, uReveal)) * (1.0 + uBoost * 1.2);
  gl_FragColor = vec4(vec3(0.34, 0.2, 0.7) * a, a);
}
`
const dustVertex = /* glsl */`
attribute float aSeed;
uniform float uTime, uPx, uReveal;
varying float vA;
void main() {
  vec3 p = position;
  p.y = mod(position.y + uTime * (0.05 + aSeed * 0.08) + 1.2, 4.4) - 1.2;
  p.x += sin(uTime * 0.3 + aSeed * 20.0) * 0.08;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (1.0 + aSeed * 2.6) * uPx * (6.0 / -mv.z);
  vA = (0.15 + 0.45 * aSeed) * (0.55 + 0.45 * sin(uTime * 1.7 + aSeed * 40.0)) * smoothstep(-1.2, -0.6, p.y) * smoothstep(3.2, 1.8, p.y) * smoothstep(0.2, 1.0, uReveal);
}
`
const dustFragment = /* glsl */`
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d) * vA;
  gl_FragColor = vec4(vec3(0.8, 0.7, 1.0) * a, a);
}
`

interface SeamUniforms { uTime: { value: number }; uGain: { value: number } }

// Filete de luz: um pulso percorre o contorno (uv.x vai de 0 a 1 ao longo do tubo).
function seamMaterial(source: MeshStandardMaterial) {
  const material = source.clone()
  material.toneMapped = false
  const uniforms: SeamUniforms = { uTime: { value: 0 }, uGain: { value: 1 } }
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vRun;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRun = uv.x;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vRun;\nuniform float uTime;\nuniform float uGain;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float head = fract(vRun - uTime * 0.16);
        float trail = smoothstep(0.0, 0.16, head) * (1.0 - smoothstep(0.16, 0.2, head));
        float head2 = fract(vRun + 0.5 - uTime * 0.16);
        float trail2 = smoothstep(0.0, 0.16, head2) * (1.0 - smoothstep(0.16, 0.2, head2));
        totalEmissiveRadiance *= uGain * (0.5 + 1.3 * max(trail, trail2));`)
  }
  material.customProgramCacheKey = () => 'omega-seam'
  return { material, uniforms }
}

export function createOmegaRig(source: Object3D): OmegaRig {
  const disposables: { dispose: () => void }[] = []
  const seamUniforms: SeamUniforms[] = []
  const seamGeometries: BufferGeometry[] = []
  const seamMaterials = new Map<Material, Material>()

  const model = source.clone(true)
  model.animations = []
  let seamEmissive = 2.4
  model.traverse(object => {
    const mesh = object as Mesh
    if (!mesh.isMesh) return
    if (mesh.name.startsWith('OmegaSeam')) {
      const original = mesh.material as MeshStandardMaterial
      let replacement = seamMaterials.get(original)
      if (!replacement) {
        const built = seamMaterial(original)
        seamEmissive = original.emissiveIntensity || 2.4
        replacement = built.material
        seamMaterials.set(original, replacement); seamUniforms.push(built.uniforms); disposables.push(replacement)
      }
      mesh.material = replacement
      if (!seamGeometries.includes(mesh.geometry)) seamGeometries.push(mesh.geometry)
    }
  })

  const front = new Group(); front.add(model)

  const glowGeometry = new PlaneGeometry(14, 14)
  const glowMaterial = new ShaderMaterial({
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: glowFragment, transparent: true, depthWrite: false, blending: AdditiveBlending, premultipliedAlpha: true,
    uniforms: { uTime: { value: 0 }, uReveal: { value: 0 }, uBoost: { value: 0 } },
  })
  const glow = new Mesh(glowGeometry, glowMaterial)
  glow.position.set(0, .1, -4); glow.renderOrder = -1

  const count = 160
  const positions = new Float32Array(count * 3), seeds = new Float32Array(count)
  for (let i = 0; i < count; i++) { positions.set([(Math.random() - .5) * 7, Math.random() * 4.4 - 1.2, (Math.random() - .5) * 4 - .5], i * 3); seeds[i] = Math.random() }
  const dustGeometry = new BufferGeometry()
  dustGeometry.setAttribute('position', new BufferAttribute(positions, 3))
  dustGeometry.setAttribute('aSeed', new BufferAttribute(seeds, 1))
  const dustMaterial = new ShaderMaterial({ vertexShader: dustVertex, fragmentShader: dustFragment, transparent: true, depthWrite: false, blending: AdditiveBlending, premultipliedAlpha: true, uniforms: { uTime: { value: 0 }, uPx: { value: 1 }, uReveal: { value: 0 } } })
  const dust = new Points(dustGeometry, dustMaterial)
  dust.frustumCulled = false; dust.renderOrder = 6

  const root = new Group()
  root.add(glow, front, dust)
  disposables.push(glowGeometry, glowMaterial, dustGeometry, dustMaterial)

  return {
    root,
    update({ time, angle, tiltX, tiltY, reveal, boost, pixelRatio }) {
      // Entrada: o filete desenha o contorno (0–55%), o logo gira até a pose e cresce levemente.
      const draw = smooth(0, .55, reveal)
      for (const geometry of seamGeometries) {
        const total = geometry.index ? geometry.index.count : geometry.attributes.position.count
        geometry.setDrawRange(0, Math.floor((total * draw) / 3) * 3)
      }
      const settle = 1 - Math.pow(1 - smooth(.15, 1, reveal), 3)
      const spin = angle - (1 - settle) * 2.2
      const scale = .9 + .1 * settle + boost * .08
      front.rotation.set(tiltX, spin + tiltY, 0); front.scale.setScalar(scale)
      for (const u of seamUniforms) { u.uTime.value = time; u.uGain.value = (seamEmissive / 2.4) * (1 + boost * 1.8) }
      glowMaterial.uniforms.uTime.value = time; glowMaterial.uniforms.uReveal.value = reveal; glowMaterial.uniforms.uBoost.value = boost
      dustMaterial.uniforms.uTime.value = time; dustMaterial.uniforms.uPx.value = pixelRatio; dustMaterial.uniforms.uReveal.value = reveal
    },
    dispose() { disposables.forEach(item => item.dispose()) },
  }
}
