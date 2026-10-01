import { supabase } from '@/lib/supabase'

const avatarBucket = 'profile-avatars'

export type ProfileFields = {
  username: string
  displayName: string
  bio: string
  location: string
  avatarPath: string | null
  avatarUrl?: string
}

export type ProfileUpdateResult = {
  synced: boolean
  profile?: ProfileFields
  error?: string
}

function publicAvatarUrl(path: string | null) {
  if (!supabase || !path) return undefined
  return supabase.storage.from(avatarBucket).getPublicUrl(path).data.publicUrl
}

export async function getCloudProfile(userId: string): Promise<ProfileFields | null> {
  if (!supabase) return null
  const { data: authData } = await supabase.auth.getSession()
  if (authData.session?.user.id !== userId) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('username, display_name, bio, location, avatar_path')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  return {
    username: data.username,
    displayName: data.display_name,
    bio: data.bio,
    location: data.location,
    avatarPath: data.avatar_path,
    avatarUrl: publicAvatarUrl(data.avatar_path),
  }
}

export async function saveCloudProfile(
  userId: string,
  input: Pick<ProfileFields, 'displayName' | 'bio' | 'location'>,
  avatar?: Blob,
): Promise<ProfileUpdateResult> {
  if (!supabase) return { synced: false }
  const { data: sessionData } = await supabase.auth.getSession()
  if (sessionData.session?.user.id !== userId) return { synced: false }

  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (authData.user?.id !== userId) return { synced: false }

  const { data: current, error: currentError } = await supabase
    .from('profiles')
    .select('username, avatar_path')
    .eq('id', userId)
    .maybeSingle()
  if (currentError) throw currentError
  if (!current) throw new Error('Perfil não encontrado.')

  const oldPath = current.avatar_path
  let avatarPath = oldPath
  let uploadedPath: string | null = null
  let profileSaved = false

  try {
    if (avatar) {
      if (avatar.type !== 'image/webp' || avatar.size > 5 * 1024 * 1024) {
        throw new Error('Imagem preparada precisa ser WebP com até 5 MB.')
      }
      uploadedPath = `${userId}/${globalThis.crypto.randomUUID()}.webp`
      const { error } = await supabase.storage.from(avatarBucket).upload(uploadedPath, avatar, {
        cacheControl: '3600',
        contentType: 'image/webp',
        upsert: false,
      })
      if (error) throw error
      avatarPath = uploadedPath
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ display_name: input.displayName, bio: input.bio, location: input.location, avatar_path: avatarPath })
      .eq('id', userId)
      .select('username, display_name, bio, location, avatar_path')
      .single()
    if (error) throw error
    profileSaved = true

    if (oldPath && oldPath !== avatarPath) {
      await supabase.storage.from(avatarBucket).remove([oldPath])
    }

    return {
      synced: true,
      profile: {
        username: data.username,
        displayName: data.display_name,
        bio: data.bio,
        location: data.location,
        avatarPath: data.avatar_path,
        avatarUrl: publicAvatarUrl(data.avatar_path),
      },
    }
  } catch (error) {
    if (uploadedPath && !profileSaved) {
      await supabase.storage.from(avatarBucket).remove([uploadedPath])
    }
    throw error
  }
}
