import { translateUi } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { ArrowLeft, Check, LockKeyhole, RotateCcw, Shield, ShieldCheck } from 'lucide-react'
import { LocalizedLink as Link } from '@/components/localized-router'
import { loadSecurityChecklist, saveSecurityChecklist } from '@/lib/learning-service'

const items = [
  { id: 'auth', label: 'Ative 2FA com aplicativo autenticador ou chave física.', note: 'Evite depender só de SMS quando houver alternativa.' },
  { id: 'password', label: 'Use uma senha única e um gerenciador confiável.', note: 'Não reutilize a senha do e-mail principal.' },
  { id: 'domain', label: 'Acesse exchanges e carteiras por endereços salvos por você.', note: 'Não confie em links de mensagens, anúncios ou comentários.' },
  { id: 'recovery', label: 'Mantenha a frase de recuperação offline e protegida.', note: 'Nunca a compartilhe ou a digite em sites de suporte.' },
  { id: 'network', label: 'Revise rede, endereço e memo antes de transferir.', note: 'Faça teste de valor baixo e confira a confirmação.' },
  { id: 'permissions', label: 'Revise conexões e permissões de contratos inteligentes.', note: 'Remova as que não usa; revogar não reverte transferências antigas.' },
  { id: 'device', label: 'Mantenha dispositivos e aplicativos atualizados.', note: 'Instale carteiras apenas por fontes oficiais.' },
]

export function SecurityPage() {
  useUiTranslation();
  const [checked, setChecked] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    loadSecurityChecklist()
      .then((items) => { if (active) setChecked(items) })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o checklist.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  const toggle = async (id: string) => {
    if (saving) return
    const previous = checked
    const next = previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]
    setChecked(next); setSaving(true); setError('')
    try { await saveSecurityChecklist(next) }
    catch (cause) { setChecked(previous); setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a alteração.') }
    finally { setSaving(false) }
  }
  const reset = async () => {
    if (saving) return
    const previous = checked
    setChecked([]); setSaving(true); setError('')
    try { await saveSecurityChecklist([]) }
    catch (cause) { setChecked(previous); setError(cause instanceof Error ? cause.message : 'Não foi possível limpar o checklist.') }
    finally { setSaving(false) }
  }
  return <div className="security-page mx-auto max-w-[1100px]">
    <Link to="/curso" className="mb-7 inline-flex items-center gap-2 text-xs text-[#8da096] hover:text-white"><ArrowLeft size={14} />{translateUi("Voltar à visão geral")}</Link>
    <div className="mb-8 flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-[#a78bfa]/15 bg-[#a78bfa]/[.08] text-[#a78bfa]"><ShieldCheck size={22} /></span><div><p className="eyebrow">{translateUi("ferramenta prática")}</p><h1 className="mt-2 font-display text-3xl font-medium tracking-[-.05em] text-[#eaf2ec]">{translateUi("Sua rotina de segurança.")}</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-[#8fa197]">{translateUi("Marque cada controle que você já revisou. Seu checklist fica salvo na sua conta.")}</p></div></div>
    {loading ? <p className="mb-4 text-xs text-[#8fa197]" role="status">{translateUi("Carregando checklist…")}</p> : <div className="mb-4 flex items-center justify-between rounded-xl border border-white/[.07] bg-[#12121a] px-4 py-3"><div className="flex items-center gap-2 text-xs text-[#a2b2a8]"><Shield size={14} className="text-[#a78bfa]" />{translateUi(checked.length)} {translateUi(" de ")}{translateUi(items.length)} {translateUi(" itens revisados")}</div><button type="button" disabled={saving} onClick={() => void reset()} className="inline-flex items-center gap-1.5 text-[10px] text-[#81948a] hover:text-white disabled:opacity-50"><RotateCcw size={12} />{translateUi("Limpar")}</button></div>}
    {error && <p role="alert" className="mb-4 rounded-lg border border-[#f28c9a]/20 bg-[#f28c9a]/[.06] p-3 text-xs text-[#f2a8b2]">{translateUi(error)}</p>}
    <div className="security-bento">{items.map((item) => { const done = checked.includes(item.id); return <button key={item.id} type="button" disabled={loading || saving} onClick={() => void toggle(item.id)} aria-pressed={done} className={`focus-ring flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-colors disabled:opacity-60 ${done ? 'border-[#a78bfa]/20 bg-[#a78bfa]/[.04]' : 'border-white/[.07] bg-[#12121a] hover:border-white/[.14]'}`}><span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border ${done ? 'border-[#a78bfa] bg-[#a78bfa] text-[#09090d]' : 'border-white/[.2] text-transparent'}`}>{done && <Check size={13} />}</span><span><span className={`block text-sm ${done ? 'text-[#d9e9de]' : 'text-[#c1cdc5]'}`}>{translateUi(item.label)}</span><span className="mt-1.5 block text-xs leading-relaxed text-[#809389]">{translateUi(item.note)}</span></span></button> })}</div>
    <div className="mt-6 flex gap-3 rounded-xl border border-[#e4bc76]/15 bg-[#e4bc76]/[.04] p-4"><LockKeyhole size={15} className="mt-0.5 shrink-0 text-[#e4bc76]" /><p className="text-xs leading-relaxed text-[#aa9b78]">{translateUi("Nunca digite ou salve sua frase de recuperação em formulários, fotos, arquivos compartilhados ou neste checklist. A lista não pede segredos.")}</p></div>
  </div>
}


