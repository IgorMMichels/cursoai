import { translateUi } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ArrowUpRight, Home, SlidersHorizontal } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { LocalizedLink as Link } from '@/components/localized-router'
import { Brand } from '@/components/brand'
import { PageMeta } from '@/components/tools/page-meta'

export function NotFoundPage() {
  useUiTranslation();
  const { pathname } = useLocation()
  return <main className="not-found-page min-h-[100dvh] overflow-hidden bg-[#09090d] text-[#e6eee9]">
    <PageMeta title={translateUi("Página não encontrada")} description={translateUi("O endereço solicitado não existe. Volte ao início da Omega e continue sua jornada de aprendizado em cripto.")} path="/404" privatePage />
    <div className="page-shell relative z-10 flex min-h-[100dvh] flex-col py-5 sm:py-7">
      <header className="not-found-header"><Brand /><span className="not-found-status"><span /> {translateUi(" Rota não encontrada")}</span></header>
      <section className="not-found-main">
        <motion.div className="not-found-copy" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, ease: [.16, 1, .3, 1] }}>
          <p className="eyebrow">{translateUi("Omega ")}<span aria-hidden="true">/</span> {translateUi(" erro 404")}</p>
          <h1 className="display-lg mt-5 max-w-xl text-[#edf4ef]">{translateUi("Esse caminho não existe.")}</h1>
          <p className="not-found-description">{translateUi("O endereço pode estar incorreto ou ter mudado. Você ainda pode voltar ao curso ou abrir uma ferramenta.")}</p>
          <div className="not-found-actions">
            <Link to="/landing" className="button-motion not-found-primary"><Home size={15} strokeWidth={1.8} />{translateUi("Ir para o início")}</Link>
            <Link to="/ferramentas" className="button-motion not-found-secondary">{translateUi("Ver ferramentas ")}<ArrowUpRight size={15} strokeWidth={1.8} /></Link>
          </div>
          <p className="not-found-path"><span>{translateUi("ENDEREÇO SOLICITADO")}</span><code title={translateUi(pathname)}>{translateUi(pathname)}</code></p>
        </motion.div>
        <motion.div className="not-found-art" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .7, delay: .08, ease: [.16, 1, .3, 1] }} role="img" aria-label={translateUi("Visual do código de erro 404")}>
          <div className="not-found-art-head"><span className="not-found-art-mark">{translateUi("Ω")}</span><span>{translateUi("OMEGA ")}<i>·</i> {translateUi(" ROUTE STATUS")}</span><span className="not-found-art-code">{translateUi("0x194")}</span></div>
          <div className="not-found-art-display"><span>404</span><div className="not-found-trace"><svg viewBox="0 0 520 88" fill="none" aria-hidden="true"><path d="M2 47h100l26-27h72l22 44h64l22-22h67" /><path d="M379 42h42m18 0h78" /><circle cx="102" cy="47" r="3" /><circle cx="286" cy="64" r="3" /><circle cx="353" cy="42" r="3" /><circle cx="421" cy="42" r="3" /></svg><span><SlidersHorizontal size={14} /> {translateUi(" rota sem destino")}</span></div></div>
          <div className="not-found-art-foot"><span>{translateUi("STATUS")}</span><strong><i /> {translateUi(" NOT FOUND")}</strong><span>{translateUi("OMEGA LEARNING SYSTEM")}</span></div>
        </motion.div>
      </section>
      <footer className="not-found-footer"><Brand compact /><span>{translateUi("Método antes do mercado.")}</span><Link to="/explorar">{translateUi("Conheça o curso ")}<ArrowUpRight size={13} /></Link></footer>
    </div>
  </main>
}
