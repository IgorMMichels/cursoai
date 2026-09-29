import { useState } from 'react'
import { ArrowLeft, ArrowRight, BadgeCheck, BookOpen, BriefcaseBusiness, ShieldCheck, WalletCards } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Brand } from '@/components/brand'
import { useSession, destinationForRole } from '@/contexts/session-context'
import { plans, type Currency, type PlanId } from '@/lib/offers'
import type { UserRole } from '@/lib/storage'
import { getPendingOrder } from '@/lib/storage'

const roles: { role: UserRole; title: string; detail: string; icon: typeof BookOpen }[] = [
  { role: 'student', title: 'Entrar como aluno', detail: 'Aulas, progresso e exercícios', icon: BookOpen },
  { role: 'admin', title: 'Abrir painel admin', detail: 'Métricas e pedidos de demonstração', icon: BriefcaseBusiness },
  { role: 'affiliate', title: 'Abrir área de afiliado', detail: 'Indicações e comissão de 20%', icon: WalletCards },
]

export function LoginPage() {
  const { user, signInDemo, signOut } = useSession()
  const [search] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const pending = getPendingOrder()
  const queryPlan = search.get('plano') as PlanId | null
  const currencyParam = search.get('moeda') as Currency | null
  const chosenPlan = pending?.plan ?? (queryPlan && queryPlan in plans ? queryPlan : undefined)
  const chosenCurrency = pending?.currency ?? (currencyParam === 'SOL' || currencyParam === 'BRL' ? currencyParam : 'BRL')
  const [name, setName] = useState('')

  if (user && !chosenPlan) return <Navigate to={destinationForRole(user.role)} replace />

  const enter = (role: UserRole) => {
    if (user) signOut()
    const session = signInDemo(role, name || undefined)
    const destination = location.state?.from && role === 'student' ? location.state.from : destinationForRole(session.role)
    navigate(destination, { replace: true })
  }

  return <div className="min-h-screen bg-[#09090d] text-[#e6eee9] lg:grid lg:grid-cols-[1fr_.8fr]">
    <section className="relative hidden overflow-hidden border-r border-white/[.06] bg-[#0d0e14] lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
      <div className="absolute -left-24 top-[22%] size-[350px] rounded-full bg-[#a78bfa]/[.07] blur-[100px]" /><div className="absolute bottom-[-160px] right-[-120px] size-[420px] rounded-full bg-[#98abff]/[.06] blur-[120px]" />
      <div className="relative"><Brand /><p className="eyebrow mt-20">um lugar para pensar com calma</p><h1 className="mt-5 max-w-xl font-display text-5xl font-medium leading-[1.02] tracking-[-.07em] text-[#eaf2ec] xl:text-6xl">Seu processo vale mais do que uma aposta.</h1><p className="mt-5 max-w-md text-sm leading-relaxed text-[#92a59a]">Uma biblioteca de aulas e exercícios para entender o mercado sem transformar curiosidade em pressa.</p></div>
      <div className="relative flex flex-wrap gap-4 text-[10px] text-[#82968a]"><span className="flex items-center gap-2"><BookOpen size={13} className="text-[#a78bfa]" />9 módulos · 27 aulas</span><span className="flex items-center gap-2"><ShieldCheck size={13} className="text-[#98abff]" />educação com contexto de risco</span></div>
    </section>
    <main className="grid min-h-screen place-items-center p-5 sm:p-9">
      <div className="w-full max-w-[460px]">
        <div className="mb-9 flex items-center justify-between lg:hidden"><Brand /><Link to="/landing" className="text-xs text-[#8da096] hover:text-white">Voltar ao curso</Link></div>
        <Link to="/landing" className="mb-9 hidden items-center gap-2 text-xs text-[#8a9d92] hover:text-white lg:inline-flex"><ArrowLeft size={14} />Voltar para a apresentação</Link>
        <div className="mb-7"><div className="mb-5 grid size-11 place-items-center rounded-lg border border-[#a78bfa]/20 bg-[#a78bfa]/[.08] text-[#a78bfa]"><BadgeCheck size={20} /></div><p className="eyebrow">acesso de demonstração</p><h2 className="mt-3 font-display text-3xl font-medium tracking-[-.05em] text-[#e9f1eb]">Entre para explorar.</h2><p className="mt-2 text-sm leading-relaxed text-[#8fa197]">Escolha uma área. Não precisa de senha nem de conta externa.</p></div>
        {chosenPlan && <div className="mb-6 rounded-xl border border-[#a78bfa]/18 bg-[#a78bfa]/[.055] p-4"><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[#c1acff]">pedido de demonstração selecionado</p><div className="mt-2 flex items-start justify-between gap-4"><p className="pt-1 font-display text-lg font-medium text-[#e6efe8]">Plano {plans[chosenPlan].name}</p><div className="text-right"><span className="rounded-full border border-[#a78bfa]/20 px-2.5 py-1 text-xs font-medium text-[#d2c4ff]">{plans[chosenPlan].prices[chosenCurrency]}</span><p className="mt-2 text-[10px] font-medium text-[#bca9e8]">ou {chosenCurrency === 'SOL' ? plans[chosenPlan].prices.BRL : plans[chosenPlan].prices.SOL}</p></div></div><p className="mt-1 text-[10px] leading-relaxed text-[#879b90]">Nenhum pagamento será cobrado. O acesso e a comissão serão marcados como demonstração.</p></div>}
        <label className="mb-2 block text-xs font-medium text-[#b3c1b8]">Como devemos chamar você?</label><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Seu nome (opcional)" className="mb-5 h-11 w-full rounded-xl border border-white/[.1] bg-[#12121a] px-4 text-sm text-[#e3ece5] outline-none placeholder:text-[#63766b] focus:border-[#a78bfa]/40 focus:ring-2 focus:ring-[#a78bfa]/10" />
        <div className="space-y-2.5">{roles.map(({ role, title, detail, icon: Icon }) => <button key={role} type="button" onClick={() => enter(role)} className={`focus-ring group flex w-full items-center gap-3.5 rounded-xl border px-4 py-4 text-left transition-colors ${role === 'student' && chosenPlan ? 'border-[#a78bfa]/30 bg-[#171621]' : 'border-white/[.08] bg-[#12121a] hover:border-white/[.16] hover:bg-white/[.035]'}`}><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${role === 'student' ? 'bg-[#a78bfa]/[.09] text-[#c1acff]' : role === 'admin' ? 'bg-[#98abff]/[.09] text-[#a8b5ff]' : 'bg-[#e4bc76]/[.09] text-[#e4bc76]'}`}><Icon size={18} /></span><span className="flex-1"><span className="block text-sm font-medium text-[#dce7df]">{chosenPlan && role === 'student' ? 'Ativar acesso de demonstração' : title}</span><span className="mt-1 block text-[11px] text-[#81948a]">{detail}</span></span><ArrowRight size={15} className="text-[#70847a] transition-transform group-hover:translate-x-1 group-hover:text-[#a78bfa]" /></button>)}</div>
        <p className="mt-5 text-center text-[10px] leading-relaxed text-[#71847a]">Login e dados ficam apenas no armazenamento local deste navegador. Não use dados pessoais reais nesta versão.</p>
        <div className="mt-7 flex items-center justify-center gap-4 border-t border-white/[.06] pt-5 text-[10px] text-[#76897e]"><Link to="/landing#jornada" className="hover:text-white">Conhecer a trilha</Link><span className="size-1 rounded-full bg-[#52665a]" /><Link to="/landing#planos" className="hover:text-white">Ver planos</Link></div>
      </div>
    </main>
  </div>
}




