---
name: platform-optimizer
description: Audit and optimize the Cripto do Zero website for every platform - mobile, tablet, desktop, iOS Safari, Android Chrome, Firefox, low-end devices, slow networks, reduced-motion and keyboard/screen-reader users. Use when asked to make the site faster, more responsive, more accessible, or better on all devices.
---

# Platform Optimizer

Audit first, fix second, verify third. Never change brand look: follow `DESIGN.md` (charcoal + lavender, Outfit font, restrained motion, no new fonts/UI/animation dependencies). Copy goes through `translateUi` / the localization system.

## Scope
Vite + React 19 + Tailwind + framer-motion + GSAP. Public pages in `src/pages`, styles in `src/index.css` and `src/styles/*.css`, motion in `src/lib/landing-motion.ts`.

## Workflow
1. **Pick target** - one page/route per run (default: landing). Read its page file, CSS and any hooks it uses.
2. **Audit** - walk the checklist below, record findings as `file:line - problem - fix`, ranked by user impact. Do not edit yet.
3. **Fix** - smallest change per finding. Reuse existing utilities and tokens.
4. **Verify** - `npx tsc -p tsconfig.app.json --noEmit`, `npm run build`, then render at 375, 768, 1280 px (browser tool). If the browser pane is hidden, say so; do not claim visual verification.
5. **Report** - fixed / skipped / not verified, plainly.

## Checklist

### Performance (slow phones, 3G)
- Heavy things lazy: WebGL/3D hero, ASCII viewer, charts. Never mount them when `usePlatformEntryActive()` is true or off-screen.
- Pause rAF/WebGL/GSAP when the tab is hidden or the element leaves the viewport.
- Cap `devicePixelRatio` (<= 2) in canvas/WebGL; skip WebGL when `navigator.hardwareConcurrency <= 4` or `saveData` is on, fall back to a static image.
- Images: explicit `width`/`height`, `loading="lazy"` below fold, `decoding="async"`, modern formats; no layout shift.
- Animate only `transform`/`opacity`/`clip-path`; no layout properties. No `filter`/`backdrop-filter` on large animated areas.
- Check bundle: route-level `lazy()`, no whole-library imports, `vite build` chunk sizes.
- Core Web Vitals targets: LCP < 2.5s, CLS < 0.1, INP < 200ms.

### Responsive / touch
- No horizontal overflow at 320-1920 px. Test 375, 768, 1024, 1280.
- Touch targets >= 44px, no hover-only controls; gate hover effects with `@media (hover: hover)` and magnetic/pointer effects with `(pointer: fine)`.
- Use `dvh`/`svh`, not `vh`, for full-height mobile sections; respect `env(safe-area-inset-*)`.
- Inputs >= 16px font on iOS (prevents zoom); correct `inputmode`/`autocomplete`/`type`.
- `position: sticky` and `overflow-x: clip` parents behave on Safari.

### Browser / OS compatibility
- Safari/iOS: `-webkit-` prefixes where needed (`backdrop-filter`, `text-size-adjust`), no `100vh` bugs, `scrollIntoView` smooth fallback.
- Firefox: scrollbar styling via `scrollbar-width`; check `clip-path` and `text-wrap: balance` fallbacks.
- Windows high-contrast / `forced-colors`: borders and focus rings remain visible.
- Feature-detect (`CSS.supports`, `matchMedia`) instead of UA sniffing.

### Accessibility
- `prefers-reduced-motion`: all GSAP/framer/CSS loops off, content visible without animation.
- Visible `:focus-visible`, logical tab order, semantic heading order, labelled landmarks.
- Contrast AA (4.5:1 body, 3:1 large). No color-only meaning.
- Charts/SVG have `<title>`/`<desc>` or text equivalent.
- Content must not depend on JS animation to become visible (no stuck `opacity: 0`).

### Network / resilience
- Meaningful skeletons, error and empty states; no indefinite spinners.
- Fonts: bundled Outfit with `font-display: swap`, subset if possible.
- Service of third-party scripts deferred; none block first paint.

### SEO / sharing (all platforms)
- `PageMeta` title/description per route, canonical + `hreflang` per locale, OG/Twitter image, `theme-color`, manifest/icons for iOS & Android home screen.

## Rules
- Fix only what the audit proves; no speculative rewrites.
- Do not add dependencies, fonts, or a second design language.
- Do not touch payment, auth or Supabase code.
- Never claim "works on all platforms"; list what was actually tested.
