import { SiteHeader, SiteFooter } from '@/components/site-header'
import { OmegaPlans } from '@/components/omega-plans'
import { PageMeta } from '@/components/tools/page-meta'
export function PlansPage() {
  return <div className="omega-public omega-landing omega-plans-page">
    <PageMeta title="Planos de acesso" description="Compare os períodos de acesso às jornadas educativas da Ômega." path="/planos" />
    <SiteHeader /><main id="conteudo"><OmegaPlans standalone /></main><SiteFooter />
  </div>
}
