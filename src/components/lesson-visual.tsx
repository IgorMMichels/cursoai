import { ArrowRight, Image } from 'lucide-react'
import { journeyModuleVisuals, moduleCovers, moduleVisualGuides } from '@/lib/course-media'

export function LessonVisual({ moduleId }: { moduleId: string }) {
  const visual = journeyModuleVisuals[moduleId]
  if (visual) return (
    <figure className="my-8 overflow-hidden rounded-2xl border border-white/[.08] bg-[#101117]">
      <div className="relative overflow-x-auto overscroll-x-contain">
        <img
          src={`/journey-module-visuals/${moduleId}.svg`}
          alt={visual.alt}
          loading="lazy"
          decoding="async"
          className="block h-auto min-w-[640px] w-full"
        />
      </div>
      <figcaption className="border-t border-white/[.07] px-4 py-3 sm:px-5">
        <p className="text-[11px] font-medium text-[#dce6df]">{visual.title}</p>
        <p className="mt-1 text-[10px] leading-relaxed text-[#87958d]">{visual.description}</p>
        <p className="mt-2 text-[9px] text-[#777b8c] sm:hidden">Deslize o diagrama para explorar.</p>
      </figcaption>
    </figure>
  )

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
