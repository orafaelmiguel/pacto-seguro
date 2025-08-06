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

export async function deleteDocument(prevState: any, formData: FormData) {
  const supabase = createClient()
  const documentId = formData.get('documentId') as string

  const { error } = await supabase.from('documents').delete().eq('id', documentId)

  if (error) {
    console.error('Erro ao deletar documento:', error)
    // TODO: Adicionar um toast de erro aqui
    return { error: error.message }
  }

  revalidatePath('/dashboard/documents')

  return { success: true }
}

export async function getTemplates() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Usuário não autenticado.' }
  }

  const { data: templates, error } = await supabase
    .from('templates')
    .select('id, title')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar templates:', error)
    return { error: error.message }
  }

  return { templates }
}

export async function createDocumentFromTemplate(templateId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // 1. Buscar o template
  const { data: template, error: templateError } = await supabase
    .from('templates')
    .select('title, content')
    .eq('id', templateId)
    .eq('user_id', user.id)
    .single()

  if (templateError || !template) {
    console.error('Erro ao buscar template:', templateError)
    // TODO: Adicionar toast de erro
    return
  }

  // 2. Criar novo documento com os dados do template
  const { data: document, error: documentError } = await supabase
    .from('documents')
    .insert({
      user_id: user.id,
      title: `${template.title} (Cópia)`,
      content: template.content,
    })
    .select('id')
    .single()
  
  if (documentError) {
    console.error('Erro ao criar documento a partir do template:', documentError)
    // TODO: Adicionar toast de erro
    return
  }

  revalidatePath('/dashboard/documents')
  redirect(`/dashboard/documents/${document.id}`)
}
