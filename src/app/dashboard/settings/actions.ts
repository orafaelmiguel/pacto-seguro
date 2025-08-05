// src/app/dashboard/settings/actions.ts
"use server";

import { createClient } from '../../../../lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const profileSchema = z.object({
  name: z.string().optional(),
  avatar: z.instanceof(File).optional(),
});

export async function updateProfile(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: 'Você precisa estar logado.' } };
  }

  const name = formData.get('name') as string | null;
  const avatarFile = formData.get('avatar') as File | null;

  // Atualiza o nome se foi fornecido
  if (name && name.length >= 3) {
    const { error } = await supabase
      .from('profiles')
      .update({ name: name })
      .eq('id', user.id);

    if (error) {
      console.error('Erro ao atualizar nome:', error);
      return { error: { message: 'Não foi possível atualizar o nome.' } };
    }
  }

  // Faz o upload do avatar se um arquivo foi enviado
  if (avatarFile && avatarFile.size > 0) {
    const fileName = `${user.id}-${Date.now()}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, avatarFile, {
        cacheControl: '3600',
        upsert: true, // Sobrescreve se já existir um arquivo com o mesmo nome
      });

    if (uploadError) {
      console.error('Erro no upload do avatar:', uploadError);
      return { error: { message: 'Não foi possível enviar o avatar.' } };
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(uploadData.path);
      
    const { error: urlUpdateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrlData.publicUrl })
      .eq('id', user.id);

    if (urlUpdateError) {
      console.error('Erro ao atualizar URL do avatar:', urlUpdateError);
      return { error: { message: 'Não foi possível salvar a URL do avatar.' } };
    }
  }

  revalidatePath('/dashboard/settings');
  return { success: true, message: 'Perfil atualizado com sucesso!' };
}
