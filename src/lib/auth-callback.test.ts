import assert from 'node:assert/strict'
import test from 'node:test'
import { forgetPasswordRecovery, hasPasswordRecovery, readAuthCallbackState, rememberPasswordRecovery } from './auth-callback.ts'

test('recovery state is detected from the application query and Supabase callback fragment', () => {
  assert.deepEqual(readAuthCallbackState('?recovery=1', ''), { isRecovery: true, error: null })
  assert.deepEqual(readAuthCallbackState('', '#type=recovery'), { isRecovery: true, error: null })
})

test('expired errors from query or fragment are shown as a recoverable message', () => {
  const message = 'Esse link é inválido ou expirou. Solicite um novo e-mail e tente novamente.'
  assert.equal(readAuthCallbackState('?error=access_denied&error_code=otp_expired', '').error, message)
  assert.equal(readAuthCallbackState('', '#error=access_denied&error_description=Email+link+expired').error, message)
})

test('unknown callback errors remain visible without exposing arbitrary server text', () => {
  assert.equal(readAuthCallbackState('?error=server_error&error_description=private-data', '').error,
    'Não foi possível validar o link. Solicite um novo e-mail e tente novamente.')
})

test('ordinary login URLs do not enter recovery or show an error', () => {
  assert.deepEqual(readAuthCallbackState('?ref=aluna', ''), { isRecovery: false, error: null })
})

test('verified recovery survives refresh only for the same user and bounded time', () => {
  const entries = new Map<string, string>()
  const storage = {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => { entries.set(key, value) },
    removeItem: (key: string) => { entries.delete(key) },
  }
  assert.equal(hasPasswordRecovery(storage, 'user-a', 1000), false)
  rememberPasswordRecovery(storage, 'user-a', 1000)
  assert.equal(hasPasswordRecovery(storage, 'user-a', 2000), true)
  assert.equal(hasPasswordRecovery(storage, 'user-b', 2000), false)
  rememberPasswordRecovery(storage, 'user-a', 1000)
  assert.equal(hasPasswordRecovery(storage, 'user-a', 1000 + 30 * 60_000), false)
  rememberPasswordRecovery(storage, 'user-a', 1000)
  forgetPasswordRecovery(storage)
  assert.equal(hasPasswordRecovery(storage, 'user-a', 2000), false)
})
