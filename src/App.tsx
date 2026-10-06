import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { SessionProvider, useSession } from '@/contexts/session-context'
import { RequireAffiliate, RequireAuth, RequireCourseAccess, RequireRole } from '@/components/guards'
import { ReferralTracker, PlatformEntryAnimation } from '@/components/app-utilities'
import { PlatformEntryContext, shouldShowPlatformEntry } from '@/contexts/platform-entry-context'
import { PriceTicker } from '@/components/price-ticker'
import { LocalizationProvider, useLocalization } from '@/contexts/localization-context'
import { localeFromPath, localizedPath, normalizePathname, unlocalizedPath } from '@/lib/localization'

const LandingPage = lazy(() => import('@/pages/landing-page').then((module) => ({ default: module.LandingPage })))
const LoginPage = lazy(() => import('@/pages/login-page').then((module) => ({ default: module.LoginPage })))
const CourseDashboard = lazy(() => import('@/pages/course-dashboard').then((module) => ({ default: module.CourseDashboard })))
const CourseAccessPage = lazy(() => import('@/components/wallet-guides').then((module) => ({ default: module.CourseAccessPage })))
const ExtraAudioPage = lazy(() => import('@/pages/extra-audio-page').then((module) => ({ default: module.ExtraAudioPage })))
const LessonPage = lazy(() => import('@/pages/lesson-page').then((module) => ({ default: module.LessonPage })))
const ModuleQuizPage = lazy(() => import('@/pages/module-quiz-page').then((module) => ({ default: module.ModuleQuizPage })))
const SecurityPage = lazy(() => import('@/pages/security-page').then((module) => ({ default: module.SecurityPage })))
const CertificatePage = lazy(() => import('@/pages/certificate-page').then((module) => ({ default: module.CertificatePage })))
const AdminPage = lazy(() => import('@/pages/admin-page').then((module) => ({ default: module.AdminPage })))
const AffiliatePage = lazy(() => import('@/pages/affiliate-page').then((module) => ({ default: module.AffiliatePage })))
const AffiliateEnrollmentPage = lazy(() => import('@/pages/affiliate-enrollment-page').then((module) => ({ default: module.AffiliateEnrollmentPage })))
const NotFoundPage = lazy(() => import('@/pages/not-found-page').then((module) => ({ default: module.NotFoundPage })))
const CourseLayout = lazy(() => import('@/components/course-layout').then((module) => ({ default: module.CourseLayout })))
const JourneysPage = lazy(() => import('@/pages/journeys-page').then((module) => ({ default: module.JourneysPage })))
const PlatformsPage = lazy(() => import('@/pages/platforms-page').then((module) => ({ default: module.PlatformsPage })))
const PlansPage = lazy(() => import('@/pages/plans-page').then((module) => ({ default: module.PlansPage })))
const PreviewPage = lazy(() => import('@/pages/preview-page').then((module) => ({ default: module.PreviewPage })))
const ToolsPage = lazy(() => import('@/pages/tools-page').then((module) => ({ default: module.ToolsPage })))
const SimulatorPage = lazy(() => import('@/pages/simulator-page').then((module) => ({ default: module.SimulatorPage })))
const ToolArticlesPage = lazy(() => import('@/pages/tool-articles-page').then((module) => ({ default: module.ToolArticlesPage })))
const MarketPulsePage = lazy(() => import('@/pages/market-pulse-page').then((module) => ({ default: module.MarketPulsePage })))
const LoadingPreviewPage = lazy(() => import('@/pages/loading-preview-page'))

function RouteContentReady({ pathname, ready, onReady, children }: { pathname: string; ready: boolean; onReady: (pathname: string) => void; children: ReactNode }) {
  useEffect(() => { if (ready) onReady(pathname) }, [onReady, pathname, ready])
  return children
}

function AffiliateReferralRedirect() {
  const { affiliateId = '' } = useParams()
  return <Navigate to={`/landing?ref=${encodeURIComponent(affiliateId.toLowerCase())}`} replace />
}

function AppRoutes() {
  const location = useLocation()
  const { locale } = useLocalization()
  const { loading: sessionLoading } = useSession()
  const [entryVisible, setEntryVisible] = useState(false)
  const [readyPath, setReadyPath] = useState<string | null>(null)
  const normalizedPathname = normalizePathname(location.pathname)
  const explicitLocale = localeFromPath(normalizedPathname)
  const routePath = unlocalizedPath(normalizedPathname)
  const routeLocation = { ...location, pathname: routePath }
  const canonicalPath = explicitLocale ? normalizedPathname : localizedPath(normalizedPathname, locale)
  // Normalize first: page-level redirects must not race the locale redirect.
  if (location.pathname !== canonicalPath) return <Navigate to={`${canonicalPath}${location.search}${location.hash}`} replace state={location.state} />
  const entryActive = shouldShowPlatformEntry(routePath) || entryVisible
  return <PlatformEntryContext.Provider value={entryActive}>
    <ReferralTracker />
    <PlatformEntryAnimation key={routePath} onVisibilityChange={setEntryVisible} contentReady={readyPath === routePath} />
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[#09090d] text-xs text-[#a19dab]">Abrindo sua trilha…</div>}><RouteContentReady pathname={routePath} ready={!routePath.startsWith('/curso') || !sessionLoading} onReady={setReadyPath}><div key={routePath} className="route-enter" inert={entryActive || undefined} aria-hidden={entryActive || undefined}><Routes location={routeLocation}>
      <Route path="/" element={<Navigate to={`${localizedPath('/landing', locale)}${location.search}${location.hash}`} replace />} />
      <Route path="/quiz" element={<Navigate to={`${localizedPath('/landing', locale)}${location.search}${location.hash}`} replace />} />
      <Route path="/landing" element={<LandingPage />} />
      {import.meta.env.DEV && <Route path="/loading-preview" element={<LoadingPreviewPage />} />}
      <Route path="/planos" element={<PlansPage />} />
      <Route path="/explorar" element={<PreviewPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/ferramentas" element={<ToolsPage />} />
      <Route path="/ferramentas/:slug" element={<ToolsPage />} />
      <Route path="/simulador" element={<SimulatorPage />} />
      <Route path="/radar" element={<MarketPulsePage />} />
      <Route path="/artigos" element={<ToolArticlesPage />} />
      <Route path="/artigos/:articleSlug" element={<ToolArticlesPage />} />
      <Route path="/:affiliateId" element={<AffiliateReferralRedirect />} />
      <Route element={<RequireAuth />}>
        <Route path="/afiliar" element={<AffiliateEnrollmentPage />} />
      </Route>
      <Route element={<RequireRole role="student" />}>
        <Route path="/acesso" element={<CourseLayout />}><Route index element={<CourseAccessPage />} /></Route>
        <Route path="/plataformas" element={<CourseLayout />}><Route index element={<PlatformsPage />} /></Route>
        <Route path="/jornadas" element={<CourseLayout />}>
          <Route element={<RequireCourseAccess />}>
            <Route index element={<JourneysPage />} />
            <Route path=":journeyId" element={<JourneysPage />} />
            <Route path=":journeyId/aula/:moduleId/:lessonId" element={<LessonPage />} />
            <Route path=":journeyId/modulo/:moduleId" element={<ModuleQuizPage />} />
          </Route>
        </Route>
        <Route path="/curso" element={<CourseLayout />}>
          <Route path="seguranca" element={<SecurityPage />} />
          <Route path="ferramentas" element={<ToolsPage insideCourse />} />
          <Route path="ferramentas/:slug" element={<ToolsPage insideCourse />} />
          <Route path="simulador" element={<SimulatorPage insideCourse />} />
          <Route path="radar" element={<MarketPulsePage insideCourse />} />
          <Route element={<RequireCourseAccess />}>
            <Route index element={<CourseDashboard />} />
            <Route path="audios-extras" element={<ExtraAudioPage />} />
            <Route path="aula/:moduleId/:lessonId" element={<LessonPage />} />
            <Route path="modulo/:moduleId" element={<ModuleQuizPage />} />
            <Route path="certificado" element={<CertificatePage />} />
          </Route>
        </Route>
      </Route>
      <Route element={<RequireRole role="admin" />}><Route path="/admin" element={<AdminPage />} /></Route>
      <Route element={<RequireAffiliate />}><Route path="/afiliado" element={<AffiliatePage />} /></Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes></div></RouteContentReady></Suspense>
    {!entryActive && (routePath === '/landing' || routePath === '/planos' || routePath === '/explorar' || routePath === '/acesso' || routePath === '/plataformas' || routePath.startsWith('/curso') || routePath.startsWith('/jornadas') || routePath.startsWith('/ferramentas') || routePath.startsWith('/artigos')) && <PriceTicker />}
  </PlatformEntryContext.Provider>
}

export default function App() {
  return <MotionConfig reducedMotion="user"><BrowserRouter><LocalizationProvider><SessionProvider><AppRoutes /></SessionProvider></LocalizationProvider></BrowserRouter></MotionConfig>
}
