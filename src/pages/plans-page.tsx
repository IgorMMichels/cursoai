import { SourceLanguageNotice } from '@/components/source-language-notice'
import { translateUi } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { Suspense, lazy } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { LocalizedLink as Link } from '@/components/localized-router'
import { Brand } from '@/components/brand'
import { plans } from '@/lib/offers'
import { useLocalization } from '@/contexts/localization-context'
import { getPlanIdsForMarket } from '@/lib/regional-offers'
import { PlanPaymentOptions } from '@/components/plan-payment-options'
import { PageMeta } from '@/components/tools/page-meta'

const HeroWebGLShader = lazy(() => import('@/components/ui/hero-webgl-shader'))

/**
 * Página pública de planos (/planos).
 * Estática: sem sessão, sem fetch de dados.
 */
export function PlansPage() {
  useUiTranslation();
  const { locale, market, regionalOffers, marketLoading, pricingError } = useLocalization()
  const copy = {
    'pt-BR': { signIn: 'Entrar', back: 'Voltar', eyebrow: 'escolha seu tempo de estudo', title: 'Um curso completo. Três formas de acessar.', intro: 'Escolha o período de acesso que combina com seu ritmo de estudo.', notAvailable: 'Preço ainda não disponível nesta região.', loading: 'Carregando preços regionais…', error: 'Não foi possível carregar os preços regionais. Tente novamente mais tarde.', checkout: 'Na próxima etapa, escolha pagar com cripto, Stripe ou Pix.' },
    en: { signIn: 'Sign in', back: 'Back', eyebrow: 'choose your study period', title: 'One complete course. Three ways to access.', intro: 'Choose the access period that fits your study pace.', notAvailable: 'Price not available in this region yet.', loading: 'Loading regional prices…', error: 'Regional prices could not be loaded. Please try again later.', checkout: 'On the next step, choose crypto, Stripe, or Pix.' },
    es: { signIn: 'Entrar', back: 'Volver', eyebrow: 'elige tu tiempo de estudio', title: 'Un curso completo. Tres formas de acceder.', intro: 'Elige el período de acceso que se adapta a tu ritmo.', notAvailable: 'Precio aún no disponible en esta región.', loading: 'Cargando precios regionales…', error: 'No se pudieron cargar los precios regionales. Inténtalo más tarde.', checkout: 'En el siguiente paso, elige cripto, Stripe o Pix.' },
  }[locale]
  return <div className="min-h-screen bg-[#09090d] pb-16 text-[#e6eee9]">
    <PageMeta title={translateUi("Planos do curso Omega")} description={translateUi("Compare os períodos de acesso ao curso Omega e escolha o tempo que combina com seu ritmo de estudo.")} path="/planos" />
    <section className="relative isolate overflow-hidden border-b border-white/[.04]">
      <Suspense fallback={null}>
        <HeroWebGLShader />
      </Suspense>
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,13,.18)_0%,rgba(9,9,13,0)_32%,rgba(9,9,13,0)_62%,rgba(9,9,13,.82)_100%),linear-gradient(90deg,rgba(9,9,13,.62)_0%,rgba(9,9,13,.18)_46%,rgba(9,9,13,0)_72%)]" aria-hidden="true" />
      <div className="relative z-10">
        <header className="page-shell flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
          <Brand />
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/login" className="text-xs text-[#b1abbc] hover:text-white">{translateUi(copy.signIn)}</Link>
            <Link to="/landing" className="inline-flex items-center gap-1.5 text-xs text-[#8da096] hover:text-white"><ArrowLeft size={14} />{translateUi(copy.back)}</Link>
          </div>
        </header>
        <div className="page-shell mx-auto max-w-2xl pb-10 pt-10 text-center">
          <p className="eyebrow">{translateUi(copy.eyebrow)}</p>
          <h1 className="display-lg mt-4 text-[#eaf2ec]">{translateUi(copy.title)}</h1>
          <p className="body-lg mt-4 text-[15px]">{translateUi(copy.intro)}</p>
        </div>
      </div>
    </section>
    <main className="page-shell"><SourceLanguageNotice />
      {marketLoading && <p role="status" className="mx-auto mt-8 max-w-xl text-center text-xs text-[#93a69b]">{translateUi(copy.loading)}</p>}
      {pricingError && <p role="alert" className="mx-auto mt-8 max-w-xl text-center text-xs text-[#e4bc76]">{translateUi(copy.error)}</p>}
      <div className="pricing-bento mx-auto mt-8">
        {getPlanIdsForMarket(market).map((id) => {
          const plan = plans[id]
          return <div key={id} className={`interactive-card pricing-card relative flex flex-col rounded-xl border p-6 ${plan.featured ? 'border-[#a78bfa]/35 bg-[linear-gradient(155deg,rgba(167,139,250,.105),rgba(20,17,30,.96)_48%)] shadow-[0_22px_70px_rgba(0,0,0,.22)]' : 'border-white/[.08] bg-[#14151d]'}`}>
            {plan.featured && <span className="mb-3 inline-flex w-fit rounded-xl bg-[#a78bfa] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.12em] text-[#09090d]">{translateUi("melhor valor")}</span>}
            <div><p className="font-display text-xl font-medium tracking-[-.04em] text-[#e8f0ea]">{translateUi(plan.name)}</p><p className="mt-1 text-xs text-[#82958a]">{translateUi(plan.term)}</p></div>
            <div className="mt-6">
              {marketLoading || pricingError ? <p className="font-display text-base font-medium text-[#9b96a5]">{translateUi(marketLoading ? copy.loading : copy.error)}</p> : null}
            </div>
            <p className="mt-2 min-h-10 text-xs leading-relaxed text-[#93a69b]">{translateUi(plan.description)}</p>
            <div className="my-5 h-px bg-white/[.08]" />
            <ul className="space-y-3 text-xs text-[#b6c5bc]">{plan.features.map((feature) => <li key={feature} className="flex gap-2.5"><Check size={14} className="mt-0.5 shrink-0 text-[#a78bfa]" />{translateUi(feature)}</li>)}</ul>
            {!marketLoading && !pricingError && <PlanPaymentOptions planId={id} offers={regionalOffers} locale={locale} />}
          </div>
        })}
      </div>
      <p className="mx-auto mt-6 max-w-3xl text-center text-[11px] leading-relaxed text-[#708279]">{translateUi(copy.checkout)}</p>
    </main>
  </div>
}
