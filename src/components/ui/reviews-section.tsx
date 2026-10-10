import { translateUi, translateTemplate, getUiLocale } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { useEffect, useState, type FormEvent } from 'react'
import { ArrowUpRight, MessageSquareQuote, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { LocalizedLink as Link } from '@/components/localized-router'
import { GlowCard } from '@/components/ui/spotlight-card'
import { AmbientShader } from '@/components/ui/ambient-shader'
import { useSession } from '@/contexts/session-context'
import { loadPublishedReviews, submitReview, type StudentReview } from '@/lib/community-service'

function ReviewCard({ review, index }: { review: StudentReview; index: number }) {
  useUiTranslation();

  const initials = review.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?'
  return <motion.div className="review-card-shell" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: .45, delay: Math.min(index * .045, .2) }} viewport={{ once: true, amount: .2 }}>
    <GlowCard className="review-entry-glow" glowColor="purple" customSize>
      <article className="review-card h-full">
        <header className="review-card-author">
          <span className="review-avatar" aria-hidden="true">{initials}</span>
          <div className="review-author-copy"><strong>{review.name}</strong><span>{translateUi("Aluno")}</span></div>
          <time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString(getUiLocale())}</time>
        </header>
        <blockquote>
          <div className="review-rating" aria-label={translateTemplate("{{value0}} de 5 estrelas", [review.rating])}>
            {Array.from({ length: 5 }, (_, star) => <Star key={star} size={12} fill={star < review.rating ? 'currentColor' : 'none'} />)}
          </div>
          <p>“{review.text}”</p>
        </blockquote>
      </article>
    </GlowCard>
  </motion.div>
}

export function ReviewsSection() {
  useUiTranslation();

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

  return <section id="avaliacoes" className="review-section scroll-mt-24 py-20 sm:py-24">
    <AmbientShader />
    <div className="page-shell review-community-shell">
      <div className="review-community-layout">
        <div className="review-community-left">
          <header className="review-community-intro">
            <p className="eyebrow review-community-kicker">{translateUi("comunidade")}</p>
            <h2>{translateUi("O que os alunos estão dizendo.")}</h2>
            <p>{translateUi("Relatos de quem está estudando criptoativos com contexto, prática e atenção aos riscos.")}</p>
          </header>

          <div className="review-compose-panel">
            <div className="review-compose-heading">
              <span className="review-compose-icon"><MessageSquareQuote size={17} /></span>
              <div><h3>{translateUi("Compartilhe sua experiência")}</h3><p>{translateUi("O que ficou mais claro no seu estudo?")}</p></div>
            </div>
            <p className="review-compose-guidance">{translateUi("Conte sobre uma ideia ou exercício específico. Não inclua saldo, dados pessoais ou informações de carteira.")}</p>
          {canReview ? <form className="mt-5 space-y-4" onSubmit={(event) => void submit(event)}>
            <div className="grid gap-2 sm:max-w-[220px]">
              <label htmlFor="review-rating" className="text-[10px] text-[#a9a3b2]">{translateUi("Nota")}</label>
              <select id="review-rating" value={rating} onChange={(event) => setRating(event.target.value)} className="review-input h-10 rounded-xl border px-3 text-xs focus:outline-none"><option value="5">{translateUi("5 — Excelente")}</option><option value="4">{translateUi("4 — Muito boa")}</option><option value="3">{translateUi("3 — Boa")}</option><option value="2">{translateUi("2 — Pode melhorar")}</option><option value="1">{translateUi("1 — Ruim")}</option></select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="review-text" className="text-[10px] text-[#a9a3b2]">{translateUi("Comentário")}</label>
              <textarea id="review-text" required minLength={20} maxLength={400} value={text} onChange={(event) => setText(event.target.value)} placeholder={translateUi("Descreva o que você aprendeu…")} className="review-input min-h-28 resize-y rounded-xl border px-3 py-3 text-xs leading-relaxed focus:outline-none" />
              <div className="flex justify-between text-[9px] text-[#8290a8]"><span>{translateUi("Mínimo de 20 caracteres.")}</span><span>{translateUi(text.length)}/400</span></div>
            </div>
            <div className="flex flex-wrap items-center gap-3"><button type="submit" disabled={text.trim().length < 20 || submitting} className="button-motion inline-flex h-10 items-center gap-2 rounded-xl bg-[#b49cff] px-4 text-xs font-semibold text-[#100c19] disabled:cursor-not-allowed disabled:opacity-45">{translateUi(submitting ? 'Enviando…' : 'Publicar avaliação')} <ArrowUpRight size={14} /></button>{notice && <p role="status" className="text-[10px] text-[#9bcdb7]">{translateUi(notice)}</p>}</div>
            {error && <p role="alert" className="text-xs text-[#f2a8b2]">{translateUi(error)}</p>}
          </form> : <div className="mt-5 flex flex-wrap items-center gap-3">{user ? <p className="text-xs text-[#a19ca9]">{translateUi("A avaliação fica disponível após ativar acesso ao curso.")}</p> : <Link to="/login" className="button-motion inline-flex h-10 items-center gap-2 rounded-xl bg-[#b49cff] px-4 text-xs font-semibold text-[#100c19]">{translateUi("Entre como aluno para avaliar ")}<ArrowUpRight size={14} /></Link>}</div>}
            <p className="review-compose-footnote">{translateUi("Avaliações passam por revisão antes de aparecerem publicamente.")}</p>
          </div>
        </div>

        <div className="review-community-feed">
          <div className="review-feed-heading"><h3>{translateUi("Avaliações publicadas")}</h3><span>{translateUi(loading ? '…' : reviews.length)}</span></div>
          <div className="review-grid" aria-label={translateUi("Avaliações publicadas")}>
            {loading ? <p role="status" className="review-empty-state">{translateUi("Carregando avaliações…")}</p> : reviews.length ? reviews.map((review, index) => <ReviewCard key={review.id} review={review} index={index} />) : <p className="review-empty-state">{translateUi("Ainda não há avaliações publicadas.")}</p>}
          </div>
          {error && !canReview && <p role="alert" className="mt-4 text-xs text-[#f2a8b2]">{translateUi(error)}</p>}
        </div>
      </div>
    </div>
  </section>
}
