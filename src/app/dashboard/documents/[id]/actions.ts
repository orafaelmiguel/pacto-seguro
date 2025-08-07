'use server'

import { createClient } from '../../../../../lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import SignatureInvitationEmail from '@/components/emails/SignatureInvitationEmail'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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

interface RecipientData {
  name: string
  email: string
}

export async function sendDocumentForSignature(
  documentId: string,
  recipients: RecipientData[],
) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Usuário não autenticado.' }
  }

  // 1. Preparar dados dos destinatários
  const recipientsData = recipients.map((r) => ({
    document_id: documentId,
    email: r.email,
    name: r.name || null,
    // access_token é gerado por padrão pelo banco de dados
  }))

  // 2. Inserir os destinatários
  const { data: insertedRecipients, error: insertError } = await supabase
    .from('recipients')
    .insert(recipientsData)
    .select()

  if (insertError) {
    console.error('Erro ao inserir destinatários:', insertError)
    return { success: false, error: 'Não foi possível salvar os destinatários.' }
  }

  // 3. Atualizar o status do documento
  const { error: updateError } = await supabase
    .from('documents')
    .update({ status: 'sent' })
    .eq('id', documentId)

  if (updateError) {
    console.error('Erro ao atualizar status do documento:', updateError)
    // Idealmente, aqui teríamos um rollback da inserção dos recipients.
    // Por simplicidade, vamos apenas reportar o erro.
    return {
      success: false,
      error: 'Os destinatários foram salvos, mas não foi possível atualizar o status do documento.',
    }
  }

  // 4. Enviar e-mails para cada destinatário
  try {
    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .select('title')
      .eq('id', documentId)
      .single()

    if (documentError || !documentData) {
      throw new Error('Documento não encontrado para o envio de e-mails.')
    }
    
    const senderName = user.user_metadata.full_name || user.email || 'Alguém';
    
    for (const recipient of insertedRecipients) {
      const invitationLink = `${baseUrl}/sign/${recipient.access_token}`
      
      await resend.emails.send({
        from: 'Pacto Seguro <onboarding@resend.dev>', // Substituir pelo seu domínio verificado
        to: recipient.email,
        subject: `Convite para assinar: ${documentData.title}`,
        react: SignatureInvitationEmail({
          documentTitle: documentData.title,
          senderName,
          invitationLink,
        }),
      });
    }
  } catch (emailError) {
    console.error('Erro ao enviar e-mails:', emailError)
    // Opcional: decidir se quer reverter o status do documento ou notificar o usuário
    // de uma forma diferente. Por ora, retornamos sucesso, pois a parte crítica (DB) funcionou.
    // Poderíamos adicionar um campo no recipient para 'email_sent_status'
    return {
      success: true, // Ainda consideramos sucesso no fluxo principal
      warning: 'O documento foi registrado, mas houve um erro ao enviar os e-mails de convite.'
    }
  }

  revalidatePath(`/dashboard/documents/${documentId}`)
  revalidatePath('/dashboard/documents')
  return { success: true }
}
