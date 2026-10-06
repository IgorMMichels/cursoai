import { createContext, useContext } from 'react'
import { unlocalizedPath } from '../lib/localization.ts'

export const PlatformEntryContext = createContext(false)
const seenSections = new Set<string>()

export function usePlatformEntryActive() {
  return useContext(PlatformEntryContext)
}

function entrySection(pathname: string) {
  const path = unlocalizedPath(pathname)
  return path === '/landing' ? 'landing' : path === '/curso' || path.startsWith('/curso/') ? 'course' : null
}

export function shouldShowPlatformEntry(pathname: string) {
  const section = entrySection(pathname)
  if (!section) return false
  if (seenSections.has(section)) return false
  try { return sessionStorage.getItem(`cripto-mentoria:welcome-seen:${section}`) !== '1' }
  catch { return true }
}

export function markPlatformEntrySeen(pathname: string) {
  const section = entrySection(pathname)
  if (!section) return
  seenSections.add(section)
  try { sessionStorage.setItem(`cripto-mentoria:welcome-seen:${section}`, '1') }
  catch { /* Storage may be unavailable in private or restricted contexts. */ }
}
