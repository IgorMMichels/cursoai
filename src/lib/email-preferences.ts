import { supabase } from '@/lib/supabase'
import type { UiLocale } from '@/lib/localization'

export async function loadMarketingPreference(userId: string) {
  if (!supabase) throw new Error('Autenticação indisponível no momento.')
  const { data, error } = await supabase
    .from('email_preferences')
    .select('marketing_opt_in')
    .eq('user_id', userId)
    .single()
  if (error) throw error
  return Boolean(data.marketing_opt_in)
}

export async function saveMarketingPreference(userId: string, marketingOptIn: boolean) {
  if (!supabase) throw new Error('Autenticação indisponível no momento.')
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (authData.user?.id !== userId) throw new Error('Entre novamente para atualizar suas preferências.')

  const { error } = await supabase
    .from('email_preferences')
    .update({ marketing_opt_in: marketingOptIn })
    .eq('user_id', userId)
  if (error) throw error
}

export async function saveEmailLocale(userId: string, locale: UiLocale) {
  if (!supabase) throw new Error('Autenticação indisponível no momento.')
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (authData.user?.id !== userId) throw new Error('Entre novamente para atualizar suas preferências.')
  const { data, error } = await supabase.from('email_preferences')
    .update({ email_locale: locale }).eq('user_id', userId).select('user_id').single()
  if (error) throw error
  if (!data) throw new Error('Não foi possível salvar o idioma dos e-mails.')
}
