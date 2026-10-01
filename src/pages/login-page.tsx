import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, BadgeCheck, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Brand } from '@/components/brand'
import { destinationForRole, useSession } from '@/contexts/session-context'
import { isAffiliateHandleAvailable, isValidAffiliateHandle } from '@/lib/affiliate-service'
import { plans, type Currency, type PlanId } from '@/lib/offers'
import { rememberReferral } from '@/lib/storage'
import type { AppSession } from '@/contexts/session-context'

type LoginMode = 'signin' | 'signup' | 'reset' | 'recovery'

function authErrorText(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  if (/23505|duplicate key|profiles_username_key/i.test(message)) return 'Este ID acabou de ser escolhido. Tente outro.'
  if (/ID indisponível|profiles_username_format/i.test(message)) return 'Escolha um ID válido, disponível, com 3 a 24 caracteres.'
  return message || 'Não foi possível concluir. Tente novamente.'
}

function safeRedirectPath(path: unknown): path is string {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\')
}

export function LoginPage() {
  const {
    user,
    loading,
    authConfigured,
    authError,
    signInWithPassword,
    signUpWithPassword,
    sendPasswordReset,
    updatePassword,
  } = useSession()
  const [search] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const queryPlan = search.get('plano') as PlanId | null
  const currencyParam = search.get('moeda') as Currency | null
  const chosenPlan = queryPlan && queryPlan in plans ? queryPlan : undefined
  const chosenCurrency = currencyParam === 'SOL' || currencyParam === 'BRL' ? currencyParam : 'BRL'
  const referralParam = search.get('ref')?.trim()
  const [mode, setMode] = useState<LoginMode>(() => authConfigured && search.get('recovery') === '1' ? 'recovery' : 'signin')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'invalid' | 'checking' | 'available' | 'taken' | 'error'>('idle')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (referralParam) rememberReferral(referralParam)
  }, [referralParam])

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
    if (!user || mode === 'recovery') return
    const requestedPath = location.state?.from
    const destination = requestedPath && user.role !== 'admin' && safeRedirectPath(requestedPath)
      ? requestedPath
      : destinationForRole(user.role)
    navigate(destination, { replace: true })
  }, [user, mode, location.state, navigate])

  const goToSession = (session: AppSession) => {
    const requestedPath = location.state?.from
    const destination = requestedPath && session.role !== 'admin' && safeRedirectPath(requestedPath)
      ? requestedPath
      : destinationForRole(session.role)
    navigate(destination, { replace: true })
  }

  const setFormMode = (nextMode: LoginMode) => {
    setMode(nextMode)
    setError(null)
    setMessage(null)
    setPassword('')
    if (search.has('recovery')) navigate('/login', { replace: true })
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
        const session = await signInWithPassword(email, password)
        goToSession(session)
      } else if (mode === 'signup') {
        const available = await isAffiliateHandleAvailable(username)
        if (!available) throw new Error('Este ID já está em uso ou reservado. Escolha outro.')
        const signedIn = await signUpWithPassword(name, username, email, password)
        if (signedIn) goToSession(signedIn)
        else setMessage(`Conta criada. Confirme seu e-mail para entrar. Seu link de afiliado: ${window.location.origin}/${username}`)
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

  const title = mode === 'signup' ? 'Crie sua conta.' : mode === 'reset' ? 'Recupere seu acesso.' : mode === 'recovery' ? 'Defina uma nova senha.' : 'Entre para continuar.'
  const description = mode === 'signup'
    ? 'Escolha seu ID público. Ele vira seu link de indicação assim que criar a conta.'
    : mode === 'reset'
      ? 'Enviaremos um link seguro se houver conta para esse e-mail.'
      : mode === 'recovery'
        ? 'Escolha uma senha nova para proteger sua conta.'
        : 'Acesse com seu e-mail e senha.'

  return <div className="min-h-screen bg-[#09090d] text-[#e6eee9] lg:grid lg:grid-cols-[1fr_.8fr]">
    <section className="relative hidden overflow-hidden border-r border-white/[.06] bg-[#0d0e14] lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
      <div className="absolute -left-24 top-[22%] size-[350px] rounded-full bg-[#a78bfa]/[.07] blur-[100px]" /><div className="absolute bottom-[-160px] right-[-120px] size-[420px] rounded-full bg-[#98abff]/[.06] blur-[120px]" />
      <div className="relative"><Brand /><p className="eyebrow mt-20">um lugar para pensar com calma</p><h1 className="mt-5 max-w-xl font-display text-5xl font-medium leading-[1.02] tracking-[-.07em] text-[#eaf2ec] xl:text-6xl">Seu processo vale mais do que uma aposta.</h1><p className="mt-5 max-w-md text-sm leading-relaxed text-[#92a59a]">Uma biblioteca de aulas e exercícios para entender o mercado sem transformar curiosidade em pressa.</p></div>
      <div className="relative flex flex-wrap gap-4 text-[10px] text-[#82968a]"><span className="flex items-center gap-2"><ShieldCheck size={13} className="text-[#98abff]" />acesso pessoal e protegido</span></div>
    </section>
    <main className="grid min-h-screen place-items-center p-5 sm:p-9">
      <div className="w-full max-w-[460px]">
        <div className="mb-9 flex items-center justify-between lg:hidden"><Brand /><Link to="/landing" className="text-xs text-[#8da096] hover:text-white">Voltar ao curso</Link></div>
        <Link to="/landing" className="mb-9 hidden items-center gap-2 text-xs text-[#8a9d92] hover:text-white lg:inline-flex"><ArrowLeft size={14} />Voltar para a apresentação</Link>
        <div className="mb-7"><div className="mb-5 grid size-11 place-items-center rounded-lg border border-[#a78bfa]/20 bg-[#a78bfa]/[.08] text-[#a78bfa]"><BadgeCheck size={20} /></div><p className="eyebrow">acesso à plataforma</p><h2 className="mt-3 font-display text-3xl font-semibold tracking-[-.05em] text-[#e9f1eb]">{title}</h2><p className="mt-2 text-sm leading-relaxed text-[#8fa197]">{description}</p></div>

        {chosenPlan && <div className="mb-6 rounded-xl border border-[#e4bc76]/18 bg-[#e4bc76]/[.045] p-4"><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[#e4bc76]">Plano selecionado</p><div className="mt-2 flex items-start justify-between gap-4"><p className="pt-1 font-display text-lg font-medium text-[#e6efe8]">Plano {plans[chosenPlan].name}</p><div className="text-right"><span className="rounded-full border border-white/[.1] px-2.5 py-1 text-xs font-medium text-[#d2c4ff]">{plans[chosenPlan].prices[chosenCurrency]}</span><p className="mt-2 text-[10px] font-medium text-[#bca9e8]">ou {chosenCurrency === 'SOL' ? plans[chosenPlan].prices.BRL : plans[chosenPlan].prices.SOL}</p></div></div><p className="mt-1 text-[10px] leading-relaxed text-[#b7a77e]">Checkout ainda não está disponível; nenhum pagamento será processado por esta tela.</p></div>}

        {authConfigured && mode !== 'recovery' && <div className="mb-5 grid grid-cols-2 rounded-xl border border-white/[.08] bg-[#12121a] p-1 text-xs">
          <button type="button" onClick={() => setFormMode('signin')} className={`rounded-lg px-3 py-2.5 transition-colors ${mode === 'signin' || mode === 'reset' ? 'bg-[#211f2b] text-white' : 'text-[#82968a] hover:text-white'}`}>Entrar</button>
          <button type="button" onClick={() => setFormMode('signup')} className={`rounded-lg px-3 py-2.5 transition-colors ${mode === 'signup' ? 'bg-[#211f2b] text-white' : 'text-[#82968a] hover:text-white'}`}>Criar conta</button>
        </div>}

        {!authConfigured ? <div className="rounded-xl border border-[#e4bc76]/15 bg-[#e4bc76]/[.035] p-4"><p className="text-xs font-medium text-[#e8d4a7]">Login indisponível no momento</p><p className="mt-1.5 text-[10px] leading-relaxed text-[#a39471]">O acesso por conta está em manutenção. Você ainda pode explorar as áreas públicas.</p></div> : mode === 'recovery' && loading ? <div className="rounded-xl border border-white/[.08] bg-[#12121a] p-4 text-sm text-[#8fa197]" role="status">Validando link de recuperação…</div> : mode === 'recovery' && !user ? <div className="rounded-xl border border-[#f28c9a]/20 bg-[#f28c9a]/[.06] p-4 text-xs leading-relaxed text-[#f2a8b2]" role="alert">Link inválido ou expirado. Volte ao login e solicite outra recuperação de senha.</div> : <form onSubmit={submit} className="space-y-4">
          {authConfigured && mode === 'signup' && <div><label htmlFor="name" className="mb-2 block text-xs font-medium text-[#b3c1b8]">Seu nome</label><input id="name" name="name" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Como devemos chamar você?" className="h-11 w-full rounded-xl border border-white/[.1] bg-[#12121a] px-4 text-sm text-[#e3ece5] outline-none placeholder:text-[#63766b] focus:border-[#a78bfa]/40 focus:ring-2 focus:ring-[#a78bfa]/10" /></div>}
          {authConfigured && mode === 'signup' && <div>
            <label htmlFor="username" className="mb-2 block text-xs font-medium text-[#b3c1b8]">Seu @id</label>
            <div className="flex h-11 items-center gap-1 rounded-xl border border-white/[.1] bg-[#12121a] px-3 focus-within:border-[#a78bfa]/40 focus-within:ring-2 focus-within:ring-[#a78bfa]/10">
              <span aria-hidden="true" className="shrink-0 select-none text-sm text-[#71847a]">/</span>
              <input id="username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} minLength={3} maxLength={24} pattern="[a-z][a-z0-9_-]{2,23}" required value={username} onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 24))} placeholder="seu-nome" aria-describedby="username-hint username-status" className="h-full min-w-0 flex-1 bg-transparent px-1 text-sm text-[#e3ece5] outline-none placeholder:text-[#63766b]" />
            </div>
            <div className="mt-2 flex min-h-4 flex-wrap items-center justify-between gap-2 text-[10px]">
              <span id="username-hint" className="text-[#71847a]">Vira seu link /seu-id e seu código de afiliado. Não pode trocar depois.</span>
              <span id="username-status" role="status" className={usernameStatus === 'available' ? 'text-[#8ed7b7]' : usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'text-[#f2a8b2]' : usernameStatus === 'checking' ? 'text-[#b5a3e6]' : 'text-[#71847a]'}>
                {usernameStatus === 'checking' ? 'Verificando…' : usernameStatus === 'available' ? 'Disponível' : usernameStatus === 'taken' ? 'Em uso ou reservado' : usernameStatus === 'invalid' ? 'Use 3–24 caracteres; comece com letra' : usernameStatus === 'error' ? 'Não foi possível verificar agora' : ''}
              </span>
            </div>
            {username && <p className="mt-2 truncate rounded-lg border border-white/[.06] bg-black/20 px-3 py-2 font-mono text-[10px] text-[#a79ac7]">{window.location.origin}/{username}</p>}
          </div>}
          {authConfigured && mode !== 'recovery' && <div><label htmlFor="email" className="mb-2 block text-xs font-medium text-[#b3c1b8]">E-mail</label><input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" className="h-11 w-full rounded-xl border border-white/[.1] bg-[#12121a] px-4 text-sm text-[#e3ece5] outline-none placeholder:text-[#63766b] focus:border-[#a78bfa]/40 focus:ring-2 focus:ring-[#a78bfa]/10" /></div>}
          {authConfigured && mode !== 'reset' && <div><label htmlFor="password" className="mb-2 block text-xs font-medium text-[#b3c1b8]">{mode === 'recovery' ? 'Nova senha' : 'Senha'}</label><div className="relative"><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : mode === 'recovery' ? 'new-password' : 'current-password'} minLength={mode === 'signup' || mode === 'recovery' ? 12 : undefined} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === 'signin' ? 'Sua senha' : 'Pelo menos 12 caracteres'} className="h-11 w-full rounded-xl border border-white/[.1] bg-[#12121a] px-4 pr-12 text-sm text-[#e3ece5] outline-none placeholder:text-[#63766b] focus:border-[#a78bfa]/40 focus:ring-2 focus:ring-[#a78bfa]/10" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} className="absolute inset-y-0 right-3 grid place-items-center text-[#81948a] hover:text-white">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{(mode === 'signup' || mode === 'recovery') && <p className="mt-2 text-[10px] text-[#71847a]">Use pelo menos 12 caracteres. Prefira senha única e gerenciador confiável.</p>}</div>}

          {mode === 'signin' && authConfigured && <div className="flex justify-end"><button type="button" onClick={() => setFormMode('reset')} className="text-xs text-[#b49cff] hover:text-white hover:underline">Esqueci minha senha</button></div>}
          {error && <p role="alert" className="rounded-lg border border-[#f28c9a]/20 bg-[#f28c9a]/[.06] px-3 py-2.5 text-xs leading-relaxed text-[#f2a8b2]">{error}</p>}
          {authError && authConfigured && mode === 'signin' && <p role="alert" className="rounded-lg border border-[#f28c9a]/20 bg-[#f28c9a]/[.06] px-3 py-2.5 text-xs leading-relaxed text-[#f2a8b2]">{authError}</p>}
          {message && <p role="status" className="rounded-lg border border-[#98abff]/20 bg-[#98abff]/[.06] px-3 py-2.5 text-xs leading-relaxed text-[#b5c2ff]">{message}</p>}
          <button type="submit" disabled={isSubmitting || loading} className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#b49cff] px-4 text-sm font-semibold text-[#100c19] transition-colors hover:bg-[#c6b4ff] disabled:cursor-wait disabled:opacity-60">{isSubmitting ? 'Aguarde…' : mode === 'signup' ? 'Criar conta' : mode === 'reset' ? 'Enviar link de recuperação' : mode === 'recovery' ? 'Atualizar senha' : 'Entrar com e-mail'}<ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" /></button>
          {mode === 'reset' && <button type="button" onClick={() => setFormMode('signin')} className="w-full py-1 text-xs text-[#8fa197] hover:text-white">Voltar ao login</button>}
          {mode === 'recovery' && <button type="button" onClick={() => setFormMode('signin')} className="w-full py-1 text-xs text-[#8fa197] hover:text-white">Voltar ao login</button>}
        </form>}

        {authConfigured && mode !== 'recovery' && <p className="mt-5 text-center text-[10px] leading-relaxed text-[#71847a]">Ao criar conta, enviaremos confirmação para seu e-mail. ID não pode ser trocado depois, pois faz parte do link compartilhado.</p>}
        {mode === 'recovery' && !loading && user && <button type="button" onClick={() => navigate(destinationForRole(user.role), { replace: true })} className="mt-3 w-full text-center text-xs text-[#b49cff] hover:text-white">Continuar para sua área</button>}
        <div className="mt-7 flex items-center justify-center gap-4 border-t border-white/[.06] pt-5 text-[10px] text-[#76897e]"><Link to="/landing#jornada" className="hover:text-white">Conhecer a trilha</Link><span className="size-1 rounded-full bg-[#52665a]" /><Link to="/landing#planos" className="hover:text-white">Ver planos</Link></div>
      </div>
    </main>
  </div>
}
