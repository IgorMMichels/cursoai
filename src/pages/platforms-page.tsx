import { translateUi } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { PlatformGuides } from '@/components/platform-guides'
import { WalletGuideSection } from '@/components/wallet-guides'

type Filter = 'todas' | 'memecoins' | 'futuros' | 'pagamentos'

const walletBasics: { title: string; frase: string; bullets: string[]; alerta: string }[] = [
  {
    title: 'Hot vs Cold',
    frase: 'Hot fica online no app; cold fica offline no aparelho.',
    bullets: [
      'Hot: Phantom, Solflare, Backpack e Rabby no celular ou navegador.',
      'Cold: hardware offline assina sem expor a chave à internet.',
      'Comece na hot com valor pequeno; use cold para guarda longa.',
    ],
    alerta: 'Não estréie com saldo alto. Teste envio e recebimento com valor mínimo.',
  },
  {
    title: 'Custodial vs Autocustódia',
    frase: 'Na custodial a corretora guarda; na autocustódia só você tem a chave.',
    bullets: [
      'Custodial: acesso por login, senha e 2FA. Ex.: saldo em Robinhood Crypto.',
      'Autocustódia: você guarda a chave. Ex.: Phantom, Solflare, Backpack, Rabby e Robinhood Wallet.',
      'Na custodial, saque e conta dependem da empresa e da região.',
    ],
    alerta: 'Conta travada ou região bloqueada deixa o saldo custodial inacessível. Mantenha mínimo operacional.',
  },
  {
    title: 'Seed Phrase',
    frase: '12 a 24 palavras que recriam sua carteira em qualquer app.',
    bullets: [
      'Anote no papel, na ordem, e guarde offline em local seguro.',
      'Perdeu a frase e o acesso, perdeu o saldo. Não há recuperação.',
      'Suporte real nunca pede a frase.',
    ],
    alerta: 'Nunca digite a frase em site, formulário ou mensagem. Quem pede é golpe.',
  },
  {
    title: 'Solana vs EVM',
    frase: 'Formatos diferentes: confira rede e endereço antes de enviar.',
    bullets: [
      'Solana: endereço base58, taxa paga em SOL.',
      'EVM: mesmo formato 0x em Ethereum, Base, Arbitrum, Polygon e outras.',
      'Só envie na mesma rede do destino. Rede errada pode perder fundos.',
    ],
    alerta: 'No Brasil: pratique autocustódia com valor pequeno na carteira; use corretora BR regulada para PIX/BRL e guarde comprovantes para IR.',
  },
]

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
  useUiTranslation();
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
          <p className="eyebrow">{translateUi("Plataformas")}</p>
          <h1 className="mt-3 font-display text-3xl font-medium tracking-[-.05em] text-[#eef3ee] sm:text-5xl">
            {translateUi("Compare antes")}<br />
            {translateUi("de conectar.")}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#8fa197]">
            {translateUi("Terminais, carteiras e caminhos de pagamento em um só lugar. Abra o guia, confira o endereço oficial e siga com limites definidos.")}</p>
        </div>
      </section>

      <div className="grid grid-flow-dense gap-0 overflow-hidden rounded-2xl border border-white/[.07] bg-[#0d0e14] sm:grid-cols-3">
        {categories.map((category) => (
          <article key={category.id} className="group flex min-w-0 flex-col border-white/[.07] max-sm:border-t max-sm:first:border-t-0 sm:border-l sm:first:border-l-0">
            <div className="relative aspect-[16/9] overflow-hidden bg-[#13141b]">
              <img
                src={category.cover}
                alt={translateUi("")}
                loading="lazy"
                className="size-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0d0e14]/60 to-transparent" />
            </div>
            <div className="flex flex-1 flex-col p-6 sm:p-7">
              <h2 className="font-display text-xl font-medium tracking-[-.03em] text-[#eef3ee]">{translateUi(category.title)}</h2>
              <p className="mt-2 text-xs leading-relaxed text-[#8fa197]">{translateUi(category.description)}</p>
              <div className="mt-auto pt-6">
                <button
                  type="button"
                  onClick={() => goTo(category.id)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#a78bfa] px-5 text-xs font-semibold text-[#0d0e14] transition-colors hover:bg-[#c1acff]"
                >
                  {translateUi(category.cta)}
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div id="lista-plataformas" className="flex flex-wrap gap-2 scroll-mt-24" role="group" aria-label={translateUi("Filtrar plataformas")}>
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
            {translateUi(entry.label)}
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
            <p className="eyebrow">{translateUi("Pagamentos")}</p>
            <h2 className="mt-2 font-display text-2xl font-medium tracking-[-.04em] text-[#e9f1eb]">{translateUi("Carteiras e exchanges")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#8ea197]">
              {translateUi("Prepare USDT na rede certa. Confira endereço, rede e taxas na tela antes de confirmar.")}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {walletBasics.map((card) => (
                <article key={card.title} className="flex flex-col rounded-xl border border-white/[.07] bg-[#12121a] p-5">
                  <h3 className="font-display text-base font-medium text-[#e9f1eb]">{translateUi(card.title)}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#c5d1c8]">{translateUi(card.frase)}</p>
                  <ul className="mt-3 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-[#8ea197]">
                    {card.bullets.map((item) => (
                      <li key={item}>{translateUi(item)}</li>
                    ))}
                  </ul>
                  <p className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/[.04] p-3 text-[11px] leading-relaxed text-amber-100">
                    {translateUi(card.alerta)}
                  </p>
                </article>
              ))}
            </div>
            <div className="mt-6">
              <WalletGuideSection variant="access" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
