import { useEffect, useState, type FormEvent } from 'react'
import { ArrowUpRight, MessageSquareQuote, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { GlowCard } from '@/components/ui/spotlight-card'
import { useSession } from '@/contexts/session-context'
import { loadPublishedReviews, submitReview, type StudentReview } from '@/lib/community-service'

function ReviewCard({ review, index }: { review: StudentReview; index: number }) {
  return <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: .45, delay: index * .06 }} viewport={{ once: true, amount: .2 }}>
    <GlowCard className="review-entry-glow" glowColor="purple" customSize>
      <article className="review-card h-full">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-[#e9c577]" aria-label={`${review.rating} de 5 estrelas`}>
            {Array.from({ length: 5 }, (_, star) => <Star key={star} size={13} fill={star < review.rating ? 'currentColor' : 'none'} />)}
          </div>
          <span className="rounded-md border border-white/[.09] px-2 py-1 text-[9px] text-[#a7a0b1]">Avaliação publicada</span>
        </div>
        <blockquote className="mt-4 font-display text-[15px] leading-relaxed tracking-[-.02em] text-[#e8e5ed]">“{review.text}”</blockquote>
        <footer className="mt-5 flex items-center justify-between gap-3 border-t border-white/[.07] pt-4">
          <span className="text-xs font-medium text-[#d8d2e0]">{review.name}</span>
          <time className="text-[10px] text-[#85808e]" dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString('pt-BR')}</time>
        </footer>
      </article>
    </GlowCard>
  </motion.div>
}

export function ReviewsSection() {
  const { user } = useSession()
  const [reviews, setReviews] = useState<StudentReview[]>([])
  const [rating, setRating] = useState('5')
  const [text, setText] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const canReview = user?.role === 'student' && user.plan !== null

  useEffect(() => {
    let active = true
    loadPublishedReviews()
      .then((items) => { if (active) setReviews(items) })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as avaliações.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const body = text.trim()
    if (!canReview || body.length < 20 || submitting) return
    setSubmitting(true); setError(''); setNotice('')
    try {
      await submitReview(Number(rating), body)
      setText('')
      setNotice('Avaliação enviada para moderação. Ela aparecerá após aprovação.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível enviar sua avaliação.')
    } finally { setSubmitting(false) }
  }

  return <section id="avaliacoes" className="review-section scroll-mt-24 border-y border-white/[.055] bg-[#0c0c12] py-20 sm:py-24">
    <div className="page-shell">
      <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <p className="eyebrow">avaliações</p>
          <h2 className="display-lg mt-4 text-[#eaf2ec]">Uma boa aula deixa perguntas melhores.</h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#9792a0]">Leia avaliações publicadas e compartilhe o que ajudou no seu estudo.</p>
        </div>
        <div className="flex max-w-sm items-start gap-3 rounded-xl border border-[#e4bc76]/15 bg-[#e4bc76]/[.035] p-4 text-[11px] leading-relaxed text-[#b6a985]"><MessageSquareQuote size={15} className="mt-0.5 shrink-0 text-[#e4bc76]" />Só avaliações enviadas por alunos e aprovadas pela equipe aparecem aqui.</div>
      </div>

      <div className="review-grid" aria-label="Avaliações publicadas">
        {loading ? <p role="status" className="rounded-xl border border-dashed border-white/[.1] p-6 text-xs text-[#938d9d]">Carregando avaliações…</p> : reviews.length ? reviews.map((review, index) => <ReviewCard key={review.id} review={review} index={index} />) : <p className="rounded-xl border border-dashed border-white/[.1] p-6 text-xs text-[#938d9d]">Ainda não há avaliações publicadas.</p>}
      </div>

      <div className="review-submit-layout mt-8">
        <div className="rounded-xl border border-white/[.07] bg-[#12121a] p-5 sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#b49cff]">sua experiência</p>
          <h3 className="mt-2 font-display text-xl font-medium tracking-[-.04em] text-[#e7e3ed]">O que ficou mais claro?</h3>
          <p className="mt-2 max-w-lg text-xs leading-relaxed text-[#938d9d]">Conte sobre uma ideia ou exercício específico. Não inclua dados pessoais, saldo ou informações de carteira.</p>
          {canReview ? <form className="mt-5 space-y-4" onSubmit={(event) => void submit(event)}>
            <div className="grid gap-2 sm:max-w-[220px]">
              <label htmlFor="review-rating" className="text-[10px] text-[#a9a2b2]">Nota</label>
              <select id="review-rating" value={rating} onChange={(event) => setRating(event.target.value)} className="h-10 rounded-xl border border-white/[.1] bg-[#0d0d13] px-3 text-xs text-[#e6e1ec] focus:border-[#b49cff]/50 focus:outline-none"><option value="5">5 — Excelente</option><option value="4">4 — Muito boa</option><option value="3">3 — Boa</option><option value="2">2 — Pode melhorar</option><option value="1">1 — Ruim</option></select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="review-text" className="text-[10px] text-[#a9a2b2]">Comentário</label>
              <textarea id="review-text" required minLength={20} maxLength={400} value={text} onChange={(event) => setText(event.target.value)} placeholder="Descreva o que você aprendeu…" className="min-h-24 resize-y rounded-xl border border-white/[.1] bg-[#0d0d13] px-3 py-3 text-xs leading-relaxed text-[#e6e1ec] placeholder:text-[#676372] focus:border-[#b49cff]/50 focus:outline-none" />
              <div className="flex justify-between text-[9px] text-[#746f7d]"><span>Mínimo de 20 caracteres.</span><span>{text.length}/400</span></div>
            </div>
            <div className="flex flex-wrap items-center gap-3"><button type="submit" disabled={text.trim().length < 20 || submitting} className="button-motion inline-flex h-10 items-center gap-2 rounded-xl bg-[#b49cff] px-4 text-xs font-semibold text-[#100c19] disabled:cursor-not-allowed disabled:opacity-45">{submitting ? 'Enviando…' : 'Enviar avaliação'} <ArrowUpRight size={14} /></button>{notice && <p role="status" className="text-[10px] text-[#9bcdb7]">{notice}</p>}</div>
            {error && <p role="alert" className="text-xs text-[#f2a8b2]">{error}</p>}
          </form> : <div className="mt-5 flex flex-wrap items-center gap-3">{user ? <p className="text-xs text-[#827c8a]">A avaliação fica disponível após ativar acesso ao curso.</p> : <Link to="/login" className="button-motion inline-flex h-10 items-center gap-2 rounded-xl bg-[#b49cff] px-4 text-xs font-semibold text-[#100c19]">Entre como aluno para avaliar <ArrowUpRight size={14} /></Link>}</div>}
        </div>
        <div className="review-note-panel rounded-xl border border-[#b49cff]/15 bg-[radial-gradient(ellipse_at_85%_0%,rgba(167,139,250,.12),transparent_55%),#111017] p-5 sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#b49cff]">critério da comunidade</p>
          <p className="mt-4 font-display text-lg leading-snug tracking-[-.03em] text-[#e6e1ec]">Comentários úteis falam do conteúdo, não prometem resultado financeiro.</p>
          <p className="mt-3 text-xs leading-relaxed text-[#938d9b]">A equipe pode aprovar, rejeitar ou remover avaliações pelo painel administrativo.</p>
        </div>
      </div>
    </div>
  </section>
}
