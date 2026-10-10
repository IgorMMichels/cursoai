import { useCallback } from 'react'
import { Link, NavLink, Navigate, useNavigate, type LinkProps, type NavLinkProps, type NavigateProps, type NavigateFunction, type NavigateOptions, type To } from 'react-router-dom'
import { useLocalization } from '@/contexts/localization-context'
import { localeFromPath, localizedPath, type UiLocale } from '@/lib/localization'

export function localizeTo(to: To, locale: UiLocale): To {
  const path = typeof to === 'string' ? to : to.pathname
  if (!path || !path.startsWith('/') || path.startsWith('//') || localeFromPath(path.split(/[?#]/)[0])) return to
  if (typeof to !== 'string') return { ...to, pathname: localizedPath(path, locale) }
  const match = to.match(/^([^?#]*)(.*)$/)!
  return localizedPath(match[1], locale) + match[2]
}

export function LocalizedLink(props: LinkProps) {
  const { locale } = useLocalization()
  return <Link {...props} to={localizeTo(props.to, locale)} />
}

export function LocalizedNavLink(props: NavLinkProps) {
  const { locale } = useLocalization()
  return <NavLink {...props} to={localizeTo(props.to, locale)} />
}

export function LocalizedNavigate(props: NavigateProps) {
  const { locale } = useLocalization()
  return <Navigate {...props} to={localizeTo(props.to, locale)} />
}

export function useLocalizedNavigate(): NavigateFunction {
  const navigate = useNavigate()
  const { locale } = useLocalization()
  return useCallback((to: To | number, options?: NavigateOptions) => {
    if (typeof to === 'number') return navigate(to)
    return navigate(localizeTo(to, locale), options)
  }, [navigate, locale]) as NavigateFunction
}
