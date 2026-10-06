import { Suspense, lazy, useState } from 'react'
import { ArrowLeft, ArrowUpRight, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '@/components/brand'
import { plans, type Currency, type PlanId } from '@/lib/offers'
import { useLocalization } from '@/contexts/localization-context'
import { LocalizationSelector } from '@/components/localization-selector'
import { getOfferAmount, getRegionalOffer } from '@/lib/regional-offers'
import { PageMeta } from '@/components/tools/page-meta'

const HeroWebGLShader = lazy(() => import('@/components/ui/hero-webgl-shader'))

/**
 * Página pública de planos (/planos).
 * Estática: sem sessão, sem fetch de dados.
 */
export function PlansPage() {
  const { locale, market } = useLocalization()
  const [currency, setCurrency] = useState<Currency>('BRL')
  const currencyOptions: Currency[] = market === 'BR' ? ['BRL', 'SOL'] : []
  const copy = {
    'pt-BR': { signIn: 'Entrar', back: 'Voltar', eyebrow: 'escolha seu tempo de estudo', title: 'Um curso completo. Três formas de acessar.', intro: 'Escolha o período de acesso que combina com seu ritmo de estudo.', notAvailable: 'Preço ainda não disponível nesta região.', proposed: 'Preço proposto; checkout indisponível.', oneTime: 'pagamento único', sol: 'pagamento em SOL', alternative: 'ou', checkout: 'Checkout ainda não está disponível; nenhum pagamento será processado por esta tela.' },
    en: { signIn: 'Sign in', back: 'Back', eyebrow: 'choose your study period', title: 'One complete course. Three ways to access.', intro: 'Choose the access period that fits your study pace.', notAvailable: 'Price not available in this region yet.', proposed: 'Proposed price; checkout unavailable.', oneTime: 'one-time payment', sol: 'payment in SOL', alternative: 'or', checkout: 'Checkout is not available yet; no payment will be processed here.' },
    es: { signIn: 'Entrar', back: 'Volver', eyebrow: 'elige tu tiempo de estudio', title: 'Un curso completo. Tres formas de acceder.', intro: 'Elige el período de acceso que se adapta a tu ritmo.', notAvailable: 'Precio aún no disponible en esta región.', proposed: 'Precio propuesto; compra no disponible.', oneTime: 'pago único', sol: 'pago en SOL', alternative: 'o', checkout: 'La compra aún no está disponible; esta pantalla no procesará pagos.' },
    fr: { signIn: 'Connexion', back: 'Retour', eyebrow: 'choisissez votre rythme d’étude', title: 'Un cours complet. Trois façons d’y accéder.', intro: 'Choisissez la durée qui convient à votre rythme.', notAvailable: 'Prix pas encore disponible dans cette région.', proposed: 'Prix proposé ; paiement indisponible.', oneTime: 'paiement unique', sol: 'paiement en SOL', alternative: 'ou', checkout: 'Le paiement n’est pas encore disponible ; aucun paiement ne sera traité ici.' },
  }[locale]
  return <div className="min-h-screen bg-[#09090d] pb-16 text-[#e6eee9]">
    <PageMeta title="Planos do curso Omega" description="Compare os períodos de acesso ao curso Omega e escolha o tempo que combina com seu ritmo de estudo." path="/planos" />
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
            <LocalizationSelector />
            <Link to="/login" className="text-xs text-[#b1abbc] hover:text-white">{copy.signIn}</Link>
            <Link to="/landing" className="inline-flex items-center gap-1.5 text-xs text-[#8da096] hover:text-white"><ArrowLeft size={14} />{copy.back}</Link>
          </div>
        </header>
        <div className="page-shell mx-auto max-w-2xl pb-10 pt-10 text-center">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 className="display-lg mt-4 text-[#eaf2ec]">{copy.title}</h1>
          <p className="body-lg mt-4 text-[15px]">{copy.intro}</p>
        </div>
      </div>
    </section>
    <main className="page-shell">
      <div className="mt-8 flex justify-center">
        <div className="inline-flex rounded-xl border border-white/[.08] bg-[#14151d] p-1" role="group" aria-label="Moeda de pagamento">
          {currencyOptions.map((item) => <button type="button" key={item} aria-pressed={currency === item} onClick={() => setCurrency(item)} className={`focus-ring rounded-xl px-5 py-2 text-xs font-semibold transition-colors ${currency === item ? 'bg-[#b49cff] text-[#100c19] hover:bg-[#c6b4ff]' : 'text-[#b1abbc] hover:bg-white/[.05] hover:text-white'}`}>
            {item === 'BRL' ? 'Reais · BRL' : 'Solana · SOL'}
          </button>)}
        </div>
      </div>
      <div className="pricing-bento mx-auto mt-8">
        {(['month', 'quarter', 'lifetime'] as const satisfies PlanId[]).map((id) => {
          const plan = plans[id]
          const regionalOffer = getRegionalOffer(market, id)
          const price = market === 'BR' ? (currency === 'SOL' ? plan.prices.SOL : plan.prices.BRL) : regionalOffer ? new Intl.NumberFormat(locale, { style: 'currency', currency: regionalOffer.currency, maximumFractionDigits: 0 }).format(getOfferAmount(regionalOffer)) : null
          return <div key={id} className={`interactive-card pricing-card relative flex flex-col rounded-xl border p-6 ${plan.featured ? 'border-[#a78bfa]/35 bg-[linear-gradient(155deg,rgba(167,139,250,.105),rgba(20,17,30,.96)_48%)] shadow-[0_22px_70px_rgba(0,0,0,.22)]' : 'border-white/[.08] bg-[#14151d]'}`}>
            {plan.featured && <span className="mb-3 inline-flex w-fit rounded-xl bg-[#a78bfa] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.12em] text-[#09090d]">melhor valor</span>}
            <div><p className="font-display text-xl font-medium tracking-[-.04em] text-[#e8f0ea]">{plan.name}</p><p className="mt-1 text-xs text-[#82958a]">{plan.term}</p></div>
            <div className="mt-6">
              {price ? <><p className="font-display text-[34px] font-medium tracking-[-.065em] text-[#f0f5f1]">{price}<span className="ml-2 font-sans text-xs font-normal tracking-normal text-[#778b80]">{market === 'BR' ? (currency === 'BRL' ? copy.oneTime : copy.sol) : copy.oneTime}</span></p>
              {market === 'BR' && <p className="mt-1 text-[11px] font-medium text-[#bca9e8]">{copy.alternative} {currency === 'SOL' ? plan.prices.BRL : plan.prices.SOL}</p>}
              {regionalOffer?.status === 'draft' && <p className="mt-1 text-[11px] text-amber-300">{copy.proposed}</p>}</> : <p className="font-display text-base font-medium text-[#9b96a5]">{copy.notAvailable}</p>}
            </div>
            <p className="mt-2 min-h-10 text-xs leading-relaxed text-[#93a69b]">{plan.description}</p>
            <div className="my-5 h-px bg-white/[.08]" />
            <ul className="space-y-3 text-xs text-[#b6c5bc]">{plan.features.map((feature) => <li key={feature} className="flex gap-2.5"><Check size={14} className="mt-0.5 shrink-0 text-[#a78bfa]" />{feature}</li>)}</ul>
            {price && (currency === 'SOL' ? market === 'BR' : regionalOffer?.status === 'published') && <Link to={`/login?plano=${id}&moeda=${currency}`} className={`mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-xs font-semibold transition-colors ${plan.featured ? 'bg-[#a78bfa] text-[#09090d] hover:bg-[#c1acff]' : 'border border-white/[.12] text-[#d9e3dc] hover:bg-white/[.04]'}`}>
              {locale === 'en' ? 'Choose' : locale === 'es' ? 'Elegir' : locale === 'fr' ? 'Choisir' : 'Escolher'} {plan.name.toLowerCase()}<ArrowUpRight size={14} />
            </Link>}
          </div>
        })}
      </div>
      <p className="mx-auto mt-6 max-w-3xl text-center text-[11px] leading-relaxed text-[#708279]">{copy.checkout} {market === 'BR' && 'Os valores em SOL não acompanham cotação cambial em tempo real.'}</p>
    </main>
  </div>
}
