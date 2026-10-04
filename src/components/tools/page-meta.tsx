import { useEffect } from 'react'
import { brand } from '@/lib/omega-brand'

export function PageMeta({ title, description, path, privatePage = false }: { title: string; description: string; path: string; privatePage?: boolean }) {
  useEffect(() => {
    document.title = `${title} | ${brand.name}`
    const configuredOrigin = import.meta.env.VITE_SITE_URL
    let origin = window.location.origin
    if (configuredOrigin) {
      try { const url = new URL(configuredOrigin); if (url.protocol === 'https:' || url.protocol === 'http:') origin = url.origin } catch { /* No dev, uma configuração inválida não impede o simulador. */ }
    }
    const changes = [
      { selector: 'meta[name="description"]', tag: 'meta', attrs: { name: 'description', content: description } },
      { selector: 'meta[name="robots"]', tag: 'meta', attrs: { name: 'robots', content: privatePage ? 'noindex, follow' : 'index, follow' } },
      { selector: 'link[rel="canonical"]', tag: 'link', attrs: { rel: 'canonical', href: `${origin}${path}` } },
    ]
    const cleanups = changes.map(({ selector, tag, attrs }) => {
      const existing = document.head.querySelector(selector)
      const element = existing ?? document.createElement(tag)
      Object.entries(attrs).forEach(([name, value]) => element.setAttribute(name, value))
      if (!existing) document.head.append(element)
      return () => {
        // O HTML de entrada pode ser de um artigo pré-renderizado. Não restaurar
        // seu canonical/título ao navegar para uma rota que usa o shell global.
        if (selector === 'meta[name="description"]') element.setAttribute('content', brand.description)
        else element.remove()
      }
    })
    return () => { document.title = brand.title; cleanups.forEach((cleanup) => cleanup()) }
  }, [title, description, path, privatePage])
  return null
}
