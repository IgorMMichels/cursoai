# E-mails de autenticação

Os templates HTML da Omega ficam em `supabase/templates/`:

- `confirmation.html` — confirmação do cadastro;
- `magic_link.html` — login por link;
- `recovery.html` — redefinição de senha.

Cada arquivo usa `{{ .ConfirmationURL }}` como destino do botão. O Supabase preenche esse valor com o link assinado da operação. Os nomes dos campos para atualizar templates hospedados são `mailer_subjects_*` e `mailer_templates_*_content`.

Os três templates mostram o conteúdo conforme `{{ .Data.email_locale }}`, a preferência de idioma salva nos metadados do usuário no Supabase Auth. Os valores `en` e `es` selecionam inglês e espanhol; valor ausente ou diferente usa português brasileiro (`pt-BR`). Mantenha essa chave sincronizada quando a pessoa alterar o idioma da conta. O assunto também pode usar Go Templates; o exemplo oficial da API usa `{{ .Token }}` no assunto de reautenticação. Use a mesma condição de idioma no assunto para que a caixa de entrada e o corpo fiquem no mesmo idioma.

| Idioma salvo em `email_locale` | Assunto de confirmação sugerido |
| --- | --- |
| `pt-BR` ou ausente | `Confirme seu e-mail na Omega Courses` |
| `en` | `Confirm your email at Omega Courses` |
| `es` | `Confirma tu correo en Omega Courses` |

Os e-mails de confirmação, acesso por link e recuperação são transacionais. O rodapé identifica a marca como `© Ω Omega Courses`; não adicione conteúdo promocional a esses templates.

## Aplicar no Supabase hospedado

O endpoint Management API é `PATCH https://api.supabase.com/v1/projects/{ref}/config/auth`. O corpo abaixo contém somente os seis campos destes templates, preservando as outras configurações do projeto. O token é lido do ambiente e não deve ser salvo no repositório. A API exige o escopo `auth:write`; tokens com permissões granulares precisam de `auth_config_write` e `project_admin_write`.

Exemplo Bash com `jq` para ler os arquivos HTML sem duplicá-los no comando:

```bash
export PROJECT_REF="seu-project-ref"
export SUPABASE_ACCESS_TOKEN="seu-token-da-management-api"

jq -n \
  --rawfile confirmation supabase/templates/confirmation.html \
  --rawfile magic_link supabase/templates/magic_link.html \
  --rawfile recovery supabase/templates/recovery.html \
  '{
    mailer_subjects_confirmation: "{{ if eq .Data.email_locale \"en\" }}Confirm your email at Omega Courses{{ else if eq .Data.email_locale \"es\" }}Confirma tu correo en Omega Courses{{ else }}Confirme seu e-mail na Omega Courses{{ end }}",
    mailer_templates_confirmation_content: $confirmation,
    mailer_subjects_magic_link: "{{ if eq .Data.email_locale \"en\" }}Your sign-in link | Omega Courses{{ else if eq .Data.email_locale \"es\" }}Tu enlace de acceso | Omega Courses{{ else }}Seu link de acesso | Omega Courses{{ end }}",
    mailer_templates_magic_link_content: $magic_link,
    mailer_subjects_recovery: "{{ if eq .Data.email_locale \"en\" }}Reset your password | Omega Courses{{ else if eq .Data.email_locale \"es\" }}Restablece tu contraseña | Omega Courses{{ else }}Redefina sua senha | Omega Courses{{ end }}",
    mailer_templates_recovery_content: $recovery
  }' > /tmp/omega-auth-email-patch.json

curl --fail-with-body --request PATCH \
  "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  --header "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  --header "Content-Type: application/json" \
  --data-binary @/tmp/omega-auth-email-patch.json
```

Review the project ref and the generated JSON before applying it. To inspect the current template values first, use `GET https://api.supabase.com/v1/projects/{ref}/config/auth` with the same authorization header and select keys beginning with `mailer_templates_` and `mailer_subjects_`.

O script `scripts/configure-email.mjs` configura e verifica SMTP, templates e callbacks do Supabase hospedado. Ele usa `https://www.omega.courses` por padrão e rejeita uma `SITE_URL` local ou sem HTTPS para impedir que links de produção apontem para `localhost`. Permita as origens raiz e `www` com `/login` e `/login?recovery=1` nos redirects. O aplicativo preserva os parâmetros ao normalizar o callback para `/pt-BR/login`, `/en/login` ou `/es/login`.

No Supabase local, `supabase/config.toml` também configura SMTP Resend e os mesmos três templates. Defina `RESEND_API_KEY` no `.env` local (arquivo ignorado pelo Git) e reinicie `supabase start` para aplicar alterações de configuração. As mensagens locais passam pelo Resend e os botões apontam para `https://www.omega.courses`; não use um endereço de cliente `localhost` nesses links de e-mail.

## Callback and delivery notes

The browser client uses Supabase PKCE. The user should open the email link in the same browser profile and tab that requested it, where the PKCE verifier is stored. For password recovery, the app preserves the pending recovery flow in that tab for up to 30 minutes so the user can return to finish setting a password. This app recovery window is separate from the signed link's validity configured in Supabase. Email security scanners may prefetch and consume one-time confirmation URLs; if that happens, ask the user to request a fresh link. Resend's click/open tracking should stay disabled for Supabase authentication links so signed URLs are not rewritten.

The in-app confirmation resend control applies a short client cooldown to prevent repeated clicks. Supabase's own email sending limits remain authoritative. These emails are transactional access messages; the marketing opt-in remains a separate signup preference.

## References

- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase Management API: Update auth service config](https://supabase.com/docs/reference/api/v1-update-auth-service-config)
- [Supabase JavaScript: signInWithOtp](https://supabase.com/docs/reference/javascript/auth-signinwithotp)
