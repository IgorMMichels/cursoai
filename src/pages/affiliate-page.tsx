import { translateUi, getUiLocale } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Check, Copy, ExternalLink, Link2, MousePointerClick, Quote, Save, Share2, ShieldCheck, Sparkles, UserRound, Wallet, WalletCards } from 'lucide-react'
import { LocalizedLink as Link } from '@/components/localized-router'
import { SiteFooter, SiteHeader } from '@/components/site-header'
import { useSession } from '@/contexts/session-context'
import { loadPublishedReviews, type StudentReview } from '@/lib/community-service'
import { loadAffiliateDashboard, requestAffiliatePayout, saveAffiliatePayoutDestinations } from '@/lib/affiliate-service'
import type { Currency } from '@/lib/offers'

gsap.registerPlugin(ScrollTrigger, useGSAP)

type DashboardData = Awaited<ReturnType<typeof loadAffiliateDashboard>>
type Totals = Record<Currency, { available: number; requested: number; earned: number; paid: number }>

export function AffiliatePage() {
  useUiTranslation();
  const { user } = useSession()
  const activityRef = useRef<HTMLElement>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [reviews, setReviews] = useState<StudentReview[]>([])
  const [reviewIndex, setReviewIndex] = useState(0)
  const [loading, setLoading] = useState(Boolean(user))
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pixKey, setPixKey] = useState('')
  const [solAddress, setSolAddress] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!user) return
    const value = await loadAffiliateDashboard(user.id)
    setData(value)
    setPixKey(value.profile.payout_pix_key ?? '')
    setSolAddress(value.profile.payout_sol_address ?? '')
  }, [user])

  useEffect(() => {
    let active = true
    if (!user) return
    loadAffiliateDashboard(user.id)
      .then((value) => {
        if (!active) return
        setData(value)
        setPixKey(value.profile.payout_pix_key ?? '')
        setSolAddress(value.profile.payout_sol_address ?? '')
      })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os dados do afiliado.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user])

  useEffect(() => {
    let active = true
    loadPublishedReviews().then((items) => { if (active) setReviews(items) }).catch(() => undefined)
    return () => { active = false }
  }, [])

  useGSAP(() => {
    if (!activityRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const section = activityRef.current
    const heading = section.querySelector<HTMLElement>('[data-activity-heading]')
    const items = gsap.utils.toArray<HTMLElement>('[data-activity-item]', section)
    if (window.matchMedia('(min-width: 1024px)').matches && heading && items.length > 2) {
      ScrollTrigger.create({ trigger: section, start: 'top top+=110', end: 'bottom bottom-=120', pin: heading, pinSpacing: false })
    }
    if (items.length) {
      gsap.from(items, {
        opacity: 0,
        y: 28,
        stagger: 0.07,
        duration: 0.65,
        ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 72%', once: true },
      })
    }
  }, { scope: activityRef, dependencies: [data?.events.length], revertOnUpdate: true })

  const affiliateCode = data?.profile.referral_code ?? user?.referralCode ?? ''
  const referralUrl = typeof window === 'undefined' ? '' : `${window.location.origin}/${encodeURIComponent(affiliateCode)}`
  const totals = useMemo<Totals>(() => {
    const result: Totals = { BRL: { available: 0, requested: 0, earned: 0, paid: 0 }, SOL: { available: 0, requested: 0, earned: 0, paid: 0 } }
    for (const commission of data?.commissions ?? []) {
      const total = result[commission.currency]
      if (commission.status !== 'reversed') total.earned += commission.amount
      if (commission.status === 'available') total.available += commission.amount
      if (commission.status === 'requested') total.requested += commission.amount
      if (commission.status === 'paid') total.paid += commission.amount
    }
    return result
  }, [data])
  const clicks = data?.events.filter((event) => event.type === 'click').length ?? 0
  const signups = data?.events.filter((event) => event.type === 'signup').length ?? 0
  const sales = data?.orders.filter((order) => order.status === 'confirmed').length ?? 0
  const conversion = clicks ? (sales / clicks * 100).toFixed(1).replace('.', ',') : '0,0'

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(referralUrl); setCopied(true); setNotice('Link copiado para compartilhar.') }
    catch { setNotice('Não foi possível copiar. Selecione e copie o endereço manualmente.') }
    window.setTimeout(() => setCopied(false), 1800)
  }

  const saveDestinations = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true); setNotice(''); setError('')
    try {
      await saveAffiliatePayoutDestinations({ pixKey, solAddress })
      await refresh()
      setNotice('Dados de recebimento salvos com segurança.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar os dados de recebimento.') }
    finally { setBusy(false) }
  }

  const askPayout = async (currency: Currency) => {
    if (busy) return
    const destination = currency === 'BRL' ? pixKey : solAddress
    if (!destination.trim()) {
      setError(`Adicione ${currency === 'BRL' ? 'sua chave PIX' : 'sua carteira Solana'} antes de solicitar o saque.`)
      document.getElementById('affiliate-payout-account')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setBusy(true); setNotice(''); setError('')
    try {
      const request = await requestAffiliatePayout(currency)
      await refresh()
      setNotice(`Solicitação registrada: ${formatMoney(Number(request?.requested_amount ?? 0), currency)}. O destino foi salvo junto ao pedido.`)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível solicitar o saque.') }
    finally { setBusy(false) }
  }

  return <main className="affiliate-page min-h-screen w-full max-w-full overflow-x-hidden text-[#eceaf2]">
    <SiteHeader mode="affiliate" />

    <div className="affiliate-shell mx-auto max-w-[1320px] px-4 pb-24 sm:px-7 lg:px-10">
      {loading && <p role="status" className="py-24 text-center text-sm text-[#918b9d]">{translateUi("Preparando seu painel…")}</p>}
      {error && <p role="alert" className="mb-5 mt-7 rounded-xl border border-[#f28c9a]/20 bg-[#f28c9a]/[.06] p-4 text-sm text-[#f2a8b2]">{translateUi(error)}</p>}
      {!loading && data && <>
        <section className="affiliate-hero relative isolate mt-8 overflow-hidden rounded-2xl border border-white/[.09] sm:mt-10" aria-labelledby="affiliate-title">
          <img decoding="async" className="affiliate-hero-image" src="/affiliate/bitcoin-hero.webp" alt={translateUi("")} />
          <div className="affiliate-hero-wash" />
          <div className="affiliate-hero-copy relative z-10 grid min-h-[440px] items-center gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,.7fr)] lg:px-14 lg:py-14">
            <div>
              <p className="eyebrow">{translateUi("Uma parceria com transparência")}</p>
              <h1 id="affiliate-title" className="affiliate-title mt-5 max-w-6xl font-display">{translateUi("Sua comunidade aprende. ")}<span className="affiliate-title-accent">{translateUi("Evolui.")}</span> {translateUi(" Você cresce junto.")}</h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-[#c0bacb] sm:text-base">{translateUi("Indique uma formação feita para decisões melhores no mercado cripto. Acompanhe cada etapa, do primeiro clique à comissão disponível.")}</p>
              <div className="mt-8 flex flex-wrap gap-3"><a href="#seu-link" className="button-motion inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#c1acff] px-5 text-sm font-semibold text-[#100c19] hover:bg-[#d1c2ff]">{translateUi("Compartilhar meu link ")}<ArrowDownRight size={16} /></a><a href="#recebimentos" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-black/20 px-5 text-sm font-medium text-white transition hover:border-white/40 hover:bg-black/35">{translateUi("Ver saldo ")}<Wallet size={15} /></a></div>
            </div>
            <div className="affiliate-link-feature rounded-2xl border border-white/[.13] bg-[#0b0b12]/75 p-5 backdrop-blur-xl sm:p-6" id="seu-link">
              <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-medium text-[#d4c8f3]">{translateUi("Seu endereço de indicação")}</p><p className="mt-1 text-[11px] text-[#938ca0]">{translateUi("Código pessoal · ")}{translateUi(affiliateCode || 'aguardando')}</p></div><span className="grid size-10 place-items-center rounded-xl bg-[#a78bfa]/[.12] text-[#c1acff]"><Link2 size={17} /></span></div>
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/[.1] bg-black/35 p-2 pl-3"><span className="min-w-0 flex-1 truncate font-mono text-[11px] text-[#d0c8db]">{translateUi(referralUrl)}</span><button type="button" onClick={() => void copyLink()} aria-label={translateUi("Copiar link de indicação")} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#eeeafa] px-3 text-xs font-semibold text-[#17131f] transition hover:bg-white">{copied ? <Check size={14} /> : <Copy size={14} />}{translateUi(copied ? 'Copiado' : 'Copiar')}</button></div>
              {notice && <p role="status" className="mt-3 text-xs text-[#b9a5ff]">{translateUi(notice)}</p>}
              <p className="mt-4 flex items-start gap-2 text-[10px] leading-relaxed text-[#928c9e]"><ShieldCheck size={13} className="mt-0.5 shrink-0 text-[#8fd8ba]" />{translateUi("A atribuição é registrada pelo servidor; comissão apenas após pagamento confirmado.")}</p>
            </div>
          </div>
          <div className="affiliate-orbit" aria-hidden="true" />
        </section>

        <section id="desempenho" className="affiliate-performance scroll-mt-28 py-20 sm:py-28" aria-labelledby="performance-title">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">{translateUi("Seu alcance em números")}</p><h2 id="performance-title" className="mt-3 font-display text-3xl tracking-[-.05em] text-[#f0edf5] sm:text-4xl">{translateUi("Cada indicação conta.")}</h2></div><p className="max-w-sm text-xs leading-6 text-[#8f899b]">{translateUi("Dados reais do seu código. Atualizados a partir dos eventos registrados na plataforma.")}</p></div>
          <div className="affiliate-data-grid grid grid-flow-dense grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
            <MetricCard className="lg:col-span-4" icon={<MousePointerClick size={17} />} label={translateUi("Cliques")} value={String(clicks)} note="Visitas únicas atribuídas" accent="violet" />
            <MetricCard className="lg:col-span-4" icon={<UserRound size={17} />} label={translateUi("Cadastros")} value={String(signups)} note="Novas contas pelo seu link" accent="blue" />
            <MetricCard className="lg:col-span-4" icon={<WalletCards size={17} />} label={translateUi("Vendas confirmadas")} value={String(sales)} note={`${conversion}% de conversão sobre cliques`} accent="amber" />
          </div>
        </section>

        <section id="recebimentos" className="affiliate-revenue-section scroll-mt-24 pb-20 sm:pb-28" aria-labelledby="revenue-title">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">{translateUi("Comissões e recebimentos")}</p><h2 id="revenue-title" className="mt-3 font-display text-3xl tracking-[-.05em] text-[#f0edf5] sm:text-4xl">{translateUi("Saldo sempre explicado.")}</h2></div><span className="inline-flex items-center gap-2 rounded-full border border-[#8bd8b1]/15 bg-[#8bd8b1]/[.045] px-3 py-2 text-[10px] text-[#a8dfc0]"><span className="size-1.5 rounded-full bg-[#8bd8b1]" />{translateUi("Comissão ")}{translateUi(data.profile.commission_bps / 100)}%</span></div>
          <div className="grid grid-flow-dense grid-cols-1 gap-4 lg:grid-cols-12">
            {(['BRL', 'SOL'] as const).map((currency, index) => <article key={currency} className={`affiliate-currency-card group relative overflow-hidden rounded-2xl border border-white/[.08] bg-[#12111a] p-5 sm:p-7 lg:col-span-6 ${index === 0 ? 'affiliate-card-first' : ''}`}>
              <div className="affiliate-card-glow" /><div className="relative flex items-start justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#9f98aa]">{translateUi("Saldo disponível · ")}{translateUi(currency)}</p><p className="mt-4 font-display text-4xl font-medium tracking-[-.06em] text-[#f1edf5]">{translateUi(formatMoney(totals[currency].available, currency))}</p><p className="mt-2 text-[11px] text-[#827c8d]">{translateUi("Total gerado ")}{translateUi(formatMoney(totals[currency].earned, currency))}</p></div><span className={`grid size-11 place-items-center rounded-xl ${index ? 'bg-[#70d9ef]/[.08] text-[#70d9ef]' : 'bg-[#e8bc76]/[.08] text-[#e8bc76]'}`}><Wallet size={19} /></span></div>
              <div className="relative mt-7 grid grid-cols-2 gap-2 border-t border-white/[.07] pt-4"><Balance label={translateUi("Em análise")} value={formatMoney(totals[currency].requested, currency)} /><Balance label={translateUi("Já recebido")} value={formatMoney(totals[currency].paid, currency)} /></div>
              <button type="button" disabled={busy || totals[currency].available <= 0} onClick={() => void askPayout(currency)} className="relative mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#ece8f5] px-4 text-xs font-semibold text-[#16131e] transition hover:bg-white disabled:cursor-not-allowed disabled:bg-white/[.07] disabled:text-[#6e6878]">{translateUi("Solicitar saque em ")}{translateUi(currency)} <ArrowRight size={14} /></button>
            </article>)}
            <form id="affiliate-payout-account" onSubmit={(event) => void saveDestinations(event)} className="affiliate-account-card rounded-2xl border border-white/[.08] bg-[#12111a] p-5 sm:p-7 lg:col-span-12">
              <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">{translateUi("Conta de recebimento")}</p><h3 className="mt-2 font-display text-xl font-medium tracking-[-.04em] text-[#edeaf2]">{translateUi("Para onde enviamos sua comissão?")}</h3><p className="mt-2 max-w-2xl text-xs leading-6 text-[#8b8596]">{translateUi("Os dados ficam vinculados à sua conta e são copiados para cada solicitação de saque. A chave PIX e a carteira Solana são opcionais até o primeiro pedido na respectiva moeda.")}</p></div><span className="grid size-10 place-items-center rounded-xl border border-white/[.08] bg-white/[.025] text-[#c1acff]"><ShieldCheck size={17} /></span></div>
              <div className="mt-6 grid gap-4 md:grid-cols-2"><label className="block"><span className="mb-2 block text-xs font-medium text-[#d0cad8]">{translateUi("Chave PIX para BRL")}</span><input value={pixKey} onChange={(event) => setPixKey(event.target.value)} maxLength={160} autoComplete="off" placeholder={translateUi("CPF, e-mail, telefone ou chave aleatória")} className="affiliate-input" /></label><label className="block"><span className="mb-2 block text-xs font-medium text-[#d0cad8]">{translateUi("Carteira Solana para SOL")}</span><input value={solAddress} onChange={(event) => setSolAddress(event.target.value)} maxLength={64} autoComplete="off" placeholder={translateUi("Endereço público da carteira")} className="affiliate-input font-mono" /></label></div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-[10px] text-[#777181]">{translateUi("Seu nome, e-mail e foto podem ser editados pelo ícone de perfil no topo.")}</p><button type="submit" disabled={busy} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#b49cff]/25 bg-[#a78bfa]/[.09] px-4 text-xs font-semibold text-[#d0c2ff] transition hover:bg-[#a78bfa]/[.16] disabled:opacity-50"><Save size={14} />{translateUi("Salvar dados")}</button></div>
              {notice && <p role="status" className="mt-4 text-xs text-[#a8dfc0]">{translateUi(notice)}</p>}{error && <p role="alert" className="mt-4 text-xs text-[#f2a8b2]">{translateUi(error)}</p>}
            </form>
          </div>
        </section>

        <section ref={activityRef} id="atividade" className="affiliate-activity-section grid scroll-mt-24 gap-8 border-t border-white/[.07] py-20 sm:py-28 lg:grid-cols-[.7fr_1fr] lg:gap-16" aria-labelledby="activity-title">
          <div data-activity-heading className="self-start"><p className="eyebrow">{translateUi("Rastro de atribuição")}</p><h2 id="activity-title" className="mt-3 max-w-md font-display text-3xl tracking-[-.05em] text-[#f0edf5] sm:text-4xl">{translateUi("Veja a confiança virar resultado.")}</h2><p className="mt-4 max-w-sm text-xs leading-6 text-[#8e8899]">{translateUi("Cada evento relevante do seu código aparece aqui, sem estimativas escondidas.")}</p><Link to="/curso" className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-[#c6b5ff] transition hover:text-white">{translateUi("Voltar à plataforma ")}<ArrowUpRight size={14} /></Link></div>
          <div className="min-w-0">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-medium text-[#dcd7e4]">{translateUi("Atividade recente")}</h3><span className="text-[10px] text-[#7c7687]">{translateUi(data.events.length)} {translateUi(" eventos")}</span></div>
            {data.events.length ? <div className="divide-y divide-white/[.07]">{data.events.slice(0, 20).map((event) => <ActivityRow key={event.id} event={event} code={affiliateCode} />)}</div> : <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-white/[.1] px-5 text-center"><div><span className="mx-auto grid size-11 place-items-center rounded-xl bg-[#a78bfa]/[.08] text-[#c1acff]"><Share2 size={18} /></span><p className="mt-4 text-sm text-[#d0cad8]">{translateUi("A primeira indicação começa com uma conversa.")}</p><p className="mt-2 text-xs text-[#817b8d]">{translateUi("Compartilhe seu link para acompanhar os próximos eventos aqui.")}</p><button type="button" onClick={() => void copyLink()} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#c6b5ff]">{translateUi("Copiar link ")}<Copy size={13} /></button></div></div>}
          </div>
        </section>

        <section className="affiliate-how rounded-2xl border border-white/[.08] bg-[radial-gradient(ellipse_at_90%_0%,rgba(167,139,250,.1),transparent_42%),linear-gradient(125deg,#15131d,#0f1016)] p-6 sm:p-9" aria-labelledby="how-title">
          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><div><p className="eyebrow">{translateUi("Programa de afiliados")}</p><h2 id="how-title" className="mt-3 max-w-xl font-display text-3xl tracking-[-.05em] text-[#f0edf5]">{translateUi("Uma parceria simples, do jeito certo.")}</h2><p className="mt-3 max-w-lg text-xs leading-6 text-[#90899a]">{translateUi("O saldo reflete pedidos pagos e comissões efetivamente lançadas. O checkout ainda está em integração, então novas comissões dependem da confirmação do provedor.")}</p></div><div className="affiliate-steps flex gap-2">{[['Compartilhe', 'Seu link identifica a origem do cadastro.'], ['Acompanhe', 'Eventos e pedidos aparecem com status real.'], ['Receba', 'Solicite o saque no destino cadastrado.']].map(([title, description], index) => <details key={title} className="affiliate-step min-w-0 flex-1 rounded-xl border border-white/[.07] bg-black/20 p-4" open={index === 0}><summary className="cursor-pointer list-none text-[10px] font-semibold uppercase tracking-[.14em] text-[#bba7f4]">{translateUi(title)}</summary><p className="mt-3 text-[11px] leading-5 text-[#9c96a6]">{translateUi(description)}</p></details>)}</div></div>
          {reviews.length > 0 && <section className="affiliate-testimonial mt-8 border-t border-white/[.07] pt-6" aria-label={translateUi("Avaliações de alunos")}><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex min-w-0 items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#a78bfa]/[.09] text-[#c1acff]"><Quote size={16} /></span><div className="min-w-0"><p className="text-xs font-medium text-[#d9d3e2]">{translateUi("O que os alunos dizem")}</p><blockquote className="mt-2 max-w-3xl text-sm leading-6 text-[#aaa4b3]">“{reviews[reviewIndex % reviews.length].text}”</blockquote><p className="mt-2 text-[10px] text-[#817b8b]">{reviews[reviewIndex % reviews.length].name} {translateUi(" · avaliação publicada")}</p></div></div><div className="flex shrink-0 gap-2"><button type="button" aria-label={translateUi("Avaliação anterior")} onClick={() => setReviewIndex((index) => (index - 1 + reviews.length) % reviews.length)} className="grid size-9 place-items-center rounded-lg border border-white/[.1] text-[#aaa4b3] hover:text-white"><ArrowLeft size={14} /></button><button type="button" aria-label={translateUi("Próxima avaliação")} onClick={() => setReviewIndex((index) => (index + 1) % reviews.length)} className="grid size-9 place-items-center rounded-lg border border-white/[.1] text-[#aaa4b3] hover:text-white"><ArrowRight size={14} /></button></div></div></section>}
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-white/[.07] pt-5"><p className="flex items-center gap-2 text-[10px] text-[#7e7889]"><ExternalLink size={13} />{translateUi("Seu código pessoal ")}<span className="font-mono text-[#bdb3d0]">/{translateUi(affiliateCode)}</span></p><Link to="/landing" className="inline-flex items-center gap-2 text-[10px] text-[#8b8495] transition hover:text-white">{translateUi("Voltar ao site ")}<ArrowUpRight size={13} /></Link></div>
        </section>
      </>}
      {!loading && !data && !error && <div className="grid min-h-52 place-items-center text-sm text-[#918b9d]">{translateUi("Perfil de afiliado não encontrado.")}</div>}
    </div>
    <SiteFooter />
  </main>
}

function MetricCard({ icon, label, value, note, accent, className = '' }: { icon: ReactNode; label: string; value: string; note: string; accent: 'violet' | 'blue' | 'amber'; className?: string }) {
  useUiTranslation();
  const tones = { violet: 'text-[#c1acff] bg-[#a78bfa]/[.09]', blue: 'text-[#82dbef] bg-[#70d9ef]/[.08]', amber: 'text-[#e8bc76] bg-[#e8bc76]/[.08]' }
  return <article className={`affiliate-metric-card ${className}`}><div className="flex items-center gap-3"><span className={`grid size-9 place-items-center rounded-xl ${tones[accent]}`}>{translateUi(icon)}</span><span className="text-xs text-[#aaa4b3]">{translateUi(label)}</span></div><p className="mt-7 font-display text-4xl font-medium tracking-[-.06em] text-[#f1edf5]">{translateUi(value)}</p><p className="mt-2 text-[10px] text-[#7f798a]">{translateUi(note)}</p></article>
}

function Balance({ label, value }: { label: string; value: string }) {
  useUiTranslation();
  return <div><p className="text-[9px] uppercase tracking-[.12em] text-[#797384]">{translateUi(label)}</p><p className="mt-1.5 text-xs font-medium tabular-nums text-[#c3bdcc]">{translateUi(value)}</p></div>
}

function ActivityRow({ event, code }: { event: DashboardData['events'][number]; code: string }) {
  useUiTranslation();
  const labels = { click: 'Visita ao link', signup: 'Novo cadastro', sale: 'Venda confirmada' }
  const icons = { click: <MousePointerClick size={14} />, signup: <Sparkles size={14} />, sale: <Check size={14} /> }
  const colors = { click: 'bg-[#a78bfa]/[.08] text-[#c1acff]', signup: 'bg-[#70d9ef]/[.08] text-[#82dbef]', sale: 'bg-[#e8bc76]/[.08] text-[#e8bc76]' }
  return <article data-activity-item className="flex items-center gap-3 py-4"><span className={`grid size-9 shrink-0 place-items-center rounded-xl ${colors[event.type]}`}>{translateUi(icons[event.type])}</span><div className="min-w-0 flex-1"><p className="text-xs font-medium text-[#d2cdd9]">{translateUi(labels[event.type])}</p><p className="mt-1 truncate text-[10px] text-[#777182]">{translateUi(event.detail ?? code)}</p></div><time dateTime={event.at} className="shrink-0 text-right text-[10px] text-[#827c8c]">{translateUi(new Date(event.at).toLocaleString(getUiLocale(), { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }))}</time></article>
}

function formatMoney(value: number, currency: Currency) { return currency === 'BRL' ? `R$ ${value.toFixed(2).replace('.', ',')}` : `${value.toFixed(4).replace('.', ',')} SOL` }
