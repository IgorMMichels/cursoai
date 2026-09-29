import { useState } from 'react'
import { ArrowLeft, Check, LockKeyhole, RotateCcw, Shield, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

const items = [
  { id: 'auth', label: 'Ative 2FA com aplicativo autenticador ou chave física.', note: 'Evite depender só de SMS quando houver alternativa.' },
  { id: 'password', label: 'Use uma senha única e um gerenciador confiável.', note: 'Não reutilize a senha do e-mail principal.' },
  { id: 'domain', label: 'Acesse exchanges e carteiras por endereços salvos por você.', note: 'Não confie em links de mensagens, anúncios ou comentários.' },
  { id: 'recovery', label: 'Mantenha a frase de recuperação offline e protegida.', note: 'Nunca a compartilhe ou a digite em sites de suporte.' },
  { id: 'network', label: 'Revise rede, endereço e memo antes de transferir.', note: 'Faça teste de valor baixo e confira a confirmação.' },
  { id: 'permissions', label: 'Revise conexões e permissões de contratos inteligentes.', note: 'Remova as que não usa; revogar não reverte transferências antigas.' },
  { id: 'device', label: 'Mantenha dispositivos e aplicativos atualizados.', note: 'Instale carteiras apenas por fontes oficiais.' },
]

const key = 'cripto-mentoria:security-checklist'
const load = () => { try { return JSON.parse(localStorage.getItem(key) ?? '[]') as string[] } catch { return [] } }

export function SecurityPage() {
  const [checked, setChecked] = useState<string[]>(load)
  const toggle = (id: string) => setChecked((current) => { const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]; localStorage.setItem(key, JSON.stringify(next)); return next })
  const reset = () => { setChecked([]); localStorage.removeItem(key) }
  return <div className="security-page mx-auto max-w-[1100px]">
    <Link to="/curso" className="mb-7 inline-flex items-center gap-2 text-xs text-[#8da096] hover:text-white"><ArrowLeft size={14} />Voltar à visão geral</Link>
    <div className="mb-8 flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-[#a78bfa]/15 bg-[#a78bfa]/[.08] text-[#a78bfa]"><ShieldCheck size={22} /></span><div><p className="eyebrow">ferramenta prática</p><h1 className="mt-2 font-display text-3xl font-medium tracking-[-.05em] text-[#eaf2ec]">Sua rotina de segurança.</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-[#8fa197]">Marque cada controle que você já revisou. Este checklist fica salvo somente neste navegador de demonstração.</p></div></div>
    <div className="mb-4 flex items-center justify-between rounded-xl border border-white/[.07] bg-[#12121a] px-4 py-3"><div className="flex items-center gap-2 text-xs text-[#a2b2a8]"><Shield size={14} className="text-[#a78bfa]" />{checked.length} de {items.length} itens revisados</div><button type="button" onClick={reset} className="inline-flex items-center gap-1.5 text-[10px] text-[#81948a] hover:text-white"><RotateCcw size={12} />Limpar</button></div>
    <div className="security-bento">{items.map((item) => { const done = checked.includes(item.id); return <button key={item.id} type="button" onClick={() => toggle(item.id)} aria-pressed={done} className={`focus-ring flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-colors ${done ? 'border-[#a78bfa]/20 bg-[#a78bfa]/[.04]' : 'border-white/[.07] bg-[#12121a] hover:border-white/[.14]'}`}><span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border ${done ? 'border-[#a78bfa] bg-[#a78bfa] text-[#09090d]' : 'border-white/[.2] text-transparent'}`}>{done && <Check size={13} />}</span><span><span className={`block text-sm ${done ? 'text-[#d9e9de]' : 'text-[#c1cdc5]'}`}>{item.label}</span><span className="mt-1.5 block text-xs leading-relaxed text-[#809389]">{item.note}</span></span></button> })}</div>
    <div className="mt-6 flex gap-3 rounded-xl border border-[#e4bc76]/15 bg-[#e4bc76]/[.04] p-4"><LockKeyhole size={15} className="mt-0.5 shrink-0 text-[#e4bc76]" /><p className="text-xs leading-relaxed text-[#aa9b78]">Nunca digite ou salve sua frase de recuperação em formulários, fotos, arquivos compartilhados ou neste checklist. A lista não pede segredos.</p></div>
  </div>
}


