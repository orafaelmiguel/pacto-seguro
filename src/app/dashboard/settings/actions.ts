'use server'

import { createClient } from '../../../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: { message: 'Você precisa estar logado.' } }
  }

  const name = formData.get('name') as string | null
  const avatarFile = formData.get('avatar') as File | null
  
  let avatarUrl = user.user_metadata.avatar_url
  const updatedMetadata: { name?: string; avatar_url?: string } = {}

  // 1. Lidar com o upload do avatar
  if (avatarFile && avatarFile.size > 0) {
    const fileName = `${user.id}-${Date.now()}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, avatarFile, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      console.error('Erro no upload do avatar:', uploadError)
      return { error: { message: 'Não foi possível enviar o avatar.' } }
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(uploadData.path)
    
    avatarUrl = publicUrlData.publicUrl
    updatedMetadata.avatar_url = avatarUrl
  }

  // 2. Preparar os dados para atualização
  if (name && name !== user.user_metadata.name) {
    updatedMetadata.name = name
  }

  // 3. Atualizar a tabela 'profiles' no banco de dados
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ 
      name: name ?? undefined, 
      avatar_url: avatarUrl 
    })
    .eq('id', user.id)

  if (profileError) {
    console.error('Erro ao atualizar tabela de perfis:', profileError)
    return { error: { message: 'Não foi possível atualizar o perfil no banco de dados.' } }
  }

  // 4. Atualizar o user_metadata no Auth, se houver alterações
  if (Object.keys(updatedMetadata).length > 0) {
    const { error: authError } = await supabase.auth.updateUser({
      data: updatedMetadata,
    })

    if (authError) {
      console.error('Erro ao atualizar metadados do usuário:', authError)
      return { error: { message: 'Não foi possível sincronizar o perfil com a autenticação.' } }
    }
  }

  // 5. Revalidar o caminho da página de configurações
  revalidatePath('/dashboard/settings')
  
  return { success: true, message: 'Perfil atualizado com sucesso!' }
}
