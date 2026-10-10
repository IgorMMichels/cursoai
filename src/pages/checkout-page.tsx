import { Brand, OmegaSymbol } from '@/components/brand'
import { OmegaBrandScene } from '@/components/omega-brand-scene'
import { LocalizedLink as Link } from '@/components/localized-router'
import { PageMeta } from '@/components/tools/page-meta'
import { useLocalization } from '@/contexts/localization-context'
import { useSession } from '@/contexts/session-context'
import { translateUi } from '@/lib/ui-translation'
import { plans, type PlanId } from '@/lib/offers'
import { formatRegionalOffer, getPublishedRegionalOffer } from '@/lib/regional-offers'
import { supabase } from '@/lib/supabase'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Bitcoin, Check, CreditCard, Loader2, LockKeyhole, QrCode, ShieldCheck, Sparkles } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useState } from 'react'

type PaymentChoice = 'crypto' | 'fiat' | 'pix'

const copy = {
  'pt-BR': {
    title: 'Finalizar compra', subtitle: 'Acesso completo ao curso Ômega. Escolha como pagar e libere o acesso logo após a confirmação.',
    eyebrow: 'Checkout Ômega', heroLine: 'Método, prática e revisão em um só lugar.',
    steps: ['Plano', 'Pagamento', 'Acesso'], method: 'Forma de pagamento', order: 'Resumo do pedido', included: 'Incluso no plano',
    oneTime: 'Pagamento único', founderTitle: 'Selo Founder', founder: 'Os primeiros 25 compradores confirmados recebem o selo Founder. Ele fica na conta e continua valendo em compras futuras.',
    crypto: 'Cripto', cryptoSub: 'Pague com Solana', stripe: 'Cartão e outros meios', stripeSub: 'Checkout seguro da Stripe', pix: 'Pix', pixSub: 'Pagamento instantâneo no Brasil',
    available: 'Disponível agora', soon: 'Em breve', region: 'Pix está disponível para compras no Brasil.',
    continue: 'Continuar para pagamento seguro', login: 'Entrar ou criar conta para pagar', loginHint: 'Você volta para esta tela com o plano escolhido.',
    unavailable: 'Esta forma de pagamento ainda não está disponível.', noPlan: 'Escolha um plano para continuar.', backPlans: 'Ver planos',
    trust: ['Dados do cartão digitados direto na Stripe', 'Acesso liberado após a confirmação', 'Sem renovação automática'],
    secure: 'Pagamento processado pela Stripe. A Ômega não armazena dados de cartão.',
    success: 'Estamos confirmando o pagamento e preparando seu acesso.', cancelled: 'Pagamento cancelado. Nenhuma cobrança foi concluída.',
    working: 'Abrindo pagamento seguro…', error: 'Não foi possível iniciar o pagamento. Tente novamente.',
  },
  en: {
    title: 'Complete your purchase', subtitle: 'Full access to the Omega course. Choose how to pay and get access right after confirmation.',
    eyebrow: 'Omega checkout', heroLine: 'Method, practice and review in one place.',
    steps: ['Plan', 'Payment', 'Access'], method: 'Payment method', order: 'Order summary', included: 'Included in the plan',
    oneTime: 'One-time payment', founderTitle: 'Founder badge', founder: 'The first 25 confirmed buyers receive the Founder badge. It stays on the account and applies to future purchases.',
    crypto: 'Crypto', cryptoSub: 'Pay with Solana', stripe: 'Card and other methods', stripeSub: 'Secure Stripe checkout', pix: 'Pix', pixSub: 'Instant payment in Brazil',
    available: 'Available now', soon: 'Coming soon', region: 'Pix is available for purchases in Brazil.',
    continue: 'Continue to secure payment', login: 'Sign in or create an account to pay', loginHint: 'You will come back to this page with your plan selected.',
    unavailable: 'This payment method is not available yet.', noPlan: 'Choose a plan to continue.', backPlans: 'View plans',
    trust: ['Card details entered directly on Stripe', 'Access granted after confirmation', 'No automatic renewal'],
    secure: 'Payment processed by Stripe. Omega does not store card details.',
    success: 'We’re confirming your payment and preparing your access.', cancelled: 'Payment cancelled. No charge was completed.',
    working: 'Opening secure payment…', error: 'We could not start the payment. Please try again.',
  },
  es: {
    title: 'Finalizar compra', subtitle: 'Acceso completo al curso Omega. Elige cómo pagar y recibe el acceso justo después de la confirmación.',
    eyebrow: 'Pago Omega', heroLine: 'Método, práctica y repaso en un solo lugar.',
    steps: ['Plan', 'Pago', 'Acceso'], method: 'Método de pago', order: 'Resumen del pedido', included: 'Incluye el plan',
    oneTime: 'Pago único', founderTitle: 'Insignia Founder', founder: 'Los primeros 25 compradores confirmados reciben la insignia Founder. Se queda en la cuenta y vale para compras futuras.',
    crypto: 'Cripto', cryptoSub: 'Paga con Solana', stripe: 'Tarjeta y otros medios', stripeSub: 'Pago seguro con Stripe', pix: 'Pix', pixSub: 'Pago instantáneo en Brasil',
    available: 'Disponible ahora', soon: 'Próximamente', region: 'Pix está disponible para compras en Brasil.',
    continue: 'Continuar al pago seguro', login: 'Inicia sesión o crea una cuenta para pagar', loginHint: 'Volverás a esta pantalla con el plan elegido.',
    unavailable: 'Este método de pago aún no está disponible.', noPlan: 'Elige un plan para continuar.', backPlans: 'Ver planes',
    trust: ['Datos de la tarjeta ingresados directamente en Stripe', 'Acceso liberado tras la confirmación', 'Sin renovación automática'],
    secure: 'Pago procesado por Stripe. Omega no guarda datos de la tarjeta.',
    success: 'Estamos confirmando el pago y preparando tu acceso.', cancelled: 'Pago cancelado. No se completó ningún cargo.',
    working: 'Abriendo el pago seguro…', error: 'No pudimos iniciar el pago. Inténtalo de nuevo.',
  },
} as const

export function CheckoutPage() {
  const { locale, market } = useLocalization()
  const { user } = useSession()
  const reducedMotion = useReducedMotion()
  const [search, setSearch] = useSearchParams()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const rawPlan = search.get('plan')
  const planId = rawPlan && rawPlan in plans ? rawPlan as PlanId : null
  const requestedMethod = search.get('payment')
  const initialMethod: PaymentChoice = requestedMethod === 'crypto' || requestedMethod === 'pix' ? requestedMethod : 'fiat'
  const [selectedMethod, setSelectedMethod] = useState<PaymentChoice>(initialMethod)
  const status = search.get('status')
  const labels = copy[locale]
  const plan = planId ? plans[planId] : null
  const offer = planId ? getPublishedRegionalOffer(market, planId, selectedMethod === 'crypto' ? 'crypto' : 'fiat') : null
  const priceLabel = offer ? formatRegionalOffer(offer, locale) : '—'
  const currentStep = status === 'success' ? 2 : 1
  const options = [
    { id: 'crypto' as const, label: labels.crypto, hint: labels.cryptoSub, icon: Bitcoin, active: false },
    { id: 'fiat' as const, label: labels.stripe, hint: labels.stripeSub, icon: CreditCard, active: true },
    { id: 'pix' as const, label: labels.pix, hint: labels.pixSub, icon: QrCode, active: false },
  ]
  const localeLabel = locale === 'en' ? 'Secure checkout' : locale === 'es' ? 'Pago seguro' : 'Checkout seguro'
  // Entradas curtas e opacas; com movimento reduzido, tudo aparece de uma vez.
  const rise = (delay = 0) => ({
    initial: { opacity: 0, y: reducedMotion ? 0 : 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reducedMotion ? 0 : .5, delay: reducedMotion ? 0 : delay, ease: [.22, 1, .36, 1] as const },
  })

  return <div className="min-h-[100dvh] bg-[#09090d] text-[#f1eff5] selection:bg-[#a78bfa]/30">
    <PageMeta title={locale === 'en' ? 'Checkout · Omega' : locale === 'es' ? 'Pago · Omega' : 'Checkout · Ômega'} description={labels.subtitle} path="/checkout" />
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between border-b border-white/[.07] px-5 py-4 sm:px-8">
      <Brand />
      <span className="inline-flex items-center gap-2 text-xs text-[#aaa6b2]"><LockKeyhole size={13} />{localeLabel}</span>
    </header>

    <main className="mx-auto w-full max-w-5xl px-5 pb-20 pt-7 sm:px-8 sm:pt-10">
      <Link to="/planos" className="mb-5 inline-flex items-center gap-2 text-xs text-[#aaa6b2] transition hover:text-white"><ArrowLeft size={14} />{labels.backPlans}</Link>

      <ol className="mb-8 grid grid-cols-3 gap-2" aria-label={labels.title}>
        {labels.steps.map((step, index) => {
          const done = index < currentStep
          const current = index === currentStep
          return <li key={step} className="min-w-0" aria-current={current ? 'step' : undefined}>
            <motion.span className={`block h-1 origin-left rounded-full ${done || current ? 'bg-[#a78bfa]' : 'bg-white/[.1]'}`}
              initial={{ scaleX: reducedMotion ? 1 : 0 }} animate={{ scaleX: done || current ? 1 : 0.35 }}
              transition={{ duration: reducedMotion ? 0 : .6, delay: reducedMotion ? 0 : index * .12, ease: [.22, 1, .36, 1] }} />
            <span className={`mt-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[.14em] ${current ? 'text-[#e4d9ff]' : done ? 'text-[#b9a5ff]' : 'text-[#7f7b88]'}`}>
              {done ? <Check size={12} /> : <span className="font-mono">{index + 1}</span>}{step}
            </span>
          </li>
        })}
      </ol>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
        <div className="min-w-0">
          <motion.section {...rise(0)} className="relative overflow-hidden rounded-2xl border border-white/[.1] bg-[#07060c]">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(167,139,250,.14),transparent_60%)]" />
            <div className="relative mx-auto h-[230px] w-full sm:h-[290px]" aria-hidden="true">
              <div className="absolute inset-0 grid place-items-center">
                <div className="w-[110px] text-[#b9a5ff]/70 sm:w-[130px] [&>svg]:size-full"><OmegaSymbol /></div>
              </div>
              <OmegaBrandScene className="absolute inset-0" still={!!reducedMotion} />
            </div>
            <div className="relative border-t border-white/[.07] px-5 py-5 sm:px-6">
              <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#a78bfa]">{labels.eyebrow}</p>
              <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-.04em] sm:text-4xl">{labels.title}</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#aaa6b2]">{labels.subtitle}</p>
              <p className="mt-3 text-xs text-[#8e8a97]">{labels.heroLine}</p>
            </div>
          </motion.section>

          <motion.section {...rise(.08)} className="mt-8">
            <h2 className="mb-3 text-sm font-semibold">{labels.method}</h2>
            <div className="grid gap-3" role="radiogroup" aria-label={labels.method}>
              {options.map(({ id, label, hint, icon: Icon, active }) => {
                const selected = selectedMethod === id
                const disabled = id === 'pix' && market !== 'BR'
                return <button key={id} type="button" role="radio" aria-checked={selected} aria-disabled={disabled || undefined}
                  onClick={() => { if (!disabled) selectMethod(id) }}
                  className={`group relative flex min-h-[76px] w-full items-center gap-4 overflow-hidden rounded-xl border px-4 py-4 text-left transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa] sm:px-5 ${selected ? 'border-[#a78bfa]/60 bg-[#a78bfa]/[.08] shadow-[0_0_0_1px_rgba(167,139,250,.12)]' : 'border-white/[.1] bg-[#13131b] hover:border-white/[.2] hover:bg-[#171620]'} ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${!active && !disabled ? 'opacity-80' : ''}`}>
                  {selected && <motion.span layoutId="omega-method-active" className="absolute inset-y-0 left-0 w-[3px] bg-[#a78bfa]" transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }} />}
                  <span className={`grid size-10 shrink-0 place-items-center rounded-lg transition ${selected ? 'bg-[#a78bfa]/18 text-[#d4c6ff]' : 'bg-white/[.05] text-[#aaa6b2]'}`}><Icon size={18} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 text-sm font-medium">{label}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${active ? 'bg-[#92d4ab]/12 text-[#a9e3c0]' : 'bg-white/[.05] text-[#8e8a97]'}`}>{active ? labels.available : labels.soon}</span>
                    </span>
                    <span className="mt-1 block text-xs text-[#aaa6b2]">{hint}</span>
                  </span>
                  <span aria-hidden="true" className={`grid size-[18px] shrink-0 place-items-center rounded-full border transition ${selected ? 'border-[#a78bfa] bg-[#a78bfa]' : 'border-white/25'}`}>{selected && <Check size={11} className="text-[#17131e]" strokeWidth={3} />}</span>
                </button>
              })}
            </div>

            {selectedMethod === 'pix' && market !== 'BR' && <p role="status" className="mt-3 text-xs text-[#aaa6b2]">{labels.region}</p>}

            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={status ?? (user ? selectedMethod : 'guest')} initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : .3 }}>
                {status === 'success' ? <p role="status" className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/[.06] p-4 text-sm text-emerald-200">{labels.success}</p>
                  : status === 'cancelled' ? <p role="status" className="mt-5 rounded-xl border border-white/[.1] bg-white/[.03] p-4 text-sm text-[#d2ced8]">{labels.cancelled}</p>
                    : !user && planId ? <div className="mt-5">
                      <Link to={`/login?plano=${planId}&payment=${selectedMethod}`} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#a78bfa] px-5 py-3.5 text-sm font-semibold text-[#17131e] transition hover:bg-[#b9a5ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4b5fd]">{labels.login}<ArrowRight size={16} /></Link>
                      <p className="mt-2 text-center text-xs text-[#8e8a97]">{labels.loginHint}</p>
                    </div>
                      : selectedMethod === 'fiat' ? <div className="mt-5">
                        <button type="button" disabled={busy || !planId || !offer} onClick={() => planId && void beginStripeCheckout(planId)} className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#a78bfa] px-5 py-3.5 text-sm font-semibold text-[#17131e] shadow-[0_12px_32px_rgba(167,139,250,.18)] transition hover:-translate-y-0.5 hover:bg-[#b9a5ff] hover:shadow-[0_16px_40px_rgba(167,139,250,.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4b5fd] disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0">
                          {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                          {busy ? labels.working : labels.continue}
                          {!busy && <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />}
                        </button>
                        <p className="mt-3 flex items-center justify-center gap-2 text-xs text-[#8e8a97]"><LockKeyhole size={12} />{labels.secure}</p>
                      </div>
                        : <p role="status" className="mt-5 rounded-xl border border-white/[.1] bg-white/[.03] p-4 text-sm text-[#aaa6b2]">{labels.unavailable}</p>}
              </motion.div>
            </AnimatePresence>
            {error && <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p>}
          </motion.section>

          <motion.ul {...rise(.16)} className="mt-8 grid gap-2 sm:grid-cols-3">
            {labels.trust.map((item, index) => <li key={item} className="flex items-start gap-2.5 rounded-xl border border-white/[.07] bg-white/[.02] px-3.5 py-3 text-xs leading-5 text-[#c4bfcc]">
              {index === 0 ? <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#a78bfa]" /> : index === 1 ? <Sparkles size={15} className="mt-0.5 shrink-0 text-[#a78bfa]" /> : <Check size={15} className="mt-0.5 shrink-0 text-[#a78bfa]" />}
              {item}
            </li>)}
          </motion.ul>
        </div>

        <motion.aside {...rise(.12)} className="rounded-2xl border border-white/[.1] bg-[#13131b] p-5 sm:p-6 lg:sticky lg:top-6">
          <h2 className="text-sm font-semibold">{labels.order}</h2>
          {plan ? <>
            <div className="mt-5">
              <p className="text-sm font-medium">{translateUi(plan.name)}</p>
              <p className="mt-1 text-xs text-[#aaa6b2]">{translateUi(plan.term)}</p>
            </div>
            <div className="my-5 border-t border-white/[.08]" />
            <div className="flex items-end justify-between gap-3">
              <span className="text-xs text-[#aaa6b2]">{labels.oneTime}</span>
              <span className="relative block h-8 overflow-hidden text-right">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={priceLabel} className="block font-display text-2xl font-semibold tabular-nums tracking-tight" initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : -10 }} transition={{ duration: reducedMotion ? 0 : .25 }}>{priceLabel}</motion.span>
                </AnimatePresence>
              </span>
            </div>
            <div className="my-5 border-t border-white/[.08]" />
            <p className="mb-3 text-xs font-medium text-[#d2ced8]">{labels.included}</p>
            <ul className="grid gap-2.5">
              {plan.features.slice(0, 4).map((feature, index) => <motion.li key={feature} className="flex items-start gap-2.5 text-xs leading-5 text-[#aaa6b2]"
                initial={{ opacity: 0, x: reducedMotion ? 0 : -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: reducedMotion ? 0 : .35, delay: reducedMotion ? 0 : .25 + index * .07 }}>
                <Check size={14} className="mt-0.5 shrink-0 text-[#a78bfa]" />{translateUi(feature)}
              </motion.li>)}
            </ul>
            <div className="mt-6 rounded-xl border border-[#e4bc76]/25 bg-[#e4bc76]/[.05] p-4">
              <p className="flex items-center gap-2 text-xs font-semibold text-[#f0ce88]"><Sparkles size={13} />{labels.founderTitle}</p>
              <p className="mt-2 text-xs leading-5 text-[#c9bfa8]">{labels.founder}</p>
            </div>
          </> : <p className="mt-3 text-sm leading-6 text-[#aaa6b2]"><Link to="/planos" className="text-[#b9a5ff] underline underline-offset-4">{labels.noPlan}</Link></p>}
        </motion.aside>
      </div>
    </main>
  </div>

  function selectMethod(id: PaymentChoice) {
    setSelectedMethod(id)
    setError('')
    setSearch((previous) => {
      const next = new URLSearchParams(previous)
      if (planId) next.set('plan', planId)
      next.set('payment', id)
      next.delete('status')
      next.delete('session_id')
      return next
    }, { replace: true })
  }

  async function beginStripeCheckout(selectedPlan: PlanId) {
    if (!supabase || busy) return
    setBusy(true)
    setError('')
    try {
      const { data, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !data.session?.access_token) throw new Error(labels.error)
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan, locale }),
      })
      const result = await response.json() as { url?: string }
      if (!response.ok || !result.url) throw new Error(labels.error)
      window.location.assign(result.url)
    } catch {
      setError(labels.error)
      setBusy(false)
    }
  }
}
