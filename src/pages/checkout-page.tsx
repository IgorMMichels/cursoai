import { LocalizedLink as Link } from '@/components/localized-router'
import { useLocalization } from '@/contexts/localization-context'
import { plans, type PlanId } from '@/lib/offers'
import { formatRegionalOffer, getPublishedRegionalOffer } from '@/lib/regional-offers'
import { PageMeta } from '@/components/tools/page-meta'
import { translateUi } from '@/lib/ui-translation'
import { ArrowLeft, CreditCard, Wallet } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

const copy = {
  'pt-BR': { title: 'Finalizar acesso', intro: 'Revise o plano e o método de pagamento selecionados.', stripe: 'Pagamento em dinheiro · Stripe', crypto: 'Pagamento em cripto · Solana', unavailable: 'Este provedor ainda não foi conectado. Nenhum pagamento foi iniciado.', back: 'Voltar aos planos', choose: 'Escolher outro método na página de planos' },
  en: { title: 'Complete your access', intro: 'Review your selected plan and payment method.', stripe: 'Cash payment · Stripe', crypto: 'Crypto payment · Solana', unavailable: 'This provider is not connected yet. No payment has been started.', back: 'Back to plans', choose: 'Choose another method on the plans page' },
  es: { title: 'Completar acceso', intro: 'Revisa el plan y el método de pago seleccionados.', stripe: 'Pago en dinero · Stripe', crypto: 'Pago en cripto · Solana', unavailable: 'Este proveedor aún no está conectado. No se ha iniciado ningún pago.', back: 'Volver a los planes', choose: 'Elige otro método en la página de planes' },
} as const

export function CheckoutPage() {
  const { locale, market } = useLocalization()
  const [search] = useSearchParams()
  const rawPlan = search.get('plan')
  const planId = rawPlan && rawPlan in plans ? rawPlan as PlanId : null
  const method = search.get('payment') === 'fiat' ? 'fiat' : search.get('payment') === 'crypto' ? 'crypto' : null
  const offer = planId && method ? getPublishedRegionalOffer(market, planId, method) : null
  const labels = copy[locale]
  const plan = planId ? plans[planId] : null
  const methodLabel = method === 'fiat' ? labels.stripe : labels.crypto
  return <main className="grid min-h-screen place-items-center bg-[#09090d] px-5 py-12 text-[#e6eee9]">
    <PageMeta title={translateUi('Checkout do curso Omega')} description={translateUi('Revise seu plano e método de pagamento.')} path="/checkout" />
    <section className="w-full max-w-lg rounded-2xl border border-white/[.08] bg-[#14151d] p-6 sm:p-8">
      <p className="eyebrow">Omega</p><h1 className="display-lg mt-3 text-3xl">{labels.title}</h1><p className="mt-3 text-sm leading-6 text-[#93a69b]">{labels.intro}</p>
      {offer && plan ? <div className="mt-7 rounded-xl border border-white/[.08] bg-black/20 p-5">
        <p className="text-xs uppercase tracking-[.12em] text-[#8e9c95]">{translateUi(plan.name)} · {methodLabel}</p>
        <p className="mt-2 font-display text-3xl text-[#eeeaf7]">{formatRegionalOffer(offer, locale)}</p>
        <p className="mt-1 text-xs text-[#9ba99f]">{offer.billingMode === 'monthly' ? (locale === 'en' ? 'Billed monthly · 30 days of access' : locale === 'es' ? 'Cobro mensual · 30 días de acceso' : 'Cobrança mensal · 30 dias de acesso') : offer.billingMode === 'annual' ? (locale === 'en' ? 'Billed yearly · 365 days of access' : locale === 'es' ? 'Cobro anual · 365 días de acceso' : 'Cobrança anual · 365 dias de acesso') : offer.accessDays === null ? (locale === 'en' ? 'Lifetime access' : locale === 'es' ? 'Acceso de por vida' : 'Acesso vitalício') : (locale === 'en' ? `${offer.accessDays} days of access` : locale === 'es' ? `${offer.accessDays} días de acceso` : `${offer.accessDays} dias de acesso`)}</p>
        <p role="status" className="mt-5 flex gap-2 rounded-lg border border-[#e5b45c]/20 bg-[#e5b45c]/[.06] p-3 text-xs leading-5 text-[#e5c995]">{method === 'fiat' ? <CreditCard size={16} className="mt-0.5 shrink-0" /> : <Wallet size={16} className="mt-0.5 shrink-0" />}{labels.unavailable}</p>
      </div> : <p role="alert" className="mt-7 rounded-xl border border-[#e5b45c]/20 bg-[#e5b45c]/[.06] p-4 text-sm text-[#e5c995]">{translateUi('Não há uma oferta disponível para esta seleção e região.')}</p>}
      <div className="mt-6 flex flex-col gap-3"><Link to="/planos" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#a78bfa] px-4 text-sm font-semibold text-[#09090d] hover:bg-[#c1acff]"><ArrowLeft size={15} />{labels.back}</Link><Link to="/planos" className="text-center text-xs text-[#9ba99f] hover:text-white">{labels.choose}</Link></div>
    </section>
  </main>
}
