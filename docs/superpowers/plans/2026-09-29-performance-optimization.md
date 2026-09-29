# Performance Optimization Implementation Plan

> **For agentic workers:** User requested implementation in this session; use native execution and verify each task before committing.

**Goal:** Reduce initial route JavaScript and GPU work while preserving site motion and the rotating ASCII Bitcoin visual.

**Architecture:** Keep page-level route splitting, move course-only shell off the entry path, and replace root-level Framer Motion wrappers with CSS transitions. Cap WebGL pixel ratio to reduce raster work on high-density displays. Preserve route behavior, animation timing, and the shared ASCII viewer.

**Tech Stack:** React 19, TypeScript, Vite 8, React Router, CSS, React Three Fiber, Drei.

**Spec:** User request on 2026-09-29: plan and implement application optimization, then split changes into Git commits and send them to GitHub.

## Global Constraints

- Preserve course, landing, authentication, and role-gated route behavior.
- Preserve motion and transition effects; move root-only transitions to CSS rather than removing them.
- Keep 3D ASCII viewer lazy-loaded and readable on mobile.
- Split commits by audio, visual redesign, and performance optimization.

## Review Focus

- Landing visit before/after session loader: retain 100% progress and rotating Bitcoin ASCII.
- Course route: defer course shell until route load without breaking nested routes.
- High-DPI display: clamp renderer resolution without clipping ASCII output.
- Reduced or unsupported WebGL: retain Canvas ASCII fallback and entry-screen completion.
- Route transitions: retain opacity and vertical entrance without loading Framer Motion in app shell.

---

### Task 1: Defer Course Shell and Remove Root Motion Dependency

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/app-utilities.tsx`
- Modify: `src/index.css`
- Modify: `package.json` and lockfile only if `motion` is confirmed unused

**Interfaces:** Keep existing React Router paths and `PlatformEntryAnimation` props. Use CSS keyframes for route and loader entrance/exit; keep loading progress animation.

- [x] Replace root `motion.div` route wrapper with keyed `.route-enter` CSS animation using opacity and transform only.
- [x] Replace loader `motion.div` and animated fill with CSS animation and width transition; retain exit fade using a timed closing class.
- [x] Lazy-load `CourseLayout` through same dynamic page pattern as other route components.
- [x] Confirm `motion` is used by `ReviewsSection`; retain dependency and keep it confined to the lazy landing route.
- [x] Run `npm run build`; compare `dist/assets/index-*.js` gzip size with 161.08 kB baseline and confirm all routes compile.

### Task 2: Reduce ASCII Viewer GPU Work

**Files:**
- Modify: `src/components/ui/3d-ascii-model-viewer.tsx`
- Modify: `src/components/app-utilities.tsx`
- Modify: `src/App.tsx`
- Modify: `src/pages/landing-page.tsx`
- Create: `src/contexts/platform-entry-context.tsx`

**Interfaces:** Keep viewer props and auto-rotation behavior. Preserve fallback rendering and `onReady` completion contract.

- [x] Cap Fiber `dpr` maximum from `1.5` to `1.25`; keep minimum `1`.
- [x] Share entry-animation state with landing page; skip hidden hero Canvas while full-screen viewer is active, preventing two simultaneous WebGL render loops.
- [x] Verify loader and landing both pass the same viewer defaults and Canvas fallback still reports ready.
- [x] Run `npm run build` and `npm run lint`; review resulting chunk sizes and warnings.

### Task 3: Split and Publish Commits

**Files:** Existing changed files grouped by responsibility.

- [ ] Commit lesson narration/transcript changes separately from visual layout/ASCII loader changes.
- [x] Commit lesson narration/transcript changes separately from visual layout/ASCII loader changes.
- [x] Commit performance work separately after Tasks 1–2.
- [x] Inspect staged diff for generated secrets, unrelated edits, or deleted user assets.
- [x] Push commits to configured `origin` branch `main` and report commit IDs and push result.

Review fix: route loader now uses guarded session-storage helpers for read and write, so restricted storage cannot strand the loader.

## Baseline (2026-09-29)

- `npm run build` passes; entry JS: 487.29 kB raw / 161.08 kB gzip.
- ASCII viewer chunk: 1,056.23 kB raw / 287.34 kB gzip, loaded lazily.
- Admin page chunk: 366.62 kB raw / 106.36 kB gzip, route already lazy-loaded.
- Routes are lazy-loaded; `CourseLayout` and Framer Motion route/loader wrappers are imported from app shell.
- `npm run lint` exits successfully with existing React purity, hooks, and fast-refresh warnings.
- After optimization: entry JS is 421.06 kB raw / 137.30 kB gzip; lazy course shell is 5.23 kB raw / 1.98 kB gzip.
- ASCII viewer remains lazy at 1,060.37 kB raw / 289.26 kB gzip. Canvas max DPR now 1.25, reducing maximum pixel area about 31% versus 1.5 DPR.

## Execution Rulings

- Ruling: Retain direct `motion` dependency — `src/components/ui/reviews-section.tsx` imports `motion/react`; removing it breaks TypeScript build — cost if wrong: unused dependency remains installed.
