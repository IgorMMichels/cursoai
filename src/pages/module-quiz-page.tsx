import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CircleHelp, RotateCcw, Trophy, Volume2, VolumeX, X } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { modules, allLessons } from '@/lib/course'
import { useJourney } from '@/lib/use-journey'
import { useSession } from '@/contexts/session-context'
import { issueCourseCertificate, loadModuleQuiz, loadQuizAttempts, submitModuleQuiz, type QuizAttempt, type QuizQuestion, type QuizSubmission } from '@/lib/learning-service'
import { isQuizSoundsMuted, playQuizError, playQuizSuccess, setQuizSoundsMuted } from '@/lib/quiz-sounds'

export function ModuleQuizPage() {
  const { journeyId, moduleId = '' } = useParams()
  const { journey, loading: journeyLoading, error: journeyError } = useJourney(journeyId)
  const activeModules = journeyId ? journey?.modules ?? [] : modules
  const basePath = journeyId ? `/jornadas/${journeyId}` : '/curso'
  const module = activeModules.find((item) => item.id === moduleId)
  const { user, completedLessons } = useSession()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [attempts, setAttempts] = useState<Record<string, QuizAttempt>>({})
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [result, setResult] = useState<QuizSubmission | null>(null)
  const [certificateUnlocked, setCertificateUnlocked] = useState(false)
  const [forceRetake, setForceRetake] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [soundsMuted, setSoundsMuted] = useState(() => isQuizSoundsMuted())

  useEffect(() => {
    let active = true
    if (!module || !user) { setLoading(false); return }
    setLoading(true)
    Promise.all([loadModuleQuiz(module.id), loadQuizAttempts(user.id)])
      .then(([quiz, savedAttempts]) => {
        if (!active) return
        setQuestions(quiz)
        setAttempts(savedAttempts)
      })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar a revisão.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [module, user])

  if (journeyLoading) return <p role="status" className="text-xs text-[#8ca096]">Carregando jornada…</p>
  if (journeyError) return <p role="alert" className="text-xs text-rose-200">{journeyError}</p>
  if (!module) return <Navigate to={journeyId ? '/jornadas' : '/curso'} replace />
  const doneCount = module.lessons.filter((lesson) => completedLessons.includes(lesson.id)).length
  const nextModule = activeModules[activeModules.findIndex((item) => item.id === module.id) + 1]
  const allCourseLessonsDone = allLessons.every((lesson) => completedLessons.includes(lesson.id))
  const previousResult = attempts[module.id]

  const retake = () => {
    setForceRetake(true)
    setQuestionIndex(0)
    setSelected(null)
    setAnswers([])
    setResult(null)
    setCertificateUnlocked(false)
    setError('')
  }

  const goNext = () => nextModule ? navigate(`${basePath}/aula/${nextModule.id}/${nextModule.lessons[0].id}`) : navigate(journeyId ? basePath : '/curso/certificado')

  const toggleSounds = () => {
    setSoundsMuted((muted) => {
      setQuizSoundsMuted(!muted)
      return !muted
    })
  }

  const nextQuestion = async () => {
    if (selected === null || submitting) return
    const submittedAnswers = [...answers, selected]
    setAnswers(submittedAnswers)
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((current) => current + 1)
      setSelected(null)
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const submission = await submitModuleQuiz(module.id, submittedAnswers)
      setResult(submission)
      if (submission.passed) playQuizSuccess()
      else playQuizError()
      setAttempts((current) => ({ ...current, [module.id]: { moduleId: module.id, score: submission.score, total: submission.total, passed: submission.passed, createdAt: new Date().toISOString() } }))
      const allPassed = modules.every((item) => item.id === module.id ? submission.passed : attempts[item.id]?.passed)
      if (!journeyId && submission.passed && allCourseLessonsDone && allPassed) {
        await issueCourseCertificate()
        setCertificateUnlocked(true)
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível registrar suas respostas.')
    } finally {
      setSubmitting(false)
    }
  }

  const allLessonsReady = doneCount === module.lessons.length
  const currentQuestion = questions[questionIndex]

  return <div className="mx-auto max-w-[800px]">
    <Link to={journeyId ? basePath : '/curso#modulos'} aria-label="Voltar para o módulo" className="mb-7 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/[.1] bg-white/[.02] px-4 text-xs font-medium text-[#c5d1c8] transition-colors hover:border-[#a78bfa]/30 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a78bfa]"><ArrowLeft size={14} />Voltar</Link>
    <div className="rounded-xl border border-white/[.08] bg-[#12121a] p-6 sm:p-9">
      <div className="flex items-start justify-between gap-3"><div><p className="eyebrow">módulo {module.number} · revisão</p><h1 className="mt-3 font-display text-3xl font-medium tracking-[-.05em] text-[#eaf2ec]">{module.title}</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-[#8fa197]">{module.subtitle} Confira o que ficou e veja explicações para cada resposta.</p></div><button type="button" onClick={toggleSounds} aria-pressed={!soundsMuted} aria-label={soundsMuted ? 'Ativar sons da revisão' : 'Silenciar sons da revisão'} title={soundsMuted ? 'Ativar sons' : 'Silenciar sons'} className="grid size-9 shrink-0 place-items-center rounded-full border border-white/[.08] text-[#8ea197] transition-colors hover:bg-white/[.05] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a78bfa]">{soundsMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}</button></div>
      {!allLessonsReady && <div className="mt-8 rounded-2xl border border-[#e4bc76]/20 bg-[#e4bc76]/[.045] p-5"><p className="text-sm font-medium text-[#e9d3a5]">Ainda faltam {module.lessons.length - doneCount} aulas deste módulo.</p><p className="mt-1 text-xs text-[#a69a7d]">Complete a trilha antes da revisão.</p><div className="mt-4 space-y-2">{module.lessons.filter((lesson) => !completedLessons.includes(lesson.id)).map((lesson) => <Link key={lesson.id} to={`${basePath}/aula/${module.id}/${lesson.id}`} className="flex items-center justify-between rounded-xl border border-white/[.06] bg-black/[.12] px-3 py-3 text-xs text-[#c5d0c8] hover:border-[#a78bfa]/20"><span>{lesson.title}</span><ArrowRight size={13} className="text-[#a78bfa]" /></Link>)}</div></div>}
      {allLessonsReady && loading && <p className="mt-8 text-xs text-[#8fa197]" role="status">Carregando revisão…</p>}
      {error && <p role="alert" className="mt-5 rounded-xl border border-[#f28c9a]/20 bg-[#f28c9a]/[.06] p-4 text-xs leading-relaxed text-[#f2a8b2]">{error}</p>}
      {allLessonsReady && !loading && !error && result && <div className="mt-8 rounded-xl border border-[#a78bfa]/15 bg-[#a78bfa]/[.045] p-6 sm:p-8"><div className="grid size-11 place-items-center rounded-full bg-[#a78bfa]/[.1] text-[#a78bfa]">{result.passed ? <Trophy size={20} /> : <CircleHelp size={20} />}</div><h2 className="mt-5 font-display text-2xl font-medium tracking-[-.04em] text-[#e5efe8]">{result.passed ? 'Revisão concluída.' : 'Vamos reforçar alguns pontos.'}</h2><p className="mt-2 text-sm text-[#9dafA4]">Você acertou <strong className="text-[#dbe9df]">{result.score} de {result.total}</strong>. {result.passed ? 'A explicação de cada resposta está abaixo.' : 'Você precisa acertar pelo menos dois terços para concluir.'}</p>
        {module.id === 'm7' && result.passed && !allCourseLessonsDone && <p className="mt-4 rounded-xl border border-[#e4bc76]/15 bg-[#e4bc76]/[.04] p-3 text-xs leading-relaxed text-[#c9b888]">Conclua todas as aulas da trilha para liberar o certificado.</p>}
        <div className="mt-5 space-y-3">{result.feedback.map((item, index) => {
          const question = questions[index]
          const correctLetter = String.fromCharCode(65 + item.correct_option)
          const selectedLetter = String.fromCharCode(65 + item.selected)
          const correctText = question?.options[item.correct_option] ?? ''
          const selectedText = question?.options[item.selected] ?? ''
          return <div key={index} role="status" className={`rounded-xl border p-4 ${item.correct ? 'border-[#a78bfa]/30 bg-[#a78bfa]/[.05] shadow-[0_0_28px_rgba(167,139,250,.2)]' : 'border-[#f28c8c]/30 bg-[#f28c8c]/[.05] shadow-[0_0_28px_rgba(242,140,140,.18)]'}`}><div className="flex items-start gap-2.5">{item.correct ? <Check size={15} className="mt-0.5 shrink-0 text-[#a78bfa]" /> : <X size={15} className="mt-0.5 shrink-0 text-[#f28c8c]" />}<div className="min-w-0 flex-1"><p className="text-xs font-medium text-[#dce9e0]">{`Pergunta ${index + 1}: ${item.correct ? 'resposta certa' : 'não foi dessa vez'}`}</p>{question && <p className="mt-1 text-xs leading-relaxed text-[#8fa197]">{question.question}</p>}<p className="mt-2 text-xs leading-relaxed text-[#a9b8af]">Você marcou: <strong className={item.correct ? 'text-[#d9ccff]' : 'text-[#f3b8b8]'}>{selectedLetter}{selectedText ? ` — ${selectedText}` : ''}</strong></p>{!item.correct && <p className="mt-1 text-xs leading-relaxed text-[#a9b8af]">Resposta certa: <strong className="text-[#d9ccff]">{correctLetter}{correctText ? ` — ${correctText}` : ''}</strong></p>}<p className="mt-2 text-xs leading-relaxed text-[#90a398]">Por quê: {item.explanation}</p></div></div></div>
        })}</div>
        {certificateUnlocked && <Link to="/curso/certificado" className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#a78bfa]/20 bg-[#a78bfa]/[.08] px-4 py-3 text-xs font-medium text-[#c1acff]">Seu certificado está pronto <ArrowRight size={14} /></Link>}
        <div className="mt-7 flex flex-wrap gap-3">{result.passed && nextModule && <Button onClick={goNext} className="h-11 rounded-full bg-[#a78bfa] px-5 text-xs font-semibold text-[#09090d] shadow-[0_0_28px_rgba(167,139,250,.35)] transition-all hover:bg-[#c1acff] hover:shadow-[0_0_36px_rgba(167,139,250,.45)] active:translate-y-px">Ir para o próximo módulo <ArrowRight size={14} /></Button>}{result.passed && !nextModule && certificateUnlocked && <Button onClick={goNext} className="h-11 rounded-full bg-[#a78bfa] px-5 text-xs font-semibold text-[#09090d] shadow-[0_0_28px_rgba(167,139,250,.35)] transition-all hover:bg-[#c1acff] hover:shadow-[0_0_36px_rgba(167,139,250,.45)] active:translate-y-px">Ver certificado <ArrowRight size={14} /></Button>}<button type="button" onClick={retake} className="inline-flex h-11 items-center gap-2 rounded-full border border-white/[.1] px-4 text-xs font-medium text-[#a9b8af] transition-all hover:bg-white/[.035] hover:text-white active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a78bfa]"><RotateCcw size={13} />Refazer</button></div>
      </div>}
      {allLessonsReady && !loading && !error && !result && previousResult?.passed && !forceRetake && <div className="mt-8 rounded-2xl border border-[#a78bfa]/15 bg-[#a78bfa]/[.045] p-5"><div className="flex items-start gap-3"><Check size={16} className="mt-0.5 text-[#a78bfa]" /><div className="flex-1"><p className="text-sm font-medium text-[#dce9e0]">Revisão deste módulo concluída</p><p className="mt-1 text-xs text-[#90a398]">Resultado anterior: {previousResult.score} de {previousResult.total}.</p></div><button type="button" onClick={retake} className="text-xs text-[#b49cff] hover:text-white">Refazer</button></div><button type="button" onClick={goNext} className="mt-4 inline-flex items-center gap-2 text-xs text-[#c1acff]">Continuar trilha <ArrowRight size={14} /></button></div>}
      {allLessonsReady && !loading && !error && !result && !(previousResult?.passed && !forceRetake) && currentQuestion && <div className="mt-8">
        <div className="mb-5 flex items-center justify-between text-xs"><span className="text-[#8ea197]">Pergunta {questionIndex + 1} de {questions.length}</span><span className="text-[#74877d]">Respostas registradas após envio</span></div><div className="mb-7 h-1 overflow-hidden rounded-full bg-white/[.08]"><div className="h-full rounded-full bg-[#a78bfa] transition-[width]" style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div>
        <h2 className="max-w-2xl font-display text-xl font-medium leading-relaxed tracking-[-.03em] text-[#e8f0ea]">{currentQuestion.question}</h2><div className="mt-5 space-y-2.5">{currentQuestion.options.map((option, index) => <button key={option} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)} className={`focus-ring flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-xs leading-relaxed transition-all ${selected === index ? 'border-[#98abff]/40 bg-[#98abff]/[.07] text-[#dce4fa] shadow-[0_0_24px_rgba(152,171,255,.22)]' : 'border-white/[.07] bg-[#171820] text-[#aab8af] hover:border-white/[.13]'}`}><span className={`grid size-6 shrink-0 place-items-center rounded-full border text-[9px] ${selected === index ? 'border-[#98abff]/60 text-[#c3d0ff]' : 'border-white/[.14] text-[#8ea197]'}`}>{selected === index ? <Check size={12} /> : String.fromCharCode(65 + index)}</span>{option}</button>)}</div>
        <div className="mt-7 flex justify-end"><Button onClick={() => void nextQuestion()} disabled={selected === null || submitting} className="h-11 rounded-full bg-[#a78bfa] px-5 text-xs font-semibold text-[#09090d] shadow-[0_0_28px_rgba(167,139,250,.35)] transition-all hover:bg-[#c1acff] hover:shadow-[0_0_36px_rgba(167,139,250,.45)] active:translate-y-px disabled:shadow-none disabled:opacity-40">{submitting ? 'Registrando…' : questionIndex === questions.length - 1 ? 'Enviar revisão' : 'Próxima pergunta'} <ArrowRight size={14} /></Button></div>
      </div>}
    </div>
  </div>
}
