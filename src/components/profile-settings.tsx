import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Camera, Check, ImagePlus, LoaderCircle, MapPin, Pencil, UserRound, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSession, planTitle } from '@/contexts/session-context'

type ProfileSettingsProps = { compact?: boolean }

async function prepareAvatar(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Use uma imagem JPG, PNG ou WebP.')
  }
  if (file.size > 8 * 1024 * 1024) throw new Error('A imagem precisa ter até 8 MB.')

  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Este navegador não conseguiu preparar a imagem.')
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 512, 512)
  bitmap.close()

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Não foi possível converter a imagem.')), 'image/webp', 0.82)
  })
  if (blob.size > 5 * 1024 * 1024) throw new Error('Imagem preparada ultrapassou 5 MB.')
  const preview = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Não foi possível abrir a imagem.'))
    reader.onerror = () => reject(new Error('Não foi possível abrir a imagem.'))
    reader.readAsDataURL(blob)
  })
  return { blob, preview }
}

export function ProfileSettings({ compact = false }: ProfileSettingsProps) {
  const { user, authConfigured, updateProfile } = useSession()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(user?.name ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [location, setLocation] = useState(user?.location ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl)
  const [avatarBlob, setAvatarBlob] = useState<Blob>()
  const [photoError, setPhotoError] = useState('')
  const [notice, setNotice] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (!open) return
    setName(user?.name ?? '')
    setBio(user?.bio ?? '')
    setLocation(user?.location ?? '')
    setAvatarUrl(user?.avatarUrl)
    setAvatarBlob(undefined)
    setPhotoError('')
    setNotice('')
  }, [open, user?.id])

  const pickPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    setPhotoError('')
    try {
      const prepared = await prepareAvatar(file)
      setAvatarUrl(prepared.preview)
      setAvatarBlob(prepared.blob)
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'Não foi possível preparar a imagem.')
    }
  }

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNotice('')
    if (!name.trim()) {
      setNotice('Informe seu nome para salvar o perfil.')
      return
    }
    setIsSaving(true)
    try {
      const result = await updateProfile({ name, bio, location, avatarDataUrl: avatarUrl }, avatarBlob)
      setNotice(result.synced ? 'Perfil atualizado no Supabase.' : `Perfil não foi salvo: ${result.error ?? 'Supabase indisponível.'}`)
      if (result.synced) setAvatarBlob(undefined)
    } finally {
      setIsSaving(false)
    }
  }

  const initials = user?.name?.trim().slice(0, 1).toUpperCase() || 'A'

  return <>
    <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label="Editar perfil" className={compact
      ? 'grid size-9 place-items-center rounded-full border border-white/[.08] bg-[#14151c] text-[#d2c4ff] transition hover:border-[#b49cff]/35 hover:bg-[#211f2b]'
      : 'group flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/[.045] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b49cff]'}>
      <Avatar className={compact ? 'size-8 border border-white/10 bg-[#1c2c25]' : 'size-9 border border-[#a78bfa]/25 bg-[#a78bfa]/[.09]'}>
        <AvatarImage src={user?.avatarUrl} alt="" />
        <AvatarFallback className="bg-[#211f2b] font-display text-xs font-semibold text-[#cbbaff]">{initials}</AvatarFallback>
      </Avatar>
      {!compact && <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-[#dae4dd]">{user?.name}</span>
        <span className="mt-1 block truncate text-[10px] text-[#7f9287]">{planTitle(user?.plan ?? null)} · editar perfil</span>
      </span>}
      {!compact && <Pencil size={13} className="shrink-0 text-[#77877f] transition group-hover:text-[#cbbaff]" />}
    </button>

    <dialog
      ref={dialogRef}
      className="profile-dialog"
      aria-labelledby="profile-dialog-title"
      onClose={() => setOpen(false)}
      onClick={(event) => { if (event.target === event.currentTarget) setOpen(false) }}
    >
      <form onSubmit={save} className="flex max-h-[min(760px,calc(100dvh-32px))] flex-col">
        <header className="flex items-start justify-between gap-5 border-b border-white/[.07] px-5 py-5 sm:px-7">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#b49cff]">Sua conta</p>
            <h2 id="profile-dialog-title" className="mt-2 font-display text-2xl font-medium tracking-[-.045em] text-[#edf3ee]">Perfil</h2>
            <p className="mt-1 text-xs text-[#909c94]">Atualize como você aparece na plataforma.</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Fechar edição de perfil" className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/[.09] text-[#a5ada7] hover:bg-white/[.06] hover:text-white"><X size={16} /></button>
        </header>

        <div className="min-h-0 space-y-5 overflow-y-auto px-5 py-5 sm:px-7">
          <div className="flex items-center gap-4 rounded-xl border border-white/[.07] bg-white/[.025] p-4">
            <Avatar className="size-16 border border-[#a78bfa]/25 bg-[#a78bfa]/[.09]">
              <AvatarImage src={avatarUrl} alt="Prévia da foto do perfil" />
              <AvatarFallback className="bg-[#211f2b] text-lg font-semibold text-[#cbbaff]">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#e4ece6]">Foto de perfil</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#849188]">JPG, PNG ou WebP. Ajustamos para um recorte quadrado.</p>
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void pickPhoto(event)} className="sr-only" />
            <button type="button" onClick={() => fileRef.current?.click()} className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#a78bfa]/20 bg-[#a78bfa]/[.07] text-[#c8b8ff] transition hover:border-[#a78bfa]/45 hover:bg-[#a78bfa]/[.13]" aria-label="Escolher foto"><Camera size={17} /></button>
          </div>
          {photoError && <p role="alert" className="text-xs text-[#f2a8b2]">{photoError}</p>}

          <div>
            <label htmlFor="profile-name" className="mb-2 block text-xs font-medium text-[#ccd5ce]">Nome</label>
            <input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={60} required autoComplete="name" className="h-11 w-full rounded-xl border border-white/[.1] bg-[#0e0e14] px-3.5 text-sm text-[#e6eee8] outline-none transition focus:border-[#a78bfa]/55 focus:ring-2 focus:ring-[#a78bfa]/10" />
          </div>
          <div>
            <label htmlFor="profile-email" className="mb-2 block text-xs font-medium text-[#ccd5ce]">E-mail</label>
            <input id="profile-email" value={user?.email ?? ''} readOnly className="h-11 w-full cursor-not-allowed rounded-xl border border-white/[.06] bg-white/[.025] px-3.5 text-sm text-[#87938b] outline-none" />
            <p className="mt-1.5 text-[10px] text-[#707e75]">E-mail da conta não pode ser alterado por aqui.</p>
          </div>
          <div>
            <label htmlFor="profile-bio" className="mb-2 block text-xs font-medium text-[#ccd5ce]">Sobre você</label>
            <textarea id="profile-bio" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={160} rows={3} placeholder="Uma frase curta, se quiser." className="w-full resize-y rounded-xl border border-white/[.1] bg-[#0e0e14] px-3.5 py-3 text-sm leading-relaxed text-[#e6eee8] outline-none transition placeholder:text-[#65736a] focus:border-[#a78bfa]/55 focus:ring-2 focus:ring-[#a78bfa]/10" />
            <p className="mt-1 text-right text-[10px] tabular-nums text-[#707e75]">{bio.length}/160</p>
          </div>
          <div>
            <label htmlFor="profile-location" className="mb-2 block text-xs font-medium text-[#ccd5ce]">Cidade ou região</label>
            <div className="relative"><MapPin size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74847a]" /><input id="profile-location" value={location} onChange={(event) => setLocation(event.target.value)} maxLength={80} autoComplete="address-level2" placeholder="Opcional" className="h-11 w-full rounded-xl border border-white/[.1] bg-[#0e0e14] pl-10 pr-3.5 text-sm text-[#e6eee8] outline-none transition placeholder:text-[#65736a] focus:border-[#a78bfa]/55 focus:ring-2 focus:ring-[#a78bfa]/10" /></div>
          </div>

          {notice && <p role="status" className={`rounded-xl border px-3.5 py-3 text-xs leading-relaxed ${notice.startsWith('Perfil atualizado') || notice.startsWith('Perfil salvo') ? 'border-[#8bd8b1]/15 bg-[#8bd8b1]/[.05] text-[#a7e2c1]' : 'border-[#e8bc76]/20 bg-[#e8bc76]/[.05] text-[#e3c78f]'}`}>{notice}</p>}
        </div>

        <footer className="flex items-center justify-between gap-4 border-t border-white/[.07] px-5 py-4 sm:px-7">
          <span className="hidden items-center gap-1.5 text-[10px] text-[#77877d] sm:flex"><UserRound size={12} />{authConfigured ? 'Sincronização com Supabase' : 'Banco indisponível'}</span>
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-xl border border-white/[.1] px-4 text-xs font-medium text-[#aeb8b0] transition hover:bg-white/[.05]">Cancelar</button>
            <button type="submit" disabled={isSaving} className="inline-flex h-10 min-w-32 items-center justify-center gap-2 rounded-xl bg-[#b49cff] px-4 text-xs font-semibold text-[#100c19] transition hover:bg-[#c6b4ff] disabled:cursor-wait disabled:opacity-60">{isSaving ? <LoaderCircle size={14} className="animate-spin" /> : notice.startsWith('Perfil atualizado') ? <Check size={14} /> : <ImagePlus size={14} />}{isSaving ? 'Salvando…' : 'Salvar perfil'}</button>
          </div>
        </footer>
      </form>
    </dialog>
  </>
}
