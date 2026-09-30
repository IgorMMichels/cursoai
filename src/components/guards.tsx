import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSession } from '@/contexts/session-context'
import type { UserRole } from '@/lib/storage'

export function RequireRole({ role }: { role: UserRole }) {
  const { user, loading } = useSession()
  const location = useLocation()
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#09090d] text-xs text-[#a19dab]" role="status">Verificando sua sessão…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!(user.roles ?? [user.role]).includes(role)) return <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'affiliate' ? '/afiliado' : '/curso'} replace />
  return <Outlet />
}

export function RequireCourseAccess() {
  const { user, loading } = useSession()
  const location = useLocation()
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#09090d] text-xs text-[#a19dab]" role="status">Verificando sua sessão…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  const startsAt = Date.parse(user.planStartedAt)
  const expiresAt = user.expiresAt ? Date.parse(user.expiresAt) : Number.POSITIVE_INFINITY
  const hasCurrentPlan = user.plan !== null
    && Number.isFinite(startsAt)
    && startsAt <= Date.now()
    && expiresAt > Date.now()

  if (!hasCurrentPlan) return <Navigate to="/acesso" replace />
  return <Outlet />
}
