import test from 'node:test'
import assert from 'node:assert/strict'

async function withStorage(storage: Pick<Storage, 'getItem' | 'setItem'>, run: () => Promise<void>) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage')
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: storage })
  try { await run() } finally {
    if (original) Object.defineProperty(globalThis, 'sessionStorage', original)
    else Reflect.deleteProperty(globalThis, 'sessionStorage')
  }
}

test('entry is shown once per section and persisted when storage works', async () => {
  const values = new Map<string, string>()
  await withStorage({ getItem: key => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value) } }, async () => {
    const { shouldShowPlatformEntry, markPlatformEntrySeen } = await import(new URL('./platform-entry-context.ts?test=available', import.meta.url).href) as typeof import('./platform-entry-context')
    assert.equal(shouldShowPlatformEntry('/landing'), true)
    markPlatformEntrySeen('/landing')
    assert.equal(values.get('cripto-mentoria:welcome-seen:landing'), '1')
    assert.equal(shouldShowPlatformEntry('/landing'), false)
    assert.equal(shouldShowPlatformEntry('/curso'), true)
    markPlatformEntrySeen('/curso')
    assert.equal(shouldShowPlatformEntry('/curso/aula/m1/a1'), false)
    assert.equal(shouldShowPlatformEntry('/login'), false)
  })
})

test('entry completion remains effective when storage reads and writes throw', async () => {
  await withStorage({ getItem: () => { throw new Error('Blocked storage') }, setItem: () => { throw new Error('Blocked storage') } }, async () => {
    const { shouldShowPlatformEntry, markPlatformEntrySeen } = await import(new URL('./platform-entry-context.ts?test=blocked', import.meta.url).href) as typeof import('./platform-entry-context')
    assert.equal(shouldShowPlatformEntry('/landing'), true)
    markPlatformEntrySeen('/landing')
    assert.equal(shouldShowPlatformEntry('/landing'), false)
    assert.equal(shouldShowPlatformEntry('/curso'), true)
    markPlatformEntrySeen('/curso/aula/m1/a1')
    assert.equal(shouldShowPlatformEntry('/curso'), false)
    assert.equal(shouldShowPlatformEntry('/landing'), false)
  })
})

test('localized entry routes share completion with their canonical section', async () => {
  const values = new Map<string, string>()
  await withStorage({ getItem: key => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value) } }, async () => {
    const { shouldShowPlatformEntry, markPlatformEntrySeen } = await import(new URL('./platform-entry-context.ts?test=localized', import.meta.url).href) as typeof import('./platform-entry-context')
    for (const locale of ['en', 'es', 'fr', 'pt-BR']) {
      assert.equal(shouldShowPlatformEntry(`/${locale}/landing`), true)
      assert.equal(shouldShowPlatformEntry(`/${locale}/curso/aula/m1/a1`), true)
    }
    markPlatformEntrySeen('/en/landing')
    markPlatformEntrySeen('/fr/curso')
    assert.equal(values.get('cripto-mentoria:welcome-seen:landing'), '1')
    assert.equal(values.get('cripto-mentoria:welcome-seen:course'), '1')
    assert.equal(shouldShowPlatformEntry('/landing'), false)
    assert.equal(shouldShowPlatformEntry('/es/landing'), false)
    assert.equal(shouldShowPlatformEntry('/curso'), false)
    assert.equal(shouldShowPlatformEntry('/en/curso'), false)
  })
})
