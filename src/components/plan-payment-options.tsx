import { LocalizedLink as Link } from '@/components/localized-router'
import { formatRegionalOffer, type RegionalOffer } from '@/lib/regional-offers'
import type { UiLocale } from '@/lib/localization'
import type { PlanId } from '@/lib/offers'

const copy = {
  'pt-BR': { stripe: 'Dinheiro · Stripe', crypto: 'Cripto · Solana', monthly: '/ mês', annual: '/ ano', term: 'pagamento único' },
  en: { stripe: 'Card · Stripe', crypto: 'Crypto · Solana', monthly: '/ month', annual: '/ year', term: 'one-time payment' },
  es: { stripe: 'Tarjeta · Stripe', crypto: 'Cripto · Solana', monthly: '/ mes', annual: '/ año', term: 'pago único' },
} satisfies Record<UiLocale, { stripe: string; crypto: string; monthly: string; annual: string; term: string }>

export function PlanPaymentOptions({ planId, offers, locale }: { planId: PlanId; offers: RegionalOffer[]; locale: UiLocale }) {
  const options = offers.filter((offer) => offer.planId === planId && offer.status === 'published')
  if (!options.length) return null
  const labels = copy[locale]
  return <div className="mt-7 grid gap-2">
    {options.map((offer) => {
      const suffix = offer.billingMode === 'monthly' ? labels.monthly : offer.billingMode === 'annual' ? labels.annual : labels.term
      const label = offer.paymentMethod === 'fiat' ? labels.stripe : labels.crypto
      return <Link key={offer.id} to={`/checkout?plan=${planId}&payment=${offer.paymentMethod}`} className={`inline-flex min-h-11 items-center justify-between gap-3 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${offer.paymentMethod === 'fiat' ? 'bg-[#a78bfa] text-[#09090d] hover:bg-[#c1acff]' : 'border border-white/[.12] text-[#d9e3dc] hover:bg-white/[.04]'}`}>
        <span>{label}</span><span>{formatRegionalOffer(offer, locale)} <span className="font-normal opacity-70">{suffix}</span></span>
      </Link>
    })}
  </div>
}
