import { lazy, Suspense, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { SessionProvider } from '@/contexts/session-context'
import { RequireCourseAccess, RequireRole } from '@/components/guards'
import { ReferralTracker, PlatformEntryAnimation } from '@/components/app-utilities'
import { CustomCursor } from '@/components/custom-cursor'
import { PlatformEntryContext, shouldShowPlatformEntry } from '@/contexts/platform-entry-context'

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
const NotFoundPage = lazy(() => import('@/pages/not-found-page').then((module) => ({ default: module.NotFoundPage })))
const CourseLayout = lazy(() => import('@/components/course-layout').then((module) => ({ default: module.CourseLayout })))

function AppRoutes() {
  const location = useLocation()
  const [entryVisible, setEntryVisible] = useState(false)
  const entryActive = shouldShowPlatformEntry(location.pathname) || entryVisible
  return <PlatformEntryContext.Provider value={entryActive}>
    <CustomCursor />
    <ReferralTracker />
    <PlatformEntryAnimation onVisibilityChange={setEntryVisible} />
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[#09090d] text-xs text-[#a19dab]">Abrindo sua trilha…</div>}><div key={location.pathname} className="route-enter"><Routes location={location}>
      <Route path="/" element={<Navigate to="/landing" replace />} />
      <Route path="/quiz" element={<Navigate to="/landing" replace />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireRole role="student" />}>
        <Route path="/acesso" element={<CourseLayout />}><Route index element={<CourseAccessPage />} /></Route>
        <Route element={<RequireCourseAccess />}>
          <Route path="/curso" element={<CourseLayout />}>
          <Route index element={<CourseDashboard />} />
          <Route path="aula/:moduleId/:lessonId" element={<LessonPage />} />
          <Route path="modulo/:moduleId" element={<ModuleQuizPage />} />
          <Route path="seguranca" element={<SecurityPage />} />
          <Route path="certificado" element={<CertificatePage />} />
          </Route>
        </Route>
      </Route>
      <Route element={<RequireRole role="admin" />}><Route path="/admin" element={<AdminPage />} /></Route>
      <Route element={<RequireRole role="affiliate" />}><Route path="/afiliado" element={<AffiliatePage />} /></Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes></div></Suspense>
  </PlatformEntryContext.Provider>
}

export default function App() {
  return <MotionConfig reducedMotion="user"><BrowserRouter><SessionProvider><AppRoutes /></SessionProvider></BrowserRouter></MotionConfig>
}

