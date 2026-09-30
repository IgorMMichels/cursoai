import { useEffect, useRef } from 'react'

const vertexSource = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`

const fragmentSource = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_drift;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float dividerX = 0.37 + uv.y * 0.12 + u_drift * 0.008;
  float distanceToDivider = abs(uv.x - dividerX);
  float line = 1.0 - smoothstep(0.001, 0.006, distanceToDivider);
  float halo = 1.0 - smoothstep(0.004, 0.18, distanceToDivider);
  vec2 bloomOffset = (uv - vec2(0.16, 0.54)) * vec2(1.2, 1.6);
  float bloom = 1.0 - smoothstep(0.05, 0.85, dot(bloomOffset, bloomOffset));
  vec3 glow = mix(vec3(0.60, 0.45, 0.92), vec3(0.30, 0.72, 0.76), uv.y);
  float alpha = clamp(line * 0.34 + halo * 0.075 + bloom * 0.11, 0.0, 0.28);
  gl_FragColor = vec4(glow * alpha, alpha);
}`

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader
  gl.deleteShader(shader)
  return null
}

export function AmbientShader({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas?.getContext('webgl', {
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    })
    if (!canvas || !gl) return

    const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource)
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
    if (!vertex || !fragment) {
      if (vertex) gl.deleteShader(vertex)
      if (fragment) gl.deleteShader(fragment)
      return
    }

    const program = gl.createProgram()
    if (!program) {
      gl.deleteShader(vertex)
      gl.deleteShader(fragment)
      return
    }

    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    gl.deleteShader(vertex)
    gl.deleteShader(fragment)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program)
      return
    }

    const buffer = gl.createBuffer()
    if (!buffer) {
      gl.deleteProgram(program)
      return
    }

    gl.useProgram(program)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
    const resolution = gl.getUniformLocation(program, 'u_resolution')
    const drift = gl.getUniformLocation(program, 'u_drift')
    gl.uniform2f(resolution, canvas.width, canvas.height)
    let animationFrame = 0
    let visible = true
    let lastFrame = 0

    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      const pixelBudget = 900_000
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.15, Math.sqrt(pixelBudget / Math.max(1, bounds.width * bounds.height)))
      const width = Math.max(1, Math.round(bounds.width * pixelRatio))
      const height = Math.max(1, Math.round(bounds.height * pixelRatio))
      if (canvas.width === width && canvas.height === height) return
      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)
      gl.uniform2f(resolution, width, height)
      if (!animationFrame && visible && !document.hidden) animationFrame = requestAnimationFrame(draw)
    }

    const draw = (timestamp: number) => {
      animationFrame = 0
      if (!visible || document.hidden) return
      if (timestamp - lastFrame >= 1000 / 20) {
        lastFrame = timestamp
        gl.uniform1f(drift, Math.sin(timestamp / 1000 * 0.16))
        gl.drawArrays(gl.TRIANGLES, 0, 6)
      }
      animationFrame = requestAnimationFrame(draw)
    }

    const start = () => {
      if (!animationFrame && visible && !document.hidden) animationFrame = requestAnimationFrame(draw)
    }
    const stop = () => {
      if (animationFrame) cancelAnimationFrame(animationFrame)
      animationFrame = 0
    }
    const intersection = typeof IntersectionObserver === 'undefined'
      ? undefined
      : new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting
          if (visible) start()
          else stop()
        }, { rootMargin: '0px' })
    const resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(resize)
    const onVisibility = () => document.hidden ? stop() : start()

    resize()
    intersection?.observe(canvas)
    resizeObserver?.observe(canvas)
    document.addEventListener('visibilitychange', onVisibility)
    start()

    return () => {
      stop()
      intersection?.disconnect()
      resizeObserver?.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
    }
  }, [])

  return <canvas ref={canvasRef} className={`ambient-shader ${className}`} aria-hidden="true" />
}
