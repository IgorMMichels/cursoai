import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSession } from '@/contexts/session-context'
import type { UserRole } from '@/lib/storage'

export function RequireRole({ role }: { role: UserRole }) {
  const { user } = useSession()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'affiliate' ? '/afiliado' : '/curso'} replace />
  return <Outlet />
}
