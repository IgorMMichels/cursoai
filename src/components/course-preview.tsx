import { SourceLanguageNotice } from '@/components/source-language-notice'
import { translateUi } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, Lock } from 'lucide-react'
import { LocalizedLink as Link } from '@/components/localized-router'
import { loadJourneys, type Journey } from '@/lib/journeys'
import { previewCatalog, previewTotals } from '@/lib/course-preview-catalog'
import { moduleCovers } from '@/lib/course-media'
import { tools } from '@/lib/tools'
import { platformGuidesByJourney } from '@/lib/platform-guides'
import '@/styles/course-preview.css'

const levels = { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado' }
const resources: Record<string, { title: string; description: string; items: string[]; href?: string }> = {
  plataformas: { title: 'Plataformas', description: 'Guias de uso das plataformas que aparecem nas jornadas.', items: ['Passo a passo para navegar nas plataformas', 'Carteiras, redes e operações', 'Cuidados antes de conectar ou assinar'] },
  ferramentas: { title: 'Ferramentas', description: 'Calculadoras gratuitas para estudar cenários e risco, como na área do curso.', items: tools.map((tool) => `${tool.title}: ${tool.description}`), href: '/ferramentas' },
  radar: { title: 'SISMO', description: 'Radar educacional em piloto, como na área de ferramentas do curso.', items: ['SISMO: notícias com fontes e filtros por tema e ativo', 'Funding Monitor: taxas de BTC, ETH e SOL', 'War Room: em planejamento'], href: '/radar' },
  audios: { title: 'Áudios extras', description: 'Biblioteca opcional de narrações organizada por jornada e aula.', items: ['Cripto do Zero, Memecoins, Futuros e Trading', 'Seleção de aulas e blocos de áudio', 'Conteúdo complementar ao material escrito'] },
  simulador: { title: 'Simulador de trade', description: 'Pratique decisões em um ambiente de simulação.', items: ['Simulação para estudo', 'Planejamento de operações', 'Sem executar ordens reais'], href: '/simulador' },
  pagamento: { title: 'Como pagar', description: 'Escolha o período de acesso na página de planos e siga as instruções de pagamento.', items: ['Períodos de acesso e valores atuais', 'Instruções para concluir o pagamento', 'Liberação após confirmação'], href: '/planos' },
  seguranca: { title: 'Central de segurança', description: 'Orientações para cuidar de suas contas, carteiras e operações.', items: ['Chaves e custódia', 'Atenção a links e permissões', 'Verificações antes de operar'] },
}

export function CoursePreview({ area = 'visao-geral', journeyId }: { area?: string; journeyId?: string }) {
  useUiTranslation();
  const [catalog, setCatalog] = useState(() => previewCatalog())
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    loadJourneys().then((journeys) => {
      if (active) { setCatalog(previewCatalog(journeys)); setStatus('ready') }
    }).catch(() => { if (active) setStatus('fallback') })
    return () => { active = false }
  }, [attempt])
  const totals = previewTotals(catalog)
  const selected = catalog.find((journey) => journey.id === journeyId)
  const resource = resources[area]
  return (
    <div className="course-preview space-y-8"><SourceLanguageNotice />
      <div className="preview-notice" role="status"><Lock size={14} /><span>{translateUi("Prévia do curso · aulas, exercícios e progresso disponíveis com acesso ativo.")}</span></div>
      {status === 'loading' && <p className="text-xs text-[#9aa39d]" role="status">{translateUi("Atualizando o catálogo do curso…")}</p>}
      {status === 'fallback' && <div className="preview-notice" role="status"><span>{translateUi("Não foi possível consultar o catálogo publicado. Exibindo a versão incluída no site.")}</span><button type="button" onClick={() => { setStatus('loading'); setAttempt((value) => value + 1) }}>{translateUi("Tentar novamente")}</button></div>}
      {resource ? <section className="preview-panel p-6 sm:p-8">
        <p className="eyebrow">{translateUi("área do curso")}</p><h1 className="mt-3 font-display text-3xl text-white">{translateUi(resource.title)}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#aaa7b5]">{translateUi(resource.description)}</p>
        <ul className="mt-6 space-y-3 text-sm text-[#d2ccd9]">{resource.items.map((item) => <li key={item} className="flex items-center gap-3"><BookOpen size={16} className="text-[#b49cff]" />{translateUi(item)}</li>)}</ul>
        {area === 'plataformas' && <div className="mt-7 grid gap-4 sm:grid-cols-2">{Object.entries(platformGuidesByJourney).map(([id, guide]) => <article key={id} className="preview-panel p-4"><h2 className="text-sm font-medium text-white">{translateUi(catalog.find((journey) => journey.id === id)?.title ?? id)}</h2><p className="mt-2 text-xs leading-6 text-[#aaa7b5]">{translateUi(guide.groups.flatMap((group) => group.guides.map((platform) => platform.name)).join(' · '))}</p></article>)}</div>}
        <Link className="preview-button mt-7" to={resource.href ?? '/planos'}>{translateUi(resource.href ? 'Abrir ' + resource.title.toLowerCase() : 'Ver planos de acesso')}<ArrowRight size={15} /></Link>
      </section> : <>
        {area === 'visao-geral' && <section className="preview-panel grid overflow-hidden lg:grid-cols-[1.2fr_1fr]">
          <div className="p-6 sm:p-8">
            <p className="eyebrow">{translateUi("Omega · área do curso")}</p>
            <h1 className="mt-4 font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">{translateUi("Conheça o caminho de estudo.")}</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#aaa7b5]">{translateUi("Comece pelos fundamentos de Cripto do Zero e explore as jornadas de Memecoins, Futuros e Trading. Esta prévia mostra a organização e o conteúdo do catálogo oficial.")}</p>
            <Link className="preview-button mt-6" to="/planos">{translateUi("Ver planos de acesso")}<ArrowRight size={15} /></Link>
          </div>
          <div className="relative flex min-h-64 items-end bg-[#13131c] p-6 sm:p-8">
            <img src={moduleCovers.m1} alt={translateUi("")} className="absolute inset-0 size-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#101018] to-transparent" />
            <div className="relative"><p className="eyebrow">{translateUi("primeiro módulo · Cripto do Zero")}</p><h2 className="mt-3 font-display text-2xl text-white">{translateUi(catalog[0]?.modules[0]?.title)}</h2><p className="mt-2 text-sm text-[#c2bdcc]">{translateUi(catalog[0]?.modules[0]?.subtitle)}</p></div>
          </div>
        </section>}
        <dl className="preview-stats">{[[totals.journeys, 'Jornadas'], [totals.modules, 'Módulos'], [totals.lessons, 'Aulas'], [totals.minutes + ' min', 'Conteúdo no catálogo']].map(([value, label]) => <div key={label}><dt>{translateUi(label)}</dt><dd>{translateUi(value)}</dd></div>)}</dl>
        <section id="modulos">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">{translateUi("catálogo do curso")}</p>{area === 'visao-geral' ? <h2 className="mt-3 font-display text-2xl text-white">{translateUi("Jornadas de estudo")}</h2> : <h1 className="mt-3 font-display text-2xl text-white">{translateUi(selected ? selected.title : area === 'trilha' ? 'Sua trilha começa pelos fundamentos' : 'Jornadas de estudo')}</h1>}</div>{selected && <Link to="/explorar?area=jornadas" className="text-sm text-[#c1acff]">{translateUi("Todas as jornadas")}</Link>}</div>
          {journeyId && !selected && status !== 'loading' && <p className="preview-notice mb-5">{translateUi("Esta jornada não está no catálogo publicado. Escolha uma das jornadas abaixo.")}</p>}
          {selected ? <JourneyModules journey={selected} /> : <div className="grid gap-5 md:grid-cols-2">{catalog.map((journey) => <article className="preview-panel overflow-hidden" key={journey.id}>
            <img src={journey.coverUrl ?? moduleCovers.m1} alt={translateUi("")} loading="lazy" className="aspect-video w-full object-cover" />
            <div className="p-5"><div className="flex justify-between gap-3 text-xs text-[#a39bab]"><span>{translateUi(levels[journey.level])}</span><span className="flex items-center gap-1"><Lock size={12} />{translateUi("Prévia")}</span></div>
              <h2 className="mt-3 font-display text-xl text-white">{translateUi(journey.title)}</h2><p className="mt-2 text-sm leading-6 text-[#aaa7b5]">{translateUi(journey.shortDesc)}</p>
              <p className="mt-4 text-xs text-[#aaa7b5]">{translateUi(journey.modules.length)} {translateUi(" módulos · ")}{translateUi(journey.modules.reduce((sum, module) => sum + module.lessons.length, 0))} {translateUi(" aulas")}</p>
              <Link className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#c1acff]" to={`/explorar?area=jornadas&jornada=${journey.id}`}>{translateUi("Ver módulos e aulas")}<ArrowRight size={15} /></Link>
            </div>
          </article>)}</div>}
          {area === 'trilha' && !selected && <div className="mt-6"><JourneyModules journey={catalog[0]} /></div>}
        </section>
      </>}
      <p className="text-xs leading-6 text-[#9aa39d]">{translateUi("O catálogo apresenta títulos e duração das aulas. Seu progresso é registrado somente na área do aluno. As jornadas em modo catálogo seguem a disponibilidade indicada no curso oficial.")}</p>
    </div>
  )
}

function JourneyModules({ journey }: { journey: Journey }) {
  useUiTranslation();
  return <div><p className="mb-5 max-w-3xl text-sm leading-7 text-[#aaa7b5]">{translateUi(journey.longDesc)}</p>
    {journey.catalogOnly && <p className="preview-notice mb-5">{translateUi("No curso oficial, esta jornada está em modo catálogo. Aulas e progresso serão liberados conforme a publicação do conteúdo.")}</p>}
    <div className="space-y-3">{journey.modules.map((module) => <details key={module.id} className="preview-panel p-5">
      <summary className="cursor-pointer text-[#eeeaf4]"><span className="mr-3 text-xs text-[#b49cff]">{translateUi(module.number)}</span>{translateUi(module.title)}<span className="mt-2 block text-xs text-[#a39bab]">{translateUi(module.lessons.length)} {translateUi(" aulas · ")}{translateUi(module.duration)}</span></summary>
      {module.subtitle && <p className="mt-4 text-sm text-[#aaa7b5]">{translateUi(module.subtitle)}</p>}
      <ol className="mt-4 divide-y divide-white/5">{module.lessons.map((lesson) => <li key={lesson.id} className="flex items-start gap-3 py-3 text-sm text-[#c2bdcc]"><Lock size={13} className="mt-1 shrink-0 text-[#a39bab]" /><span className="flex-1">{translateUi(lesson.title)}</span><span className="shrink-0 text-xs text-[#a39bab]">{translateUi(lesson.duration)}</span></li>)}</ol>
      <Link to="/planos" className="mt-3 inline-flex items-center gap-2 text-xs text-[#c1acff]">{translateUi("Ver acesso ao curso")}<ArrowRight size={13} /></Link>
    </details>)}</div></div>
}
