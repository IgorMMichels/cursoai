import { lazy, Suspense, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { SessionProvider } from '@/contexts/session-context'
import { RequireAffiliate, RequireAuth, RequireCourseAccess, RequireRole } from '@/components/guards'
import { ReferralTracker, PlatformEntryAnimation } from '@/components/app-utilities'
import { PlatformEntryContext, shouldShowPlatformEntry } from '@/contexts/platform-entry-context'
import { PriceTicker } from '@/components/price-ticker'

const LandingPage = lazy(() => import('@/pages/landing-page').then((module) => ({ default: module.LandingPage })))
const LoginPage = lazy(() => import('@/pages/login-page').then((module) => ({ default: module.LoginPage })))
const CourseDashboard = lazy(() => import('@/pages/course-dashboard').then((module) => ({ default: module.CourseDashboard })))
const CourseAccessPage = lazy(() => import('@/components/wallet-guides').then((module) => ({ default: module.CourseAccessPage })))
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
const ToolArticlesPage = lazy(() => import('@/pages/tool-articles-page').then((module) => ({ default: module.ToolArticlesPage })))

function AffiliateReferralRedirect() {
  const { affiliateId = '' } = useParams()
  return <Navigate to={`/landing?ref=${encodeURIComponent(affiliateId.toLowerCase())}`} replace />
}

function AppRoutes() {
  const location = useLocation()
  const [entryVisible, setEntryVisible] = useState(false)
  const entryActive = shouldShowPlatformEntry(location.pathname) || entryVisible
  return <PlatformEntryContext.Provider value={entryActive}>
    <ReferralTracker />
    <PlatformEntryAnimation onVisibilityChange={setEntryVisible} />
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[#09090d] text-xs text-[#a19dab]">Abrindo sua trilha…</div>}><div key={location.pathname} className="route-enter"><Routes location={location}>
      <Route path="/" element={<Navigate to="/landing" replace />} />
      <Route path="/quiz" element={<Navigate to="/landing" replace />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/planos" element={<PlansPage />} />
      <Route path="/explorar" element={<PreviewPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/ferramentas" element={<ToolsPage />} />
      <Route path="/ferramentas/:slug" element={<ToolsPage />} />
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
          <Route element={<RequireCourseAccess />}>
            <Route index element={<CourseDashboard />} />
            <Route path="aula/:moduleId/:lessonId" element={<LessonPage />} />
            <Route path="modulo/:moduleId" element={<ModuleQuizPage />} />
            <Route path="certificado" element={<CertificatePage />} />
          </Route>
        </Route>
      </Route>
      <Route element={<RequireRole role="admin" />}><Route path="/admin" element={<AdminPage />} /></Route>
      <Route element={<RequireAffiliate />}><Route path="/afiliado" element={<AffiliatePage />} /></Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes></div></Suspense>
    {(location.pathname === '/landing' || location.pathname === '/planos' || location.pathname === '/explorar' || location.pathname === '/acesso' || location.pathname === '/plataformas' || location.pathname.startsWith('/curso') || location.pathname.startsWith('/jornadas') || location.pathname.startsWith('/ferramentas') || location.pathname.startsWith('/artigos')) && <PriceTicker />}
  </PlatformEntryContext.Provider>
}

export default function App() {
  return <MotionConfig reducedMotion="user"><BrowserRouter><SessionProvider><AppRoutes /></SessionProvider></BrowserRouter></MotionConfig>
}

