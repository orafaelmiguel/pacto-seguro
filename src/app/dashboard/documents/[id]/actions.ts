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
