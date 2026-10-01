import { ArrowRight, Lock, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import { modules } from '@/lib/course'
import { moduleCovers } from '@/lib/course-media'

export function CoursePreviewHero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/[.08] bg-[#0f1017]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(520px circle at 18% 0%, rgba(167,139,250,.14), transparent 65%), radial-gradient(420px circle at 90% 20%, rgba(112,217,239,.07), transparent 60%)',
        }}
      />
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
        <div>
          <p className="eyebrow">visão geral · acesso de visitante</p>
          <h1 className="display-lg mt-4 text-[#eef3ee]">Olá, futuro aluno.</h1>
          <p className="body-lg mt-4 max-w-xl text-[15px]">
            Esta é uma amostra da área do curso: nove módulos curtos, com aulas, exercícios e revisões.
            O conteúdo completo é liberado após a confirmação do plano.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/planos"
              className="button-motion inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#a78bfa] px-5 text-xs font-semibold text-[#09090d] shadow-[0_0_25px_rgba(167,139,250,.18)] hover:bg-[#c1acff]"
            >
              Ver planos de acesso <ArrowRight size={15} />
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.03] px-3 py-2 text-[11px] text-[#9aa39d]">
              <Lock size={12} className="text-[#a78bfa]" /> Amostra bloqueada
            </span>
          </div>
          <p className="mt-4 max-w-md text-[11px] leading-relaxed text-[#708279]">
            Material educacional sobre conceitos e rotina de estudo. Sem promessa de resultado financeiro.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-white/[.09] bg-[#14151d]">
          <div className="relative p-5 sm:p-6" aria-hidden>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#8d839f]">Continuar estudando</p>
                <p className="mt-2 font-display text-lg font-medium tracking-[-.03em] text-[#e8e4ee]">
                  Entenda o terreno
                </p>
              </div>
              <span className="rounded-full bg-[#a78bfa]/[.12] px-3 py-1 text-[10px] font-semibold text-[#c1acff]">
                Módulo 01
              </span>
            </div>
            <div className="mt-4 space-y-2.5 select-none" style={{ filter: 'blur(5px)', opacity: 0.75 }}>
              {['Uma rede que mantém o próprio livro-caixa', 'Bitcoin, ether e tokens: ativos diferentes', 'Carteiras, chaves e custódia'].map((lesson) => (
                <div key={lesson} className="flex items-center gap-3 rounded-lg border border-white/[.06] bg-white/[.02] px-3 py-2.5">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#a78bfa]/[.14] text-[#c1acff]">
                    <Play size={12} />
                  </span>
                  <span className="truncate text-xs text-[#c8c1d1]">{lesson}</span>
                  <span className="ml-auto text-[10px] text-[#777180]">7 min</span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute inset-0 grid place-items-center bg-[#09090d]/55 p-6 backdrop-blur-[2px]">
            <div className="flex max-w-xs flex-col items-center text-center">
              <span className="grid size-11 place-items-center rounded-full border border-[#a78bfa]/30 bg-[#a78bfa]/[.12] text-[#c1acff] shadow-[0_0_28px_rgba(167,139,250,.25)]">
                <Lock size={18} />
              </span>
              <p className="mt-3 font-display text-base font-medium tracking-[-.03em] text-white">Continue de onde parou</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[#a5a1b3]">
                Seu progresso, aulas e exercícios ficam disponíveis com um plano ativo.
              </p>
              <Link
                to="/planos"
                className="button-motion mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#a78bfa] px-5 text-xs font-semibold text-[#09090d] hover:bg-[#c1acff]"
              >
                Acessar conteúdo <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function LockedJourneysPreview() {
  return (
    <section aria-label="Módulos da trilha (amostra bloqueada)" className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">a trilha completa</p>
          <h2 className="mt-3 font-display text-2xl font-medium tracking-[-.04em] text-[#e8ece7] sm:text-3xl">
            Nove módulos para estudar no seu ritmo
          </h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.03] px-3 py-2 text-[11px] text-[#9aa39d]">
          <Lock size={12} className="text-[#a78bfa]" /> Prévia · conteúdo bloqueado
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => {
          const cover = moduleCovers[module.id]
          return (
            <article
              key={module.id}
              className="group relative flex min-h-[240px] flex-col justify-end overflow-hidden rounded-xl border border-white/[.08] bg-[#12121a]"
            >
              {cover && (
                <img
                  src={cover}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-45 saturate-[.9] contrast-[1.05] transition-transform duration-700 group-hover:scale-[1.03]"
                />
              )}
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#09090d] via-[#09090d]/72 to-[#09090d]/25" />
              <div className="image-grain pointer-events-none absolute inset-0" aria-hidden />

              <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-[#09090d]/60 px-2.5 py-1.5 text-[10px] font-semibold text-[#d6c9f3] backdrop-blur-md">
                <Lock size={11} className="text-[#a78bfa]" /> Bloqueado
              </span>

              <div className="relative p-5">
                <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#b49cff]">Módulo {module.number}</p>
                <h3 className="mt-2 font-display text-lg font-medium leading-tight tracking-[-.03em] text-white">
                  {module.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#b9b5c1]" style={{ textShadow: '0 1px 12px rgba(0,0,0,.7)' }}>
                  {module.subtitle}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-[#9aa39d]">
                  <span>{module.lessons.length} aulas · {module.duration}</span>
                  <Link
                    to="/planos"
                    className="inline-flex items-center gap-1.5 font-semibold text-[#c1acff] transition-colors hover:text-white"
                    aria-label={`Desbloquear módulo ${module.title} — ver planos`}
                  >
                    Desbloquear <ArrowRight size={13} />
                  </Link>
                </div>
              </div>

              <div aria-hidden className="absolute inset-x-0 top-0 h-10 bg-white/[.02] backdrop-blur-[1px]" style={{ maskImage: 'linear-gradient(to bottom, black, transparent)' }} />
            </article>
          )
        })}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-[#a78bfa]/20 bg-[#a78bfa]/[.05] p-6 text-center">
        <p className="max-w-xl text-xs leading-relaxed text-[#a5a1b3]">
          Gostou da amostra? Escolha um tempo de acesso e estude a trilha completa, com progresso salvo e revisões.
        </p>
        <Link
          to="/planos"
          className="button-motion inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#a78bfa] px-5 text-xs font-semibold text-[#09090d] hover:bg-[#c1acff]"
        >
          Acessar conteúdo <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  )
}
