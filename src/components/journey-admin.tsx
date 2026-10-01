import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { deleteJourney, deleteLesson, deleteModule, loadAdminJourneys, loadAdminLessonContent, reorder, saveJourney, saveLesson, saveLessonContent, saveModule } from '@/lib/journey-admin-service'
import type { Journey } from '@/lib/journeys'
import type { ProtectedLessonContent } from '@/lib/learning-service'

type Editing = { kind: 'journey' | 'module' | 'lesson' | 'content'; id?: string; parentId?: string; journeyId?: string }
const field = 'w-full min-h-11 rounded-lg border border-white/[.1] bg-[#0d0e14] px-3 text-xs text-[#e4ede6] outline-none focus:border-[#a78bfa]/50'
const button = 'inline-flex min-h-9 items-center gap-1 rounded-lg border border-white/[.1] px-2.5 text-[10px] text-[#afc0b3] hover:border-[#a78bfa]/30 hover:text-white disabled:opacity-40'

export function JourneyAdmin() {
  const [journeys, setJourneys] = useState<Journey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [form, setForm] = useState<Record<string, string | boolean | number>>({})
  const [json, setJson] = useState('')

  const refresh = async () => setJourneys(await loadAdminJourneys())
  useEffect(() => {
    let active = true
    loadAdminJourneys().then((items) => { if (active) setJourneys(items) }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar jornadas.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  const run = async (action: () => Promise<void>, message: string) => {
    setBusy(true); setError(''); setNotice('')
    try { await action(); await refresh(); setEditing(null); setNotice(message) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Ação falhou.') }
    finally { setBusy(false) }
  }
  const startJourney = (journey?: Journey) => {
    setEditing({ kind: 'journey', id: journey?.id })
    setForm({ id: journey?.id ?? '', title: journey?.title ?? '', shortDesc: journey?.shortDesc ?? '', longDesc: journey?.longDesc ?? '', icon: journey?.icon ?? 'BookOpen', color: journey?.color ?? 'mint', level: journey?.level ?? 'iniciante', coverUrl: journey?.coverUrl ?? '', published: journey?.published ?? false })
  }
  const startModule = (journey: Journey, module?: Journey['modules'][number]) => {
    setEditing({ kind: 'module', id: module?.id, parentId: journey.id })
    setForm({ id: module?.id ?? '', title: module?.title ?? '', subtitle: module?.subtitle ?? '', published: module?.published ?? false })
  }
  const startLesson = (module: Journey['modules'][number], lesson?: Journey['modules'][number]['lessons'][number]) => {
    setEditing({ kind: 'lesson', id: lesson?.id, parentId: module.id })
    setForm({ id: lesson?.id ?? '', title: lesson?.title ?? '', durationMinutes: Number(lesson?.duration.split(' ')[0] ?? 7), published: lesson?.published ?? false })
  }
  const startContent = async (lessonId: string) => {
    setEditing({ kind: 'content', id: lessonId }); setJson('Carregando…')
    try { setJson(JSON.stringify(await loadAdminLessonContent(lessonId) ?? { paragraphs: [], takeaway: '', sources: [], answerIndex: 0, exercise: { title: '', prompt: '', options: [], note: '' }, narration: { src: '', captionsSrc: '', transcript: '', summary: '', duration: 0, voice: '' } }, null, 2)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível carregar conteúdo.') }
  }
  const save = () => {
    if (!editing) return
    if (editing.kind === 'content') {
      let content: ProtectedLessonContent & { answerIndex?: number }
      try {
        content = JSON.parse(json) as ProtectedLessonContent & { answerIndex?: number }
        if (!Array.isArray(content.paragraphs) || !content.exercise?.prompt || !Array.isArray(content.exercise.options) || !content.narration?.transcript || !Number.isInteger(content.answerIndex)) throw new Error('JSON precisa conter paragraphs, exercise, narration e answerIndex.')
      } catch (cause) { setError(cause instanceof Error ? cause.message : 'JSON inválido.'); return }
      const { answerIndex, ...protectedContent } = content
      void run(() => saveLessonContent(editing.id!, protectedContent, answerIndex!), 'Conteúdo salvo.')
      return
    }
    const id = String(form.id).trim().toLowerCase()
    const title = String(form.title).trim()
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id) || !title) { setError('Informe ID em letras minúsculas, números e hífens, além do título.'); return }
    if (editing.kind === 'journey') void run(() => saveJourney({ id, ordinal: journeys.find((item) => item.id === editing.id)?.ordinal ?? Math.max(0, ...journeys.map((item) => item.ordinal)) + 1, title, shortDesc: String(form.shortDesc), longDesc: String(form.longDesc), icon: String(form.icon), color: String(form.color), level: form.level as Journey['level'], coverUrl: String(form.coverUrl), published: Boolean(form.published) }, editing.id), 'Jornada salva.')
    if (editing.kind === 'module') {
      const parent = journeys.find((item) => item.id === editing.parentId)!
      void run(() => saveModule({ id, journeyId: parent.id, ordinal: parent.modules.find((item) => item.id === editing.id)?.ordinal ?? Math.max(0, ...parent.modules.map((item) => item.ordinal ?? 0)) + 1, title, subtitle: String(form.subtitle), published: Boolean(form.published) }, editing.id), 'Módulo salvo.')
    }
    if (editing.kind === 'lesson') {
      const parent = journeys.flatMap((item) => item.modules).find((item) => item.id === editing.parentId)!
      const minutes = Number(form.durationMinutes)
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 240) { setError('Duração deve ficar entre 1 e 240 minutos.'); return }
      void run(() => saveLesson({ id, moduleId: parent.id, ordinal: parent.lessons.find((item) => item.id === editing.id)?.ordinal ?? Math.max(0, ...parent.lessons.map((item) => item.ordinal ?? 0)) + 1, title, durationMinutes: minutes, published: Boolean(form.published) }, editing.id), 'Aula salva.')
    }
  }
  const remove = (kind: string, name: string, action: () => Promise<void>) => {
    if (!window.confirm(`Excluir ${kind} “${name}” e todo conteúdo vinculado? Esta ação é permanente.`)) return
    void run(action, `${kind} excluído.`)
  }
  const move = (table: 'journeys' | 'course_modules' | 'lessons', rows: { id: string; ordinal: number }[], index: number, offset: number) => {
    const target = rows[index + offset]
    if (target) void run(() => reorder(table, rows[index], target), 'Ordem atualizada.')
  }
  const control = (label: string, onClick: () => void, disabled = false) => <button type="button" disabled={busy || disabled} onClick={onClick} className={button}>{label}</button>
  const moves = (table: 'journeys' | 'course_modules' | 'lessons', rows: { id: string; ordinal: number }[], index: number) => <span className="inline-flex gap-1"><button type="button" disabled={busy || index === 0} onClick={() => move(table, rows, index, -1)} aria-label="Mover para cima" className={button}><ArrowUp size={13} /></button><button type="button" disabled={busy || index === rows.length - 1} onClick={() => move(table, rows, index, 1)} aria-label="Mover para baixo" className={button}><ArrowDown size={13} /></button></span>

  return <section className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-xl text-[#e8f0ea]">Catálogo de jornadas</h2><p className="mt-1 text-xs text-[#829589]">Jornada → módulos → aulas. Rascunhos ficam ocultos para alunos.</p></div><button type="button" onClick={() => startJourney()} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#a78bfa] px-4 text-xs font-semibold text-[#09090d]"><Plus size={15} />Nova jornada</button></div>
    {error && <p role="alert" className="rounded-lg border border-rose-300/20 bg-rose-300/[.04] p-3 text-xs text-rose-200">{error}</p>}{notice && <p role="status" className="text-xs text-[#b49cff]">{notice}</p>}{loading && <p role="status" className="text-xs text-[#8fa197]">Carregando…</p>}
    {editing && <form onSubmit={(event) => { event.preventDefault(); save() }} className="rounded-xl border border-[#a78bfa]/25 bg-[#14131d] p-5"><h3 className="mb-4 font-display text-lg text-[#e8f0ea]">{editing.kind === 'content' ? 'Conteúdo protegido' : `${editing.id ? 'Editar' : 'Criar'} ${editing.kind === 'journey' ? 'jornada' : editing.kind === 'module' ? 'módulo' : 'aula'}`}</h3>{editing.kind === 'content' ? <textarea value={json} onChange={(event) => setJson(event.target.value)} rows={18} className={`${field} font-mono leading-relaxed`} aria-label="JSON do conteúdo da aula" /> : <div className="grid gap-3 sm:grid-cols-2"><label className="text-[10px] text-[#aebcb1]">ID / slug<input required value={String(form.id)} onChange={(event) => setForm({ ...form, id: event.target.value })} className={`mt-1 ${field}`} /></label><label className="text-[10px] text-[#aebcb1]">Título<input required value={String(form.title)} onChange={(event) => setForm({ ...form, title: event.target.value })} className={`mt-1 ${field}`} /></label>{editing.kind === 'journey' && <><label className="text-[10px] text-[#aebcb1]">Descrição curta<input value={String(form.shortDesc)} onChange={(event) => setForm({ ...form, shortDesc: event.target.value })} className={`mt-1 ${field}`} /></label><label className="text-[10px] text-[#aebcb1]">Ícone Lucide<input value={String(form.icon)} onChange={(event) => setForm({ ...form, icon: event.target.value })} className={`mt-1 ${field}`} /></label><label className="text-[10px] text-[#aebcb1]">Cor<select value={String(form.color)} onChange={(event) => setForm({ ...form, color: event.target.value })} className={`mt-1 ${field}`}><option value="mint">Mint</option><option value="blue">Blue</option><option value="lilac">Lilac</option></select></label><label className="text-[10px] text-[#aebcb1]">Nível<select value={String(form.level)} onChange={(event) => setForm({ ...form, level: event.target.value })} className={`mt-1 ${field}`}><option value="iniciante">Iniciante</option><option value="intermediario">Intermediário</option><option value="avancado">Avançado</option></select></label><label className="text-[10px] text-[#aebcb1]">URL da capa<input value={String(form.coverUrl)} onChange={(event) => setForm({ ...form, coverUrl: event.target.value })} className={`mt-1 ${field}`} /></label><label className="text-[10px] text-[#aebcb1] sm:col-span-2">Descrição longa<textarea value={String(form.longDesc)} onChange={(event) => setForm({ ...form, longDesc: event.target.value })} rows={3} className={`mt-1 ${field}`} /></label></>}{editing.kind === 'module' && <label className="text-[10px] text-[#aebcb1] sm:col-span-2">Subtítulo<input value={String(form.subtitle)} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} className={`mt-1 ${field}`} /></label>}{editing.kind === 'lesson' && <label className="text-[10px] text-[#aebcb1]">Duração em minutos<input type="number" min="1" max="240" value={Number(form.durationMinutes)} onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })} className={`mt-1 ${field}`} /></label>}<label className="flex min-h-11 items-center gap-2 text-xs text-[#becbbf]"><input type="checkbox" checked={Boolean(form.published)} onChange={(event) => setForm({ ...form, published: event.target.checked })} />Publicado / disponível</label></div>}<div className="mt-4 flex gap-2"><button type="submit" disabled={busy} className="min-h-10 rounded-full bg-[#a78bfa] px-5 text-xs font-semibold text-[#09090d] disabled:opacity-40">{busy ? 'Salvando…' : 'Salvar'}</button>{control('Cancelar', () => setEditing(null))}</div></form>}
    {journeys.map((journey, index) => <div key={journey.id} className="rounded-xl border border-white/[.07] bg-[#12121a] p-4 sm:p-5"><div className="flex flex-wrap items-center gap-3"><button type="button" onClick={() => setExpanded(expanded === journey.id ? null : journey.id)} className="inline-flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left"><span className="text-[#a78bfa]">{expanded === journey.id ? <ChevronDown size={17} /> : <ChevronRight size={17} />}</span><span className="min-w-0"><strong className="block truncate text-sm text-[#e1ebe3]">{journey.title}</strong><span className="text-[10px] text-[#84978a]">{journey.modules.length} módulos · {journey.modules.reduce((sum, module) => sum + module.lessons.length, 0)} aulas · {journey.published ? 'publicada' : 'rascunho'}</span></span></button>{moves('journeys', journeys, index)}{control('Editar', () => startJourney(journey))}{control(journey.published ? 'Despublicar' : 'Publicar', () => void run(() => saveJourney({ ...journey, published: !journey.published }, journey.id), 'Publicação atualizada.'))}{control('Excluir', () => remove('Jornada', journey.title, () => deleteJourney(journey)))}</div>{expanded === journey.id && <div className="mt-4 space-y-3 border-t border-white/[.06] pt-4"><button type="button" onClick={() => startModule(journey)} className={button}><Plus size={12} />Adicionar módulo</button>{journey.modules.map((module, moduleIndex) => <div key={module.id} className={`rounded-lg border border-white/[.06] bg-[#0d0e14] p-3 ${!module.published ? 'opacity-60' : ''}`}><div className="flex flex-wrap items-center gap-2"><span className="min-w-0 flex-1 text-xs text-[#d2dfd5]">{module.number}. {module.title} <span className="text-[#788b80]">· {module.lessons.length} aulas</span></span>{moves('course_modules', journey.modules.map((item, ordinal) => ({ id: item.id, ordinal: item.ordinal ?? ordinal + 1 })), moduleIndex)}{control('Editar', () => startModule(journey, module))}{control(module.published ? 'Ocultar' : 'Publicar', () => void run(() => saveModule({ id: module.id, journeyId: journey.id, ordinal: module.ordinal ?? moduleIndex + 1, title: module.title, subtitle: module.subtitle, published: !module.published }, module.id), 'Módulo atualizado.'))}{control('Excluir', () => remove('Módulo', module.title, () => deleteModule(module)))}</div><div className="mt-3 space-y-2 border-t border-white/[.05] pt-3"><button type="button" onClick={() => startLesson(module)} className={button}><Plus size={12} />Adicionar aula</button>{module.lessons.map((lesson, lessonIndex) => <div key={lesson.id} className={`flex flex-wrap items-center gap-2 rounded-lg border border-white/[.05] px-3 py-2 ${!lesson.published ? 'opacity-60' : ''}`}><span className="min-w-0 flex-1 text-xs text-[#afc0b3]">{lessonIndex + 1}. {lesson.title} · {lesson.duration}</span>{moves('lessons', module.lessons.map((item, ordinal) => ({ id: item.id, ordinal: item.ordinal ?? ordinal + 1 })), lessonIndex)}{control('Conteúdo', () => void startContent(lesson.id))}{control('Editar', () => startLesson(module, lesson))}{control(lesson.published ? 'Ocultar' : 'Publicar', () => void run(() => saveLesson({ id: lesson.id, moduleId: module.id, ordinal: lesson.ordinal ?? lessonIndex + 1, title: lesson.title, durationMinutes: Number(lesson.duration.split(' ')[0]), published: !lesson.published }, lesson.id), 'Aula atualizada.'))}{control('Excluir', () => remove('Aula', lesson.title, () => deleteLesson(lesson.id)))}</div>)}</div></div>)}</div>}</div>)}
  </section>
}
