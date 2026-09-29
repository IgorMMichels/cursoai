import { useEffect } from 'react'
import { ArrowUpRight, MessageSquareQuote, Star } from 'lucide-react'
import { motion, useAnimationControls } from 'motion/react'
import { Link } from 'react-router-dom'
import { GlowCard } from '@/components/ui/spotlight-card'

interface StudentReview {
  name: string
  context: string
  text: string
  rating: number
}

// Empty until real, consented reviews arrive from the data layer.
const publishedReviews: StudentReview[] = []

function ReviewColumn({ reviews, duration }: { reviews: StudentReview[]; duration: number }) {
  const controls = useAnimationControls()
  const play = () => controls.start({
    y: '-50%',
    transition: { duration, repeat: Infinity, ease: 'linear', repeatType: 'loop' },
  })

  useEffect(() => { void play() }, [duration])

  const cards = (set: string) => <div className="flex flex-col gap-4" aria-hidden={set === 'copy'}>
    {reviews.map((review, index) => <GlowCard className="review-entry-glow" glowColor="purple" customSize key={`${set}-${review.name}-${index}`}>
      <article className="review-card">
      <div className="flex items-center gap-1 text-[#e9c577]" aria-label={`${review.rating} de 5 estrelas`}>
        {Array.from({ length: 5 }, (_, star) => <Star key={star} size={13} fill={star < review.rating ? 'currentColor' : 'none'} />)}
      </div>
      <blockquote className="mt-4 font-display text-[16px] leading-relaxed tracking-[-.025em] text-[#e8e5ed]">“{review.text}”</blockquote>
      <footer className="mt-5 flex items-center justify-between gap-3 border-t border-white/[.07] pt-4">
        <span className="text-xs font-medium text-[#d8d2e0]">{review.name}</span>
        <span className="text-[10px] text-[#85808e]">{review.context}</span>
      </footer>
      </article>
    </GlowCard>)}
  </div>

  return <div className="review-column" onPointerEnter={() => controls.stop()} onPointerLeave={() => void play()}>
    <motion.div className="review-column-track" animate={controls}>{cards('first')}{cards('copy')}</motion.div>
  </div>
}

export function ReviewsSection() {
  if (publishedReviews.length > 0) {
    const third = Math.ceil(publishedReviews.length / 3)
    return <section id="avaliacoes" className="review-section scroll-mt-24 border-y border-white/[.055] bg-[#0c0c12] py-20 sm:py-24">
      <div className="page-shell">
        <div className="mb-10 max-w-2xl">
          <p className="eyebrow">avaliações</p>
          <h2 className="display-lg mt-4 text-[#eaf2ec]">Experiências de quem estudou a trilha.</h2>
        </div>
        <div className="review-columns" aria-label="Avaliações de alunos">
          <ReviewColumn reviews={publishedReviews.slice(0, third)} duration={25} />
          <ReviewColumn reviews={publishedReviews.slice(third, third * 2)} duration={31} />
          <ReviewColumn reviews={publishedReviews.slice(third * 2)} duration={28} />
        </div>
      </div>
    </section>
  }

  return <section id="avaliacoes" className="review-section scroll-mt-24 border-y border-white/[.055] bg-[#0c0c12] py-20 sm:py-24">
    <div className="page-shell">
      <div className="review-empty-layout">
        <motion.div
          className="review-intro"
          initial={{ opacity: 0, y: 22, filter: 'blur(7px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: .62, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, amount: .35 }}
        >
          <p className="eyebrow">avaliações de alunos</p>
          <h2 className="display-lg mt-4 max-w-2xl text-[#eaf2ec]">Opiniões reais, depois da experiência.</h2>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-[#9792a0]">Esta área vai reunir comentários de alunos que percorreram a trilha. Ainda não há avaliações publicadas.</p>
          <Link to="/login" className="review-cta mt-7 inline-flex items-center gap-2 rounded-xl border border-white/[.12] bg-white/[.035] px-4 py-3 text-xs font-medium text-[#e3deeb] transition-all hover:-translate-y-1 hover:border-[#b49cff]/40 hover:bg-[#a78bfa]/[.08] hover:shadow-[0_12px_34px_rgba(151,119,226,.14)]">
            Explorar o curso <ArrowUpRight size={15} />
          </Link>
        </motion.div>

        <motion.div
          className="review-empty-motion"
          initial={{ opacity: 0, y: 28, rotateX: 7, scale: .98 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          transition={{ duration: .7, delay: .12, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, amount: .3 }}
        >
          <GlowCard glowColor="purple" customSize className="review-empty-card">
            <div className="review-card-topline"><span>avaliações da trilha</span><span>sem relatos</span></div>
            <div className="review-empty-symbol"><MessageSquareQuote size={26} strokeWidth={1.35} /></div>
            <div className="review-stars" aria-hidden="true">{Array.from({ length: 5 }, (_, star) => <Star key={star} size={17} strokeWidth={1.4} />)}</div>
            <p className="review-empty-title">Nenhuma avaliação ainda.</p>
            <p className="review-empty-copy">Este espaço está reservado aos comentários de alunos quando eles forem enviados.</p>
            <div className="review-empty-footer"><span>0 avaliações publicadas</span><span>relatos de alunos</span></div>
          </GlowCard>
        </motion.div>
      </div>
    </div>
  </section>
}
