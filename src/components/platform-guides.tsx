import { translateUi, translateTemplate } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUp, ArrowUpRight, ExternalLink, ShieldAlert, X } from 'lucide-react'
import { ArrowText } from '@/components/arrow-text'
import { platformGuidesByJourney, platformUrl, type PlatformGuide } from '@/lib/platform-guides'
import { platformGuideMedia } from '@/lib/platform-guide-media'

export function PlatformGuides({ journeyId }: { journeyId: string }) {
  useUiTranslation();
  const collection = platformGuidesByJourney[journeyId]
  const [selected, setSelected] = useState<PlatformGuide | null>(null)
  if (!collection) return null
  return <section className="mt-8" aria-labelledby="platform-heading"><div className="mb-5"><p className="eyebrow">{translateUi(collection.title)}</p><h2 id="platform-heading" className="mt-2 font-display text-2xl font-medium tracking-[-.04em] text-[#e9f1eb]">{translateUi("Plataformas recomendadas")}</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#8ea197]">{translateUi(collection.subtitle)}</p></div>
    <div className="space-y-8">{collection.groups.map((group) => <div key={group.label}><h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[.14em] text-[#9eb0a4]">{translateUi(group.label)}</h3><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{group.guides.map((guide) => { const media = platformGuideMedia[guide.id]; return <button type="button" key={guide.id} onClick={() => setSelected(guide)} aria-haspopup="dialog" className="group flex min-h-[150px] flex-col rounded-xl border border-white/[.07] bg-[#12121a] p-5 text-left transition-colors hover:border-[#a78bfa]/25 hover:bg-[#171720] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a78bfa]"><div className="flex w-full items-start gap-3"><span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/[.08] bg-white/[.04]" style={{ color: guide.tint }}>{media?.logo || guide.iconPath ? <img src={media?.logo ?? guide.iconPath} alt={translateUi("")} className="size-8 object-contain" onError={(event) => { event.currentTarget.style.display = 'none' }} /> : <span className="text-sm font-semibold">{translateUi(guide.name.slice(0, 2).toUpperCase())}</span>}</span><span className="min-w-0 flex-1"><strong className="block text-sm font-medium text-[#e5eee7]">{translateUi(guide.name)}</strong><span className="mt-1 inline-block rounded-full border border-white/[.09] px-2 py-0.5 text-[9px] text-[#b0a4cb]">{translateUi(guide.badge)}</span></span><ArrowUpRight size={16} className="text-[#867ba0] group-hover:text-[#b8a3f0]" /></div><span className="mt-4 text-xs leading-relaxed text-[#8ea096]">{translateUi(guide.description)}</span><span className="mt-auto pt-4 text-[10px] font-medium text-[#b8a3f0]">{translateUi("Abrir guia passo a passo")}</span></button>})}</div></div>)}</div>
    {selected && <PlatformDialog guide={selected} onClose={() => setSelected(null)} />}
  </section>
}

function PlatformDialog({ guide, onClose }: { guide: PlatformGuide; onClose: () => void }) {
  useUiTranslation();
  const dialog = useRef<HTMLDivElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const action = platformUrl(guide)
  const media = platformGuideMedia[guide.id]
  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButton.current?.focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab' || !dialog.current) return
      const focusable = Array.from(dialog.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href]'))
      const first = focusable[0]
      const last = focusable.at(-1)
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', keydown)
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener('keydown', keydown); previousFocus.current?.focus() }
  }, [onClose])
  return createPortal(<div className="fixed inset-0 z-[110] grid place-items-center bg-black/75 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="platform-dialog-title" className="flex max-h-[min(92dvh,800px)] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl border border-white/[.11] bg-[#12121a] shadow-[0_28px_90px_rgba(0,0,0,.55)]"><div className="flex items-start gap-4 border-b border-white/[.07] p-5 sm:p-7"><span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/[.08] bg-white/[.04] text-sm font-semibold" style={{ color: guide.tint }}>{media?.logo || guide.iconPath ? <img src={media?.logo ?? guide.iconPath} alt={translateUi("")} className="size-9 object-contain" /> : guide.name.slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="text-[10px] uppercase tracking-[.14em] text-[#aa9bbf]">{translateUi("Guia de plataforma")}</p><h2 id="platform-dialog-title" className="mt-1 font-display text-2xl font-medium tracking-[-.04em] text-[#eaf2ec]">{translateUi(guide.name)}</h2><p className="mt-1 text-xs leading-relaxed text-[#92a59a]">{translateUi(guide.description)}</p></div><button ref={closeButton} type="button" onClick={onClose} aria-label={translateUi("Fechar guia")} className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/[.09] text-[#abb9ae] hover:bg-white/[.06]"><X size={17} /></button></div>
      <div className="min-h-0 overflow-y-auto p-5 sm:p-7">{media?.cover && <img src={media.cover} alt={translateUi(translateTemplate("Capa do guia {{value0}}", [guide.name]))} className="mb-5 aspect-[16/9] w-full rounded-xl border border-white/[.08] object-cover" />}<div className="space-y-3">{guide.steps.map((step, index) => { const mediaItem = media?.screenshots[index] ?? step.screenshot; const screenshots = !mediaItem ? [] : Array.isArray(mediaItem) ? mediaItem : [mediaItem]; const missingNote = media?.missingSteps?.[index]; return <article key={`${step.title}-${index}`} className="rounded-xl border border-white/[.07] bg-white/[.025] p-4"><div className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full border border-[#a78bfa]/20 bg-[#a78bfa]/[.08] text-[10px] font-semibold text-[#c1acff]">{translateUi(index + 1)}</span><div><h3 className="text-xs font-semibold text-[#dce8df]">{translateUi(step.title)}</h3><p className="mt-2 text-xs leading-relaxed text-[#94a69a]">{translateUi(step.text)}</p></div></div>{screenshots.map((screenshot) => <figure key={screenshot.src} className="platform-guide-screenshot mt-4"><div className="platform-guide-image-wrap"><img src={screenshot.src} alt={translateUi(screenshot.alt)} loading="lazy" /><span aria-hidden="true" className="platform-guide-highlight" style={{ left: `${'highlight' in screenshot ? screenshot.highlight.left : 50}%`, top: `${'highlight' in screenshot ? screenshot.highlight.top : 50}%`, width: `${'highlight' in screenshot ? screenshot.highlight.size ?? 60 : 60}px`, height: `${'highlight' in screenshot ? screenshot.highlight.size ?? 60 : 60}px` }} /></div>{'caption' in screenshot ? <figcaption className="flex items-start gap-1.5"><ArrowUp aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" /><span><ArrowText text={translateUi(screenshot.caption)} /></span></figcaption> : <figcaption>{translateUi("Fonte: ")}<a href={screenshot.sourceUrl} target="_blank" rel="noopener noreferrer">{translateUi(screenshot.sourceLabel)}</a></figcaption>}</figure>)}{missingNote && <p className="platform-guide-missing">{translateUi("Etapa sem captura: ")}{translateUi(missingNote)}</p>}</article>})}</div>
        {guide.warning && <p className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/[.04] p-4 text-xs leading-relaxed text-amber-100"><ShieldAlert size={14} className="mr-2 inline" />{translateUi(guide.warning)}</p>}
        <p className="mt-5 text-xs leading-relaxed text-[#8fa197]">{translateUi("Disponibilidade, taxas e produtos variam por região e conta. Derivativos e memecoins envolvem risco elevado de perda. Informações verificadas em 2026; confira taxas e regras na página oficial antes de usar.")}</p>
        <a href={guide.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-[10px] text-[#bdaafa] underline underline-offset-4">{translateUi(guide.sourceLabel)}<ExternalLink size={12} /></a>
      </div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[.07] p-5 sm:px-7"><span className="text-[10px] text-[#879a8e]">{translateUi(action.referral ? 'Link de indicação' : 'Endereço oficial')}</span><a href={action.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#a78bfa] px-5 text-xs font-semibold text-[#0d0e14] hover:bg-[#c1acff]">{translateUi("Abrir plataforma ")}<ExternalLink size={14} /></a></div></div></div>, document.body)
}
