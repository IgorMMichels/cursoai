// Gera public/brand/omega/omega-logo-3d.glb — o logo Omega como peça 3D de marca.
//   OmegaBody      : corpo extrudado do SVG oficial, bisel arredondado, normais suaves com vincos nos cantos
//                    (PBR metálico escuro + KHR_materials_clearcoat + KHR_materials_iridescence)
//   OmegaSeam_*    : filete de luz embutido que contorna o logo (frente e verso), com UV ao longo do
//                    comprimento para animar o fluxo de luz (KHR_materials_emissive_strength)
//   Animação "Spin": giro de 360° em loop no nó raiz (visualizadores tocam sozinhos)
// Uso: node scripts/build-omega-logo-glb.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const THREE = await import('three')
const { mergeGeometries, mergeVertices, toCreasedNormals } = await import('three/addons/utils/BufferGeometryUtils.js')
const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/brand/omega/omega-logo-3d.glb')

// Contornos de public/brand/omega/symbol-accent.svg (viewBox 240x220, comandos absolutos).
const PATHS = [
  'M39 136C29 121 24 106 24 88C24 42 62 8 110 8C160 8 198 43 198 90C198 120 186 145 167 165H220V204H126V157C145 145 157 125 157 101C157 70 137 48 110 48C82 48 62 70 62 101C62 109 64 116 67 123Z',
  'M16 165L148 86C112 113 89 139 78 161V204H16Z',
]
const DEPTH = 30            // espessura do miolo (sem bisel)
const BEVEL_T = 3.4         // profundidade do bisel
const BEVEL_S = 2.6         // largura do bisel
const BEVEL_OFFSET = -1.3   // metade do bisel para dentro: silhueta fiel ao SVG
const SEAM_INSET = 7.5      // distância do filete até a borda
const SEAM_RADIUS = 1.15

function parseShape(d) {
  const t = d.match(/[MLHVCZ]|-?\d*\.?\d+/g)
  const shape = new THREE.Shape()
  let x = 0, y = 0, cmd = null, i = 0
  const n = () => parseFloat(t[i++])
  while (i < t.length) {
    if (/[A-Z]/.test(t[i])) cmd = t[i++]
    if (cmd === 'M') { x = n(); y = n(); shape.moveTo(x, -y); cmd = 'L' }
    else if (cmd === 'L') { x = n(); y = n(); shape.lineTo(x, -y) }
    else if (cmd === 'H') { x = n(); shape.lineTo(x, -y) }
    else if (cmd === 'V') { y = n(); shape.lineTo(x, -y) }
    else if (cmd === 'C') { const a = n(), b = n(), c = n(), e = n(), f = n(), g = n(); shape.bezierCurveTo(a, -b, c, -e, f, -g); x = f; y = g }
    else if (cmd === 'Z') { shape.closePath(); cmd = null }
    else break
  }
  return shape
}
const shapes = PATHS.map(parseShape)
const polys = shapes.map(s => s.getPoints(64).map(p => [p.x, p.y]))

// ───────── Corpo ─────────
const parts = shapes.map(shape => {
  const g = new THREE.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: true, bevelThickness: BEVEL_T, bevelSize: BEVEL_S, bevelOffset: BEVEL_OFFSET, bevelSegments: 6, curveSegments: 36, steps: 1 })
  g.translate(0, 0, -DEPTH / 2)
  g.deleteAttribute('uv')
  return g
})
// Normais suaves nas curvas e no bisel, vinco nítido nos cantos retos (> 40°).
const body = mergeVertices(toCreasedNormals(mergeGeometries(parts), (40 * Math.PI) / 180), 1e-4)

// ───────── Filete de luz: contorno interno via campo de distância + marching squares ─────────
function inside(px, py, poly) {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}
function distToPoly(px, py, poly) {
  let best = Infinity
  for (let i = 0; i < poly.length; i++) {
    const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % poly.length]
    const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy || 1
    const k = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l))
    const ex = px - (ax + k * dx), ey = py - (ay + k * dy)
    const d = ex * ex + ey * ey
    if (d < best) best = d
  }
  return Math.sqrt(best)
}
const STEP = .5, X0 = 8, Y0 = -212, NX = Math.ceil((232 - X0) / STEP) + 1, NY = Math.ceil((0 - Y0) / STEP) + 1
const field = new Float32Array(NX * NY)
for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
  const x = X0 + i * STEP, y = Y0 + j * STEP
  const ins = polys.some(p => inside(x, y, p))
  const d = Math.min(...polys.map(p => distToPoly(x, y, p)))
  field[j * NX + i] = ins ? -d : d
}
const ISO = -SEAM_INSET
const at = (i, j) => field[j * NX + i]
const pointOn = key => {
  const [kind, a, b] = key.split(':'); const i = +a, j = +b
  const [i2, j2] = kind === 'h' ? [i + 1, j] : [i, j + 1]
  const v1 = at(i, j), v2 = at(i2, j2), t = (ISO - v1) / (v2 - v1)
  return [X0 + (i + (i2 - i) * t) * STEP, Y0 + (j + (j2 - j) * t) * STEP]
}
const links = new Map()
const link = (a, b) => { (links.get(a) ?? links.set(a, []).get(a)).push(b); (links.get(b) ?? links.set(b, []).get(b)).push(a) }
for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX - 1; i++) {
  const v = [at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)]
  const c = (v[0] < ISO ? 1 : 0) | (v[1] < ISO ? 2 : 0) | (v[2] < ISO ? 4 : 0) | (v[3] < ISO ? 8 : 0)
  if (c === 0 || c === 15) continue
  const e = [`h:${i}:${j}`, `v:${i + 1}:${j}`, `h:${i}:${j + 1}`, `v:${i}:${j}`]   // baixo, direita, cima, esquerda
  const center = (v[0] + v[1] + v[2] + v[3]) / 4 < ISO
  const table = { 1: [[3, 0]], 2: [[0, 1]], 3: [[3, 1]], 4: [[1, 2]], 6: [[0, 2]], 7: [[3, 2]], 8: [[2, 3]], 9: [[0, 2]], 11: [[1, 2]], 12: [[1, 3]], 13: [[0, 1]], 14: [[3, 0]],
    5: center ? [[3, 2], [1, 0]] : [[3, 0], [1, 2]], 10: center ? [[0, 3], [2, 1]] : [[0, 1], [2, 3]] }
  for (const [a, b] of table[c]) link(e[a], e[b])
}
const visited = new Set(), loops = []
for (const start of links.keys()) {
  if (visited.has(start)) continue
  const loop = []; let prev = null, cur = start
  while (cur && !visited.has(cur)) {
    visited.add(cur); loop.push(pointOn(cur))
    const next = (links.get(cur) || []).find(k => k !== prev && !visited.has(k))
    prev = cur; cur = next
  }
  let len = 0
  for (let k = 0; k < loop.length; k++) { const a = loop[k], b = loop[(k + 1) % loop.length]; len += Math.hypot(b[0] - a[0], b[1] - a[1]) }
  if (len > 40) loops.push(loop)
}
const frontZ = DEPTH / 2 + BEVEL_T - SEAM_RADIUS * .35
const seams = []
for (const loop of loops) {
  // reamostra a cada ~1.6 un. e suaviza (Chaikin) para tirar o serrilhado do grid
  let pts = loop.filter((_, k) => k % 3 === 0)
  for (let it = 0; it < 2; it++) {
    const next = []
    for (let k = 0; k < pts.length; k++) { const a = pts[k], b = pts[(k + 1) % pts.length]; next.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]) }
    pts = next
  }
  for (const z of [frontZ, -frontZ]) {
    const curve = new THREE.CatmullRomCurve3(pts.map(([x, y]) => new THREE.Vector3(x, y, z)), true, 'centripetal')
    const length = curve.getLength()
    const tube = new THREE.TubeGeometry(curve, Math.max(64, Math.round(length / 2.4)), SEAM_RADIUS, 6, true)
    seams.push(tube)
  }
}

// ───────── Normalização (centro + ~2 unidades) ─────────
const bp = body.attributes.position.array
let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9
for (let i = 0; i < bp.length; i += 3) { minX = Math.min(minX, bp[i]); maxX = Math.max(maxX, bp[i]); minY = Math.min(minY, bp[i + 1]); maxY = Math.max(maxY, bp[i + 1]) }
const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, S = 2 / Math.max(maxX - minX, maxY - minY)
const norm = a => { for (let i = 0; i < a.length; i += 3) { a[i] = (a[i] - cx) * S; a[i + 1] = (a[i + 1] - cy) * S; a[i + 2] *= S } }

// ───────── Escritor GLB ─────────
const chunks = [], views = [], accessors = []
let offset = 0
function view(typed, target) {
  const buf = Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength)
  const pad = (4 - (buf.length % 4)) % 4
  views.push({ buffer: 0, byteOffset: offset, byteLength: buf.length, ...(target ? { target } : {}) })
  chunks.push(buf, Buffer.alloc(pad)); offset += buf.length + pad
  return views.length - 1
}
function accessor(bufferView, componentType, count, type, extra = {}) { accessors.push({ bufferView, componentType, count, type, ...extra }); return accessors.length - 1 }
const bounds = a => { const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (let i = 0; i < a.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], a[i + k]); mx[k] = Math.max(mx[k], a[i + k]) } return { min: mn, max: mx } }
function primitive(geometry, material, withUv) {
  const pos = new Float32Array(geometry.attributes.position.array); norm(pos)
  const nor = new Float32Array(geometry.attributes.normal.array)
  const count = pos.length / 3
  const idxSrc = geometry.index.array
  const idx = count > 65535 ? new Uint32Array(idxSrc) : new Uint16Array(idxSrc)
  const attributes = {
    POSITION: accessor(view(pos, 34962), 5126, count, 'VEC3', bounds(pos)),
    NORMAL: accessor(view(nor, 34962), 5126, count, 'VEC3'),
  }
  if (withUv) attributes.TEXCOORD_0 = accessor(view(new Float32Array(geometry.attributes.uv.array), 34962), 5126, count, 'VEC2')
  return { attributes, indices: accessor(view(idx, 34963), idx instanceof Uint32Array ? 5125 : 5123, idx.length, 'SCALAR'), material, mode: 4 }
}
const meshes = [{ name: 'OmegaBody', primitives: [primitive(body, 0, false)] }]
seams.forEach((tube, k) => meshes.push({ name: `OmegaSeam_${k}`, primitives: [primitive(tube, 1, true)] }))
const nodes = [{ name: 'OmegaLogo3D', children: meshes.map((_, k) => k + 1) }, ...meshes.map((m, k) => ({ name: m.name, mesh: k }))]

const times = new Float32Array([0, 3, 6, 9, 12])
const rot = new Float32Array([0, 0, 0, 1, 0, Math.SQRT1_2, 0, Math.SQRT1_2, 0, 1, 0, 0, 0, Math.SQRT1_2, 0, -Math.SQRT1_2, 0, 0, 0, -1])
const aTime = accessor(view(times), 5126, 5, 'SCALAR', { min: [0], max: [12] })
const aRot = accessor(view(rot), 5126, 5, 'VEC4')

const json = {
  asset: { version: '2.0', generator: 'scripts/build-omega-logo-glb.mjs' },
  extensionsUsed: ['KHR_materials_clearcoat', 'KHR_materials_iridescence', 'KHR_materials_emissive_strength'],
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes, meshes,
  materials: [
    { name: 'OmegaObsidian', pbrMetallicRoughness: { baseColorFactor: [.05, .04, .1, 1], metallicFactor: 1, roughnessFactor: .17 },
      extensions: { KHR_materials_clearcoat: { clearcoatFactor: 1, clearcoatRoughnessFactor: .07 }, KHR_materials_iridescence: { iridescenceFactor: .35, iridescenceIor: 1.3, iridescenceThicknessMinimum: 200, iridescenceThicknessMaximum: 520 } } },
    { name: 'OmegaLightSeam', pbrMetallicRoughness: { baseColorFactor: [.82, .72, 1, 1], metallicFactor: 0, roughnessFactor: .35 }, emissiveFactor: [.66, .5, 1],
      extensions: { KHR_materials_emissive_strength: { emissiveStrength: 2.4 } } },
  ],
  animations: [{ name: 'Spin', samplers: [{ input: aTime, output: aRot, interpolation: 'LINEAR' }], channels: [{ sampler: 0, target: { node: 0, path: 'rotation' } }] }],
  accessors, bufferViews: views,
  buffers: [{ byteLength: offset }],
}
const jsonBuf = Buffer.from(JSON.stringify(json)); const jsonPad = Buffer.alloc((4 - (jsonBuf.length % 4)) % 4, 0x20)
const bin = Buffer.concat(chunks)
const total = 12 + 8 + jsonBuf.length + jsonPad.length + 8 + bin.length
const header = Buffer.alloc(12); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(total, 8)
const h1 = Buffer.alloc(8); h1.writeUInt32LE(jsonBuf.length + jsonPad.length, 0); h1.writeUInt32LE(0x4e4f534a, 4)
const h2 = Buffer.alloc(8); h2.writeUInt32LE(bin.length, 0); h2.writeUInt32LE(0x004e4942, 4)
fs.writeFileSync(out, Buffer.concat([header, h1, jsonBuf, jsonPad, h2, bin]))
console.log(`ok: corpo ${body.attributes.position.count} vértices, ${loops.length} contornos de luz (${seams.length} tubos), ${(total / 1024).toFixed(0)} KB -> ${path.relative(process.cwd(), out)}`)
