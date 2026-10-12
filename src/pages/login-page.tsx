import { translateUi } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, KeyRound, Link2, Mail } from 'lucide-react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { LocalizedLink as Link, useLocalizedNavigate as useNavigate } from '@/components/localized-router'
import { OmegaLoginScene } from '@/components/omega-login-scene'
import { OmegaBrandScene } from '@/components/omega-brand-scene'
import { omegaCopy } from '@/lib/omega-copy'
import { PageMeta } from '@/components/tools/page-meta'
import { Brand } from '@/components/brand'
import { destinationForRole, useSession } from '@/contexts/session-context'
import { isAffiliateHandleAvailable, isValidAffiliateHandle } from '@/lib/affiliate-service'
import { plans, type PlanId } from '@/lib/offers'
import { FounderBadge } from '@/components/founder-badge'
import { useLocalization } from '@/contexts/localization-context'
import { localizedPath } from '@/lib/localization'
import { formatRegionalOffer, getPublishedRegionalOffer, type PaymentMethod } from '@/lib/regional-offers'
import { rememberReferral } from '@/lib/storage'
import { readAuthCallbackState } from '@/lib/auth-callback'
import { supabase } from '@/lib/supabase'
import type { EmailOtpType } from '@supabase/supabase-js'
import type { AppSession } from '@/contexts/session-context'

type LoginMode = 'signin' | 'signup' | 'reset' | 'recovery'

const emailOtpTypes: EmailOtpType[] = ['signup', 'magiclink', 'recovery']

function authErrorText(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  if (/23505|duplicate key|profiles_username_key/i.test(message)) return 'Este ID acabou de ser escolhido. Tente outro.'
  if (/ID indisponível|profiles_username_format/i.test(message)) return 'Escolha um ID válido, disponível, com 3 a 24 caracteres.'
  return message || 'Não foi possível concluir. Tente novamente.'
}

function safeRedirectPath(path: unknown): path is string {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\')
}

const STRENGTH_META = [
  { label: 'Senha fácil', color: '#f28c9a', hint: 'pode ser quebrada em minutos — use uma frase mais longa e única.' },
  { label: 'Senha fácil', color: '#f28c9a', hint: 'pode ser quebrada em minutos — use uma frase mais longa e única.' },
  { label: 'Senha razoável', color: '#e4bc76', hint: 'levaria dias para quebrar — adicione maiúsculas e símbolos.' },
  { label: 'Senha boa', color: '#98abff', hint: 'levaria anos para quebrar — quase lá, estenda um pouco mais.' },
  { label: 'Senha forte', color: '#8ed7b7', hint: 'levaria séculos para quebrar — excelente escolha, guarde com cuidado.' },
] as const

function scorePassword(password: string): number {
  if (!password) return 0
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasDigit = /[0-9]/.test(password)
  const hasSymbol = /[^a-zA-Z0-9]/.test(password)
  const classes = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length
  let score = 0
  if (password.length >= 12) score += 1
  if (password.length >= 16 || (hasLower && hasUpper && hasDigit)) score += 1
  if (hasSymbol || classes >= 3) score += 1
  if (password.length >= 20 || classes >= 4) score += 1
  return Math.min(4, Math.max(0, score))
}

function PasswordStrength({ password, compact = false }: { password: string; compact?: boolean }) {
  useUiTranslation();
  const score = useMemo(() => scorePassword(password), [password])
  const meta = STRENGTH_META[score]
  const visible = password.length > 0
  const activeBars = visible ? Math.max(1, score) : 0
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasDigit = /[0-9]/.test(password)
  const hasSymbol = /[^a-zA-Z0-9]/.test(password)
  const checks = [
    { ok: password.length >= 12, label: '12+ caracteres' },
    { ok: hasLower && hasUpper, label: 'maiúscula e minúscula' },
    { ok: hasDigit, label: 'número' },
    { ok: hasSymbol, label: 'símbolo' },
  ]

  return (
    <div
      aria-hidden={!visible}
      className="grid transition-all duration-500 ease-out"
      style={{ gridTemplateRows: visible ? '1fr' : '0fr', opacity: visible ? 1 : 0 }}
    >
      <div className="overflow-hidden">
        <div role="status" aria-live="polite" className={compact ? 'mt-3 opacity-80' : 'mt-3 rounded-2xl border border-white/[.07] bg-white/[.025] p-3.5 backdrop-blur-sm'}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold tracking-wide transition-colors duration-500" style={{ color: meta.color }}>
              {translateUi(meta.label)}
            </span>
            <span className="text-[10px] leading-relaxed text-[#76897e]">{translateUi(score)}/4</span>
          </div>
          <div className="mt-2.5 flex gap-1.5" aria-hidden="true">
            {[0, 1, 2, 3].map((index) => {
              const filled = index < activeBars
              return (
                <span key={index} className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/[.08]">
                  <span
                    className="absolute inset-0 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: filled ? '100%' : '0%',
                      backgroundColor: filled ? meta.color : 'transparent',
                      boxShadow: filled ? `0 0 12px ${meta.color}66` : 'none',
                      opacity: filled ? 1 : 0,
                    }}
                  />
                  {filled && index === activeBars - 1 && <span className="login-shimmer" aria-hidden="true" />}
                </span>
              )
            })}
          </div>
          {!compact && (
            <>
              <p className="mt-2.5 text-[10px] leading-relaxed text-[#8fa197]">
                {translateUi(meta.hint)}
              </p>
              <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
                {checks.map((check) => (
                  <li key={check.label} className="flex items-center gap-1.5 text-[10px]">
                    <span
                      className="grid size-4 shrink-0 place-items-center rounded-full border transition-all duration-300"
                      style={{
                        borderColor: check.ok ? `${meta.color}55` : 'rgba(255,255,255,.12)',
                        backgroundColor: check.ok ? `${meta.color}1f` : 'transparent',
                        color: check.ok ? meta.color : '#5c6f64',
                      }}
                    >
                      <Check size={10} strokeWidth={3} />
                    </span>
                    <span className="transition-colors duration-300" style={{ color: check.ok ? '#dfe9e1' : '#76897e' }}>
                      {translateUi(check.label)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function LoginPage() {
  useUiTranslation();
  const {
    user,
    loading,
    authConfigured,
    authError,
    isPasswordRecovery,
    signInWithPassword,
    sendMagicLink,
    resendSignupConfirmation,
    signUpWithPassword,
    sendPasswordReset,
    updatePassword,
  } = useSession()
  const [search] = useSearchParams()
  const { locale, regionalOffers, marketLoading, pricingError } = useLocalization()
  const location = useLocation()
  const navigate = useNavigate()
  const callbackState = useMemo(() => readAuthCallbackState(location.search, location.hash), [location.search, location.hash])
  const queryPlan = search.get('plano') as PlanId | null
  const chosenPlan = queryPlan && queryPlan in plans ? queryPlan : undefined
  const requestedPayment = search.get('payment')
  const paymentMethod = search.get('payment') as PaymentMethod | null
  const chosenOffer = chosenPlan ? getPublishedRegionalOffer(regionalOffers[0]?.marketId ?? 'OTHER', chosenPlan, paymentMethod === 'fiat' || paymentMethod === 'crypto' ? paymentMethod : undefined) : undefined
  const chosenPrice = chosenOffer ? formatRegionalOffer(chosenOffer, locale) : null
  const authReturnTo = chosenPlan ? `/login?plano=${encodeURIComponent(chosenPlan)}${requestedPayment === 'fiat' || requestedPayment === 'crypto' || requestedPayment === 'pix' ? `&payment=${requestedPayment}` : ''}` : undefined
  const referralParam = search.get('ref')?.trim()
  const [mode, setMode] = useState<LoginMode>(() => authConfigured && callbackState.isRecovery ? 'recovery' : 'signin')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'invalid' | 'checking' | 'available' | 'taken' | 'error'>('idle')
  const [email, setEmail] = useState('')
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [signInMethod, setSignInMethod] = useState<'password' | 'magic-link'>('password')
  const [canResendConfirmation, setCanResendConfirmation] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const tokenVerificationStarted = useRef(false)

  useEffect(() => {
    if (referralParam) rememberReferral(referralParam)
  }, [referralParam])

  useEffect(() => {
    if (callbackState.error) setError(callbackState.error)
    if (isPasswordRecovery) {
      setMode('recovery')
      setError(null)
      setMessage(null)
    }
  }, [callbackState, isPasswordRecovery])

  // Links enviados pelo Resend apontam para este site (token_hash), não para o Supabase.
  // O token é trocado por sessão aqui; o link é de uso único.
  useEffect(() => {
    const tokenHash = search.get('token_hash')
    const otpType = search.get('type')
    if (!tokenHash || !supabase || tokenVerificationStarted.current) return
    if (!otpType || !emailOtpTypes.includes(otpType as EmailOtpType)) return
    tokenVerificationStarted.current = true
    setIsSubmitting(true)
    void supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType as EmailOtpType }).then(({ error: verifyError }) => {
      navigate(otpType === 'recovery' ? '/login?recovery=1' : '/login', { replace: true })
      if (verifyError) setError('Esse link é inválido ou expirou. Solicite um novo e-mail e tente novamente.')
    }).finally(() => setIsSubmitting(false))
  }, [search, navigate])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = window.setInterval(() => setResendCooldown((remaining) => Math.max(0, remaining - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [resendCooldown > 0])

  useEffect(() => {
    if (mode !== 'signup') return
    if (!username) { setUsernameStatus('idle'); return }
    if (!isValidAffiliateHandle(username)) { setUsernameStatus('invalid'); return }
    let active = true
    setUsernameStatus('checking')
    const timeout = window.setTimeout(() => {
      void isAffiliateHandleAvailable(username)
        .then((available) => { if (active) setUsernameStatus(available ? 'available' : 'taken') })
        .catch(() => { if (active) setUsernameStatus('error') })
    }, 300)
    return () => { active = false; window.clearTimeout(timeout) }
  }, [mode, username])

  useEffect(() => {
    if (!user || mode === 'recovery' || callbackState.error) return
    const requestedPath = location.state?.from
    const destination = chosenPlan
      ? `${localizedPath('/checkout', locale)}?plan=${chosenPlan}${requestedPayment === 'fiat' || requestedPayment === 'crypto' || requestedPayment === 'pix' ? `&payment=${requestedPayment}` : ''}`
      : requestedPath && user.role !== 'admin' && safeRedirectPath(requestedPath)
      ? requestedPath
      : destinationForRole(user.role)
    navigate(destination, { replace: true })
  }, [user, mode, callbackState.error, location.state, navigate, chosenPlan, requestedPayment, locale])

  const goToSession = (session: AppSession) => {
    const requestedPath = location.state?.from
    const destination = chosenPlan
      ? `${localizedPath('/checkout', locale)}?plan=${chosenPlan}${requestedPayment === 'fiat' || requestedPayment === 'crypto' || requestedPayment === 'pix' ? `&payment=${requestedPayment}` : ''}`
      : requestedPath && session.role !== 'admin' && safeRedirectPath(requestedPath)
      ? requestedPath
      : destinationForRole(session.role)
    navigate(destination, { replace: true })
  }

  const setFormMode = (nextMode: LoginMode) => {
    setMode(nextMode)
    setError(null)
    setMessage(null)
    setPassword('')
    setSignInMethod('password')
    setCanResendConfirmation(false)
    if (callbackState.isRecovery || callbackState.error) navigate('/login', { replace: true })
  }

  const resendConfirmation = async () => {
    if (resendCooldown > 0 || isSubmitting) return
    setError(null)
    setMessage(null)
    setResendCooldown(60)
    setIsSubmitting(true)
    try {
      await resendSignupConfirmation(email, authReturnTo)
      setMessage('Se houver uma confirmação pendente para esse e-mail, enviaremos outra mensagem.')
    } catch (resendError) {
      setError(authErrorText(resendError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (mode === 'signup' && !name.trim()) {
      setError('Informe seu nome para criar a conta.')
      return
    }
    if (mode === 'signup' && !isValidAffiliateHandle(username)) {
      setError('Escolha um ID de 3 a 24 caracteres. Comece com letra; use letras, números, - ou _.')
      return
    }
    if ((mode === 'signup' || mode === 'recovery') && password.length < 12) {
      setError('Use uma senha com pelo menos 12 caracteres.')
      return
    }

    setIsSubmitting(true)
    try {
      if (mode === 'signin') {
        if (signInMethod === 'magic-link') {
          await sendMagicLink(email, authReturnTo)
          setMessage('Se houver uma conta com esse e-mail, enviaremos um link seguro para entrar.')
        } else {
          const session = await signInWithPassword(email, password)
          goToSession(session)
        }
      } else if (mode === 'signup') {
        const available = await isAffiliateHandleAvailable(username)
        if (!available) throw new Error('Este ID já está em uso ou reservado. Escolha outro.')
        const signedIn = await signUpWithPassword(name, username, email, password, marketingOptIn, authReturnTo)
        if (signedIn) goToSession(signedIn)
        else {
          setCanResendConfirmation(true)
          setMessage(`Conta criada. Confirme seu e-mail para entrar. Seu link de afiliado: ${window.location.origin}/${username}`)
        }
      } else if (mode === 'reset') {
        await sendPasswordReset(email)
        setMessage('Se houver conta para este e-mail, você receberá um link para redefinir a senha.')
      } else {
        await updatePassword(password)
        navigate(user ? destinationForRole(user.role) : '/login', { replace: true })
      }
    } catch (submitError) {
      setError(authErrorText(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const title = omegaCopy.login[mode]
  const description = mode === 'signup'
    ? 'Escolha seu ID público. Ele vira seu link de indicação assim que criar a conta.'
    : mode === 'reset'
      ? 'Enviaremos um link seguro se houver conta para esse e-mail.'
      : mode === 'recovery'
        ? 'Escolha uma senha nova para proteger sua conta.'
        : signInMethod === 'magic-link'
          ? 'Enviaremos um link seguro ao seu e-mail para você entrar.'
          : 'Acesse com seu e-mail e senha.'
  const displayHandle = username.trim().toLowerCase() || 'seu-id'
  const usernameHintColor = usernameStatus === 'available' ? 'text-[#8ed7b7]' : usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'text-[#f2a8b2]' : usernameStatus === 'checking' ? 'text-[#b5a3e6]' : 'text-[#71847a]'

  return (
    <div className="omega-login min-h-[100dvh] w-full max-w-full bg-[#0b0d0c] text-[#e8ece8] lg:grid lg:h-[100dvh] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:overflow-hidden">
      <PageMeta title={translateUi("Acesso")} description={translateUi("Entre na Omega para acessar suas jornadas e seu progresso de estudo.")} path="/login" privatePage />
      <style>{translateUi(`
        @keyframes login-shimmer-slide { from { transform: translateX(-120%); } to { transform: translateX(320%); } }
        @keyframes login-enter { from { opacity: 0; transform: translateY(16px); filter: blur(5px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
        .login-enter { animation: login-enter .7s cubic-bezier(.2,.8,.2,1) both; }
        .login-enter-delay { animation: login-enter .8s cubic-bezier(.2,.8,.2,1) .12s both; }
        .login-shimmer { position: absolute; inset: 0; width: 38%; border-radius: inherit; background: linear-gradient(100deg, transparent, rgba(255,255,255,.55), transparent); animation: login-shimmer-slide 2.2s ease-in-out infinite; pointer-events: none; }
        @media (prefers-reduced-motion: reduce) { .login-shimmer, .login-enter, .login-enter-delay { animation: none; } }
      `)}</style>

      {/* LEFT — form column */}
      <main className="relative flex min-h-[100dvh] p-5 sm:p-9 lg:h-[100dvh] lg:min-h-0 lg:overflow-y-auto lg:px-12 xl:px-20">
        <div className="relative m-auto w-full max-w-[420px] py-5 sm:py-8 lg:py-6">
          <div className="mb-14 flex items-center justify-between gap-4">
            <Brand />
            {user?.isFounder && <FounderBadge isFounder={user.isFounder} />}
            <Link to="/landing" className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-[#a1aaa2] transition hover:text-white">
              <ArrowLeft size={13} /> {translateUi(" Voltar ao curso")}</Link>
          </div>

          <OmegaLoginScene compact />
          <div className="login-enter mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#91a394]">{translateUi("Acesso à plataforma")}</p>
            <h2 className="mt-3 max-w-[18ch] font-display text-[34px] font-medium leading-[1.12] tracking-[-.045em] text-[#f0f2ee]">
              {translateUi(title)}
            </h2>
            <p className="mt-3 max-w-[42ch] text-sm leading-relaxed text-[#a0aaa1]">{translateUi(description)}</p>
          </div>

          {chosenPlan && (
            <div className="login-enter-delay mb-6 rounded-2xl border border-[#e4bc76]/20 bg-gradient-to-b from-[#e4bc76]/[.07] to-transparent p-4 backdrop-blur-md">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#e4bc76]">{translateUi("Plano selecionado")}</p>
              <div className="mt-2 flex items-start justify-between gap-4">
                <p className="pt-1 font-display text-lg font-medium tracking-[-.02em] text-[#e6efe8]">{translateUi("Plano ")}{translateUi(plans[chosenPlan].name)}</p>
                {chosenPrice && <div className="text-right">
                  <span className="inline-block rounded-full border border-white/[.1] bg-white/[.04] px-2.5 py-1 text-xs font-medium text-[#d2c4ff]">{chosenPrice}</span>
                  <p className="mt-2 text-[10px] font-medium text-[#bca9e8]">{locale === 'en' ? 'one-time payment' : locale === 'es' ? 'pago único' : 'pagamento único'}</p>
                </div>}
              </div>
              {!chosenPrice && <p role={pricingError ? 'alert' : 'status'} className="mt-2 text-[10px] leading-relaxed text-[#bca9e8]">{pricingError
                ? (locale === 'en' ? 'Regional price could not be loaded.' : locale === 'es' ? 'No se pudo cargar el precio regional.' : 'Não foi possível carregar o preço regional.')
                : marketLoading
                  ? (locale === 'en' ? 'Loading regional price…' : locale === 'es' ? 'Cargando precio regional…' : 'Carregando preço regional…')
                  : (locale === 'en' ? 'Price unavailable in this region.' : locale === 'es' ? 'Precio no disponible en esta región.' : 'Preço indisponível nesta região.')}</p>}
              <p className="mt-2 text-[10px] leading-relaxed text-[#b7a77e]">{translateUi("Sua escolha fica salva. Depois de entrar ou criar a conta, você volta para concluir o pagamento.")}</p>
            </div>
          )}

          {authConfigured && mode !== 'recovery' && (
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border border-white/[.08] bg-white/[.03] p-1.5 text-[13px] font-medium backdrop-blur-xl" role="tablist" aria-label={translateUi("Alternar entre entrar e criar conta")}>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signin' || mode === 'reset'}
                onClick={() => setFormMode('signin')}
                className={`rounded-xl px-3 py-2.5 transition-all duration-300 ${mode === 'signin' || mode === 'reset' ? 'bg-[#262433] text-white shadow-[0_6px_20px_rgba(0,0,0,.35),inset_0_1px_rgba(255,255,255,.08)]' : 'text-[#82968a] hover:text-white'}`}
              >
                {translateUi("Entrar")}</button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                onClick={() => setFormMode('signup')}
                className={`rounded-xl px-3 py-2.5 transition-all duration-300 ${mode === 'signup' ? 'bg-[#262433] text-white shadow-[0_6px_20px_rgba(0,0,0,.35),inset_0_1px_rgba(255,255,255,.08)]' : 'text-[#82968a] hover:text-white'}`}
              >
                {translateUi("Criar conta")}</button>
            </div>
          )}

          {!authConfigured ? (
            <div className="rounded-2xl border border-[#e4bc76]/15 bg-[#e4bc76]/[.035] p-4">
              <p className="text-xs font-medium text-[#e8d4a7]">{translateUi("Login indisponível no momento")}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[#a39471]">{translateUi("O acesso por conta está em manutenção. Você ainda pode explorar as áreas públicas.")}</p>
            </div>
          ) : mode === 'recovery' && loading ? (
            <div className="rounded-2xl border border-white/[.08] bg-white/[.03] p-4 text-sm text-[#8fa197]" role="status">{translateUi("Validando link de recuperação…")}</div>
          ) : mode === 'recovery' && (!user || !isPasswordRecovery) ? (
            <div className="rounded-2xl border border-[#f28c9a]/20 bg-[#f28c9a]/[.06] p-4 text-xs leading-relaxed text-[#f2a8b2]">
              <p role="alert">{translateUi(error ?? authError ?? "Link inválido ou expirado. Volte ao login e solicite outra recuperação de senha.")}</p>
              <button type="button" onClick={() => setFormMode('reset')} className="mt-4 rounded-lg px-1 py-2 font-medium text-[#b49cff] hover:text-white">{translateUi('Solicitar novo link de recuperação')}</button>
              <button type="button" onClick={() => setFormMode('signin')} className="ml-3 rounded-lg px-1 py-2 text-[#8fa197] hover:text-white">{translateUi('Voltar ao login')}</button>
            </div>
          ) : (
            <form onSubmit={submit} className="login-enter-delay space-y-4">
              {authConfigured && mode === 'signup' && (
                <div>
                  <label htmlFor="name" className="mb-2 block text-xs font-semibold text-[#c3d0c6]">{translateUi("Seu nome")}</label>
                  <input
                    id="name" name="name" autoComplete="name" required value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={translateUi("Como devemos chamar você?")}
                    className="h-12 w-full rounded-2xl border border-white/[.1] bg-white/[.035] px-4 text-sm text-[#e3ece5] shadow-[inset_0_1px_rgba(255,255,255,.05)] outline-none backdrop-blur-md transition placeholder:text-[#63766b] focus:border-[#a78bfa]/60 focus:ring-4 focus:ring-[#a78bfa]/15"
                  />
                </div>
              )}

              {authConfigured && mode === 'signup' && (
                <div>
                  <label htmlFor="username" className="mb-2 block text-xs font-semibold text-[#c3d0c6]">{translateUi("Seu @id")}</label>
                  <div className="flex h-12 items-center gap-1 rounded-2xl border border-white/[.1] bg-white/[.035] px-3 shadow-[inset_0_1px_rgba(255,255,255,.05)] backdrop-blur-md transition focus-within:border-[#a78bfa]/60 focus-within:ring-4 focus-within:ring-[#a78bfa]/15">
                    <span aria-hidden="true" className="shrink-0 select-none font-mono text-sm text-[#71847a]">/</span>
                    <input
                      id="username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false}
                      minLength={3} maxLength={24} pattern="[a-z][a-z0-9_-]{2,23}" required value={username}
                      onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 24))}
                      placeholder={translateUi("seu-nome")} aria-describedby="username-hint username-status"
                      className="h-full min-w-0 flex-1 bg-transparent px-1 font-mono text-sm text-[#e3ece5] outline-none placeholder:text-[#63766b]"
                    />
                    <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold transition-colors duration-300 ${usernameStatus === 'available' ? 'border-[#8ed7b7]/30 bg-[#8ed7b7]/10 text-[#8ed7b7]' : usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-[#f28c9a]/25 bg-[#f28c9a]/[.07] text-[#f2a8b2]' : 'border-white/[.08] bg-white/[.03] text-[#71847a]'}`}>
                      {translateUi(usernameStatus === 'checking' ? 'Verificando…' : usernameStatus === 'available' ? 'Disponível' : usernameStatus === 'taken' ? 'Em uso' : usernameStatus === 'invalid' ? 'Inválido' : usernameStatus === 'error' ? 'Erro' : 'ID')}
                    </span>
                  </div>
                  <div className="mt-2 flex min-h-4 flex-wrap items-center justify-between gap-2 text-[10px]">
                    <span id="username-hint" className="text-[#71847a]">{translateUi("Vira seu link /seu-id e seu código de afiliado. Não pode trocar depois.")}</span>
                    <span id="username-status" role="status" className={usernameHintColor}>
                      {translateUi(usernameStatus === 'checking' ? 'Verificando…' : usernameStatus === 'available' ? 'Disponível' : usernameStatus === 'taken' ? 'Em uso ou reservado' : usernameStatus === 'invalid' ? 'Use 3–24 caracteres; comece com letra' : usernameStatus === 'error' ? 'Não foi possível verificar agora' : '')}
                    </span>
                  </div>
                  <p className="mt-2 flex items-center gap-2 truncate rounded-xl border border-white/[.07] bg-black/30 px-3 py-2.5 font-mono text-[11px] text-[#b9a8e8] backdrop-blur-md">
                    <Link2 size={12} className="shrink-0 text-[#8f7cc4]" />
                    <span className="truncate">{translateUi(typeof window !== 'undefined' ? window.location.origin : '')}/{translateUi(displayHandle)}</span>
                  </p>
                </div>
              )}

              {authConfigured && mode !== 'recovery' && (
                <div>
                  <label htmlFor="email" className="mb-2 block text-xs font-semibold text-[#c3d0c6]">{translateUi("E-mail")}</label>
                  <input
                    id="email" name="email" type="email" autoComplete="email" required value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={translateUi("voce@exemplo.com")}
                    className="h-12 w-full rounded-2xl border border-white/[.1] bg-white/[.035] px-4 text-sm text-[#e3ece5] shadow-[inset_0_1px_rgba(255,255,255,.05)] outline-none backdrop-blur-md transition placeholder:text-[#63766b] focus:border-[#a78bfa]/60 focus:ring-4 focus:ring-[#a78bfa]/15"
                  />
                </div>
              )}

              {authConfigured && mode !== 'reset' && !(mode === 'signin' && signInMethod === 'magic-link') && (
                <div>
                  <label htmlFor="password" className="mb-2 block text-xs font-semibold text-[#c3d0c6]">{translateUi(mode === 'recovery' ? 'Nova senha' : 'Senha')}</label>
                  <div className="relative">
                    <input
                      id="password" name="password" type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'signup' || mode === 'recovery' ? 'new-password' : 'current-password'}
                      minLength={mode === 'signup' || mode === 'recovery' ? 12 : undefined}
                      required value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={translateUi(mode === 'signin' ? 'Sua senha' : 'Pelo menos 12 caracteres')}
                      className="h-12 w-full rounded-2xl border border-white/[.1] bg-white/[.035] px-4 pr-14 text-sm text-[#e3ece5] shadow-[inset_0_1px_rgba(255,255,255,.05)] outline-none backdrop-blur-md transition placeholder:text-[#63766b] focus:border-[#a78bfa]/60 focus:ring-4 focus:ring-[#a78bfa]/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={translateUi(showPassword ? 'Ocultar senha' : 'Mostrar senha')}
                      title={translateUi(showPassword ? 'Ocultar senha' : 'Mostrar senha')}
                      aria-pressed={showPassword}
                      className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-xl text-[#81948a] transition hover:bg-white/[.06] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b49cff]"
                    >
                      <span className="relative grid size-5 place-items-center">
                        <Eye size={18} className={`absolute transition-all duration-300 ${showPassword ? 'scale-50 opacity-0' : 'scale-100 opacity-100'}`} />
                        <EyeOff size={18} className={`absolute transition-all duration-300 ${showPassword ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} />
                      </span>
                    </button>
                  </div>
                  {mode === 'signup' && (
                    <PasswordStrength password={password} />
                  )}
                  {(mode === 'signup' || mode === 'recovery') && password.length === 0 && (
                    <p className="mt-2 text-[10px] leading-relaxed text-[#71847a]">{translateUi("Use pelo menos 12 caracteres. Prefira uma senha única e um gerenciador confiável.")}</p>
                  )}
                </div>
              )}

              {authConfigured && mode === 'signup' && (
                <label htmlFor="marketing-opt-in" className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[.07] bg-white/[.02] px-3.5 py-3 text-[11px] leading-relaxed text-[#aab6ad]">
                  <input
                    id="marketing-opt-in"
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={(event) => setMarketingOptIn(event.target.checked)}
                    className="mt-0.5 size-4 shrink-0 accent-[#b49cff]"
                  />
                  <span>{translateUi("Quero receber por e-mail conteúdos gratuitos, novidades e convites da Omega. Posso cancelar quando quiser.")}</span>
                </label>
              )}

              {mode === 'signin' && authConfigured && (
                <div className="flex justify-end">
                  <button type="button" onClick={() => setFormMode('reset')} className="rounded-lg px-1 py-1 text-xs font-medium text-[#b49cff] transition hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b49cff]">
                    {translateUi("Esqueci minha senha")}</button>
                </div>
              )}
              {mode === 'signin' && authConfigured && (
                <button
                  type="button"
                  onClick={() => { setSignInMethod((current) => current === 'password' ? 'magic-link' : 'password'); setPassword(''); setError(null); setMessage(null) }}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/[.1] bg-white/[.02] text-sm font-medium text-[#d7d4e0] transition hover:border-[#b49cff]/40 hover:bg-white/[.05] hover:text-white"
                >
                  {signInMethod === 'password' ? <Mail size={15} strokeWidth={1.8} /> : <KeyRound size={15} strokeWidth={1.8} />}
                  {translateUi(signInMethod === 'password' ? 'Entrar por link enviado ao e-mail' : 'Entrar com senha')}
                </button>
              )}
              {mode === 'signin' && authConfigured && (
                <button
                  type="button"
                  disabled={isSubmitting || !email.trim() || resendCooldown > 0}
                  onClick={resendConfirmation}
                  className="flex h-8 w-full items-center justify-center text-xs text-[#8fa197] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {translateUi('Reenviar e-mail de confirmação')}{resendCooldown > 0 ? ` (${resendCooldown}s)` : ''}
                </button>
              )}
              {error && <p role="alert" className="rounded-2xl border border-[#f28c9a]/20 bg-[#f28c9a]/[.06] px-3.5 py-2.5 text-xs leading-relaxed text-[#f2a8b2]">{translateUi(error)}</p>}
              {authError && authConfigured && mode !== 'recovery' && <p role="alert" className="rounded-2xl border border-[#f28c9a]/20 bg-[#f28c9a]/[.06] px-3.5 py-2.5 text-xs leading-relaxed text-[#f2a8b2]">{translateUi(authError)}</p>}
              {message && <p role="status" className="rounded-2xl border border-[#98abff]/20 bg-[#98abff]/[.06] px-3.5 py-2.5 text-xs leading-relaxed text-[#b5c2ff]">{translateUi(message)}</p>}
              <button
                type="submit" disabled={isSubmitting || loading}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#b49cff] px-4 text-sm font-semibold text-[#100c19] shadow-[0_10px_36px_rgba(180,156,255,.28)] transition hover:bg-[#c6b4ff] disabled:cursor-wait disabled:opacity-60"
              >
                {translateUi(isSubmitting ? 'Aguarde…' : mode === 'signup' ? 'Criar conta' : mode === 'reset' ? 'Enviar link de recuperação' : mode === 'recovery' ? 'Atualizar senha' : signInMethod === 'magic-link' ? 'Enviar link para entrar' : 'Entrar com e-mail')}
                <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
              {mode === 'reset' && <button type="button" onClick={() => setFormMode('signin')} className="w-full rounded-lg py-1.5 text-xs text-[#8fa197] transition hover:text-white">{translateUi("Voltar ao login")}</button>}
              {mode === 'recovery' && <button type="button" onClick={() => setFormMode('signin')} className="w-full rounded-lg py-1.5 text-xs text-[#8fa197] transition hover:text-white">{translateUi("Voltar ao login")}</button>}
              {mode === 'signup' && canResendConfirmation && (
                <button
                  type="button"
                  disabled={isSubmitting || !email.trim() || resendCooldown > 0}
                  onClick={resendConfirmation}
                  className="w-full rounded-lg py-1.5 text-xs text-[#b49cff] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {translateUi('Reenviar e-mail de confirmação')}{resendCooldown > 0 ? ` (${resendCooldown}s)` : ''}
                </button>
              )}
            </form>
          )}

          {authConfigured && mode !== 'recovery' && (
            <p className="mt-6 text-center text-[10px] leading-relaxed text-[#71847a]">
              {translateUi("Ao criar conta, enviaremos confirmação para seu e-mail. O ID não pode ser trocado depois, pois faz parte do link compartilhado.")}</p>
          )}
          {mode === 'recovery' && !loading && user && (
            <button type="button" onClick={() => navigate(destinationForRole(user.role), { replace: true })} className="mt-3 w-full text-center text-xs font-medium text-[#b49cff] transition hover:text-white">
              {translateUi("Continuar para sua área")}</button>
          )}
          <div className="mt-8 flex items-center justify-center gap-4 border-t border-white/[.06] pt-5 text-[10px] text-[#76897e]">
            <Link to="/landing#jornada" className="transition hover:text-white">{translateUi("Conhecer a trilha")}</Link>
            <span className="size-1 rounded-full bg-[#52665a]" aria-hidden="true" />
            <Link to="/planos" className="transition hover:text-white">{translateUi("Ver planos")}</Link>
          </div>
        </div>
      </main>

      <aside className="omega-login-panel relative hidden overflow-hidden lg:block lg:h-[100dvh]">
        <OmegaBrandScene className="absolute inset-0" />
        <p className="absolute inset-x-0 bottom-10 text-center text-sm text-[#aaa3bc]">{translateUi(omegaCopy.sceneCaption)}</p>
      </aside>
    </div>
  )
}
