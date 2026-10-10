import { translateUi, getUiLocale } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { LocalizedNavigate as Navigate, LocalizedLink as Link } from '@/components/localized-router'
import { ArrowLeft, Award, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession } from '@/contexts/session-context'
import { allLessons } from '@/lib/course'
import { loadCourseCertificate } from '@/lib/learning-service'

export function CertificatePage() {
  useUiTranslation();
  const { user } = useSession()
  const [certificate, setCertificate] = useState<Awaited<ReturnType<typeof loadCourseCertificate>>>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    if (!user) { setLoading(false); return }
    loadCourseCertificate(user.id)
      .then((value) => { if (active) setCertificate(value) })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o certificado.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user])

  if (!loading && !certificate && !error) return <Navigate to="/curso" replace />
  const date = certificate ? new Date(certificate.issuedAt).toLocaleDateString(getUiLocale(), { day: '2-digit', month: 'long', year: 'numeric' }) : ''
  return <div className="mx-auto max-w-[900px]">
    <Link to="/curso" className="no-print mb-7 inline-flex items-center gap-2 text-xs text-[#8da096] hover:text-white"><ArrowLeft size={14} />{translateUi("Voltar à visão geral")}</Link>
    {loading && <p className="text-xs text-[#8fa197]" role="status">{translateUi("Carregando certificado…")}</p>}
    {error && <p className="rounded-xl border border-[#f28c9a]/20 bg-[#f28c9a]/[.06] p-4 text-xs text-[#f2a8b2]" role="alert">{translateUi(error)}</p>}
    {certificate && <>
      <section className="certificate-paper relative overflow-hidden rounded-xl border border-[#a78bfa]/25 bg-[radial-gradient(ellipse_at_top_right,rgba(167,139,250,.12),transparent_48%),linear-gradient(145deg,#171621,#12121a)] p-8 text-center sm:p-14">
        <div className="absolute inset-4 rounded-xl border border-[#a78bfa]/10" />
        <div className="relative mx-auto grid size-14 place-items-center rounded-full border border-[#e4bc76]/30 bg-[#e4bc76]/[.08] text-[#e4bc76]"><Award size={26} /></div>
        <p className="relative mt-8 text-[10px] font-semibold uppercase tracking-[.2em] text-[#b49cff]">{translateUi("certificado de conclusão")}</p><h1 className="relative mt-4 font-display text-4xl font-medium tracking-[-.06em] text-[#eef5ef] sm:text-5xl">{translateUi("Cripto do Zero")}</h1>
        <p className="relative mx-auto mt-5 max-w-lg text-sm leading-relaxed text-[#a6b7ac]">{translateUi("Certificamos que")}</p><p className="relative mt-3 font-display text-2xl font-medium text-[#e5eee7]">{certificate.name || user?.name}</p>
        <p className="relative mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#a6b7ac]">{translateUi("concluiu a trilha educativa de ")}{translateUi(allLessons.length)} {translateUi(" aulas sobre fundamentos, pesquisa, segurança, riscos e organização de estudos em criptoativos.")}</p>
        <div className="relative mx-auto mt-8 flex max-w-md items-center justify-center gap-8 border-t border-white/[.09] pt-5 text-left"><div><p className="text-[9px] uppercase tracking-[.12em] text-[#6f8478]">{translateUi("conclusão")}</p><p className="mt-1 text-xs text-[#c4d2c9]">{translateUi(date)}</p></div><div className="h-7 w-px bg-white/[.1]" /><div><p className="text-[9px] uppercase tracking-[.12em] text-[#6f8478]">{translateUi("código")}</p><p className="mt-1 font-mono text-xs text-[#c4d2c9]">{translateUi(certificate.code)}</p></div></div>
        <p className="relative mx-auto mt-8 max-w-xl text-[10px] leading-relaxed text-[#71857a]">{translateUi("Este certificado registra a conclusão de conteúdo educativo. Não atesta habilitação profissional, desempenho de investimento ou recomendação financeira.")}</p>
      </section>
      <div className="no-print mt-5 flex flex-wrap items-center justify-between gap-4"><p className="text-xs text-[#81948a]">{translateUi("Você pode salvar ou imprimir este certificado pelo navegador.")}</p><Button onClick={() => window.print()} className="h-10 rounded-full bg-[#a78bfa] px-5 text-xs font-semibold text-[#09090d] hover:bg-[#c1acff]"><Printer size={14} />{translateUi("Imprimir certificado")}</Button></div>
    </>}
  </div>
}
