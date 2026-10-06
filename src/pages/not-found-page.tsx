import { motion } from 'framer-motion'
import { ArrowUpRight, Home, SlidersHorizontal } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Brand } from '@/components/brand'
import { PageMeta } from '@/components/tools/page-meta'

export function NotFoundPage() {
  const { pathname } = useLocation()
  return <main className="not-found-page min-h-[100dvh] overflow-hidden bg-[#09090d] text-[#e6eee9]">
    <PageMeta title="Página não encontrada" description="O endereço solicitado não existe. Volte ao início da Omega e continue sua jornada de aprendizado em cripto." path="/404" privatePage />
    <div className="page-shell relative z-10 flex min-h-[100dvh] flex-col py-5 sm:py-7">
      <header className="not-found-header"><Brand /><span className="not-found-status"><span /> Rota não encontrada</span></header>
      <section className="not-found-main">
        <motion.div className="not-found-copy" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, ease: [.16, 1, .3, 1] }}>
          <p className="eyebrow">Omega <span aria-hidden="true">/</span> erro 404</p>
          <h1 className="display-lg mt-5 max-w-xl text-[#edf4ef]">Esse caminho não existe.</h1>
          <p className="not-found-description">O endereço pode estar incorreto ou ter mudado. Você ainda pode voltar ao curso ou abrir uma ferramenta.</p>
          <div className="not-found-actions">
            <Link to="/landing" className="button-motion not-found-primary"><Home size={15} strokeWidth={1.8} />Ir para o início</Link>
            <Link to="/ferramentas" className="button-motion not-found-secondary">Ver ferramentas <ArrowUpRight size={15} strokeWidth={1.8} /></Link>
          </div>
          <p className="not-found-path"><span>ENDEREÇO SOLICITADO</span><code title={pathname}>{pathname}</code></p>
        </motion.div>
        <motion.div className="not-found-art" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .7, delay: .08, ease: [.16, 1, .3, 1] }} role="img" aria-label="Visual do código de erro 404">
          <div className="not-found-art-head"><span className="not-found-art-mark">Ω</span><span>OMEGA <i>·</i> ROUTE STATUS</span><span className="not-found-art-code">0x194</span></div>
          <div className="not-found-art-display"><span>404</span><div className="not-found-trace"><svg viewBox="0 0 520 88" fill="none" aria-hidden="true"><path d="M2 47h100l26-27h72l22 44h64l22-22h67" /><path d="M379 42h42m18 0h78" /><circle cx="102" cy="47" r="3" /><circle cx="286" cy="64" r="3" /><circle cx="353" cy="42" r="3" /><circle cx="421" cy="42" r="3" /></svg><span><SlidersHorizontal size={14} /> rota sem destino</span></div></div>
          <div className="not-found-art-foot"><span>STATUS</span><strong><i /> NOT FOUND</strong><span>OMEGA LEARNING SYSTEM</span></div>
        </motion.div>
      </section>
      <footer className="not-found-footer"><Brand compact /><span>Método antes do mercado.</span><Link to="/explorar">Conheça o curso <ArrowUpRight size={13} /></Link></footer>
    </div>
  </main>
}
