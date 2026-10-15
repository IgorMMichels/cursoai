import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { RefObject } from 'react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const EASE_OUT = 'expo.out'

/**
 * Landing-page choreography. Everything is scoped to `root`, skipped for
 * reduced-motion users, and only touches transform/opacity/clip-path/stroke.
 * Elements already driven by framer-motion are intentionally left alone.
 */
export function useLandingMotion(root: RefObject<HTMLElement | null>) {
  useGSAP(() => {
    const scope = root.current
    if (!scope) return
    const q = <T extends Element = HTMLElement>(selector: string) => gsap.utils.toArray<T>(selector, scope)
    const mm = gsap.matchMedia()

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // 1. Scroll progress hairline
      const bar = scope.querySelector<HTMLElement>('[data-scroll-progress]')
      if (bar) {
        gsap.fromTo(bar, { scaleX: 0 }, {
          scaleX: 1, ease: 'none', transformOrigin: '0 50%',
          scrollTrigger: { trigger: document.documentElement, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
        })
      }

      // 2. Hero headline: masked line reveal
      const title = scope.querySelector<HTMLElement>('[data-hero-title]')
      if (title) {
        const line2 = title.querySelector<HTMLElement>('span')
        const tl = gsap.timeline({ defaults: { ease: EASE_OUT, duration: 1.1 } })
        tl.fromTo(title, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 -12% 0)', duration: 0.9 }, 0.1)
          .fromTo(title, { yPercent: 28 }, { yPercent: 0 }, 0.1)
        if (line2) tl.fromTo(line2, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1 }, 0.3)
      }

      // 3. Hero visual drifts slower than the page
      const visual = scope.querySelector<HTMLElement>('[data-hero-visual]')
      if (visual) {
        gsap.to(visual, {
          yPercent: -6, ease: 'none',
          scrollTrigger: { trigger: visual, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
        })
      }

      // 4. Stat count-up (final value is always restored, so locale text is never lost)
      q('[data-count]').forEach((el) => {
        const final = el.textContent ?? ''
        const target = Number(el.dataset.count)
        if (!Number.isFinite(target) || target <= 0) return
        const state = { value: 0 }
        gsap.to(state, {
          value: target, duration: 1.6, ease: 'power3.out', snap: { value: 1 },
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          onUpdate: () => { el.textContent = String(state.value) },
          onComplete: () => { el.textContent = final },
        })
      })

      // 5. Section headings: rise out of a mask
      q('[data-reveal-heading]').forEach((heading) => {
        gsap.fromTo(heading, { clipPath: 'inset(0 0 100% 0)', yPercent: 24 }, {
          clipPath: 'inset(0 0 -10% 0)', yPercent: 0, duration: 1, ease: EASE_OUT,
          scrollTrigger: { trigger: heading, start: 'top 88%', once: true },
        })
      })

      // 6. Method steps + feature rows: staggered batch entrance
      const batchIn = (selector: string, x = 0) => {
        const items = q(selector)
        if (!items.length) return
        gsap.set(items, { opacity: 0, y: 28, x })
        ScrollTrigger.batch(items, {
          start: 'top 90%', once: true,
          onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, x: 0, duration: 0.9, ease: EASE_OUT, stagger: 0.12, overwrite: true }),
        })
      }
      batchIn('.learning-method-step', -16)
      batchIn('.omega-feature')
      batchIn('.practice-card')
      batchIn('.pricing-card')

      // 7. Learning map: line is drawn by scroll, nodes pop as it passes
      const line = scope.querySelector<SVGPathElement>('.learning-map .learning-chart-line')
      const fill = scope.querySelector<SVGPathElement>('.learning-map .learning-chart-fill')
      const nodes = q<SVGCircleElement>('.learning-map .learning-chart-node')
      const labels = q('.learning-map-labels span')
      if (line) {
        const length = line.getTotalLength()
        gsap.set(line, { strokeDasharray: length, strokeDashoffset: length })
        if (fill) gsap.set(fill, { opacity: 0 })
        gsap.set(nodes, { scale: 0, opacity: 0 })
        gsap.set(labels, { opacity: 0.35 })
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: line, start: 'top 85%', end: 'bottom 45%', scrub: 0.7 },
        })
        tl.to(line, { strokeDashoffset: 0, duration: 1 }, 0)
        if (fill) tl.to(fill, { opacity: 1, duration: 0.4 }, 0.6)
        nodes.forEach((node, i) => {
          const at = (i / Math.max(nodes.length - 1, 1)) * 0.92
          tl.to(node, { scale: 1, opacity: 1, duration: 0.08, ease: 'back.out(3)' }, at)
          if (labels[i]) tl.to(labels[i], { opacity: 1, duration: 0.08 }, at)
        })
      }

      // 8. Magnetic primary CTA (fine pointers only)
      const cta = scope.querySelector<HTMLElement>('[data-magnetic]')
      if (cta && window.matchMedia('(pointer: fine)').matches) {
        const moveX = gsap.quickTo(cta, 'x', { duration: 0.5, ease: 'power3' })
        const moveY = gsap.quickTo(cta, 'y', { duration: 0.5, ease: 'power3' })
        const onMove = (event: PointerEvent) => {
          const r = cta.getBoundingClientRect()
          moveX((event.clientX - (r.left + r.width / 2)) * 0.22)
          moveY((event.clientY - (r.top + r.height / 2)) * 0.32)
        }
        const onLeave = () => { moveX(0); moveY(0) }
        cta.addEventListener('pointermove', onMove)
        cta.addEventListener('pointerleave', onLeave)
        return () => {
          cta.removeEventListener('pointermove', onMove)
          cta.removeEventListener('pointerleave', onLeave)
        }
      }
    })

    // Lazy sections and the course outline change page height after mount.
    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh)
    const settle = window.setTimeout(refresh, 1200)
    return () => {
      mm.revert()
      window.removeEventListener('load', refresh)
      window.clearTimeout(settle)
    }
  }, { scope: root })
}
