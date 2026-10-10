import { translateUi, translateTemplate, getUiLocale } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BookOpen, Check, CircleDollarSign, MessageSquareQuote, MousePointer2, Star, Trash2, Users, WalletCards, X } from 'lucide-react'
import { LocalizedLink as Link, useLocalizedNavigate as useNavigate } from '@/components/localized-router'
import { Brand } from '@/components/brand'
import { useSession } from '@/contexts/session-context'
import { deleteReview, moderateReview, type StudentReview } from '@/lib/community-service'
import { loadAdminSnapshot, type AdminOrder, type AdminSnapshot } from '@/lib/admin-service'
import { processAffiliatePayout } from '@/lib/affiliate-service'
import { JourneyAdmin } from '@/components/journey-admin'
import type { Currency } from '@/lib/offers'

type Section = 'overview' | 'content' | 'journeys' | 'affiliates' | 'orders' | 'reviews'
const nav: { id: Section; label: string; icon: typeof Activity }[] = [
  { id: 'overview', label: 'Visão geral', icon: Activity },
  { id: 'content', label: 'Conteúdo do curso', icon: BookOpen },
  { id: 'journeys', label: 'Jornadas', icon: BookOpen },
  { id: 'affiliates', label: 'Afiliados', icon: Users },
  { id: 'orders', label: 'Pedidos', icon: WalletCards },
  { id: 'reviews', label: 'Avaliações', icon: MessageSquareQuote },
]

export function AdminPage() {
  useUiTranslation();
  const [section, setSection] = useState<Section>('overview')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const { user, signOut } = useSession()
  const navigate = useNavigate()

  const refresh = async () => setSnapshot(await loadAdminSnapshot())
  useEffect(() => {
    let active = true
    loadAdminSnapshot()
      .then((data) => { if (active) setSnapshot(data) })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os dados administrativos.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const runAction = async (action: () => Promise<void>, successMessage: string) => {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try { await action(); await refresh(); setNotice(successMessage) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível concluir a ação.') }
    finally { setBusy(false) }
  }

  const events = snapshot?.events ?? []
  const orders = snapshot?.orders ?? []
  const payouts = snapshot?.payouts ?? []
  const affiliates = snapshot?.affiliates ?? []
  const reviews = snapshot?.reviews ?? []
  const modules = snapshot?.modules ?? []
  const chartData = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(); date.setDate(date.getDate() - (6 - index))
    const key = date.toDateString()
    return {
      dia: date.toLocaleDateString(getUiLocale(), { weekday: 'short' }).replace('.', ''),
      cliques: events.filter((event) => event.type === 'click' && new Date(event.at).toDateString() === key).length,
      pedidos: orders.filter((order) => order.status === 'confirmed' && new Date(order.at).toDateString() === key).length,
    }
  }), [events, orders])
  const confirmedOrders = orders.filter((order) => order.status === 'confirmed')
  const grossBrl = confirmedOrders.filter((order) => order.currency === 'BRL').reduce((sum, order) => sum + order.amount, 0)
  const grossSol = confirmedOrders.filter((order) => order.currency === 'SOL').reduce((sum, order) => sum + order.amount, 0)
  const commissionBrl = affiliates.reduce((sum, item) => sum + item.commissionBrl, 0)
  const commissionSol = affiliates.reduce((sum, item) => sum + item.commissionSol, 0)
  const pendingPayouts = payouts.filter((payout) => payout.status === 'requested')

  const logout = () => { signOut(); navigate('/login') }
  const setReviewStatus = (reviewId: string, status: 'approved' | 'rejected') => runAction(() => moderateReview(reviewId, status), status === 'approved' ? 'Avaliação publicada.' : 'Avaliação rejeitada.')
  const removeReview = (reviewId: string) => runAction(() => deleteReview(reviewId), 'Avaliação removida.')
  const settlePayout = (payoutId: string, result: 'paid' | 'rejected') => runAction(() => processAffiliatePayout(payoutId, result), result === 'paid' ? 'Saque marcado como pago.' : 'Saque rejeitado; comissão voltou ao saldo disponível.')

  return <div className="min-h-screen bg-[#09090d] text-[#e6eee9] lg:grid lg:grid-cols-[245px_minmax(0,1fr)]">
    <aside className="hidden border-r border-white/[.07] bg-[#0d0e14] p-5 lg:fixed lg:inset-y-0 lg:flex lg:w-[245px] lg:flex-col"><Brand /><div className="mt-11"><p className="px-3 pb-3 text-[9px] font-semibold uppercase tracking-[.18em] text-[#687b70]">{translateUi("operação")}</p><nav className="space-y-1">{nav.map(({ id, label, icon: Icon }) => <button type="button" key={id} onClick={() => setSection(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs transition-colors ${section === id ? 'bg-[#a78bfa]/[.09] text-[#c1acff]' : 'text-[#8da095] hover:bg-white/[.04] hover:text-white'}`}><Icon size={16} />{translateUi(label)}</button>)}</nav></div><div className="mt-auto rounded-xl border border-white/[.07] bg-[#14151c] p-4"><span className="rounded-full border border-[#98abff]/15 bg-[#98abff]/[.06] px-2 py-1 text-[9px] font-semibold uppercase tracking-[.12em] text-[#aab8ff]">{translateUi("admin conectado")}</span><p className="mt-3 text-xs font-medium text-[#d8e3db]">{translateUi(user?.name)}</p><p className="mt-1 text-[10px] text-[#778a7f]">{translateUi("admin da plataforma")}</p><button onClick={logout} type="button" className="mt-4 text-[10px] text-[#899c91] hover:text-white">{translateUi("Sair")}</button></div></aside>
    <main className="min-w-0 lg:col-start-2">
      <header className="sticky top-0 z-20 flex h-[66px] items-center justify-between border-b border-white/[.07] bg-[#09090d]/90 px-4 backdrop-blur-xl sm:px-7 lg:px-9"><div className="flex items-center gap-3 lg:hidden"><Brand compact /><span className="rounded-full bg-[#98abff]/[.08] px-2 py-1 text-[9px] font-semibold uppercase tracking-[.12em] text-[#aab8ff]">{translateUi("admin")}</span></div><div className="hidden items-center gap-2 text-xs text-[#81948a] lg:flex"><span>{translateUi("Omega")}</span><ArrowRight size={12} /><span className="text-[#d3ded6]">{translateUi("Painel administrativo")}</span></div><div className="ml-auto flex items-center gap-4"><Link to="/landing" className="inline-flex items-center gap-1 text-[11px] text-[#8c9f94] hover:text-white">{translateUi("Abrir site ")}<ArrowUpRight size={13} /></Link><span className="grid size-8 place-items-center rounded-full bg-[#14151d] text-xs font-medium text-[#c6b5ff]">{translateUi(user?.name.slice(0, 1).toUpperCase())}</span></div></header>
      <div className="mx-auto max-w-[1480px] p-4 sm:p-7 lg:p-9">
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:hidden">{nav.map(({ id, label, icon: Icon }) => <button type="button" key={id} onClick={() => setSection(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-[10px] ${section === id ? 'border-[#a78bfa]/25 bg-[#a78bfa]/[.07] text-[#c1acff]' : 'border-white/[.08] text-[#899b91]'}`}><Icon size={13} />{translateUi(label)}</button>)}</div>
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">{translateUi("administração")}</p><h1 className="mt-2 font-display text-3xl font-medium tracking-[-.05em] text-[#e9f1eb]">{translateUi(nav.find((item) => item.id === section)?.label)}</h1></div><div className="flex items-center gap-2 rounded-full border border-[#e4bc76]/15 bg-[#e4bc76]/[.045] px-3 py-2 text-[10px] text-[#b6a174]"><CircleDollarSign size={13} />{translateUi("Comissões confirmadas")}</div></div>
        <div className="mb-5 rounded-xl border border-[#e4bc76]/15 bg-[#e4bc76]/[.035] p-4 text-xs leading-relaxed text-[#b6a985]">{translateUi("Checkout de planos ainda não foi conectado ao provedor de pagamento. Pedidos e ativações só mudam após confirmação confiável do servidor.")}</div>
        {error && <p role="alert" className="mb-4 rounded-xl border border-[#f28c9a]/20 bg-[#f28c9a]/[.06] p-4 text-xs text-[#f2a8b2]">{translateUi(error)}</p>}
        {notice && <p role="status" className="mb-4 rounded-xl border border-[#98abff]/20 bg-[#98abff]/[.06] p-4 text-xs text-[#b5c2ff]">{translateUi(notice)}</p>}
        {loading && <p className="py-10 text-center text-xs text-[#8fa197]" role="status">{translateUi("Carregando dados…")}</p>}

        {!loading && section === 'overview' && <div className="admin-bento">
          <div className="admin-bento-metrics"><Metric icon={<WalletCards size={16} />} label={translateUi("Pedidos confirmados")} value={String(confirmedOrders.length)} note={`${orders.length} no total`} tone="mint" /><Metric icon={<MousePointer2 size={16} />} label={translateUi("Cliques atribuídos")} value={String(events.filter((event) => event.type === 'click').length)} note="Atividade dos links" tone="blue" /><Metric icon={<ArrowDownRight size={16} />} label={translateUi("Comissões em BRL")} value={formatMoney(commissionBrl, 'BRL')} note={`Volume confirmado: ${formatMoney(grossBrl, 'BRL')}`} tone="amber" /><Metric icon={<ArrowUpRight size={16} />} label={translateUi("Comissões em SOL")} value={formatMoney(commissionSol, 'SOL')} note={`Volume confirmado: ${formatMoney(grossSol, 'SOL')}`} tone="lilac" /></div>
          <div className="admin-bento-panels"><section className="rounded-xl border border-white/[.07] bg-[#12121a] p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="font-display text-base font-medium text-[#e0eae3]">{translateUi("Atividade dos últimos 7 dias")}</h2><p className="mt-1 text-[10px] text-[#7f9287]">{translateUi("Cliques e pedidos confirmados")}</p></div><span className="grid size-8 place-items-center rounded-lg bg-[#a78bfa]/[.08] text-[#a78bfa]"><Activity size={15} /></span></div><div className="mt-5 h-[250px] w-full">{events.length || orders.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 8, right: 5, left: -22, bottom: 0 }}><defs><linearGradient id="admin-clicks" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a78bfa" stopOpacity={.23} /><stop offset="100%" stopColor="#a78bfa" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} /><XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fill: '#71847a', fontSize: 10 }} /><Tooltip contentStyle={{ background: '#171820', border: '1px solid #302d3c', borderRadius: 12, color: '#e6eee9', fontSize: 11 }} /><Area type="monotone" dataKey="cliques" name="Cliques" stroke="#a78bfa" fill="url(#admin-clicks)" strokeWidth={2} /><Area type="monotone" dataKey="pedidos" name="Pedidos" stroke="#98abff" fill="transparent" strokeWidth={2} /></AreaChart></ResponsiveContainer> : <Empty text="Ainda sem eventos ou pedidos registrados." />}</div></section>
            <section className="rounded-xl border border-white/[.07] bg-[#12121a] p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-display text-base font-medium text-[#e0eae3]">{translateUi("Trilha publicada")}</h2><p className="mt-1 text-[10px] text-[#7f9287]">{translateUi("Conteúdo publicado")}</p></div><BookOpen size={16} className="text-[#98abff]" /></div><p className="mt-6 font-display text-3xl font-medium tracking-[-.05em] text-[#e9f2eb]">{translateUi(modules.length)}<span className="ml-2 text-sm font-normal tracking-normal text-[#809389]">{translateUi("módulos")}</span></p><div className="mt-5 space-y-3">{modules.slice(0, 4).map((module) => <div key={module.id} className="flex items-center gap-3"><span className="font-display text-[10px] text-[#61766a]">{translateUi(String(module.ordinal).padStart(2, '0'))}</span><span className="min-w-0 flex-1 truncate text-[11px] text-[#a9b8af]">{translateUi(module.title)}</span><span className={`size-1.5 rounded-full ${module.published ? 'bg-[#a78bfa]' : 'bg-[#e4bc76]'}`} /></div>)}</div><button type="button" onClick={() => setSection('content')} className="mt-6 inline-flex items-center gap-1 text-[10px] text-[#c1acff]">{translateUi("Ver conteúdo completo ")}<ArrowRight size={12} /></button></section></div>
          <section className="mt-4 rounded-xl border border-white/[.07] bg-[#12121a] p-5 sm:p-6"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-display text-base font-medium text-[#e0eae3]">{translateUi("Pedidos recentes")}</h2><p className="mt-1 text-[10px] text-[#7f9287]">{translateUi("Últimos pedidos")}</p></div><button onClick={() => setSection('orders')} className="text-[10px] text-[#c1acff] hover:text-white">{translateUi("Ver todos ")}<ArrowRight size={12} className="inline" /></button></div><OrdersTable orders={orders.slice(0, 4)} /></section>
        </div>}

        {!loading && section === 'content' && <section className="admin-content-bento">{modules.map((module) => <div key={module.id} className="rounded-xl border border-white/[.07] bg-[#12121a] p-4 sm:p-5"><div className="flex flex-wrap items-center gap-4"><span className="font-display text-xs tracking-[.12em] text-[#678072]">{translateUi(String(module.ordinal).padStart(2, '0'))}</span><div className="min-w-[180px] flex-1"><h2 className="text-sm font-medium text-[#dce7df]">{translateUi(module.title)}</h2><p className="mt-1 text-[10px] text-[#7e9187]">{translateUi(module.lessons.length)} {translateUi(" aulas")}</p></div><span className={`rounded-full border px-2.5 py-1 text-[9px] ${module.published ? 'border-[#a78bfa]/15 bg-[#a78bfa]/[.04] text-[#c1acff]' : 'border-[#e4bc76]/15 bg-[#e4bc76]/[.04] text-[#d7ba80]'}`}>{translateUi(module.published ? 'Publicado' : 'Rascunho')}</span><button type="button" onClick={() => setExpanded(expanded === module.id ? null : module.id)} className="inline-flex items-center gap-1 rounded-full border border-white/[.08] px-3 py-2 text-[10px] text-[#9aaca2] hover:bg-white/[.035]">{translateUi(expanded === module.id ? 'Fechar aulas' : 'Ver aulas')}<ArrowDownRight size={12} /></button></div>{expanded === module.id && <div className="mt-4 space-y-2 border-t border-white/[.06] pt-4">{module.lessons.map((lesson, index) => <div key={lesson.id} className="flex items-center justify-between gap-3 text-[11px]"><span className="text-[#afbbb3]">{translateUi(index + 1)}. {translateUi(lesson.title)}</span><span className="shrink-0 text-[#71857a]">{translateUi(lesson.durationMinutes)} {translateUi(" min")}</span></div>)}</div>}</div>)}</section>}

        {section === 'journeys' && <JourneyAdmin />}
        {!loading && section === 'affiliates' && <section className="space-y-5"><div className="rounded-xl border border-white/[.07] bg-[#12121a] p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-display text-base font-medium text-[#e0eae3]">{translateUi("Afiliados ativos e inativos")}</h2><p className="mt-1 text-[10px] text-[#7f9287]">{translateUi("Desempenho por afiliado.")}</p></div></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead><tr className="border-b border-white/[.07] text-[9px] uppercase tracking-[.12em] text-[#667b6f]"><th className="pb-3 font-medium">{translateUi("Afiliado / código")}</th><th className="pb-3 font-medium">{translateUi("Cliques")}</th><th className="pb-3 font-medium">{translateUi("Cadastros")}</th><th className="pb-3 font-medium">{translateUi("Pedidos")}</th><th className="pb-3 font-medium">{translateUi("Comissão BRL")}</th><th className="pb-3 font-medium">{translateUi("Comissão SOL")}</th></tr></thead><tbody>{affiliates.map((affiliate) => <tr key={affiliate.userId} className="border-b border-white/[.045] text-[11px] last:border-0"><td className="py-4"><p className="font-medium text-[#c8d5cc]">{translateUi(affiliate.name)}{!affiliate.active && <span className="ml-2 text-[9px] text-[#e4bc76]">{translateUi("inativo")}</span>}</p><p className="mt-1 font-mono text-[9px] text-[#71857a]">{translateUi(affiliate.code)} · {translateUi(affiliate.commissionBps / 100)}%</p></td><td className="py-4 text-[#a7b6ad]">{translateUi(affiliate.clicks)}</td><td className="py-4 text-[#a7b6ad]">{translateUi(affiliate.signups)}</td><td className="py-4 text-[#a7b6ad]">{translateUi(affiliate.sales)}</td><td className="py-4 text-[#a7b6ad]">{translateUi(formatMoney(affiliate.commissionBrl, 'BRL'))}</td><td className="py-4 text-[#a7b6ad]">{translateUi(formatMoney(affiliate.commissionSol, 'SOL'))}</td></tr>)}</tbody></table>{!affiliates.length && <Empty text="Nenhum afiliado cadastrado." />}</div></div>
          <div className="rounded-xl border border-white/[.07] bg-[#12121a] p-5 sm:p-6"><h2 className="font-display text-base font-medium text-[#e0eae3]">{translateUi("Solicitações de saque")}</h2><div className="mt-4 space-y-3">{pendingPayouts.map((payout) => <div key={payout.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[.07] bg-[#0e0f15] p-4"><div><p className="text-xs text-[#d7e2da]">{translateUi(payout.affiliateName)} · {translateUi(formatMoney(payout.amount, payout.currency))}</p><p className="mt-1 text-[9px] text-[#75897d]">{translateUi(payout.currency === 'BRL' ? 'Chave PIX' : 'Carteira Solana')}: <span className="font-mono text-[#b8c6bd]">{translateUi(payout.destination ?? 'Destino não informado')}</span></p><p className="mt-1 text-[9px] text-[#75897d]">{translateUi("Solicitado em ")}{translateUi(new Date(payout.createdAt).toLocaleDateString(getUiLocale()))}</p></div><div className="flex gap-2"><button type="button" disabled={busy} onClick={() => void settlePayout(payout.id, 'paid')} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#a78bfa]/20 px-3 text-[10px] text-[#c1acff] disabled:opacity-40"><Check size={13} />{translateUi("Marcar pago")}</button><button type="button" disabled={busy} onClick={() => void settlePayout(payout.id, 'rejected')} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e58e91]/15 px-3 text-[10px] text-[#eaa2a4] disabled:opacity-40"><X size={13} />{translateUi("Rejeitar")}</button></div></div>)}{!pendingPayouts.length && <Empty text="Nenhum saque aguardando processamento." />}</div></div>
        </section>}

        {!loading && section === 'orders' && <section className="rounded-xl border border-white/[.07] bg-[#12121a] p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-display text-base font-medium text-[#e0eae3]">{translateUi("Pedidos e pagamentos")}</h2><p className="mt-1 text-[10px] text-[#7f9287]">{translateUi("Status mantido pelo servidor e pelo provedor.")}</p></div><span className="text-[10px] text-[#7b8f83]">{translateUi(orders.length)} {translateUi(" pedidos")}</span></div><OrdersTable orders={orders} /></section>}

        {!loading && section === 'reviews' && <section className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-white/[.07] bg-[#12121a] p-5 sm:p-6"><div><h2 className="font-display text-base font-medium text-[#e0eae3]">{translateUi("Moderação de avaliações")}</h2><p className="mt-1 max-w-xl text-[10px] leading-relaxed text-[#7f9287]">{translateUi("Aprovar, rejeitar ou remover comentários enviados pelos alunos.")}</p></div><span className="text-[10px] text-[#9b8dbb]">{translateUi(reviews.length)} {translateUi(" avaliações")}</span></div>{reviews.length ? reviews.map((review) => <ReviewModerationCard key={review.id} review={review} busy={busy} onStatus={setReviewStatus} onDelete={removeReview} />) : <Empty text="Nenhuma avaliação recebida." />}</section>}
        <p className="mt-7 flex items-start gap-2 text-[10px] leading-relaxed text-[#65796d]"><span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-[#e4bc76]" />{translateUi("A confirmação de pagamentos aguarda configuração do checkout no Marketplace; não altere pedidos manualmente para conceder acesso.")}</p>
      </div>
    </main>
  </div>
}

function ReviewModerationCard({ review, busy, onStatus, onDelete }: { review: StudentReview; busy: boolean; onStatus: (id: string, status: 'approved' | 'rejected') => void; onDelete: (id: string) => void }) {
  useUiTranslation();
  const statusLabel = { pending: 'Aguardando', approved: 'Publicada', rejected: 'Rejeitada' }[review.status]
  return <article className="rounded-xl border border-white/[.07] bg-[#12121a] p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-medium text-[#ded8e7]">{translateUi(review.name)}</span><span className="rounded-md border border-white/[.09] px-2 py-1 text-[9px] text-[#a7a0b1]">{translateUi(statusLabel)}</span><time dateTime={review.createdAt} className="text-[10px] text-[#77717f]">{translateUi(new Date(review.createdAt).toLocaleDateString(getUiLocale()))}</time></div><div className="mt-3 flex items-center gap-1 text-[#e9c577]" aria-label={translateUi(translateTemplate("{{value0}} de 5 estrelas", [review.rating]))}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={12} fill={index < review.rating ? 'currentColor' : 'none'} />)}</div><p className="mt-3 max-w-4xl whitespace-pre-wrap text-xs leading-relaxed text-[#b8b2c0]">{translateUi(review.text)}</p></div><div className="flex shrink-0 flex-wrap gap-2">{review.status !== 'approved' && <button type="button" disabled={busy} onClick={() => onStatus(review.id, 'approved')} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#a78bfa]/20 px-3 text-[10px] text-[#c1acff] disabled:opacity-40"><Check size={13} />{translateUi("Aprovar")}</button>}{review.status !== 'rejected' && <button type="button" disabled={busy} onClick={() => onStatus(review.id, 'rejected')} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/[.1] px-3 text-[10px] text-[#9aaca2] disabled:opacity-40"><X size={13} />{translateUi("Rejeitar")}</button>}<button type="button" disabled={busy} onClick={() => onDelete(review.id)} aria-label={translateUi(translateTemplate("Remover avaliação de {{value0}}", [review.name]))} className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#e58e91]/15 px-3 text-[10px] text-[#eaa2a4] disabled:opacity-40"><Trash2 size={13} />{translateUi("Remover")}</button></div></div></article>
}

function Metric({ icon, label, value, note, tone }: { icon: ReactNode; label: string; value: string; note: string; tone: 'mint' | 'blue' | 'amber' | 'lilac' }) {
  useUiTranslation();
  const tones = { mint: 'bg-[#a78bfa]/[.08] text-[#a78bfa]', blue: 'bg-[#98abff]/[.08] text-[#aab8ff]', amber: 'bg-[#e4bc76]/[.08] text-[#e4bc76]', lilac: 'bg-[#bba3ff]/[.08] text-[#c4b3ff]' }
  return <div className="rounded-xl border border-white/[.07] bg-[#12121a] p-4"><div className="flex items-center gap-2.5"><span className={`grid size-8 place-items-center rounded-lg ${tones[tone]}`}>{translateUi(icon)}</span><span className="text-[10px] text-[#8c9e94]">{translateUi(label)}</span></div><p className="mt-4 font-display text-xl font-medium tracking-[-.05em] text-[#e4ede6]">{translateUi(value)}</p><p className="mt-1 text-[9px] text-[#708378]">{translateUi(note)}</p></div>
}

function OrdersTable({ orders }: { orders: AdminOrder[] }) {
  useUiTranslation();
  if (!orders.length) return <Empty text="Nenhum pedido registrado." />
  return <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead><tr className="border-b border-white/[.07] text-[9px] uppercase tracking-[.12em] text-[#667b6f]"><th className="pb-3 font-medium">{translateUi("Data")}</th><th className="pb-3 font-medium">{translateUi("Plano")}</th><th className="pb-3 font-medium">{translateUi("Valor")}</th><th className="pb-3 font-medium">{translateUi("Afiliado")}</th><th className="pb-3 font-medium">{translateUi("Comissão")}</th><th className="pb-3 font-medium">{translateUi("Status")}</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-b border-white/[.045] text-[11px] last:border-0"><td className="py-3.5 text-[#899c91]">{translateUi(new Date(order.at).toLocaleDateString(getUiLocale()))}</td><td className="py-3.5 text-[#c0cdc4]">{translateUi(planName(order.plan))}</td><td className="py-3.5 text-[#b1c0b6]">{translateUi(formatMoney(order.amount, order.currency))}</td><td className="py-3.5 font-mono text-[9px] text-[#92a79b]">{translateUi(order.referralCode ?? 'direto')}</td><td className="py-3.5 text-[#b1c0b6]">{translateUi(formatMoney(order.commission, order.currency))}</td><td className="py-3.5"><span className="rounded-full border border-white/[.1] px-2 py-1 text-[9px] text-[#cdb477]">{translateUi(order.status)}</span></td></tr>)}</tbody></table></div>
}

function Empty({ text }: { text: string }) {
  useUiTranslation();
  return <div className="grid min-h-[110px] place-items-center rounded-xl border border-dashed border-white/[.08] px-4 text-center text-xs text-[#7f9287]">{translateUi(text)}</div>
}

function planName(plan: string) { return plan === 'month' ? '1 mês' : plan === 'quarter' ? '3 meses' : plan === 'lifetime' ? 'Vitalício' : plan }
function formatMoney(value: number, currency: Currency) { return currency === 'BRL' ? `R$ ${value.toFixed(2).replace('.', ',')}` : `${value.toFixed(4).replace('.', ',')} SOL` }
