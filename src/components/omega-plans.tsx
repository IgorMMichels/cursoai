import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Check } from 'lucide-react'
import { plans, type Currency, type PlanId } from '@/lib/offers'

export function OmegaPlans({ standalone = false }: { standalone?: boolean }) {
  const [currency, setCurrency] = useState<Currency>(standalone ? 'BRL' : 'SOL')
  const [selected, setSelected] = useState<PlanId | null>(null)
  const Heading = standalone ? 'h1' : 'h2'
  return <section id="planos" className="omega-section omega-pricing" aria-labelledby="pricing-title"><div className="page-shell">
    <div className="omega-pricing-heading"><Heading id="pricing-title">Escolha seu tempo de estudo.</Heading><p className="omega-section-intro">A mesma trilha. Um período de acesso que combina com seu ritmo.</p></div>
    <div className="omega-currency" role="group" aria-label="Moeda de pagamento">{(['BRL', 'SOL'] as const).map(item => <button type="button" key={item} aria-pressed={currency === item} onClick={() => setCurrency(item)}>{item === 'BRL' ? 'Reais (BRL)' : 'Solana (SOL)'}</button>)}</div>
    <div className="omega-plan-grid">{(['month', 'quarter', 'lifetime'] as const).map(id => {
      const plan = plans[id]
      const buttonClass = plan.featured ? 'omega-button' : 'omega-button omega-button-outline'
      return <article key={id} className={`omega-plan${plan.featured ? ' omega-plan-featured' : ''}`}>
        <div className="omega-plan-heading"><h3>{plan.name}</h3>{plan.featured && <span>Sem prazo</span>}</div>
        <p className="omega-plan-term">{plan.term}</p><p className="omega-plan-price">{plan.prices[currency]}</p>
        <p className="omega-plan-alternative">ou {currency === 'SOL' ? plan.prices.BRL : plan.prices.SOL}</p><p className="omega-plan-description">{plan.description}</p>
        <ul>{plan.features.map(feature => <li key={feature}><Check size={15} />{feature}</li>)}</ul>
        {standalone ? <Link className={buttonClass} to={`/login?plano=${id}&moeda=${currency}`}>Ver plano {plan.name.toLowerCase()} <ArrowUpRight size={16} /></Link> : <button type="button" className={buttonClass} onClick={() => setSelected(id)}>Ver plano {plan.name.toLowerCase()} <ArrowUpRight size={16} /></button>}
        {selected === id && <p className="omega-plan-notice" role="status">Checkout indisponível no momento. Nenhum pagamento foi iniciado.</p>}
      </article>
    })}</div>
    {standalone && <p className="omega-pricing-note">Checkout ainda não está disponível; nenhum pagamento será processado por esta tela.</p>}
    <p className="omega-pricing-note">Os valores em SOL não acompanham cotação cambial em tempo real.</p>
  </div></section>
}
