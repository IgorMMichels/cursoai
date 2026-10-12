import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown } from 'lucide-react'
import { localeNames, type UiLocale } from '@/lib/localization'
import { useLocalization } from '@/contexts/localization-context'

// Troca de idioma compacta para cabeçalhos (site e curso). Não altera preços nem planos.
// Lista própria (em vez do <select> nativo) para ter cantos de 12px e estilo consistente.
export function HeaderLanguageSelect({ className = '' }: { className?: string }) {
  const id = useId()
  const { locale, setLocale } = useLocalization()
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const entries = Object.entries(localeNames) as [UiLocale, string][]

  useEffect(() => {
    if (!open) return
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [open])

  const options = () => Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [])

  const focusOption = (index: number) => {
    const list = options()
    list[(index + list.length) % list.length]?.focus()
  }

  const choose = (next: UiLocale) => {
    setOpen(false)
    buttonRef.current?.focus()
    if (next !== locale) setLocale(next)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!open) return
    const current = options().indexOf(document.activeElement as HTMLButtonElement)
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      buttonRef.current?.focus()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusOption(current < 0 ? 0 : current + 1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusOption(current < 0 ? -1 : current - 1)
    }
  }

  return <div ref={rootRef} onKeyDown={onKeyDown} className={`relative inline-flex ${className}`}>
    <button
      ref={buttonRef}
      id={`${id}-button`}
      type="button"
      aria-label={t('language')}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={`${id}-list`}
      onClick={() => setOpen((value) => !value)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown' && !open) {
          event.preventDefault()
          setOpen(true)
          requestAnimationFrame(() => focusOption(0))
        }
      }}
      className="inline-flex h-9 min-w-[10.5rem] items-center justify-between gap-2 rounded-[12px] border border-white/[.12] bg-white/[.03] pl-3.5 pr-2.5 text-xs text-[#e6eee8] outline-none transition hover:border-white/25 hover:bg-white/[.05] focus-visible:border-[#b49cff]/60 focus-visible:ring-2 focus-visible:ring-[#b49cff]/20 aria-expanded:border-[#b49cff]/50"
    >
      <span>{localeNames[locale]}</span>
      <ChevronDown aria-hidden="true" size={14} className={`shrink-0 text-[#8b8793] transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <ul
      id={`${id}-list`}
      role="listbox"
      aria-labelledby={`${id}-button`}
      className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-full overflow-hidden rounded-[12px] border border-white/[.12] bg-[#0e0e14] p-1 shadow-2xl shadow-black/50"
    >
      {entries.map(([code, name]) => {
        const selected = code === locale
        return <li key={code} role="presentation">
          <button
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => choose(code)}
            className={`flex w-full items-center justify-between gap-4 whitespace-nowrap rounded-[9px] px-3 py-2 text-left text-xs outline-none transition focus-visible:bg-white/[.08] ${selected ? 'bg-[#a78bfa]/15 text-white' : 'text-[#c9c4d6] hover:bg-white/[.06] hover:text-white'}`}
          >
            <span>{name}</span>
            {selected && <Check aria-hidden="true" size={13} className="text-[#c9b8ff]" />}
          </button>
        </li>
      })}
    </ul>}
  </div>
}
