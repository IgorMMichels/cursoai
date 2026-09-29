import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CircleHelp, RotateCcw, Trophy } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { modules, allLessons } from '@/lib/course'
import { useSession } from '@/contexts/session-context'
import { getQuizResults, saveCertificate, saveQuizResult } from '@/lib/storage'

export function ModuleQuizPage() {
  const { moduleId = '' } = useParams()
  const module = modules.find((item) => item.id === moduleId)
  const { user, completedLessons } = useSession()
  const navigate = useNavigate()
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<number | null>(null)
  const [passed, setPassed] = useState(false)
  const [certificateUnlocked, setCertificateUnlocked] = useState(false)
  const [forceRetake, setForceRetake] = useState(false)

  if (!module) return <Navigate to="/curso" replace />
  const doneCount = module.lessons.filter((lesson) => completedLessons.includes(lesson.id)).length
  const nextModule = modules[modules.findIndex((item) => item.id === module.id) + 1]
  const allCourseLessonsDone = allLessons.every((lesson) => completedLessons.includes(lesson.id))
  const previousResult = getQuizResults()[module.id]

  const submitAnswer = () => {
    if (selected === null || revealed) return
    setRevealed(true)
  }

  const nextQuestion = () => {
    const correct = selected === module.quiz[questionIndex].answer
    const finalScore = score + (correct ? 1 : 0)
    if (questionIndex < module.quiz.length - 1) {
      setScore(finalScore)
      setQuestionIndex((current) => current + 1)
      setSelected(null)
      setRevealed(false)
      return
    }
    const isPassed = finalScore >= Math.ceil(module.quiz.length * 2 / 3)
    saveQuizResult(module.id, finalScore, module.quiz.length)
    setResult(finalScore)
    setPassed(isPassed)
    if (module.id === 'm7' && isPassed && allCourseLessonsDone && user) {
      saveCertificate(user.name)
      setCertificateUnlocked(true)
    }
  }

  const retake = () => { setForceRetake(true); setQuestionIndex(0); setSelected(null); setRevealed(false); setScore(0); setResult(null); setPassed(false); setCertificateUnlocked(false) }
  const goNext = () => nextModule ? navigate(`/curso/aula/${nextModule.id}/${nextModule.lessons[0].id}`) : navigate('/curso/certificado')
  const allLessonsReady = doneCount === module.lessons.length

  return <div className="mx-auto max-w-[800px]">
    <Link to="/curso#modulos" className="mb-7 inline-flex items-center gap-2 text-xs text-[#8a9c91] hover:text-white"><ArrowLeft size={14} />Voltar à trilha</Link>
    <div className="rounded-xl border border-white/[.08] bg-[#12121a] p-6 sm:p-9">
      <p className="eyebrow">módulo {module.number} · revisão</p><h1 className="mt-3 font-display text-3xl font-medium tracking-[-.05em] text-[#eaf2ec]">{module.title}</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-[#8fa197]">{module.subtitle} Confira o que ficou e veja explicações para cada resposta.</p>
      {!allLessonsReady && result === null ? <div className="mt-8 rounded-2xl border border-[#e4bc76]/20 bg-[#e4bc76]/[.045] p-5"><p className="text-sm font-medium text-[#e9d3a5]">Ainda faltam {module.lessons.length - doneCount} aulas deste módulo.</p><p className="mt-1 text-xs text-[#a69a7d]">Complete a trilha antes do quiz para revisar o conteúdo na ordem certa.</p><div className="mt-4 space-y-2">{module.lessons.filter((lesson) => !completedLessons.includes(lesson.id)).map((lesson) => <Link key={lesson.id} to={`/curso/aula/${module.id}/${lesson.id}`} className="flex items-center justify-between rounded-xl border border-white/[.06] bg-black/[.12] px-3 py-3 text-xs text-[#c5d0c8] hover:border-[#a78bfa]/20"><span>{lesson.title}</span><ArrowRight size={13} className="text-[#a78bfa]" /></Link>)}</div></div> : result !== null ? <div className="mt-8 rounded-xl border border-[#a78bfa]/15 bg-[#a78bfa]/[.045] p-6 sm:p-8"><div className="grid size-11 place-items-center rounded-full bg-[#a78bfa]/[.1] text-[#a78bfa]">{passed ? <Trophy size={20} /> : <CircleHelp size={20} />}</div><h2 className="mt-5 font-display text-2xl font-medium tracking-[-.04em] text-[#e5efe8]">{passed ? 'Revisão concluída.' : 'Vamos reforçar alguns pontos.'}</h2><p className="mt-2 text-sm text-[#9dafA4]">Você acertou <strong className="text-[#dbe9df]">{result} de {module.quiz.length}</strong>. {passed ? 'A explicação fica disponível em cada resposta; siga quando quiser.' : 'Você precisa de duas respostas corretas para concluir o quiz.'}</p>
          {module.id === 'm7' && passed && !allCourseLessonsDone && <p className="mt-4 rounded-xl border border-[#e4bc76]/15 bg-[#e4bc76]/[.04] p-3 text-xs leading-relaxed text-[#c9b888]">Conclua todas as aulas da trilha para liberar o certificado de conclusão.</p>}
          {certificateUnlocked && <Link to="/curso/certificado" className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#a78bfa]/20 bg-[#a78bfa]/[.08] px-4 py-3 text-xs font-medium text-[#c1acff]">Seu certificado está pronto <ArrowRight size={14} /></Link>}
          <div className="mt-7 flex flex-wrap gap-3">{passed && nextModule && <Button onClick={goNext} className="h-11 rounded-full bg-[#a78bfa] px-5 text-xs font-semibold text-[#09090d] hover:bg-[#c1acff]">Ir para o próximo módulo <ArrowRight size={14} /></Button>}{passed && !nextModule && <Button onClick={goNext} className="h-11 rounded-full bg-[#a78bfa] px-5 text-xs font-semibold text-[#09090d] hover:bg-[#c1acff]">Ver certificado <ArrowRight size={14} /></Button>}<button type="button" onClick={retake} className="inline-flex h-11 items-center gap-2 rounded-full border border-white/[.1] px-4 text-xs text-[#a9b8af] hover:bg-white/[.035]"><RotateCcw size={13} />Refazer</button></div>
        </div> : previousResult?.passed && !forceRetake ? <div className="mt-8 rounded-2xl border border-[#a78bfa]/15 bg-[#a78bfa]/[.045] p-5"><div className="flex items-start gap-3"><Check size={16} className="mt-0.5 text-[#a78bfa]" /><div className="flex-1"><p className="text-sm font-medium text-[#dce9e0]">Quiz deste módulo concluído</p><p className="mt-1 text-xs text-[#90a398]">Resultado anterior: {previousResult.score} de {module.quiz.length}.</p></div><button type="button" onClick={retake} className="text-xs text-[#b49cff] hover:text-white">Refazer</button></div><button type="button" onClick={() => nextModule ? navigate(`/curso/aula/${nextModule.id}/${nextModule.lessons[0].id}`) : navigate('/curso/certificado')} className="mt-4 inline-flex items-center gap-2 text-xs text-[#c1acff]">Continuar trilha <ArrowRight size={14} /></button></div> : <div className="mt-8">
        <div className="mb-5 flex items-center justify-between text-xs"><span className="text-[#8ea197]">Pergunta {questionIndex + 1} de {module.quiz.length}</span><span className="text-[#74877d]">{score} certas até aqui</span></div><div className="mb-7 h-1 overflow-hidden rounded-full bg-white/[.08]"><div className="h-full rounded-full bg-[#a78bfa] transition-[width]" style={{ width: `${((questionIndex + 1) / module.quiz.length) * 100}%` }} /></div>
        <h2 className="max-w-2xl font-display text-xl font-medium leading-relaxed tracking-[-.03em] text-[#e8f0ea]">{module.quiz[questionIndex].question}</h2><div className="mt-5 space-y-2.5">{module.quiz[questionIndex].options.map((option, index) => <button key={option} type="button" disabled={revealed} aria-pressed={selected === index} onClick={() => setSelected(index)} className={`focus-ring flex w-full items-center gap-3 rounded-lg border px-4 py-3.5 text-left text-xs leading-relaxed transition-colors ${revealed && index === module.quiz[questionIndex].answer ? 'border-[#a78bfa]/30 bg-[#a78bfa]/[.06] text-[#e8e1f7]' : selected === index ? 'border-[#98abff]/30 bg-[#98abff]/[.05] text-[#dce4fa]' : 'border-white/[.07] bg-[#171820] text-[#aab8af] hover:border-white/[.13]'} disabled:cursor-default`}><span className="grid size-6 shrink-0 place-items-center rounded-full border border-white/[.14] text-[9px]">{revealed && index === module.quiz[questionIndex].answer ? <Check size={12} /> : String.fromCharCode(65 + index)}</span>{option}</button>)}</div>
        {revealed && <div className="mt-4 rounded-xl border border-white/[.07] bg-white/[.025] p-4"><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[#b49cff]">por que essa é a resposta</p><p className="mt-2 text-xs leading-relaxed text-[#9aaca2]">{module.quiz[questionIndex].explanation}</p></div>}
        <div className="mt-7 flex justify-end">{!revealed ? <Button onClick={submitAnswer} disabled={selected === null} className="h-11 rounded-full bg-[#a78bfa] px-5 text-xs font-semibold text-[#09090d] hover:bg-[#c1acff] disabled:opacity-40">Conferir resposta <ArrowRight size={14} /></Button> : <Button onClick={nextQuestion} className="h-11 rounded-full bg-[#dcebe1] px-5 text-xs font-semibold text-[#09090d] hover:bg-white">{questionIndex === module.quiz.length - 1 ? 'Ver resultado' : 'Próxima pergunta'} <ArrowRight size={14} /></Button>}</div>
      </div>}
    </div>
  </div>
}



