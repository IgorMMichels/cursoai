import { useEffect, useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
type Theme = 'system' | 'dark' | 'light'
const labels = { system: 'Sistema', dark: 'Escuro', light: 'Claro' }
function readTheme(): Theme {
  try { const value = localStorage.getItem('omega:theme'); return value === 'light' || value === 'dark' ? value : 'system' }
  catch { return 'system' }
}
export function ThemeControl() {
  const [theme, setTheme] = useState<Theme>(readTheme)
  useEffect(() => {
    const sync = (event: Event) => setTheme((event as CustomEvent<Theme>).detail)
    window.addEventListener('omega-theme-change', sync)
    return () => window.removeEventListener('omega-theme-change', sync)
  }, [])
  useEffect(() => {
    const query = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const resolved = theme === 'system' ? query.matches ? 'dark' : 'light' : theme
      document.documentElement.dataset.omegaTheme = resolved
      document.documentElement.style.colorScheme = resolved
    }
    apply()
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [theme])
  const Icon = theme === 'system' ? Monitor : theme === 'dark' ? Moon : Sun
  return <button type="button" className="omega-theme-control" aria-label={`Tema ${labels[theme]}. Alterar tema`} title={`Tema: ${labels[theme]}`} onClick={() => {
    const next = theme === 'system' ? 'dark' : theme === 'dark' ? 'light' : 'system'
    setTheme(next)
    try { localStorage.setItem('omega:theme', next) } catch { /* Appearance works without storage. */ }
    window.dispatchEvent(new CustomEvent('omega-theme-change', { detail: next }))
  }}><Icon size={17} /><span>{labels[theme]}</span></button>
}
