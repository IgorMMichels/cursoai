import { useEffect } from 'react'
import { useLocalization } from '@/contexts/localization-context'
import { localizedPath } from '@/lib/localization'
import { omegaCopy } from '@/lib/omega-copy'

export function PageMeta({ title, description, path, privatePage = false }: { title: string; description: string; path: string; privatePage?: boolean }) {
  const { locale } = useLocalization()
  useEffect(() => {
    document.title = `${title} | ${omegaCopy.name}`
    const configuredOrigin = import.meta.env.VITE_SITE_URL
    let origin = window.location.origin
    if (configuredOrigin) {
      try { const url = new URL(configuredOrigin); if (url.protocol === 'https:' || url.protocol === 'http:') origin = url.origin } catch { /* No dev, uma configuração inválida não impede o simulador. */ }
    }
    const changes = [
      { selector: 'meta[name="description"]', tag: 'meta', attrs: { name: 'description', content: description } },
      { selector: 'meta[name="robots"]', tag: 'meta', attrs: { name: 'robots', content: privatePage ? 'noindex, follow' : 'index, follow' } },
      { selector: 'link[rel="canonical"]', tag: 'link', attrs: { rel: 'canonical', href: `${origin}${localizedPath(path, locale)}` } },
    ]
    const cleanups = changes.map(({ selector, tag, attrs }) => {
      const existing = document.head.querySelector(selector)
      const element = existing ?? document.createElement(tag)
      Object.entries(attrs).forEach(([name, value]) => element.setAttribute(name, value))
      if (!existing) document.head.append(element)
      return () => {
        // O HTML de entrada pode ser de um artigo pré-renderizado. Não restaurar
        // seu canonical/título ao navegar para uma rota que usa o shell global.
        if (selector === 'meta[name="description"]') element.setAttribute('content','Omega: aprenda sobre criptoativos, Bitcoin, Ethereum, carteiras, DeFi e futuros com aulas narradas e exercícios interativos.')
        else element.remove()
      }
    })
    return () => { document.title = omegaCopy.title; cleanups.forEach((cleanup) => cleanup()) }
  }, [title, description, path, privatePage, locale])
  return null
}
