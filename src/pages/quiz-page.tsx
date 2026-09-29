import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Compass, LockKeyhole, ScanSearch, ShieldCheck, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Brand } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { saveQuizProfile, type QuizProfile } from '@/lib/storage'

type ProfileKey = 'explorador' | 'analista' | 'protetor'
type QuizChoice = { label: string; category: ProfileKey }
type QuizQuestion = { eyebrow: string; prompt: string; context: string; choices: QuizChoice[] }

const questions: QuizQuestion[] = [
  { eyebrow: 'começo de jornada', prompt: 'Quando um ativo chama sua atenção, qual é a primeira pergunta que aparece?', context: 'Não existe resposta certa. Queremos encontrar seu ponto de partida nos estudos.', choices: [
    { label: 'Que problema ele resolve e como a rede funciona?', category: 'explorador' },
    { label: 'Que dados confirmam a história do projeto?', category: 'analista' },
    { label: 'Como evitar um erro de custódia ou cair em um golpe?', category: 'protetor' }
  ] },
  { eyebrow: 'seu repertório', prompt: 'Qual assunto você gostaria de destravar primeiro?', context: 'Escolha a lacuna que mais gostaria de preencher agora.', choices: [
    { label: 'Blockchain, Bitcoin, tokens e carteiras', category: 'explorador' },
    { label: 'Oferta, liquidez, métricas e leitura de projetos', category: 'analista' },
    { label: 'Segurança, risco e proteção de acesso', category: 'protetor' }
  ] },
  { eyebrow: 'aprendizagem', prompt: 'Que tipo de aula ajuda você a entender melhor?', context: 'A trilha combina formatos diferentes, mas um pode ser seu melhor começo.', choices: [
    { label: 'Uma explicação curta com exemplo do dia a dia', category: 'explorador' },
    { label: 'Um roteiro de pesquisa com evidências para comparar', category: 'analista' },
    { label: 'Um passo a passo do que conferir antes de agir', category: 'protetor' }
  ] },
  { eyebrow: 'decisões melhores', prompt: 'O que você quer saber fazer depois de estudar?', context: 'O diagnóstico sugere por onde começar; não mede seu apetite ou perfil financeiro.', choices: [
    { label: 'Explicar com clareza o que estou estudando', category: 'explorador' },
    { label: 'Separar evidências de narrativa', category: 'analista' },
    { label: 'Reconhecer riscos antes de autorizar uma operação', category: 'protetor' }
  ] },
]

const profileInfo: Record<ProfileKey, QuizProfile & { title: string; detail: string; icon: typeof Compass; color: string }> = {
  explorador: { name: 'explorador', title: 'Explorador de fundamentos', description: 'Você quer entender o que existe por trás dos nomes e termos do mercado.', detail: 'A trilha começa em blockchain, Bitcoin, tokens e carteiras. Você vai construir vocabulário antes de comparar projetos.', nextStep: 'Comece pelo módulo 1 e salve os termos que quiser rever.', icon: Compass, color: 'mint' },
  analista: { name: 'analista', title: 'Leitor de evidências', description: 'Seu interesse está em pesquisar projetos, comparar dados e testar hipóteses.', detail: 'Você vai gostar dos módulos de análise, oferta, liquidez e rotina de pesquisa. Os fundamentos continuam disponíveis se quiser voltar.', nextStep: 'Comece pelo módulo 3 e siga o roteiro de análise.', icon: ScanSearch, color: 'blue' },
  protetor: { name: 'guardião de decisões', title: 'Guardião de decisões', description: 'Você quer colocar a segurança e o controle de risco no centro do aprendizado.', detail: 'A trilha dá atenção especial a custódia, golpes, risco e autocuidado antes de qualquer decisão.', nextStep: 'Comece pelo módulo 5 e monte sua lista de segurança.', icon: ShieldCheck, color: 'amber' },
}

export function QuizPage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<(ProfileKey | null)[]>(Array(questions.length).fill(null))
  const navigate = useNavigate()
  const result = useMemo(() => {
    if (step < questions.length) return null
    const scores: Record<ProfileKey, number> = { explorador: 0, analista: 0, protetor: 0 }
    answers.forEach((answer) => { if (answer) scores[answer] += 1 })
    const winner = (Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'explorador') as ProfileKey
    return profileInfo[winner]
  }, [answers, step])
  const select = (choice: ProfileKey) => setAnswers((current) => current.map((value, index) => index === step ? choice : value))
  const next = () => {
    if (step < questions.length - 1) setStep((value) => value + 1)
    else {
      setStep(questions.length)
      const scores: Record<ProfileKey, number> = { explorador: 0, analista: 0, protetor: 0 }
      answers.forEach((answer) => { if (answer) scores[answer] += 1 })
      const winner = (Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'explorador') as ProfileKey
      saveQuizProfile(profileInfo[winner])
    }
  }
  const previous = () => setStep((value) => Math.max(0, value - 1))

  return <div className="min-h-screen bg-[#09090d] text-[#e6eee9]">
    <header className="border-b border-white/[.06]"><div className="page-shell flex h-[72px] items-center justify-between"><Brand /><Link to="/landing" className="text-xs text-[#8ea197] transition-colors hover:text-white">Ver o curso</Link></div></header>
    <main className="page-shell grid min-h-[calc(100vh-72px)] items-center gap-12 py-12 lg:grid-cols-[.65fr_1.35fr] lg:py-16">
      <aside className="hidden lg:block"><p className="eyebrow">diagnóstico de aprendizagem</p><h1 className="mt-4 max-w-md font-display text-4xl font-medium leading-[1.08] tracking-[-.06em] text-[#eaf2ec]">Seu ponto de partida, sem chute.</h1><p className="mt-5 max-w-sm text-sm leading-relaxed text-[#91a49a]">Responda quatro perguntas rápidas. O resultado sugere uma porta de entrada para estudar — não mede tolerância ao risco nem indica investimentos.</p><div className="mt-9 flex items-center gap-3 text-xs text-[#7f9287]"><LockKeyhole size={15} className="text-[#a78bfa]" />Sem e-mail. Sem recomendação financeira.</div></aside>
      <div className="mx-auto w-full max-w-[680px]">
        <div className="mb-7 flex items-center justify-between"><span className="rounded-full border border-white/[.08] bg-white/[.025] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[.13em] text-[#94a69c]">seu mapa de estudo</span><span className="text-xs text-[#81948a]">{step < questions.length ? `${step + 1} de ${questions.length}` : 'resultado'}</span></div>
        <Progress value={Math.min((step / questions.length) * 100, 100)} className="h-1 bg-white/[.08] [&_[data-slot=progress-indicator]]:bg-[#a78bfa]" />
        <AnimatePresence mode="wait">
          {result ? <motion.section key="result" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .28 }} className="mt-7 overflow-hidden rounded-xl border border-[#a78bfa]/20 bg-[linear-gradient(145deg,#191722,#12151c_72%)] p-6 sm:p-9">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.15em] text-[#c1acff]"><Sparkles size={14} />seu perfil de aprendizagem</div>
            <div className="mt-6 flex items-start gap-4"><div className={`grid size-12 shrink-0 place-items-center rounded-2xl ${result.color === 'blue' ? 'bg-[#98abff]/[.1] text-[#aab8ff]' : result.color === 'amber' ? 'bg-[#e4bc76]/[.1] text-[#e4bc76]' : 'bg-[#a78bfa]/[.1] text-[#a78bfa]'}`}><result.icon size={22} /></div><div><h2 className="font-display text-2xl font-medium tracking-[-.045em] text-[#edf4ef]">{result.title}</h2><p className="mt-2 text-sm leading-relaxed text-[#9aaca2]">{result.description}</p></div></div>
            <div className="mt-6 rounded-2xl border border-white/[.07] bg-black/[.12] p-5"><p className="text-sm leading-relaxed text-[#d0ddd4]">{result.detail}</p><p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-[#88a394]"><Check size={14} className="mt-0.5 shrink-0 text-[#a78bfa]" />{result.nextStep}</p></div>
            <div className="mt-7 flex flex-wrap items-center gap-3"><button type="button" onClick={() => navigate('/landing')} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#a78bfa] px-5 text-xs font-semibold text-[#09090d] transition-colors hover:bg-[#c1acff]">Ver a trilha completa <ArrowRight size={15} /></button><button type="button" onClick={() => { setAnswers(Array(questions.length).fill(null)); setStep(0) }} className="h-11 rounded-full px-4 text-xs text-[#91a49a] hover:text-white">Refazer o quiz</button></div>
            <p className="mt-5 text-[10px] text-[#6f8277]">Este quiz indica uma sequência de estudos, não seu perfil de investidor ou adequação de produtos.</p>
          </motion.section> : <motion.section key={`question-${step}`} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: .2 }} className="mt-7 rounded-xl border border-white/[.08] bg-[#12121a] p-6 sm:p-9">
            <p className="eyebrow">{questions[step].eyebrow}</p><h2 className="mt-4 max-w-xl font-display text-2xl font-medium leading-[1.18] tracking-[-.045em] text-[#e8f0ea] sm:text-[30px]">{questions[step].prompt}</h2><p className="mt-3 text-xs leading-relaxed text-[#889b90]">{questions[step].context}</p>
            <div className="mt-7 space-y-2.5" role="radiogroup" aria-label={questions[step].prompt}>{questions[step].choices.map((choice, index) => { const selected = answers[step] === choice.category; return <button type="button" role="radio" aria-checked={selected} key={choice.label} onClick={() => select(choice.category)} className={`focus-ring flex w-full items-center gap-3 rounded-xl border px-4 py-4 text-left text-sm transition-colors ${selected ? 'border-[#a78bfa]/40 bg-[#a78bfa]/[.07] text-[#f1edf8]' : 'border-white/[.075] bg-[#171820] text-[#b3c0b8] hover:border-white/[.15] hover:bg-white/[.035]'}`}><span className={`grid size-7 shrink-0 place-items-center rounded-full border text-[10px] ${selected ? 'border-[#a78bfa] bg-[#a78bfa] text-[#0a0910]' : 'border-white/[.16] text-[#71857a]'}`}>{selected ? <Check size={13} /> : String.fromCharCode(65 + index)}</span><span className="leading-relaxed">{choice.label}</span></button> })}</div>
            <div className="mt-8 flex items-center justify-between"><button type="button" onClick={previous} disabled={step === 0} className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-xs text-[#82958a] transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"><ArrowLeft size={14} />Anterior</button><Button onClick={next} disabled={!answers[step]} className="h-11 rounded-full bg-[#a78bfa] px-5 text-xs font-semibold text-[#09090d] hover:bg-[#c1acff] disabled:opacity-40">{step === questions.length - 1 ? 'Ver meu ponto de partida' : 'Continuar'}<ArrowRight size={14} /></Button></div>
          </motion.section>}
        </AnimatePresence>
        <p className="mt-5 flex items-center justify-center gap-2 text-[10px] text-[#71847a]"><LockKeyhole size={12} />Suas respostas ficam neste navegador nesta demonstração.</p>
      </div>
    </main>
  </div>
}




