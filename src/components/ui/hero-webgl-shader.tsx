import { useEffect, useRef } from 'react'

const vertexSource = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`

const fragmentSource = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 centered = uv - 0.5;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  centered.x *= aspect;

  vec2 m = u_mouse;

  // Posições das luzes: deriva lenta + deslocamento do mouse (parallax)
  vec2 violetPos = vec2(-0.32 + m.x * 0.55 + sin(u_time * 0.18) * 0.07, 0.22 + m.y * 0.38 + cos(u_time * 0.13) * 0.05);
  vec2 tealPos = vec2(0.34 + m.x * -0.42 + cos(u_time * 0.15) * 0.06, -0.10 + m.y * 0.30 + sin(u_time * 0.19) * 0.05);
  vec2 emberPos = vec2(0.02 + m.x * 0.22 + sin(u_time * 0.11 + 1.7) * 0.05, -0.34 + m.y * 0.18);

  float d1 = length(centered - violetPos);
  float d2 = length(centered - tealPos);
  float d3 = length(centered - emberPos);

  float glow1 = exp(-d1 * d1 * 3.4);
  float glow2 = exp(-d2 * d2 * 4.6);
  float glow3 = exp(-d3 * d3 * 6.0);

  vec3 base = vec3(0.035, 0.035, 0.052);
  vec3 violet = vec3(0.653, 0.545, 0.980);
  vec3 teal = vec3(0.404, 0.875, 0.953);
  vec3 ember = vec3(0.898, 0.737, 0.463);

  // Linha divisória sutil herdada do AmbientShader (ancora editorial à esquerda)
  float dividerX = 0.37 + uv.y * 0.10 + m.x * 0.02;
  float distDiv = abs(uv.x - dividerX);
  float line = 1.0 - smoothstep(0.001, 0.005, distDiv);
  float halo = 1.0 - smoothstep(0.004, 0.16, distDiv);

  vec3 col = base;
  col += violet * glow1 * 0.34;
  col += teal * glow2 * 0.20;
  col += ember * glow3 * 0.10;
  col += mix(violet, teal, uv.y) * (line * 0.10 + halo * 0.045);

  // Vinheta para ancorar o texto (escurece bordas, preserva legibilidade)
  float vig = smoothstep(1.15, 0.35, length(centered * vec2(0.85, 1.0)));
  col *= mix(0.72, 1.0, vig);

  // Fade superior para fundir com o header
  col *= mix(0.55, 1.0, smoothstep(1.0, 0.72, uv.y));

  // Grain fino
  float grain = hash(uv * u_resolution * 0.35 + fract(u_time) * 7.13) - 0.5;
  col += grain * 0.028;

  gl_FragColor = vec4(col, 1.0);
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

export default function HeroWebGLShader({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches
    const smallScreen = window.innerWidth < 768
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    const lowEnd = Boolean(connection?.saveData) || (navigator.hardwareConcurrency || 8) <= 4
    const staticMode = prefersReduced || coarsePointer || smallScreen || lowEnd

    const gl = canvas.getContext('webgl', {
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    })
    if (!gl) return

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
    const timeLoc = gl.getUniformLocation(program, 'u_time')
    const mouseLoc = gl.getUniformLocation(program, 'u_mouse')

    const target = { x: 0, y: 0 }
    const smooth = { x: 0, y: 0 }

    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      if (bounds.width === 0 || bounds.height === 0) return
      const pixelBudget = staticMode ? 500_000 : 850_000
      const pixelRatio = Math.min(
        window.devicePixelRatio || 1,
        staticMode ? 1 : 1.2,
        Math.sqrt(pixelBudget / Math.max(1, bounds.width * bounds.height)),
      )
      const width = Math.max(1, Math.round(bounds.width * pixelRatio))
      const height = Math.max(1, Math.round(bounds.height * pixelRatio))
      if (canvas.width === width && canvas.height === height) return
      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)
      gl.uniform2f(resolution, width, height)
    }
    resize()

    const renderFrame = (time: number, mx: number, my: number) => {
      gl.uniform1f(timeLoc, time)
      gl.uniform2f(mouseLoc, mx, my)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    // Frame estático inicial (também é o fallback para mobile / reduced-motion)
    renderFrame(1.4, 0, 0)
    if (staticMode) {
      const onResize = () => {
        resize()
        renderFrame(1.4, 0, 0)
      }
      window.addEventListener('resize', onResize)
      return () => {
        window.removeEventListener('resize', onResize)
        gl.deleteBuffer(buffer)
        gl.deleteProgram(program)
      }
    }

    let animationFrame = 0
    let visible = true
    let lastFrame = 0
    const startTime = performance.now()

    const onPointerMove = (event: PointerEvent) => {
      const section = canvas.closest('section')
      const bounds = (section ?? canvas).getBoundingClientRect()
      const nx = (event.clientX - bounds.left) / Math.max(1, bounds.width) - 0.5
      const ny = 0.5 - (event.clientY - bounds.top) / Math.max(1, bounds.height)
      target.x = Math.max(-0.5, Math.min(0.5, nx))
      target.y = Math.max(-0.5, Math.min(0.5, ny))
    }

    const draw = (timestamp: number) => {
      animationFrame = 0
      if (!visible || document.hidden) return
      if (timestamp - lastFrame >= 1000 / 30) {
        lastFrame = timestamp
        // Suavização exponencial: o fundo "persegue" o mouse sem tremer
        smooth.x += (target.x - smooth.x) * 0.06
        smooth.y += (target.y - smooth.y) * 0.06
        const elapsed = (timestamp - startTime) / 1000
        renderFrame(elapsed, smooth.x, smooth.y)
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

    const section = canvas.closest('section')
    const listenTarget = section ?? window
    listenTarget.addEventListener('pointermove', onPointerMove as EventListener, { passive: true })

    const intersection =
      typeof IntersectionObserver === 'undefined'
        ? undefined
        : new IntersectionObserver(
            ([entry]) => {
              visible = entry.isIntersecting
              if (visible) start()
              else stop()
            },
            { rootMargin: '80px' },
          )
    const resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(resize)
    const onVisibility = () => (document.hidden ? stop() : start())

    intersection?.observe(canvas)
    resizeObserver?.observe(canvas)
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)
    start()

    return () => {
      stop()
      listenTarget.removeEventListener('pointermove', onPointerMove as EventListener)
      intersection?.disconnect()
      resizeObserver?.disconnect()
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`hero-webgl-shader ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
        background:
          'radial-gradient(ellipse 60% 50% at 30% 40%, rgba(167,139,250,.14), transparent 65%), radial-gradient(ellipse 45% 40% at 72% 62%, rgba(103,223,243,.08), transparent 60%), #09090d',
      }}
    />
  )
}
