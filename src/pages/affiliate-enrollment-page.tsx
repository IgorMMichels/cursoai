import { useState } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Link2, Users } from 'lucide-react'
import { Brand } from '@/components/brand'
import { useSession } from '@/contexts/session-context'

export function AffiliateEnrollmentPage() {
  const { user, joinAffiliateProgram } = useSession()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!user) return <Navigate to="/login" replace />
  if (user.isAffiliate) return <Navigate to="/afiliado" replace />
  const join = async () => {
    if (loading) return
    setLoading(true); setError('')
    try {
      await joinAffiliateProgram()
      navigate('/afiliado', { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível ativar sua conta de afiliado.')
    } finally { setLoading(false) }
  }

  return <main className="grid min-h-screen place-items-center bg-[#09090d] px-4 py-10 text-[#e6eee9]">
    <section className="w-full max-w-[620px] rounded-2xl border border-white/[.08] bg-[#12121a] p-6 sm:p-10">
      <div className="flex items-center justify-between"><Brand /><Link to="/landing" className="text-xs text-[#8ea197] hover:text-white">Voltar ao site</Link></div>
      <span className="mt-10 grid size-12 place-items-center rounded-2xl border border-[#e4bc76]/20 bg-[#e4bc76]/[.08] text-[#e4bc76]"><Users size={22} /></span>
      <p className="eyebrow mt-6">programa de afiliados</p>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-[-.05em] text-[#edf3ee]">Indique o curso com sua conta.</h1>
      <p className="mt-3 text-sm leading-relaxed text-[#9eaa9f]">Seu ID escolhido no cadastro será seu link. A conta de afiliado dá acesso ao painel; aulas continuam vinculadas ao seu plano.</p>
      <p className="mt-5 rounded-xl border border-white/[.07] bg-black/20 px-4 py-3 font-mono text-xs text-[#c6b6ea]">{window.location.origin}/{user.username}</p>
      <ul className="mt-6 space-y-3 text-xs text-[#bbc8bf]"><li className="flex gap-2"><Check size={14} className="shrink-0 text-[#a78bfa]" />Seu código pessoal de indicação</li><li className="flex gap-2"><Check size={14} className="shrink-0 text-[#a78bfa]" />Cliques e cadastros associados ao seu código</li><li className="flex gap-2"><Check size={14} className="shrink-0 text-[#a78bfa]" />Comissão contabilizada somente após pagamento confirmado</li></ul>
      <p className="mt-5 rounded-xl border border-[#e4bc76]/15 bg-[#e4bc76]/[.04] p-4 text-[11px] leading-relaxed text-[#b6a985]">Checkout ainda indisponível. Nenhuma venda ou comissão será registrada até a conexão do provedor de pagamento.</p>
      {error && <p role="alert" className="mt-4 rounded-lg border border-[#f28c9a]/20 bg-[#f28c9a]/[.06] p-3 text-xs text-[#f2a8b2]">{error}</p>}
      <button type="button" onClick={() => void join()} disabled={loading} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#b49cff] px-5 text-sm font-semibold text-[#100c19] hover:bg-[#c6b4ff] disabled:cursor-wait disabled:opacity-55">{loading ? 'Ativando…' : 'Ativar conta de afiliado'} {loading ? null : <ArrowRight size={15} />}</button>
      <p className="mt-4 flex items-center justify-center gap-2 text-[10px] text-[#73867b]"><Link2 size={12} />Sua conta atual: {user.email}</p>
    </section>
  </main>
}
