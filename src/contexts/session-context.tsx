import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { plans, type PlanId } from '@/lib/offers'
import { clearPendingOrder, formatExpiry, getCompletedLessons, getPendingOrder, getReferralCode, getSession, saveCompletedLesson, setSession, type DemoSession, type UserRole, trackDemoSale, trackDemoSignup } from '@/lib/storage'

type SessionContextValue = {
  user: DemoSession | null
  completedLessons: string[]
  signInDemo: (role: UserRole, displayName?: string) => DemoSession
  signOut: () => void
  completeLesson: (lessonId: string) => void
  refreshProgress: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoSession | null>(() => getSession())
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => getCompletedLessons())

  const signInDemo = useCallback((role: UserRole, displayName?: string) => {
    const pending = role === 'student' ? getPendingOrder() : null
    const now = new Date()
    const id = `demo-${role}`
    const referralCode = getReferralCode()
    const session: DemoSession = {
      id,
      name: displayName?.trim() || (role === 'admin' ? 'Alex Costa' : role === 'affiliate' ? 'Marina Lima' : 'Rafael Santos'),
      email: role === 'admin' ? 'admin@criptomentoria.demo' : role === 'affiliate' ? 'marina@parceiros.demo' : 'aluno@demo.criptomentoria',
      role,
      plan: pending?.plan ?? 'demo',
      planStartedAt: now.toISOString(),
      expiresAt: pending ? formatExpiry(pending.plan, now) : undefined,
      currency: pending?.currency,
      referralCode
    }
    setSession(session)
    if (role === 'student') {
      trackDemoSignup(referralCode, id)
      if (pending) {
        const amount = pending.currency === 'SOL'
          ? pending.plan === 'month' ? 0.4 : pending.plan === 'quarter' ? 0.7 : 0.9
          : pending.plan === 'month' ? 299 : pending.plan === 'quarter' ? 549 : 699
        trackDemoSale({ code: referralCode, userId: id, plan: pending.plan, currency: pending.currency, amount })
        clearPendingOrder()
      }
    }
    setUser(session)
    return session
  }, [])

  const signOut = useCallback(() => {
    setSession(null)
    setUser(null)
  }, [])

  const completeLesson = useCallback((lessonId: string) => {
    saveCompletedLesson(lessonId)
    setCompletedLessons(getCompletedLessons())
  }, [])

  const refreshProgress = useCallback(() => setCompletedLessons(getCompletedLessons()), [])
  const value = useMemo(() => ({ user, completedLessons, signInDemo, signOut, completeLesson, refreshProgress }), [user, completedLessons, signInDemo, signOut, completeLesson, refreshProgress])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession precisa estar dentro de SessionProvider')
  return context
}

export const destinationForRole = (role: UserRole) => role === 'admin' ? '/admin' : role === 'affiliate' ? '/afiliado' : '/curso'
export const planTitle = (plan: PlanId | 'demo') => plan === 'demo' ? 'Demonstração' : plans[plan].name
