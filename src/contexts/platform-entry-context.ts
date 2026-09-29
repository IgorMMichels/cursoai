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

export function markPlatformEntrySeen(pathname: string) {
  const section = pathname === '/landing' ? 'landing' : pathname.startsWith('/curso') ? 'course' : null
  if (!section) return
  try { sessionStorage.setItem(`cripto-mentoria:welcome-seen:${section}`, '1') }
  catch { /* Storage may be unavailable in private or restricted contexts. */ }
}
