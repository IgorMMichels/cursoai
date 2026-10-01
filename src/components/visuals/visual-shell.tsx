import type { ReactNode } from 'react'

export function VisualShell({
  title,
  description,
  alt,
  children,
}: {
  title: string
  description: string
  alt: string
  children: ReactNode
}) {
  return (
    <figure className="my-8 overflow-hidden rounded-2xl border border-white/[.08] bg-[#101117]">
      <div role="img" aria-label={alt} className="p-4 sm:p-6">
        {children}
      </div>
      <figcaption className="border-t border-white/[.07] px-4 py-3 sm:px-5">
        <p className="text-[11px] font-medium text-[#dce6df]">{title}</p>
        <p className="mt-1 text-[10px] leading-relaxed text-[#87958d]">{description}</p>
        <p className="mt-2 text-[9px] text-[#777b8c]">Valores fictícios para estudo.</p>
      </figcaption>
      <style>{`.lesson-viz-bar{transform-box:fill-box;transform-origin:bottom;animation:lesson-viz-grow .9s cubic-bezier(.16,1,.3,1) both}.lesson-viz-fade{animation:lesson-viz-fade .7s ease both}@keyframes lesson-viz-grow{from{transform:scaleY(.2);opacity:.4}to{transform:scaleY(1);opacity:1}}@keyframes lesson-viz-fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){.lesson-viz-bar,.lesson-viz-fade{animation:none}}`}</style>
    </figure>
  )
}
