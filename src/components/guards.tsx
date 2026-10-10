import { translateUi } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router-dom'
import { LocalizedNavigate as Navigate } from '@/components/localized-router'
import { useSession, type AppSession } from '@/contexts/session-context'
import type { UserRole } from '@/lib/storage'
import { CoursePreview } from '@/components/course-preview'

export function hasActivePlan(user: Pick<AppSession, 'plan' | 'planStartedAt' | 'expiresAt'> | null | undefined) {
  if (!user || user.plan === null) return false
  const startsAt = Date.parse(user.planStartedAt)
  const expiresAt = user.expiresAt ? Date.parse(user.expiresAt) : Number.POSITIVE_INFINITY
  return Number.isFinite(startsAt)
    && startsAt <= Date.now()
    && expiresAt > Date.now()
}

export function RequireRole({ role }: { role: UserRole }) {
  useUiTranslation();
  const { user, loading } = useSession()
  const location = useLocation()
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#09090d] text-xs text-[#a19dab]" role="status">{translateUi("Verificando sua sessão…")}</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!(user.roles ?? [user.role]).includes(role)) return <Navigate to={user.role === 'admin' ? '/admin' : '/curso'} replace />
  return <Outlet />
}

export function RequireAuth() {
  useUiTranslation();
  const { user, loading } = useSession()
  const location = useLocation()
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#09090d] text-xs text-[#a19dab]" role="status">{translateUi("Verificando sua sessão…")}</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export function RequireAffiliate() {
  useUiTranslation();
  const { user, loading } = useSession()
  const location = useLocation()
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#09090d] text-xs text-[#a19dab]" role="status">{translateUi("Verificando sua sessão…")}</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!user.isAffiliate) return <Navigate to="/afiliar" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export function RequireCourseAccess() {
  useUiTranslation();
  const { user, loading } = useSession()
  const location = useLocation()
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#09090d] text-xs text-[#a19dab]" role="status">{translateUi("Verificando sua sessão…")}</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  // Preview queries only catalogue metadata, never protected lesson/account data.
  if (!hasActivePlan(user)) return <CoursePreview
    area={location.pathname.includes('audios-extras') ? 'audios' : location.pathname.startsWith('/jornadas') ? 'jornadas' : 'visao-geral'}
    journeyId={location.pathname.startsWith('/jornadas/') ? location.pathname.split('/')[2] : undefined}
  />
  return <Outlet />
}
