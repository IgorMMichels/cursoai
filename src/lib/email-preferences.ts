import { supabase } from '@/lib/supabase'

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
