'use server'

import { createClient } from '../../../../lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createDocument() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const { data: document, error } = await supabase
    .from('documents')
    .insert({
      user_id: user.id,
      title: 'Novo Documento Sem Título',
      // os outros campos terão valores DEFAULT definidos no DB
    })
    .select('id')
    .single()

  if (error) {
    console.error('Erro ao criar documento:', error)
    // TODO: Adicionar um toast de erro aqui
    return
  }

  revalidatePath('/dashboard/documents')
  redirect(`/dashboard/documents/${document.id}`)
}
