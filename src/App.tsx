import { lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { SessionProvider } from '@/contexts/session-context'
import { RequireRole } from '@/components/guards'
import { ReferralTracker, PlatformEntryAnimation } from '@/components/app-utilities'
import { CourseLayout } from '@/components/course-layout'
import { CustomCursor } from '@/components/custom-cursor'

const LandingPage = lazy(() => import('@/pages/landing-page').then((module) => ({ default: module.LandingPage })))
const LoginPage = lazy(() => import('@/pages/login-page').then((module) => ({ default: module.LoginPage })))
const CourseDashboard = lazy(() => import('@/pages/course-dashboard').then((module) => ({ default: module.CourseDashboard })))
const LessonPage = lazy(() => import('@/pages/lesson-page').then((module) => ({ default: module.LessonPage })))
const ModuleQuizPage = lazy(() => import('@/pages/module-quiz-page').then((module) => ({ default: module.ModuleQuizPage })))
const SecurityPage = lazy(() => import('@/pages/security-page').then((module) => ({ default: module.SecurityPage })))
const CertificatePage = lazy(() => import('@/pages/certificate-page').then((module) => ({ default: module.CertificatePage })))
const AdminPage = lazy(() => import('@/pages/admin-page').then((module) => ({ default: module.AdminPage })))
const AffiliatePage = lazy(() => import('@/pages/affiliate-page').then((module) => ({ default: module.AffiliatePage })))
const NotFoundPage = lazy(() => import('@/pages/not-found-page').then((module) => ({ default: module.NotFoundPage })))

function AppRoutes() {
  const location = useLocation()
  return <>
    <CustomCursor />
    <ReferralTracker />
    <PlatformEntryAnimation />
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[#09090d] text-xs text-[#a19dab]">Abrindo sua trilha…</div>}><motion.div key={location.pathname} initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}><Routes location={location}>
      <Route path="/" element={<Navigate to="/landing" replace />} />
      <Route path="/quiz" element={<Navigate to="/landing" replace />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireRole role="student" />}>
        <Route path="/curso" element={<CourseLayout />}>
          <Route index element={<CourseDashboard />} />
          <Route path="aula/:moduleId/:lessonId" element={<LessonPage />} />
          <Route path="modulo/:moduleId" element={<ModuleQuizPage />} />
          <Route path="seguranca" element={<SecurityPage />} />
          <Route path="certificado" element={<CertificatePage />} />
        </Route>
      </Route>
      <Route element={<RequireRole role="admin" />}><Route path="/admin" element={<AdminPage />} /></Route>
      <Route element={<RequireRole role="affiliate" />}><Route path="/afiliado" element={<AffiliatePage />} /></Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes></motion.div></Suspense>
  </>
}

export default function App() {
  return <BrowserRouter><SessionProvider><AppRoutes /></SessionProvider></BrowserRouter>
}

