import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArrowRight, ArrowUpRight, Check, Copy, ExternalLink, MousePointerClick, Share2, Wallet, WalletCards } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '@/components/brand'
import { useSession } from '@/contexts/session-context'
import { loadAffiliateDashboard, requestAffiliatePayout } from '@/lib/affiliate-service'
import type { Currency } from '@/lib/offers'

type DashboardData = Awaited<ReturnType<typeof loadAffiliateDashboard>>
type Totals = Record<Currency, { available: number; requested: number; earned: number; paid: number }>

export function AffiliatePage() {
  const { user, signOut } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const refresh = async () => {
    if (!user) return
    setData(await loadAffiliateDashboard(user.id))
  }
  useEffect(() => {
    let active = true
    if (!user) { setLoading(false); return }
    loadAffiliateDashboard(user.id)
      .then((value) => { if (active) setData(value) })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os dados do afiliado.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user])

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

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(referralUrl); setCopied(true); setNotice('Link copiado.') }
    catch { setNotice('Não foi possível copiar. Selecione e copie o link manualmente.') }
    window.setTimeout(() => setCopied(false), 1800)
  }
  const askPayout = async (currency: Currency) => {
    if (busy) return
    setBusy(true); setNotice(''); setError('')
    try {
      const request = await requestAffiliatePayout(currency)
      await refresh()
      setNotice(`Solicitação registrada: ${formatMoney(Number(request?.requested_amount ?? 0), currency)}.`)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível solicitar o saque.') }
    finally { setBusy(false) }
  }

  return <div className="min-h-screen bg-[#09090d] text-[#e6eee9]">
    <header className="sticky top-0 z-30 border-b border-white/[.06] bg-[#09090d]/90 backdrop-blur-xl"><div className="mx-auto flex h-[68px] max-w-[1450px] items-center justify-between px-4 sm:px-7 lg:px-10"><div className="flex items-center gap-6"><Brand /><span className="hidden text-xs text-[#778a7f] sm:inline">painel de parcerias</span></div><div className="flex items-center gap-3"><Link to="/landing" className="hidden text-[11px] text-[#8c9f94] hover:text-white sm:inline">Abrir site <ArrowUpRight size={13} className="inline" /></Link><button type="button" onClick={() => { signOut(); location.assign('/login') }} className="rounded-full border border-white/[.08] px-3 py-2 text-[10px] text-[#99a99f] hover:text-white">Sair</button></div></div></header>
    <main className="mx-auto max-w-[1300px] px-4 py-8 sm:px-7 sm:py-10">
      {loading && <p role="status" className="py-10 text-center text-xs text-[#8fa197]">Carregando painel…</p>}
      {error && <p role="alert" className="mb-5 rounded-xl border border-[#f28c9a]/20 bg-[#f28c9a]/[.06] p-4 text-xs text-[#f2a8b2]">{error}</p>}
      {!loading && data && <>
        <section className="affiliate-intro relative isolate overflow-hidden rounded-xl border border-[#e4bc76]/18 bg-[linear-gradient(115deg,#191722,#12131b_62%,#111820)] p-6 sm:p-8"><div className="absolute -right-24 -top-24 -z-10 size-72 rounded-full bg-[#e4bc76]/[.08] blur-[90px]" /><div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><p className="eyebrow text-[#e4bc76]">painel de parcerias</p><h1 className="mt-3 font-display text-3xl font-medium tracking-[-.05em] text-[#edf3ee] sm:text-4xl">Indicações com transparência.</h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-[#9eaa9f]">Acompanhe cliques, cadastros, pedidos confirmados e comissões atribuídas ao seu link.</p></div><div className="flex items-center gap-3 rounded-xl border border-[#e4bc76]/15 bg-black/[.12] px-4 py-3"><span className="grid size-9 place-items-center rounded-xl bg-[#e4bc76]/[.09] text-[#e4bc76]"><WalletCards size={17} /></span><div><p className="text-[9px] uppercase tracking-[.13em] text-[#927f58]">seu ID</p><p className="mt-1 font-mono text-sm tracking-[.08em] text-[#e8d4a7]">/{affiliateCode || '—'}</p></div></div></div></section>

        <section className="affiliate-metrics mt-5"><Stat icon={<MousePointerClick size={16} />} label="Cliques" value={clicks} note="Recebidos pelo seu link" tone="mint" /><Stat icon={<Check size={16} />} label="Cadastros" value={signups} note="Atribuídos pelo código" tone="blue" /><Stat icon={<WalletCards size={16} />} label="Vendas confirmadas" value={sales} note="Pedidos pagos" tone="amber" /></section>

        <section className="affiliate-main-grid mt-5">
          <div className="affiliate-link bento-panel p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#a78bfa]/[.08] text-[#a78bfa]"><Share2 size={16} /></span><div><h2 className="text-sm font-medium text-[#e0eae3]">Seu link de indicação</h2><p className="mt-1 text-[10px] text-[#7f9287]">ID curto, cadastros associados automaticamente.</p></div></div><div className="mt-5 flex flex-col gap-2 sm:flex-row"><div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-white/[.08] bg-[#09090d] px-4 py-3 font-mono text-[11px] text-[#a6b7ac]">{referralUrl}</div><button type="button" onClick={() => void copyLink()} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#dcebe1] px-4 text-xs font-semibold text-[#09090d] hover:bg-white">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copiado' : 'Copiar link'}</button></div>{notice && <p role="status" className="mt-3 text-[10px] text-[#c1acff]">{notice}</p>}<div className="mt-5 flex items-start gap-3 rounded-xl border border-[#98abff]/12 bg-[#98abff]/[.035] p-4"><ExternalLink size={14} className="mt-0.5 shrink-0 text-[#aab8ff]" /><p className="text-[10px] leading-relaxed text-[#8996aa]">Compartilhe este endereço. Cliques e cadastros ficam associados ao seu ID; comissão nasce após pedido confirmado e checkout conectado.</p></div></div>

          <div className="affiliate-commissions bento-panel p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-sm font-medium text-[#e0eae3]">Comissões</h2><p className="mt-1 text-[10px] text-[#7f9287]">Valores separados por moeda.</p></div><Wallet size={16} className="text-[#e4bc76]" /></div><div className="mt-5 space-y-3">{(['BRL', 'SOL'] as const).map((currency) => <div key={currency} className="rounded-lg border border-white/[.06] bg-[#14151c] p-4"><div className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-[.12em] text-[#778a7f]">{currency}</span><span className="text-[9px] text-[#6e8276]">{data.profile.commission_bps / 100}% por venda</span></div><p className="mt-2 font-display text-2xl font-medium tracking-[-.04em] text-[#e6eee7]">{formatMoney(totals[currency].available, currency)}</p><p className="mt-1 text-[9px] text-[#71857a]">{formatMoney(totals[currency].earned, currency)} acumulados · {formatMoney(totals[currency].requested, currency)} solicitados · {formatMoney(totals[currency].paid, currency)} pagos</p><button type="button" disabled={busy || totals[currency].available <= 0} onClick={() => void askPayout(currency)} className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-full border border-white/[.1] px-3 text-[10px] text-[#b7c7bd] hover:border-[#e4bc76]/25 hover:text-[#f0d391] disabled:cursor-not-allowed disabled:opacity-35">Solicitar saque <ArrowRight size={12} /></button></div>)}</div></div>
        </section>

        <section className="affiliate-activity bento-panel mt-5 p-5 sm:p-6"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-base font-medium text-[#e0eae3]">Atividade do código</h2><p className="mt-1 text-[10px] text-[#7f9287]">Eventos registrados pelo servidor.</p></div><span className="rounded-full border border-white/[.08] px-2.5 py-1 text-[9px] text-[#83968b]">{data.events.length} eventos</span></div>{data.events.length ? <div className="divide-y divide-white/[.055]">{data.events.map((event) => <div key={event.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="flex items-center gap-3"><span className={`grid size-8 place-items-center rounded-lg ${event.type === 'sale' ? 'bg-[#e4bc76]/[.08] text-[#e4bc76]' : event.type === 'signup' ? 'bg-[#98abff]/[.08] text-[#aab8ff]' : 'bg-[#a78bfa]/[.08] text-[#a78bfa]'}`}>{event.type === 'sale' ? <WalletCards size={14} /> : event.type === 'signup' ? <Check size={14} /> : <MousePointerClick size={14} />}</span><div><p className="text-xs text-[#c3cfc7]">{event.type === 'click' ? 'Clique no link' : event.type === 'signup' ? 'Cadastro' : 'Venda confirmada'}</p><p className="mt-1 text-[9px] text-[#72867a]">{event.detail ?? affiliateCode}</p></div></div><div className="text-right"><p className="mt-1 text-[9px] text-[#71857a]">{new Date(event.at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p></div></div>)}</div> : <div className="grid min-h-[110px] place-items-center rounded-lg border border-dashed border-white/[.08]"><p className="text-xs text-[#7f9287]">Seu primeiro evento aparecerá aqui.</p></div>}</section>
      </>}
      {!loading && !data && !error && <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-white/[.1] text-xs text-[#7f9287]">Perfil de afiliado não encontrado.</div>}
    </main>
  </div>
}

function Stat({ icon, label, value, note, tone }: { icon: ReactNode; label: string; value: number; note: string; tone: 'mint' | 'blue' | 'amber' }) {
  const color = { mint: 'bg-[#a78bfa]/[.08] text-[#a78bfa]', blue: 'bg-[#98abff]/[.08] text-[#aab8ff]', amber: 'bg-[#e4bc76]/[.08] text-[#e4bc76]' }
  return <div className="rounded-xl border border-white/[.07] bg-[#12121a] p-4"><div className="flex items-center gap-2.5"><span className={`grid size-8 place-items-center rounded-lg ${color[tone]}`}>{icon}</span><span className="text-[10px] text-[#8c9e94]">{label}</span></div><p className="mt-4 font-display text-2xl font-medium tracking-[-.045em] text-[#e7efe9]">{value}</p><p className="mt-1 text-[9px] text-[#708378]">{note}</p></div>
}

function formatMoney(value: number, currency: Currency) { return currency === 'BRL' ? `R$ ${value.toFixed(2).replace('.', ',')}` : `${value.toFixed(4).replace('.', ',')} SOL` }
