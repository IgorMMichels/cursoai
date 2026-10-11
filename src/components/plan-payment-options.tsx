import { LocalizedLink as Link } from '@/components/localized-router'
import { formatRegionalOffer, type RegionalOffer } from '@/lib/regional-offers'
import type { UiLocale } from '@/lib/localization'
import type { PlanId } from '@/lib/offers'

const copy = {
  'pt-BR': {
    choose: 'Escolher forma de pagamento', term: 'pagamento único', fiat: 'ou em reais', cheaper: 'Mais barato em cripto',
    encourage: 'Estimulamos o uso de cripto: pagando em SOL o valor é menor, e é isso que praticamos aqui na plataforma.',
    cta: 'Continuar',
  },
  en: {
    choose: 'Choose a payment method', term: 'one-time payment', fiat: 'or in reais', cheaper: 'Cheaper in crypto',
    encourage: 'We encourage crypto: paying in SOL costs less, and that is what we practice on this platform.',
    cta: 'Continue',
  },
  es: {
    choose: 'Elegir método de pago', term: 'pago único', fiat: 'o en reales', cheaper: 'Más barato en cripto',
    encourage: 'Fomentamos el uso de cripto: pagando en SOL el valor es menor, y eso es lo que practicamos en esta plataforma.',
    cta: 'Continuar',
  },
} satisfies Record<UiLocale, { choose: string; term: string; fiat: string; cheaper: string; encourage: string; cta: string }>

export function PlanPaymentOptions({ planId, offers, locale }: { planId: PlanId; offers: RegionalOffer[]; locale: UiLocale }) {
  const published = offers.filter((offer) => offer.planId === planId && offer.status === 'published')
  if (!published.length) return null
  const labels = copy[locale]
  const cryptoPrice = published.find((offer) => offer.paymentMethod === 'crypto')
  const fiatPrice = published.find((offer) => offer.paymentMethod === 'fiat')
  // Crypto leads when available: it is the cheaper route and the one the platform encourages.
  const lead = cryptoPrice ?? fiatPrice
  const secondary = cryptoPrice ? fiatPrice : undefined
  if (!lead) return null
  return <div className="mt-7">
    <p className="mb-3 text-xs text-[#9c9aa8]">{labels.choose}</p>
    <p className="font-display text-3xl font-semibold tracking-[-.02em] text-[#e8f0ea]">
      {formatRegionalOffer(lead, locale)}
      <span className="ml-2 font-sans text-xs font-normal text-[#9c9aa8]">· {labels.term}</span>
    </p>
    {secondary && <p className="mt-1 text-sm text-[#8e8a97]">{labels.fiat}: {formatRegionalOffer(secondary, locale)}</p>}
    {cryptoPrice && <p className="mt-3 rounded-lg border border-[#e4bc76]/25 bg-[#e4bc76]/[.05] px-3 py-2 text-xs leading-5 text-[#d9c59a]"><span className="font-semibold">{labels.cheaper}.</span> {labels.encourage}</p>}
    <Link to={`/checkout?plan=${planId}`} className="group mt-5 flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#c8b4ff] to-[#a78bfa] px-4 text-sm font-bold text-[#111018] shadow-[0_12px_35px_rgba(167,139,250,.18)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(167,139,250,.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c1acff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#11121a]">
      {labels.cta}
    </Link>
  </div>
}
