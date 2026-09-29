import { createContext, useContext } from 'react'

export const PlatformEntryContext = createContext(false)

export function usePlatformEntryActive() {
  return useContext(PlatformEntryContext)
}

export function shouldShowPlatformEntry(pathname: string) {
  const section = pathname === '/landing' ? 'landing' : pathname.startsWith('/curso') ? 'course' : null
  if (!section) return false
  try { return sessionStorage.getItem(`cripto-mentoria:welcome-seen:${section}`) !== '1' }
  catch { return true }
}
