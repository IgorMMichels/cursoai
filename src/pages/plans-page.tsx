import { Suspense, lazy, useState } from 'react'
import { ArrowLeft, ArrowUpRight, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '@/components/brand'
import { plans, type Currency, type PlanId } from '@/lib/offers'

const HeroWebGLShader = lazy(() => import('@/components/ui/hero-webgl-shader'))

/**
 * Página pública de planos (/planos).
 * Estática: sem sessão, sem fetch de dados.
 */
export function PlansPage() {
  const [currency, setCurrency] = useState<Currency>('BRL')
  return <div className="min-h-screen bg-[#09090d] pb-16 text-[#e6eee9]">
    <section className="relative isolate overflow-hidden border-b border-white/[.04]">
      <Suspense fallback={null}>
        <HeroWebGLShader />
      </Suspense>
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,13,.18)_0%,rgba(9,9,13,0)_32%,rgba(9,9,13,0)_62%,rgba(9,9,13,.82)_100%),linear-gradient(90deg,rgba(9,9,13,.62)_0%,rgba(9,9,13,.18)_46%,rgba(9,9,13,0)_72%)]" aria-hidden="true" />
      <div className="relative z-10">
        <header className="page-shell flex h-16 items-center justify-between">
          <Brand />
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-xs text-[#b1abbc] hover:text-white">Entrar</Link>
            <Link to="/landing" className="inline-flex items-center gap-1.5 text-xs text-[#8da096] hover:text-white"><ArrowLeft size={14} />Voltar</Link>
          </div>
        </header>
        <div className="page-shell mx-auto max-w-2xl pb-10 pt-10 text-center">
          <p className="eyebrow">escolha seu tempo de estudo</p>
          <h1 className="display-lg mt-4 text-[#eaf2ec]">Um curso completo. Três formas de acessar.</h1>
          <p className="body-lg mt-4 text-[15px]">Escolha o período de acesso que combina com seu ritmo de estudo.</p>
        </div>
      </div>
    </section>
    <main className="page-shell">
      <div className="mt-8 flex justify-center">
        <div className="inline-flex rounded-xl border border-white/[.08] bg-[#14151d] p-1" role="group" aria-label="Moeda de pagamento">
          {(['BRL', 'SOL'] as const).map((item) => <button type="button" key={item} aria-pressed={currency === item} onClick={() => setCurrency(item)} className={`focus-ring rounded-xl px-5 py-2 text-xs font-semibold transition-colors ${currency === item ? 'bg-[#b49cff] text-[#100c19] hover:bg-[#c6b4ff]' : 'text-[#b1abbc] hover:bg-white/[.05] hover:text-white'}`}>
            {item === 'BRL' ? 'Reais · BRL' : 'Solana · SOL'}
          </button>)}
        </div>
      </div>
      <div className="pricing-bento mx-auto mt-8">
        {(['month', 'quarter', 'lifetime'] as const satisfies PlanId[]).map((id) => {
          const plan = plans[id]
          return <div key={id} className={`interactive-card pricing-card relative flex flex-col rounded-xl border p-6 ${plan.featured ? 'border-[#a78bfa]/35 bg-[linear-gradient(155deg,rgba(167,139,250,.105),rgba(20,17,30,.96)_48%)] shadow-[0_22px_70px_rgba(0,0,0,.22)]' : 'border-white/[.08] bg-[#14151d]'}`}>
            {plan.featured && <span className="mb-3 inline-flex w-fit rounded-xl bg-[#a78bfa] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.12em] text-[#09090d]">melhor valor</span>}
            <div><p className="font-display text-xl font-medium tracking-[-.04em] text-[#e8f0ea]">{plan.name}</p><p className="mt-1 text-xs text-[#82958a]">{plan.term}</p></div>
            <div className="mt-6">
              <p className="font-display text-[34px] font-medium tracking-[-.065em] text-[#f0f5f1]">{plan.prices[currency]}<span className="ml-2 font-sans text-xs font-normal tracking-normal text-[#778b80]">{currency === 'BRL' ? 'à vista' : 'pagamento em SOL'}</span></p>
              <p className="mt-1 text-[11px] font-medium text-[#bca9e8]">ou {currency === 'SOL' ? plan.prices.BRL : plan.prices.SOL}</p>
            </div>
            <p className="mt-2 min-h-10 text-xs leading-relaxed text-[#93a69b]">{plan.description}</p>
            <div className="my-5 h-px bg-white/[.08]" />
            <ul className="space-y-3 text-xs text-[#b6c5bc]">{plan.features.map((feature) => <li key={feature} className="flex gap-2.5"><Check size={14} className="mt-0.5 shrink-0 text-[#a78bfa]" />{feature}</li>)}</ul>
            <Link to={`/login?plano=${id}&moeda=${currency}`} className={`mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-xs font-semibold transition-colors ${plan.featured ? 'bg-[#a78bfa] text-[#09090d] hover:bg-[#c1acff]' : 'border border-white/[.12] text-[#d9e3dc] hover:bg-white/[.04]'}`}>
              Assinar {plan.name.toLowerCase()}<ArrowUpRight size={14} />
            </Link>
          </div>
        })}
      </div>
      <p className="mx-auto mt-6 max-w-3xl text-center text-[11px] leading-relaxed text-[#708279]">Checkout ainda não está disponível; nenhum pagamento será processado por esta tela. Os valores em SOL não acompanham cotação cambial em tempo real.</p>
    </main>
  </div>
}
