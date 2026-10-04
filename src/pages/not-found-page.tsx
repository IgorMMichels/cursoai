import { motion } from 'framer-motion'
import { ArrowLeft, ArrowUpRight, Compass } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Brand } from '@/components/brand'

export function NotFoundPage() {
  const { pathname } = useLocation()
  return <main className="not-found-page min-h-screen overflow-hidden bg-[#09090d] text-[#e6eee9]">
    <div className="not-found-grid" aria-hidden="true" />
    <div className="page-shell relative z-10 flex min-h-screen flex-col py-6 sm:py-8">
      <header className="flex items-center justify-between"><Brand /><span className="not-found-status"><span /> rota indisponível</span></header>
      <section className="not-found-main">
        <motion.div className="not-found-art" initial={{ opacity: 0, y: 20, rotateX: 9 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: .72, ease: [.16, 1, .3, 1] }} aria-hidden="true">
          <span className="not-found-number">404</span>
          <motion.div className="not-found-coin" animate={{ rotateY: [0, 360] }} transition={{ duration: 6, ease: 'linear', repeat: Infinity }}><span>₿</span></motion.div>
          <span className="not-found-orbit not-found-orbit-a" />
          <span className="not-found-orbit not-found-orbit-b" />
          <span className="not-found-signal"><i /><i /><i /></span>
        </motion.div>

        <motion.div className="not-found-copy" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .12, ease: [.16, 1, .3, 1] }}>
          <p className="eyebrow">404 · caminho não encontrado</p>
          <h1 className="display-lg mt-4 max-w-xl text-[#edf4ef]">Essa página saiu do bloco.</h1>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-[#9693a0]">O endereço pode ter mudado ou não existir. Volte ao início e continue pela trilha.</p>
          <p className="not-found-path">Endereço solicitado <code>{pathname}</code></p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/landing" className="button-motion not-found-primary"><ArrowLeft size={15} />Voltar ao início</Link>
            <Link to="/landing#jornada" className="button-motion not-found-secondary">Explorar módulos <ArrowUpRight size={15} /></Link>
          </div>
        </motion.div>
      </section>
      <footer className="not-found-footer"><Brand compact /><span>Omega · conteúdo educacional</span><Compass size={14} /></footer>
    </div>
  </main>
}
