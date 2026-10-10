import { LocalizedLink as Link } from '@/components/localized-router'
import { formatRegionalOffer, type RegionalOffer } from '@/lib/regional-offers'
import type { UiLocale } from '@/lib/localization'
import type { PlanId } from '@/lib/offers'

const copy = {
  'pt-BR': {
    choose: 'Escolher forma de pagamento', term: 'pagamento único',
  },
  en: {
    choose: 'Choose a payment method', term: 'one-time payment',
  },
  es: {
    choose: 'Elegir método de pago', term: 'pago único',
  },
} satisfies Record<UiLocale, { choose: string; term: string }>

export function PlanPaymentOptions({ planId, offers, locale }: { planId: PlanId; offers: RegionalOffer[]; locale: UiLocale }) {
  const options = offers
    .filter((offer) => offer.planId === planId && offer.status === 'published')
    .sort((a, b) => (a.paymentMethod === 'fiat' ? -1 : 1) - (b.paymentMethod === 'fiat' ? -1 : 1))
  if (!options.length) return null
  const labels = copy[locale]
  const fiatPrice = options.find((offer) => offer.paymentMethod === 'fiat')
  return <div className="mt-7">
    <p className="mb-3 text-xs text-[#9c9aa8]">{labels.choose}</p>
    {fiatPrice && <p className="mb-4 font-display text-2xl font-semibold text-[#e8f0ea]">{formatRegionalOffer(fiatPrice, locale)} <span className="font-sans text-xs font-normal text-[#9c9aa8]">· {labels.term}</span></p>}
    <Link to={`/checkout?plan=${planId}`} className="group flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#c8b4ff] to-[#a78bfa] px-4 text-sm font-bold text-[#111018] shadow-[0_12px_35px_rgba(167,139,250,.18)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(167,139,250,.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c1acff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#11121a]">
      {locale === 'en' ? 'Continue' : locale === 'es' ? 'Continuar' : 'Continuar'}
    </Link>
  </div>
}
