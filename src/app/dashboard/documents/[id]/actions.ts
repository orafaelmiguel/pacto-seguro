'use server'

import { createClient } from '../../../../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateDocumentTitle(documentId: string, newTitle: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('documents')
    .update({ title: newTitle })
    .eq('id', documentId)

  if (error) {
    console.error('Error updating document title:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/dashboard/documents/${documentId}`)
  revalidatePath('/dashboard/documents')
  return { success: true }
}

export async function updateDocumentContent(documentId: string, newContent: any) {
  const supabase = createClient()

  const { error } = await supabase
    .from('documents')
    .update({ content: newContent })
    .eq('id', documentId)

  if (error) {
    console.error('Error updating document content:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/dashboard/documents/${documentId}`)
  return { success: true }
}

export async function saveAsTemplate(templateTitle: string, documentContent: any) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Usuário não autenticado.' }
  }

  if (!templateTitle || !documentContent) {
    return { success: false, error: 'Título e conteúdo são obrigatórios.'}
  }

  const { error } = await supabase.from('templates').insert({
    user_id: user.id,
    title: templateTitle,
    content: documentContent,
  })

  if (error) {
    console.error('Erro ao salvar template:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/documents') // Para o futuro modal de criação
  return { success: true }
}
