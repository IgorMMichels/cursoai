import { LocalizedLink as Link } from '@/components/localized-router'
import { formatRegionalOffer, type RegionalOffer } from '@/lib/regional-offers'
import type { UiLocale } from '@/lib/localization'
import type { PlanId } from '@/lib/offers'

const copy = {
  'pt-BR': {
    stripe: 'Pagar em dinheiro', crypto: 'Pagar com cripto', monthly: '/ mês', annual: '/ ano', term: 'pagamento único',
    fiatNote: 'Cartão ou outros meios disponíveis na sua região.', cryptoNote: 'Preço especial para pagamentos em Solana.',
    cryptoReminder: 'Pagando com cripto, você aproveita um preço menor e ajuda a ampliar o uso dessa tecnologia.',
    recommended: 'Mais popular', lowerPrice: 'Preço menor',
  },
  en: {
    stripe: 'Pay with money', crypto: 'Pay with crypto', monthly: '/ month', annual: '/ year', term: 'one-time payment',
    fiatNote: 'Card and other payment methods available in your region.', cryptoNote: 'Special pricing for Solana payments.',
    cryptoReminder: 'Pay with crypto to get a lower price and help make this technology more widely used.',
    recommended: 'Most popular', lowerPrice: 'Lower price',
  },
  es: {
    stripe: 'Pagar en dinero', crypto: 'Pagar con cripto', monthly: '/ mes', annual: '/ año', term: 'pago único',
    fiatNote: 'Tarjeta y otros métodos disponibles en tu región.', cryptoNote: 'Precio especial para pagos en Solana.',
    cryptoReminder: 'Paga con cripto para obtener un precio menor y ayudar a ampliar el uso de esta tecnología.',
    recommended: 'Más popular', lowerPrice: 'Precio menor',
  },
} satisfies Record<UiLocale, { stripe: string; crypto: string; monthly: string; annual: string; term: string; fiatNote: string; cryptoNote: string; cryptoReminder: string; recommended: string; lowerPrice: string }>

export function PlanPaymentOptions({ planId, offers, locale }: { planId: PlanId; offers: RegionalOffer[]; locale: UiLocale }) {
  const options = offers
    .filter((offer) => offer.planId === planId && offer.status === 'published')
    .sort((a, b) => (a.paymentMethod === 'fiat' ? -1 : 1) - (b.paymentMethod === 'fiat' ? -1 : 1))
  if (!options.length) return null
  const labels = copy[locale]
  const hasBothMethods = options.some((offer) => offer.paymentMethod === 'fiat') && options.some((offer) => offer.paymentMethod === 'crypto')
  return <div className="mt-7 grid gap-3">
    {options.map((offer) => {
      const suffix = offer.billingMode === 'monthly' ? labels.monthly : offer.billingMode === 'annual' ? labels.annual : labels.term
      const isFiat = offer.paymentMethod === 'fiat'
      const label = isFiat ? labels.stripe : labels.crypto
      return <Link key={offer.id} to={`/checkout?plan=${planId}&payment=${offer.paymentMethod}`} className={`group relative flex min-h-[88px] items-center justify-between gap-4 overflow-hidden rounded-2xl px-5 py-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c1acff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#11121a] ${isFiat ? 'bg-gradient-to-br from-[#c8b4ff] to-[#a78bfa] text-[#111018] shadow-[0_12px_35px_rgba(167,139,250,.18)] hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(167,139,250,.28)]' : 'border border-[#b5a1f5]/25 bg-[#191822] text-[#f0edf8] hover:-translate-y-0.5 hover:border-[#b5a1f5]/55 hover:bg-[#201e2b]'}`}>
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-sm font-bold tracking-[-.01em]">
            {label}
            {hasBothMethods && <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.08em] ${isFiat ? 'bg-black/10 text-[#282238]' : 'bg-[#b5a1f5]/15 text-[#c8b4ff]'}`}>{isFiat ? labels.recommended : labels.lowerPrice}</span>}
          </span>
          <span className={`mt-1 block text-xs ${isFiat ? 'text-[#302940]/75' : 'text-[#a7a3b1]'}`}>{isFiat ? labels.fiatNote : labels.cryptoNote}</span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-lg font-bold tracking-[-.03em]">{formatRegionalOffer(offer, locale)}</span>
          <span className={`block text-[11px] ${isFiat ? 'text-[#302940]/75' : 'text-[#a7a3b1]'}`}>{suffix}</span>
        </span>
      </Link>
    })}
    {hasBothMethods && <p className="px-1 pt-0.5 text-xs leading-5 text-[#9c9aa8]">{labels.cryptoReminder}</p>}
  </div>
}
