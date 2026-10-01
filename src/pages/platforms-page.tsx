import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { PlatformGuides } from '@/components/platform-guides'
import { WalletGuideSection } from '@/components/wallet-guides'

type Filter = 'todas' | 'memecoins' | 'futuros' | 'pagamentos'

const categories: { id: Exclude<Filter, 'todas'>; title: string; description: string; cover: string; cta: string; anchor: string }[] = [
  {
    id: 'memecoins',
    title: 'Memecoins',
    description: 'Terminais de Solana e carteiras para estudo. Confira o endereço oficial antes de conectar.',
    cover: '/journey-covers/memecoins.webp',
    cta: 'Ver terminais e carteiras',
    anchor: 'plataformas-memecoins',
  },
  {
    id: 'futuros',
    title: 'Futuros',
    description: 'Corretoras com conta demo e perpétuos. Confira região, custos e riscos antes de depositar.',
    cover: '/journey-covers/futuros.webp',
    cta: 'Ver corretoras de futuros',
    anchor: 'plataformas-futuros',
  },
  {
    id: 'pagamentos',
    title: 'Pagamentos',
    description: 'Carteiras e exchanges para preparar USDT. Confira rede, endereço e taxas antes de transferir.',
    cover: '/journey-covers/trading.webp',
    cta: 'Ver carteiras e exchanges',
    anchor: 'plataformas-pagamentos',
  },
]

const filters: { id: Filter; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'memecoins', label: 'Memecoins' },
  { id: 'futuros', label: 'Futuros' },
  { id: 'pagamentos', label: 'Pagamentos' },
]

export function PlatformsPage() {
  const [filtro, setFiltro] = useState<Filter>('todas')

  const goTo = (target: Filter) => {
    setFiltro(target)
    requestAnimationFrame(() => {
      if (target === 'todas') {
        document.getElementById('lista-plataformas')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
      const item = categories.find((entry) => entry.id === target)
      if (item) document.getElementById(item.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const showMemecoins = filtro === 'todas' || filtro === 'memecoins'
  const showFuturos = filtro === 'todas' || filtro === 'futuros'
  const showPagamentos = filtro === 'todas' || filtro === 'pagamentos'

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-2xl border border-white/[.07] bg-[#0d0e14]">
        <div className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-10 sm:py-14">
          <p className="eyebrow">Plataformas</p>
          <h1 className="mt-3 font-display text-3xl font-medium tracking-[-.05em] text-[#eef3ee] sm:text-5xl">
            Compare antes
            <br />
            de conectar.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#8fa197]">
            Terminais, carteiras e caminhos de pagamento em um só lugar. Abra o guia, confira o endereço oficial e siga com limites definidos.
          </p>
        </div>
      </section>

      <div className="grid grid-flow-dense gap-0 overflow-hidden rounded-2xl border border-white/[.07] bg-[#0d0e14] sm:grid-cols-3">
        {categories.map((category) => (
          <article key={category.id} className="group flex min-w-0 flex-col border-white/[.07] max-sm:border-t max-sm:first:border-t-0 sm:border-l sm:first:border-l-0">
            <div className="relative aspect-[16/9] overflow-hidden bg-[#13141b]">
              <img
                src={category.cover}
                alt=""
                loading="lazy"
                className="size-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0d0e14]/60 to-transparent" />
            </div>
            <div className="flex flex-1 flex-col p-6 sm:p-7">
              <h2 className="font-display text-xl font-medium tracking-[-.03em] text-[#eef3ee]">{category.title}</h2>
              <p className="mt-2 text-xs leading-relaxed text-[#8fa197]">{category.description}</p>
              <div className="mt-auto pt-6">
                <button
                  type="button"
                  onClick={() => goTo(category.id)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#a78bfa] px-5 text-xs font-semibold text-[#0d0e14] transition-colors hover:bg-[#c1acff]"
                >
                  {category.cta}
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div id="lista-plataformas" className="flex flex-wrap gap-2 scroll-mt-24" role="group" aria-label="Filtrar plataformas">
        {filters.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => goTo(entry.id)}
            aria-pressed={filtro === entry.id}
            className={`inline-flex min-h-10 items-center rounded-full border px-4 text-xs font-medium transition-colors ${
              filtro === entry.id
                ? 'border-[#a78bfa] bg-[#a78bfa] text-[#0d0e14]'
                : 'border-white/[.09] bg-white/[.02] text-[#a9b6ad] hover:border-[#a78bfa]/40 hover:text-white'
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="space-y-12">
        {showMemecoins && (
          <div id="plataformas-memecoins" className="scroll-mt-24">
            <PlatformGuides journeyId="memecoins" />
          </div>
        )}
        {showFuturos && (
          <div id="plataformas-futuros" className="scroll-mt-24">
            <PlatformGuides journeyId="futuros" />
          </div>
        )}
        {showPagamentos && (
          <div id="plataformas-pagamentos" className="scroll-mt-24 rounded-2xl border border-white/[.07] bg-[#0d0e14] p-5 sm:p-7">
            <p className="eyebrow">Pagamentos</p>
            <h2 className="mt-2 font-display text-2xl font-medium tracking-[-.04em] text-[#e9f1eb]">Carteiras e exchanges</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#8ea197]">
              Prepare USDT na rede certa. Confira endereço, rede e taxas na tela antes de confirmar.
            </p>
            <div className="mt-6">
              <WalletGuideSection variant="access" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
