import { useMemo, useState, type ReactNode } from 'react'
import { ArrowRight, ArrowUpRight, Check, Copy, ExternalLink, MousePointerClick, Share2, Wallet, WalletCards } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '@/contexts/session-context'
import { affiliateRate } from '@/lib/offers'
import { getMockEvents, getMockOrders, getMockPayouts, requestMockPayout } from '@/lib/storage'
import type { Currency } from '@/lib/offers'

const REF_CODE = 'MARINA20'

export function AffiliatePage() {
  const [refresh, setRefresh] = useState(0)
  const [copied, setCopied] = useState(false)
  const [notice, setNotice] = useState('')
  const { user, signOut } = useSession()
  const navigate = useNavigate()
  const events = getMockEvents().filter((event) => event.code === REF_CODE)
  const orders = getMockOrders().filter((order) => order.refCode === REF_CODE)
  const payouts = getMockPayouts().filter((payout) => payout.code === REF_CODE)
  const clicks = events.filter((event) => event.type === 'click').length
  const signups = events.filter((event) => event.type === 'signup').length
  const sales = events.filter((event) => event.type === 'sale').length
  const totals = useMemo(() => (['BRL', 'SOL'] as const).reduce((result, currency) => {
    const earned = orders.filter((order) => order.currency === currency).reduce((sum, order) => sum + order.commission, 0)
    const requested = payouts.filter((payout) => payout.currency === currency).reduce((sum, payout) => sum + payout.amount, 0)
    result[currency] = { earned, available: Math.max(earned - requested, 0), requested }
    return result
  }, {} as Record<Currency, { earned: number; available: number; requested: number }>), [orders, payouts, refresh])

  const referralUrl = `${window.location.origin}/landing?ref=${REF_CODE}`
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(referralUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1800) }
    catch { setNotice('Copie o endereço exibido pelo navegador: ' + referralUrl) }
  }
  const askPayout = (currency: Currency) => {
    const amount = totals[currency].available
    if (amount <= 0) return
    requestMockPayout(REF_CODE, currency, amount)
    setNotice(`Solicitação demo registrada: ${formatMoney(amount, currency)}.`)
    setRefresh((value) => value + 1)
  }
  const logout = () => { signOut(); navigate('/login') }

  return <div className="min-h-screen bg-[#09090d] text-[#e6eee9]">
    <header className="sticky top-0 z-20 border-b border-white/[.07] bg-[#09090d]/90 backdrop-blur-xl"><div className="page-shell flex h-[70px] items-center justify-between"><Link to="/landing"><span className="font-display text-sm font-semibold tracking-[-.03em] text-[#e1ebe4]">Cripto do Zero</span><span className="ml-2 rounded-full border border-[#e4bc76]/15 bg-[#e4bc76]/[.04] px-2 py-1 text-[8px] font-semibold uppercase tracking-[.12em] text-[#cfb476]">afiliado</span></Link><div className="flex items-center gap-3"><Link to="/landing" className="hidden text-[11px] text-[#899c91] hover:text-white sm:block">Abrir site <ArrowUpRight size={12} className="inline" /></Link><span className="hidden text-xs text-[#a5b4ab] sm:block">{user?.name}</span><button type="button" onClick={logout} className="rounded-full border border-white/[.08] px-3 py-2 text-[10px] text-[#8b9e93] hover:bg-white/[.04]">Sair</button></div></div></header>
    <main className="affiliate-bento page-shell max-w-[1240px] py-8 sm:py-11">
      <section className="affiliate-intro relative isolate overflow-hidden rounded-xl border border-[#e4bc76]/18 bg-[linear-gradient(115deg,#191722,#12131b_62%,#111820)] p-6 sm:p-8"><div className="absolute -right-24 -top-24 -z-10 size-72 rounded-full bg-[#e4bc76]/[.08] blur-[90px]" /><div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><p className="eyebrow text-[#e4bc76]">painel de parcerias</p><h1 className="mt-3 font-display text-3xl font-medium tracking-[-.05em] text-[#edf3ee] sm:text-4xl">Indicações com transparência.</h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-[#9eaa9f]">Acompanhe cliques, cadastros e pedidos vinculados ao seu link. A comissão da demonstração é de 20% por pedido.</p></div><div className="flex items-center gap-3 rounded-xl border border-[#e4bc76]/15 bg-black/[.12] px-4 py-3"><span className="grid size-9 place-items-center rounded-xl bg-[#e4bc76]/[.09] text-[#e4bc76]"><WalletCards size={17} /></span><div><p className="text-[9px] uppercase tracking-[.13em] text-[#927f58]">seu código</p><p className="mt-1 font-mono text-sm tracking-[.08em] text-[#e8d4a7]">{REF_CODE}</p></div></div></div></section>

      <section className="affiliate-metrics"><Stat icon={<MousePointerClick size={16} />} label="Cliques" value={clicks} note="Neste navegador" tone="mint" /><Stat icon={<Check size={16} />} label="Cadastros demo" value={signups} note="Com seu código" tone="blue" /><Stat icon={<ArrowUpRight size={16} />} label="Pedidos demo" value={sales} note="Atribuídos ao seu link" tone="amber" /></section>

      <section className="affiliate-tools">
        <div className="affiliate-link bento-panel p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#a78bfa]/[.08] text-[#a78bfa]"><Share2 size={16} /></span><div><h2 className="text-sm font-medium text-[#e0eae3]">Seu link de indicação</h2><p className="mt-1 text-[10px] text-[#7f9287]">O código acompanha a página, o cadastro e o pedido de demonstração.</p></div></div><div className="mt-5 flex flex-col gap-2 sm:flex-row"><div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-white/[.08] bg-[#09090d] px-4 py-3 font-mono text-[11px] text-[#a6b7ac]">{referralUrl}</div><button type="button" onClick={copyLink} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#dcebe1] px-4 text-xs font-semibold text-[#09090d] hover:bg-white">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copiado' : 'Copiar link'}</button></div>{notice && <p role="status" className="mt-3 text-[10px] leading-relaxed text-[#c1acff]">{notice}</p>}<div className="mt-5 flex items-start gap-3 rounded-xl border border-[#98abff]/12 bg-[#98abff]/[.035] p-4"><ExternalLink size={14} className="mt-0.5 shrink-0 text-[#aab8ff]" /><p className="text-[10px] leading-relaxed text-[#8996aa]">Abra o link, selecione um plano e entre na demonstração. O pedido será marcado como demo e aparecerá aqui. Nenhum pagamento será realizado.</p></div></div>

        <div className="affiliate-commissions bento-panel p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-sm font-medium text-[#e0eae3]">Comissões</h2><p className="mt-1 text-[10px] text-[#7f9287]">Moedas calculadas separadamente.</p></div><Wallet size={16} className="text-[#e4bc76]" /></div><div className="mt-5 space-y-3">{(['BRL', 'SOL'] as const).map((currency) => <div key={currency} className="rounded-lg border border-white/[.06] bg-[#14151c] p-4"><div className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-[.12em] text-[#778a7f]">{currency}</span><span className="text-[9px] text-[#6e8276]">{affiliateRate * 100}% por venda</span></div><p className="mt-2 font-display text-2xl font-medium tracking-[-.04em] text-[#e6eee7]">{formatMoney(totals[currency].available, currency)}</p><p className="mt-1 text-[9px] text-[#71857a]">{formatMoney(totals[currency].earned, currency)} gerados · {formatMoney(totals[currency].requested, currency)} solicitados</p><button type="button" disabled={totals[currency].available <= 0} onClick={() => askPayout(currency)} className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-full border border-white/[.1] px-3 text-[10px] text-[#b7c7bd] hover:border-[#e4bc76]/25 hover:text-[#f0d391] disabled:cursor-not-allowed disabled:opacity-35">Registrar solicitação demo <ArrowRight size={12} /></button></div>)}</div></div>
      </section>

      <section className="affiliate-activity bento-panel p-5 sm:p-6"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-base font-medium text-[#e0eae3]">Atividade do código</h2><p className="mt-1 text-[10px] text-[#7f9287]">Registro local, com data e ação.</p></div><span className="rounded-full border border-white/[.08] px-2.5 py-1 text-[9px] text-[#83968b]">{events.length} eventos</span></div>{events.length ? <div className="divide-y divide-white/[.055]">{events.slice().reverse().map((event) => <div key={event.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="flex items-center gap-3"><span className={`grid size-8 place-items-center rounded-lg ${event.type === 'sale' ? 'bg-[#e4bc76]/[.08] text-[#e4bc76]' : event.type === 'signup' ? 'bg-[#98abff]/[.08] text-[#aab8ff]' : 'bg-[#a78bfa]/[.08] text-[#a78bfa]'}`}>{event.type === 'sale' ? <WalletCards size={14} /> : event.type === 'signup' ? <Check size={14} /> : <MousePointerClick size={14} />}</span><div><p className="text-xs text-[#c3cfc7]">{event.type === 'click' ? 'Clique no link' : event.type === 'signup' ? 'Cadastro demonstrativo' : 'Pedido demonstrativo'}</p><p className="mt-1 text-[9px] text-[#72867a]">{event.detail ?? REF_CODE}</p></div></div><div className="text-right"><p className="text-[10px] text-[#a7b6ad]">{event.value !== undefined && event.currency ? formatMoney(event.value, event.currency) : '—'}</p><p className="mt-1 text-[9px] text-[#71857a]">{new Date(event.at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p></div></div>)}</div> : <div className="grid min-h-[110px] place-items-center rounded-lg border border-dashed border-white/[.08]"><p className="text-xs text-[#7f9287]">Seu primeiro acesso atribuído aparecerá aqui.</p></div>}</section>
      <p className="mt-6 text-[10px] leading-relaxed text-[#65796d]">Atribuição e comissões são locais e temporárias. Em produção, valide o pedido no servidor, impeça duplicidade e configure regras de privacidade, estorno e pagamento antes de liberar saques.</p>
    </main>
  </div>
}

function Stat({ icon, label, value, note, tone }: { icon: ReactNode; label: string; value: number; note: string; tone: 'mint' | 'blue' | 'amber' }) {
  const color = { mint: 'bg-[#a78bfa]/[.08] text-[#a78bfa]', blue: 'bg-[#98abff]/[.08] text-[#aab8ff]', amber: 'bg-[#e4bc76]/[.08] text-[#e4bc76]' }
  return <div className="rounded-xl border border-white/[.07] bg-[#12121a] p-4"><div className="flex items-center gap-2.5"><span className={`grid size-8 place-items-center rounded-lg ${color[tone]}`}>{icon}</span><span className="text-[10px] text-[#8c9e94]">{label}</span></div><p className="mt-4 font-display text-2xl font-medium tracking-[-.045em] text-[#e7efe9]">{value}</p><p className="mt-1 text-[9px] text-[#708378]">{note}</p></div>
}

function formatMoney(value: number, currency: Currency) {
  return currency === 'BRL' ? `R$ ${value.toFixed(2).replace('.', ',')}` : `${value.toFixed(2).replace('.', ',')} SOL`
}






