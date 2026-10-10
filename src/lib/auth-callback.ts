export type AuthCallbackState = {
  isRecovery: boolean
  error: string | null
}

const recoveryStorageKey = 'omega-password-recovery'
type RecoveryStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

// This is a per-tab UI marker, written only after Supabase verifies recovery.
// Supabase still validates the authenticated password update on the server.
export function rememberPasswordRecovery(storage: RecoveryStorage, userId: string, now = Date.now()) {
  try { storage.setItem(recoveryStorageKey, JSON.stringify({ userId, expiresAt: now + 30 * 60_000 })) } catch { /* Storage can be unavailable. */ }
}

export function forgetPasswordRecovery(storage: RecoveryStorage) {
  try { storage.removeItem(recoveryStorageKey) } catch { /* Storage can be unavailable. */ }
}

export function hasPasswordRecovery(storage: RecoveryStorage, userId: string, now = Date.now()) {
  try {
    const marker = JSON.parse(storage.getItem(recoveryStorageKey) || 'null')
    if (marker?.userId === userId && Number.isFinite(marker.expiresAt) && marker.expiresAt > now) return true
  } catch { /* Invalid or unavailable storage does not enable recovery. */ }
  forgetPasswordRecovery(storage)
  return false
}

function callbackParams(value: string) {
  const normalized = value.startsWith('?') || value.startsWith('#') ? value.slice(1) : value
  return new URLSearchParams(normalized)
}

export function readAuthCallbackState(search: string, hash: string): AuthCallbackState {
  const query = callbackParams(search)
  const fragment = callbackParams(hash)
  const errorCode = query.get('error_code') ?? fragment.get('error_code')
  const error = query.get('error') ?? fragment.get('error')
  const description = query.get('error_description') ?? fragment.get('error_description')
  const isRecovery = query.get('recovery') === '1' || query.get('type') === 'recovery' || fragment.get('type') === 'recovery'

  if (!error && !errorCode && !description) return { isRecovery, error: null }
  if (errorCode === 'otp_expired' || errorCode === 'access_denied') {
    return { isRecovery, error: 'Esse link é inválido ou expirou. Solicite um novo e-mail e tente novamente.' }
  }
  if (description && /expired|invalid|otp/i.test(description)) {
    return { isRecovery, error: 'Esse link é inválido ou expirou. Solicite um novo e-mail e tente novamente.' }
  }
  return { isRecovery, error: 'Não foi possível validar o link. Solicite um novo e-mail e tente novamente.' }
}
