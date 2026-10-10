import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { plans, type PlanId } from '@/lib/offers'
import { getCloudProfile, saveCloudProfile } from '@/lib/profile-service'
import { loadLessonProgress, saveLessonProgress } from '@/lib/learning-service'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { getReferralCode, type UserRole } from '@/lib/storage'

export type AppSession = {
  id: string
  username: string
  name: string
  email: string
  bio: string
  location: string
  avatarUrl?: string
  role: UserRole
  roles: UserRole[]
  isAffiliate: boolean
  plan: PlanId | null
  planStartedAt: string
  expiresAt?: string
  referralCode?: string
}

type SessionContextValue = {
  user: AppSession | null
  loading: boolean
  authConfigured: boolean
  authError: string | null
  completedLessons: string[]
  signInWithPassword: (email: string, password: string) => Promise<AppSession>
  signUpWithPassword: (name: string, username: string, email: string, password: string, marketingOptIn?: boolean) => Promise<AppSession | null>
  joinAffiliateProgram: () => Promise<string>
  sendPasswordReset: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  updateProfile: (input: { name: string; bio: string; location: string; avatarDataUrl?: string }, avatar?: Blob) => Promise<{ synced: boolean; error?: string }>
  signOut: () => void
  completeLesson: (lessonId: string) => Promise<void>
  refreshProgress: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível validar sua sessão.'
}

function mapRole(roles: string[]): UserRole {
  if (roles.includes('admin')) return 'admin'
  return 'student'
}

function mapRoles(roles: string[]): UserRole[] {
  return roles.filter((role): role is UserRole => role === 'student' || role === 'admin')
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppSession | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [authError, setAuthError] = useState<string | null>(null)
  const [completedLessons, setCompletedLessons] = useState<string[]>([])
  const activeAuthSyncs = useRef(new Map<string, Promise<AppSession>>())

  const syncSupabaseUser = useCallback((authUser: User) => {
    const activeSync = activeAuthSyncs.current.get(authUser.id)
    if (activeSync) return activeSync

    const sync = (async () => {
      try {
        if (!supabase) throw new Error('Autenticação não configurada.')
        const [rolesResult, subscriptionsResult, profile, progress] = await Promise.all([
          supabase.from('app_roles').select('role').eq('user_id', authUser.id),
          supabase.from('subscriptions').select('plan_id, starts_at, expires_at').eq('user_id', authUser.id).eq('status', 'active').order('created_at', { ascending: false }),
          getCloudProfile(authUser.id),
          loadLessonProgress(authUser.id),
        ])
        if (rolesResult.error) throw rolesResult.error
        if (subscriptionsResult.error) throw subscriptionsResult.error
        const roles = mapRoles((rolesResult.data ?? []).map((entry) => entry.role))
        if (roles.length === 0) roles.push('student')
        const role = mapRole(roles)
        const affiliateProfile = await supabase.from('affiliate_profiles').select('referral_code, active').eq('user_id', authUser.id).maybeSingle()
        if (affiliateProfile?.error) throw affiliateProfile.error
        const now = Date.now()
        const subscription = (subscriptionsResult.data ?? []).find((entry) =>
          (!entry.starts_at || Date.parse(entry.starts_at) <= now)
          && (!entry.expires_at || Date.parse(entry.expires_at) > now),
        )
        const activePlan: PlanId | null = subscription?.plan_id === 'month' || subscription?.plan_id === 'quarter' || subscription?.plan_id === 'annual' || subscription?.plan_id === 'lifetime'
          ? subscription.plan_id
          : null
        const session: AppSession = {
          id: authUser.id,
          username: profile?.username ?? (typeof authUser.user_metadata?.username === 'string' ? authUser.user_metadata.username : ''),
          name: profile?.displayName?.trim() || (typeof authUser.user_metadata?.name === 'string' ? authUser.user_metadata.name.trim() : '') || authUser.email?.split('@')[0] || 'Aluno',
          email: authUser.email ?? '',
          bio: profile?.bio ?? '',
          location: profile?.location ?? '',
          avatarUrl: profile?.avatarUrl,
          role,
          roles,
          isAffiliate: Boolean(affiliateProfile?.data && affiliateProfile.data.active),
          plan: activePlan,
          planStartedAt: subscription?.starts_at ?? '',
          expiresAt: subscription?.expires_at ?? undefined,
          referralCode: profile?.username || affiliateProfile?.data?.referral_code || getReferralCode(),
        }
        setUser(session)
        setCompletedLessons(progress)
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
      setAuthError('Login indisponível neste ambiente.')
      return
    }

    let isMounted = true
    const applyAuthSession = (session: Session | null) => {
      if (!session?.user) {
        setUser(null)
        setCompletedLessons([])
        setAuthError(null)
        setLoading(false)
        return
      }
      void syncSupabaseUser(session.user)
        .then(() => { if (isMounted) setAuthError(null) })
        .catch((error: unknown) => {
          if (!isMounted) return
          setUser(null)
          setCompletedLessons([])
          setAuthError(errorMessage(error))
        })
        .finally(() => { if (isMounted) setLoading(false) })
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Autenticação indisponível no momento.')
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw error
    if (!data.user) throw new Error('Não foi possível validar a conta.')
    setAuthError(null)
    return syncSupabaseUser(data.user)
  }, [syncSupabaseUser])

  const signUpWithPassword = useCallback(async (name: string, username: string, email: string, password: string, marketingOptIn = false) => {
    if (!supabase) throw new Error('Autenticação indisponível no momento.')
    const referralCode = getReferralCode()
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name: name.trim(), username, marketing_opt_in: marketingOptIn, ...(referralCode ? { referral_code: referralCode } : {}) },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    if (error) throw error
    setAuthError(null)
    if (!data.session || !data.user) return null
    return syncSupabaseUser(data.user)
  }, [syncSupabaseUser])

  const joinAffiliateProgram = useCallback(async () => {
    if (!supabase || !user) throw new Error('Entre na sua conta para participar do programa de afiliados.')
    const { data: referralCode, error } = await supabase.rpc('join_affiliate_program')
    if (error) throw error
    if (typeof referralCode !== 'string' || !referralCode) throw new Error('O código de afiliado não foi criado.')
    setLoading(true)
    try {
      const { data, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!data.user) throw new Error('Sua sessão expirou. Entre novamente.')
      activeAuthSyncs.current.delete(data.user.id)
      await syncSupabaseUser(data.user)
    } finally { setLoading(false) }
    return referralCode
  }, [user, syncSupabaseUser])

  const sendPasswordReset = useCallback(async (email: string) => {
    if (!supabase) throw new Error('Autenticação indisponível no momento.')
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/login?recovery=1` })
    if (error) throw error
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    if (!supabase) throw new Error('Autenticação indisponível no momento.')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }, [])

  const updateProfile = useCallback(async (input: { name: string; bio: string; location: string; avatarDataUrl?: string }, avatar?: Blob) => {
    if (!user) throw new Error('Entre na sua conta para editar o perfil.')
    try {
      const avatarToUpload = avatar ?? (input.avatarDataUrl?.startsWith('data:image/webp;')
        ? await fetch(input.avatarDataUrl).then((response) => response.blob())
        : undefined)
      const result = await saveCloudProfile(user.id, {
        displayName: input.name.trim(),
        bio: input.bio.trim(),
        location: input.location.trim(),
      }, avatarToUpload)
      if (!result.synced || !result.profile) throw new Error(result.error ?? 'O perfil não foi salvo.')
      setUser((current) => current?.id === user.id ? {
        ...current,
        name: result.profile!.displayName,
        bio: result.profile!.bio,
        location: result.profile!.location,
        avatarUrl: result.profile!.avatarUrl,
      } : current)
      return { synced: true }
    } catch (error) {
      return { synced: false, error: errorMessage(error) }
    }
  }, [user])

  const signOut = useCallback(() => {
    setUser(null)
    setCompletedLessons([])
    if (supabase) void supabase.auth.signOut()
  }, [])

  const completeLesson = useCallback(async (lessonId: string) => {
    if (!user) throw new Error('Entre na sua conta para salvar o progresso.')
    await saveLessonProgress(user.id, lessonId)
    setCompletedLessons((current) => current.includes(lessonId) ? current : [...current, lessonId])
  }, [user])

  const refreshProgress = useCallback(async () => {
    if (!user) { setCompletedLessons([]); return }
    setCompletedLessons(await loadLessonProgress(user.id))
  }, [user])

  const value = useMemo(() => ({
    user,
    loading,
    authConfigured: isSupabaseConfigured,
    authError,
    completedLessons,
    signInWithPassword,
    signUpWithPassword,
    joinAffiliateProgram,
    sendPasswordReset,
    updatePassword,
    updateProfile,
    signOut,
    completeLesson,
    refreshProgress,
  }), [user, loading, authError, completedLessons, signInWithPassword, signUpWithPassword, joinAffiliateProgram, sendPasswordReset, updatePassword, updateProfile, signOut, completeLesson, refreshProgress])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession precisa estar dentro de SessionProvider')
  return context
}

export const destinationForRole = (role: UserRole) => role === 'admin' ? '/admin' : '/curso'
export const planTitle = (plan: PlanId | null) => plan ? plans[plan].name : 'Sem acesso ao curso'
