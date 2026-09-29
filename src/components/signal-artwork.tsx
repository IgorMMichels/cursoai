import { Activity, ArrowUpRight, ShieldCheck } from 'lucide-react'

export function SignalArtwork() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[560px] overflow-hidden rounded-xl border border-white/[.08] bg-[#0d0e14] p-5 shadow-[0_30px_100px_rgba(0,0,0,.28)] sm:p-8">
      <div className="hero-grid absolute inset-0 opacity-60" />
      <div className="absolute -right-16 -top-20 size-64 rounded-full bg-[#a78bfa]/[.09] blur-[90px]" />
      <div className="absolute -bottom-16 -left-12 size-56 rounded-full bg-[#98abff]/[.08] blur-[90px]" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-center justify-between">
          <div><p className="eyebrow">mapa de decisão</p><p className="mt-1 text-sm text-[#dce9e1]">Antes de apertar comprar</p></div>
          <div className="grid size-10 place-items-center rounded-full border border-[#a78bfa]/20 bg-[#a78bfa]/[.08] text-[#a78bfa]"><Activity size={17} /></div>
        </div>
        <div className="relative my-6 min-h-[250px] flex-1">
          <svg viewBox="0 0 500 320" className="absolute inset-0 size-full" fill="none" role="img" aria-label="Diagrama abstrato que conecta tese, risco e segurança">
            <defs>
              <linearGradient id="signal-gradient" x1="63" y1="248" x2="443" y2="76" gradientUnits="userSpaceOnUse"><stop stopColor="#98ABFF" stopOpacity=".1" /><stop offset=".48" stopColor="#75E0B4" /><stop offset="1" stopColor="#75E0B4" stopOpacity=".25" /></linearGradient>
              <filter id="signal-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
            </defs>
            <path d="M26 264H473M26 199H473M26 134H473M26 69H473" stroke="white" strokeOpacity=".055" />
            <path d="M93 34V286M191 34V286M289 34V286M387 34V286" stroke="white" strokeOpacity=".045" />
            <path d="M38 232C90 226 96 186 147 195C196 204 203 111 257 130C309 149 326 154 359 108C391 63 425 89 461 47" stroke="url(#signal-gradient)" strokeWidth="3" strokeLinecap="round" className="signal-path" />
            <path d="M38 232C90 226 96 186 147 195C196 204 203 111 257 130C309 149 326 154 359 108C391 63 425 89 461 47" stroke="#a78bfa" strokeOpacity=".2" strokeWidth="13" strokeLinecap="round" filter="url(#signal-glow)" />
            <circle cx="147" cy="195" r="6" fill="#98ABFF" className="signal-pulse" /><circle cx="257" cy="130" r="6" fill="#75E0B4" className="signal-pulse" /><circle cx="359" cy="108" r="6" fill="#E4BC76" className="signal-pulse" />
            <circle cx="147" cy="195" r="14" stroke="#98ABFF" strokeOpacity=".3" /><circle cx="257" cy="130" r="14" stroke="#75E0B4" strokeOpacity=".3" /><circle cx="359" cy="108" r="14" stroke="#E4BC76" strokeOpacity=".3" />
          </svg>
          <div className="float-slow absolute left-[19%] top-[52%] rounded-xl border border-[#98abff]/20 bg-[#101a20]/90 px-3 py-2 backdrop-blur"><p className="text-[9px] font-semibold uppercase tracking-[.12em] text-[#98abff]">tese</p><p className="mt-1 text-xs text-[#e0e8ee]">o que sustenta a ideia?</p></div>
          <div className="float-slow absolute left-[43%] top-[28%] rounded-xl border border-[#a78bfa]/20 bg-[#101a20]/90 px-3 py-2 backdrop-blur" style={{ animationDelay: '.7s' }}><p className="text-[9px] font-semibold uppercase tracking-[.12em] text-[#a78bfa]">risco</p><p className="mt-1 text-xs text-[#e0e8ee]">quanto pode oscilar?</p></div>
          <div className="float-slow absolute right-[5%] top-[4%] rounded-xl border border-[#e4bc76]/20 bg-[#101a20]/90 px-3 py-2 backdrop-blur" style={{ animationDelay: '1.2s' }}><p className="text-[9px] font-semibold uppercase tracking-[.12em] text-[#e4bc76]">saída</p><p className="mt-1 text-xs text-[#e0e8ee]">como rever a decisão?</p></div>
        </div>
        <div className="flex items-center justify-between border-t border-white/[.08] pt-4">
          <div className="flex items-center gap-2 text-xs text-[#91a49a]"><ShieldCheck size={15} className="text-[#a78bfa]" />educação antes da exposição</div>
          <div className="flex size-8 items-center justify-center rounded-full bg-[#171621] text-[#a78bfa]"><ArrowUpRight size={15} /></div>
        </div>
      </div>
    </div>
  )
}




