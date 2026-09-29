import { ArrowRight, Image } from 'lucide-react'
import { moduleCovers, moduleVisualGuides } from '@/lib/course-media'

export function LessonVisual({ moduleId }: { moduleId: string }) {
  const guide = moduleVisualGuides[moduleId]
  if (!guide) return null

  return <section className="lesson-visual" aria-labelledby="lesson-visual-title">
    <div className="lesson-visual-image">
      <img src={moduleCovers[moduleId]} alt="" loading="lazy" />
      <div className="lesson-visual-image-shade" />
      <div className="lesson-visual-image-label"><Image size={13} />Imagem ilustrativa</div>
      <p>{guide.caption}</p>
    </div>
    <div className="lesson-visual-map">
      <div className="lesson-visual-heading"><span>mapa do conceito</span><h2 id="lesson-visual-title">{guide.title}</h2></div>
      <ol>
        {guide.steps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><p>{step}</p>{index < guide.steps.length - 1 && <ArrowRight size={13} aria-hidden="true" />}</li>)}
      </ol>
      <p className="lesson-visual-footnote">Leia cada etapa junto com a explicação da aula.</p>
    </div>
  </section>
}
