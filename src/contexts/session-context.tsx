import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { plans, type PlanId } from '@/lib/offers'
import { getCloudProfile, saveCloudProfile } from '@/lib/profile-service'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { clearPendingOrder, formatExpiry, getCompletedLessons, getPendingOrder, getReferralCode, getSession, saveCompletedLesson, setSession, type DemoSession, type UserRole, trackDemoSale, trackDemoSignup } from '@/lib/storage'

type SessionContextValue = {
  user: DemoSession | null
  loading: boolean
  authConfigured: boolean
  authError: string | null
  completedLessons: string[]
  signInDemo: (role: UserRole, displayName?: string) => DemoSession
  signInWithPassword: (email: string, password: string) => Promise<DemoSession>
  signUpWithPassword: (name: string, email: string, password: string) => Promise<boolean>
  sendPasswordReset: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  updateProfile: (input: { name: string; bio: string; location: string; avatarDataUrl?: string }, avatar?: Blob) => Promise<{ synced: boolean; error?: string }>
  signOut: () => void
  completeLesson: (lessonId: string) => void
  refreshProgress: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível validar sua sessão.'
}

function mapRole(roles: string[]): UserRole {
  if (roles.includes('admin')) return 'admin'
  if (roles.includes('affiliate')) return 'affiliate'
  return 'student'
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoSession | null>(() => isSupabaseConfigured ? null : getSession())
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [authError, setAuthError] = useState<string | null>(null)
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => getCompletedLessons())
  const activeAuthSyncs = useRef(new Map<string, Promise<DemoSession>>())

  const syncSupabaseUser = useCallback((authUser: User) => {
    const activeSync = activeAuthSyncs.current.get(authUser.id)
    if (activeSync) return activeSync

    const sync = (async () => {
      try {
        if (!supabase) throw new Error('Autenticação Supabase não configurada.')
        const cachedProfile = getSession()
        const [rolesResult, subscriptionsResult] = await Promise.all([
          supabase.from('app_roles').select('role').eq('user_id', authUser.id),
          supabase.from('subscriptions').select('plan_id, starts_at, expires_at').eq('user_id', authUser.id).eq('status', 'active').order('created_at', { ascending: false }),
        ])
        if (rolesResult.error) throw rolesResult.error
        if (subscriptionsResult.error) throw subscriptionsResult.error
        const profile = await getCloudProfile(authUser.id).catch(() => null)
        const localProfile = cachedProfile?.id === authUser.id ? cachedProfile : null

        const role = mapRole((rolesResult.data ?? []).map((entry) => entry.role))
        const affiliateProfile = role === 'affiliate'
          ? await supabase.from('affiliate_profiles').select('referral_code').eq('user_id', authUser.id).maybeSingle()
          : null
        if (affiliateProfile?.error) throw affiliateProfile.error
        const now = Date.now()
        const subscription = (subscriptionsResult.data ?? []).find((entry) =>
          (!entry.starts_at || Date.parse(entry.starts_at) <= now)
          && (!entry.expires_at || Date.parse(entry.expires_at) > now),
        )
        const subscriptionPlan = subscription?.plan_id
        const activePlan: PlanId | undefined = subscriptionPlan === 'month' || subscriptionPlan === 'quarter' || subscriptionPlan === 'lifetime'
          ? subscriptionPlan
          : undefined
        const referralCode = affiliateProfile?.data?.referral_code
          ?? getReferralCode()
          ?? (typeof authUser.user_metadata?.referral_code === 'string' ? authUser.user_metadata.referral_code : undefined)
        const displayName = profile?.displayName?.trim()
          || (!profile ? localProfile?.name?.trim() : '')
          || (typeof authUser.user_metadata?.name === 'string' ? authUser.user_metadata.name.trim() : '')
        const session: DemoSession = {
          id: authUser.id,
          name: displayName || authUser.email?.split('@')[0] || 'Aluno',
          email: authUser.email ?? '',
          bio: profile?.bio ?? localProfile?.bio ?? '',
          location: profile?.location ?? localProfile?.location ?? '',
          avatarUrl: profile?.avatarUrl ?? localProfile?.avatarUrl,
          role,
          plan: activePlan ?? 'demo',
          planStartedAt: subscription?.starts_at ?? new Date().toISOString(),
          expiresAt: subscription?.expires_at ?? undefined,
          referralCode,
        }

        setSession(session)
        setUser(session)
        return session
      } finally {
        activeAuthSyncs.current.delete(authUser.id)
      }
    })()
    activeAuthSyncs.current.set(authUser.id, sync)
    return sync
  }, [])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let isMounted = true
    const applyAuthSession = (session: Session | null) => {
      if (!session?.user) {
        setSession(null)
        setUser(null)
        setAuthError(null)
        setLoading(false)
        return
      }
      void syncSupabaseUser(session.user)
        .then(() => { if (isMounted) setAuthError(null) })
        .catch((error: unknown) => {
          if (!isMounted) return
          setSession(null)
          setUser(null)
          setAuthError(errorMessage(error))
        })
        .finally(() => { if (isMounted) setLoading(false) })
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer network work until after Supabase finishes its auth state callback.
      window.setTimeout(() => { if (isMounted) applyAuthSession(session) }, 0)
    })
    void supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) throw error
        if (isMounted) applyAuthSession(data.session)
      })
      .catch((error: unknown) => {
        if (!isMounted) return
        setLoading(false)
        setAuthError(errorMessage(error))
      })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [syncSupabaseUser])

  const signInDemo = useCallback((role: UserRole, displayName?: string) => {
    if (isSupabaseConfigured) throw new Error('Use login por e-mail quando Supabase estiver configurado.')
    if (role !== 'student') throw new Error('Demonstração permite apenas acesso de aluno.')
    const pending = getPendingOrder()
    const now = new Date()
    const id = 'demo-student'
    const referralCode = getReferralCode()
    const session: DemoSession = {
      id,
      name: displayName?.trim() || 'Rafael Santos',
      email: 'aluno@demo.criptomentoria',
      role: 'student',
      plan: pending?.plan ?? 'demo',
      planStartedAt: now.toISOString(),
      expiresAt: pending ? formatExpiry(pending.plan, now) : undefined,
      currency: pending?.currency,
      referralCode,
    }
    setSession(session)
    trackDemoSignup(referralCode, id)
    if (pending) {
      const amount = pending.currency === 'SOL'
        ? pending.plan === 'month' ? 0.4 : pending.plan === 'quarter' ? 0.7 : 0.9
        : pending.plan === 'month' ? 299 : pending.plan === 'quarter' ? 549 : 699
      trackDemoSale({ code: referralCode, userId: id, plan: pending.plan, currency: pending.currency, amount })
      clearPendingOrder()
    }
    setUser(session)
    return session
  }, [])

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Autenticação indisponível. Configure as variáveis do Supabase ou use a demonstração.')
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw error
    if (!data.user) throw new Error('Não foi possível validar a conta.')
    setAuthError(null)
    return syncSupabaseUser(data.user)
  }, [syncSupabaseUser])

  const signUpWithPassword = useCallback(async (name: string, email: string, password: string) => {
    if (!supabase) throw new Error('Autenticação indisponível. Configure as variáveis do Supabase.')
    const referralCode = getReferralCode()
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
          ...(referralCode ? { referral_code: referralCode } : {}),
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    if (error) throw error
    setAuthError(null)
    if (!data.session || !data.user) return false
    await syncSupabaseUser(data.user)
    return true
  }, [syncSupabaseUser])

  const sendPasswordReset = useCallback(async (email: string) => {
    if (!supabase) throw new Error('Autenticação indisponível. Configure as variáveis do Supabase.')
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login?recovery=1`,
    })
    if (error) throw error
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    if (!supabase) throw new Error('Autenticação indisponível. Configure as variáveis do Supabase.')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }, [])

  const updateProfile = useCallback(async (input: { name: string; bio: string; location: string; avatarDataUrl?: string }, avatar?: Blob) => {
    if (!user) throw new Error('Entre na sua conta para editar o perfil.')
    const localProfile: DemoSession = {
      ...user,
      name: input.name.trim(),
      bio: input.bio.trim(),
      location: input.location.trim(),
      avatarUrl: input.avatarDataUrl ?? user.avatarUrl,
    }
    setSession(localProfile)
    setUser(localProfile)

    try {
      const avatarToUpload = avatar ?? (input.avatarDataUrl?.startsWith('data:image/webp;')
        ? await fetch(input.avatarDataUrl).then((response) => response.blob())
        : undefined)
      const result = await saveCloudProfile(user.id, {
        displayName: localProfile.name,
        bio: localProfile.bio ?? '',
        location: localProfile.location ?? '',
      }, avatarToUpload)
      if (result.synced && result.profile) {
        const syncedProfile: DemoSession = {
          ...localProfile,
          name: result.profile.displayName,
          bio: result.profile.bio,
          location: result.profile.location,
          avatarUrl: result.profile.avatarUrl ?? localProfile.avatarUrl,
        }
        setSession(syncedProfile)
        setUser(syncedProfile)
      }
      return { synced: result.synced }
    } catch (error) {
      return { synced: false, error: errorMessage(error) }
    }
  }, [user])

  const signOut = useCallback(() => {
    setSession(null)
    setUser(null)
    if (supabase) void supabase.auth.signOut()
  }, [])

  const completeLesson = useCallback((lessonId: string) => {
    saveCompletedLesson(lessonId)
    setCompletedLessons(getCompletedLessons())
  }, [])

  const refreshProgress = useCallback(() => setCompletedLessons(getCompletedLessons()), [])
  const value = useMemo(() => ({
    user,
    loading,
    authConfigured: isSupabaseConfigured,
    authError,
    completedLessons,
    signInDemo,
    signInWithPassword,
    signUpWithPassword,
    sendPasswordReset,
    updatePassword,
    updateProfile,
    signOut,
    completeLesson,
    refreshProgress,
  }), [user, loading, authError, completedLessons, signInDemo, signInWithPassword, signUpWithPassword, sendPasswordReset, updatePassword, updateProfile, signOut, completeLesson, refreshProgress])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession precisa estar dentro de SessionProvider')
  return context
}

export const destinationForRole = (role: UserRole) => role === 'admin' ? '/admin' : role === 'affiliate' ? '/afiliado' : '/curso'
export const planTitle = (plan: PlanId | 'demo') => plan === 'demo' ? 'Demonstração' : plans[plan].name
