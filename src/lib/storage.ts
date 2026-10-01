export type UserRole = 'student' | 'admin'

const referralKey = 'cripto-mentoria:referral'
const volatileStorage = new Map<string, string>()

export function getStoredValue(key: string) {
  if (volatileStorage.has(key)) return volatileStorage.get(key) ?? null
  try { return window.localStorage.getItem(key) }
  catch { return null }
}

export function setStoredValue(key: string, value: string) {
  volatileStorage.set(key, value)
  try { window.localStorage.setItem(key, value) }
  catch { /* Keep the current view usable when browser storage is unavailable. */ }
}

export function removeStoredValue(key: string) {
  volatileStorage.delete(key)
  try { window.localStorage.removeItem(key) }
  catch { /* In-memory state can still be cleared when browser storage is unavailable. */ }
}

export const getReferralCode = () => getStoredValue(referralKey) || undefined
export const rememberReferral = (code: string) => {
  const normalized = code.trim().toLowerCase()
  if (!/^[a-z][a-z0-9_-]{2,23}$/.test(normalized)) return
  setStoredValue(referralKey, normalized)
}
