'use server'

import { createClient } from '../../../../../lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

interface UpdateDocumentPayload {
  documentId: string
  content: any // TipTap content is JSON
  title: string
}

export async function updateDocument(payload: UpdateDocumentPayload) {
  const { documentId, content, title } = payload
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const { error } = await supabase
    .from('documents')
    .update({
      content,
      title,
    })
    .eq('id', documentId)
    .eq('user_id', user.id) // RLS also handles this

  if (error) {
    console.error('Error updating document:', error)
    return { success: false, error: error.message }
  }

  // Revalidate the path to show the updated content if user navigates back
  revalidatePath('/dashboard/documents')
  // Revalidate the current page to update any server components if needed
  revalidatePath(`/dashboard/documents/${documentId}`)

  return { success: true }
}
