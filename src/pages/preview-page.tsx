import { translateUi } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { LocalizedLink as Link } from '@/components/localized-router'
import { ArrowRight, BookOpen, Headphones, LayoutDashboard, LayoutGrid, Map, Radio, ShieldCheck, SlidersHorizontal, WalletCards } from 'lucide-react'
import { Brand } from '@/components/brand'
import { CoursePreview } from '@/components/course-preview'
import { PageMeta } from '@/components/tools/page-meta'

const previewNav = [
  { id: 'visao-geral', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'jornadas', label: 'Jornadas', icon: Map },
  { id: 'trilha', label: 'Minha trilha', icon: BookOpen },
  { id: 'plataformas', label: 'Plataformas', icon: LayoutGrid },
  { id: 'ferramentas', label: 'Ferramentas', icon: SlidersHorizontal },
  { id: 'radar', label: 'SISMO', icon: Radio },
  { id: 'audios', label: 'Áudios extras', icon: Headphones },
  { id: 'simulador', label: 'Simulador de trade', icon: SlidersHorizontal },
  { id: 'pagamento', label: 'Como pagar', icon: WalletCards },
  { id: 'seguranca', label: 'Central de segurança', icon: ShieldCheck },
]

export function PreviewPage() {
  useUiTranslation();
  const [params] = useSearchParams()
  const area = previewNav.some((item) => item.id === params.get('area')) ? params.get('area')! : 'visao-geral'
  const current = previewNav.find((item) => item.id === area)!
  return <div className="preview-shell">
    <PageMeta title={translateUi("Conheça o curso")} description={translateUi("Explore as jornadas, módulos e aulas do curso Omega, além das ferramentas e recursos da área do aluno.")} path="/explorar" />
    <aside className="preview-sidebar">
      <div className="px-6 py-6"><Brand /></div>
      <p className="px-7 pb-3 text-[10px] uppercase tracking-widest text-[#85808f]">{translateUi("Aprender")}</p>
      <nav className="px-4" aria-label={translateUi("Prévia da área do aluno")}>{previewNav.map(({ id, label, icon: Icon }) => <Link key={id} to={`/explorar?area=${id}`} aria-current={area === id ? 'page' : undefined} className={`preview-nav-link ${area === id ? 'is-active' : ''}`}><Icon size={17} />{translateUi(label)}</Link>)}</nav>
      <div className="mt-auto p-4"><Link className="preview-button w-full" to="/planos">{translateUi("Ver planos")}<ArrowRight size={14} /></Link><p className="mt-3 text-center text-[10px] text-[#85808f]">{translateUi("Prévia pública · sem login")}</p></div>
    </aside>
    <div className="min-w-0">
      <header className="preview-header">
        <div className="lg:hidden"><Brand compact /></div><span className="hidden text-xs text-[#aaa7b5] lg:block">{translateUi("Prévia pública / ")}{translateUi(current.label)}</span>
        <div className="ml-auto flex items-center gap-2 sm:gap-4"><Link to="/login" className="text-xs text-[#c2bdcc]">{translateUi("Entrar")}</Link><Link className="preview-button" to="/planos">{translateUi("Ver planos")}</Link></div>
      </header>
      <nav className="preview-mobile-nav" aria-label={translateUi("Navegação da prévia")}>{previewNav.map(({ id, label }) => <Link key={id} to={`/explorar?area=${id}`} aria-current={area === id ? 'page' : undefined}>{translateUi(label)}</Link>)}</nav>
      <main className="mx-auto max-w-[1450px] px-4 py-7 sm:px-7 lg:px-10"><CoursePreview area={area} journeyId={area === 'jornadas' ? params.get('jornada') ?? undefined : undefined} /></main>
    </div>
  </div>
}
