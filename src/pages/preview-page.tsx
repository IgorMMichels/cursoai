import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, LayoutDashboard, Map, ShieldCheck, WalletCards } from 'lucide-react'
import { Brand } from '@/components/brand'
import { CoursePreviewHero, LockedJourneysPreview } from '@/components/course-preview'

/**
 * Página pública de preview (/explorar).
 * 100% estática: sem sessão, sem Supabase, sem fetch de dados.
 * Reutiliza CoursePreviewHero + LockedJourneysPreview (componentes estáticos).
 * Shell próprio simples — não usa CourseLayout (que depende de useSession/ProfileSettings/sair).
 */
const previewNav = [
  { label: 'Visão geral', icon: LayoutDashboard, active: true },
  { label: 'Jornadas', icon: Map, active: false },
  { label: 'Minha trilha', icon: BookOpen, active: false },
  { label: 'Como pagar', icon: WalletCards, active: false },
  { label: 'Central de segurança', icon: ShieldCheck, active: false },
]

export function PreviewPage() {
  return (
    <div className="min-h-screen bg-[#09090d] lg:grid lg:grid-cols-[252px_minmax(0,1fr)]">
      <aside className="hidden border-r border-white/[.07] bg-[#0d0e14] lg:flex lg:flex-col">
        <div className="px-6 pb-7 pt-6">
          <Brand />
        </div>
        <div className="px-4">
          <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[.16em] text-[#687b70]">
            Aprender
          </p>
          <nav className="space-y-1" aria-label="Prévia da área do aluno">
            {previewNav.map(({ label, icon: Icon, active }) => (
              <span
                key={label}
                title="Disponível com um plano ativo"
                className={`flex cursor-default items-center gap-3 rounded-xl px-3 py-3 text-[13px] ${
                  active
                    ? 'bg-[#a78bfa]/[.1] text-[#e6dcff]'
                    : 'text-[#8ea197]'
                }`}
              >
                <Icon size={17} strokeWidth={1.7} />
                {label}
              </span>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <Link
            to="/planos"
            className="button-motion flex h-11 items-center justify-center gap-2 rounded-xl bg-[#a78bfa] px-4 text-xs font-semibold text-[#09090d] hover:bg-[#c1acff]"
          >
            Começar agora <ArrowRight size={14} />
          </Link>
          <p className="mt-3 px-1 text-center text-[10px] leading-relaxed text-[#687b70]">
            Prévia pública — sem login
          </p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between gap-3 border-b border-white/[.07] bg-[#09090d]/85 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <Brand compact />
            </div>
            <span className="hidden items-center gap-2 text-xs text-[#7f9287] lg:flex">
              Prévia pública <span className="text-[#c6d4cb]">· 9 módulos</span>
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/login" className="text-xs text-[#b1abbc] transition-colors hover:text-white">
              Entrar
            </Link>
            <Link
              to="/planos"
              className="button-motion inline-flex min-h-9 items-center justify-center rounded-xl bg-[#b49cff] px-4 text-xs font-semibold text-[#100c19] hover:bg-[#c6b4ff]"
            >
              Começar agora
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1450px] px-4 pb-20 pt-7 sm:px-7 sm:pt-9 lg:px-10">
          <CoursePreviewHero />
          <LockedJourneysPreview />
          <section className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-white/[.07] bg-[#12121a] p-8 text-center sm:p-10">
            <p className="eyebrow">pronto quando você estiver</p>
            <h2 className="max-w-xl font-display text-2xl font-medium tracking-[-.04em] text-[#eef3ee] sm:text-3xl">
              Veja a trilha por dentro, entre quando fizer sentido
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-[#90a298]">
              Esta prévia é aberta e não precisa de conta. Para salvar progresso e
              desbloquear aulas, escolha um tempo de acesso.
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/planos"
                className="button-motion inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#a78bfa] px-6 text-xs font-semibold text-[#09090d] hover:bg-[#c1acff]"
              >
                Ver planos de acesso <ArrowRight size={15} />
              </Link>
              <Link
                to="/login"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/[.12] px-6 text-xs font-medium text-[#d9e3dc] transition-colors hover:bg-white/[.04] hover:text-white"
              >
                Já tenho conta
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
