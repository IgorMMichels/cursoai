import { readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { join } from 'node:path'

// Server credentials are supplied by the operator's environment, never printed.
const environment = process.env
const apply = process.argv.includes('--apply')
const projectRef = environment.SUPABASE_PROJECT_REF || 'lmapktqohocacdqxdzor'
const origin = new URL(environment.SITE_URL || 'https://www.omega.courses').origin
const required = ['RESEND_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ACCESS_TOKEN']
const missing = required.filter((name) => !environment[name]?.trim())
if (missing.length) {
  console.error(`Configuração pendente: ${missing.join(', ')}.`)
  console.error('Forneça as credenciais no ambiente do terminal; não envie chaves pelo chat.')
  process.exitCode = 1
} else {
  await configure().catch((error) => {
    console.error(error instanceof Error ? error.message : 'Não foi possível configurar o e-mail.')
    process.exitCode = 1
  })
}

async function configure() {
  const url = `https://api.supabase.com/v1/projects/${encodeURIComponent(projectRef)}/config/auth`
  const headers = { Authorization: `Bearer ${environment.SUPABASE_ACCESS_TOKEN.trim()}`, 'Content-Type': 'application/json' }
  const configResponse = await fetch(url, { headers, signal: AbortSignal.timeout(15_000) })
  if (!configResponse.ok) throw new Error(`Supabase Auth: acesso à configuração falhou (HTTP ${configResponse.status}).`)
  const current = await configResponse.json()
  const patch = {
    site_url: origin,
    uri_allow_list: [...new Set([
      ...(current.uri_allow_list || '').split(',').map((value) => value.trim()).filter(Boolean),
      `${origin}/login`, `${origin}/login?recovery=1`,
      'https://omega.courses/login', 'https://omega.courses/login?recovery=1',
    ])].join(','),
    mailer_autoconfirm: false,
    smtp_host: 'smtp.resend.com', smtp_port: '465', smtp_user: 'resend',
    smtp_pass: environment.RESEND_API_KEY.trim(),
    smtp_admin_email: environment.RESEND_SENDER_EMAIL?.trim() || 'contato@omega.courses',
    smtp_sender_name: 'Omega',
  }
  for (const [kind, subject] of Object.entries({
    confirmation: '{{ if eq .Data.email_locale "en" }}Confirm your email at Omega{{ else if eq .Data.email_locale "es" }}Confirma tu correo en Omega{{ else }}Confirme seu e-mail na Omega{{ end }}',
    magic_link: '{{ if eq .Data.email_locale "en" }}Your secure Omega sign-in link{{ else if eq .Data.email_locale "es" }}Tu enlace seguro para entrar en Omega{{ else }}Seu link seguro para entrar na Omega{{ end }}',
    recovery: '{{ if eq .Data.email_locale "en" }}Reset your Omega password{{ else if eq .Data.email_locale "es" }}Restablece tu contraseña de Omega{{ else }}Redefina sua senha da Omega{{ end }}',
  })) {
    patch[`mailer_subjects_${kind}`] = subject
    patch[`mailer_templates_${kind}_content`] = await readFile(new URL(`../supabase/templates/${kind}.html`, import.meta.url), 'utf8')
  }
  if (!apply) {
    console.log('Acesso ao Supabase confirmado. SMTP, templates e callbacks estão preparados para aplicação.')
    console.log('Use --apply para aplicar a configuração e guardar as duas chaves de servidor na Vercel.')
    return
  }
  // Keep the existing authentication configuration; patch only the listed email fields.
  const response = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(patch), signal: AbortSignal.timeout(15_000) })
  if (!response.ok) throw new Error(`Supabase Auth: atualização falhou (HTTP ${response.status}).`)
  const verification = await fetch(url, { headers, signal: AbortSignal.timeout(15_000) })
  if (!verification.ok) throw new Error(`Supabase Auth: leitura de verificação falhou (HTTP ${verification.status}).`)
  const applied = await verification.json()
  for (const key of Object.keys(patch).filter((key) => key !== 'smtp_pass')) {
    if (String(applied[key]) !== String(patch[key])) throw new Error(`Supabase Auth: campo ${key} não foi confirmado.`)
  }
  for (const name of ['RESEND_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
    await saveVercelSecret(name, environment[name].trim())
  }
  console.log('SMTP, confirmação de e-mail, callbacks e templates aplicados e verificados no Supabase.')
  console.log('Chaves de servidor salvas na Vercel. Envios de marketing continuam controlados por MARKETING_EMAILS_ENABLED.')
}

function saveVercelSecret(name, value) {
  return new Promise((resolve, reject) => {
    // Avoid shell interpolation and command-line secret arguments. The JSON contains
    // the intended encrypted environment variable and is passed on stdin to the CLI.
    const endpoint = `/v10/projects/${environment.VERCEL_PROJECT_ID || 'prj_7vpdbFcEb1a9qFCBbzamcePb0J4D'}/env?upsert=true`
    const cliPath = environment.VERCEL_CLI_PATH || (process.platform === 'win32' && environment.APPDATA
      ? join(environment.APPDATA, 'npm', 'node_modules', 'vercel', 'dist', 'vc.js') : null)
    const command = cliPath ? process.execPath : 'vercel'
    const args = [...(cliPath ? [cliPath] : []), 'api', endpoint, '--method', 'POST', '--input', '-', '--silent']
    if (process.platform === 'win32' && !cliPath) {
      reject(new Error('No Windows, defina VERCEL_CLI_PATH com o caminho do arquivo vercel/dist/vc.js instalado.'))
      return
    }
    const child = spawn(command, args, { shell: false, stdio: ['pipe', 'ignore', 'ignore'], windowsHide: true })
    child.once('error', () => reject(new Error(`Vercel: não foi possível executar a configuração de ${name}.`)))
    child.once('close', (code) => code === 0 ? resolve() : reject(new Error(`Vercel: não foi possível salvar ${name}.`)))
    child.stdin.on('error', () => {})
    child.stdin.end(JSON.stringify({ key: name, value, type: 'sensitive', target: ['production'] }))
  })
}
