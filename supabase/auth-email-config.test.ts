import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const config = await readFile(new URL('./config.toml', import.meta.url), 'utf8')

test('local Supabase Auth sends transactional email through Omega Resend SMTP', () => {
  assert.match(config, /\[auth\.email\.smtp\]\s+enabled = true\s+host = "smtp\.resend\.com"\s+port = 465\s+user = "resend"\s+pass = "env\(RESEND_API_KEY\)"/)
  assert.match(config, /admin_email = "contato@omega\.courses"/)
  assert.match(config, /sender_name = "Omega"/)
})

test('local Auth emails link to the production Omega login and use the Resend templates', () => {
  assert.match(config, /site_url = "https:\/\/www\.omega\.courses"/)
  assert.match(config, /https:\/\/www\.omega\.courses\/login\?recovery=1/)
  for (const template of ['confirmation', 'magic_link', 'recovery']) {
    assert.match(config, new RegExp(`\\[auth\\.email\\.template\\.${template}\\]`))
    assert.ok(config.includes(`./supabase/templates/${template}.html`))
  }
})
