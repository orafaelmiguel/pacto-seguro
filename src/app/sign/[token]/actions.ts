'use server'

import { createClient as createServerClient } from '../../../../lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Resend } from 'resend'
import SignedDocumentEmail from '@/components/emails/SignedDocumentEmail'
import { generateHTML } from '@tiptap/html/server'
import StarterKit from '@tiptap/starter-kit'
import { FunctionsHttpError } from '@supabase/supabase-js'

const extensions = [StarterKit]
const resend = new Resend(process.env.RESEND_API_KEY)

interface SubmitSignaturePayload {
  token: string
  signatureDataUrl: string
  signerName: string
}

export async function submitSignature(payload: SubmitSignaturePayload) {
  console.log('Server Action: Iniciando processo de assinatura para o token:', payload.token)
  
  // Cliente que age em nome do usuário (respeita RLS do DB)
  const supabase = createServerClient()
  
  // Cliente Admin com service_role (ignora RLS, para uso no Storage)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: recipient, error: recipientError } = await supabase
    .from('recipients')
    .select('*, document:documents(title, content)')
    .eq('access_token', payload.token)
    .single()

  if (recipientError || !recipient) {
    return { success: false, message: 'Este link de assinatura é inválido ou expirou.' }
  }

  if (recipient.status === 'signed') {
    return { success: false, message: 'Este documento já foi assinado.' }
  }

  const signaturePath = `signatures/${recipient.id}/${Date.now()}.png`;
  const signatureImage = Buffer.from(
    payload.signatureDataUrl.replace(/^data:image\/png;base64,/, ''),
    'base64'
  );

  // Usar o cliente ADMIN para o upload da assinatura
  const { error: uploadError } = await supabaseAdmin.storage
    .from('signatures')
    .upload(signaturePath, signatureImage, {
      contentType: 'image/png',
    });

  if (uploadError) {
    console.error('Erro ao fazer upload da assinatura:', uploadError);
    return { success: false, message: 'Não foi possível salvar a imagem da assinatura.' };
  }
  
  // Usar o cliente ADMIN para obter a URL pública
  const { data: { publicUrl: signatureUrl } } = supabaseAdmin
    .storage
    .from('signatures')
    .getPublicUrl(signaturePath)

  if (!signatureUrl) {
    return { success: false, message: 'Não foi possível obter a URL da assinatura.' };
  }

  // Garante que o conteúdo do documento seja um JSON válido para o TipTap
  const documentContent =
    recipient.document.content &&
    typeof recipient.document.content === 'object' &&
    (recipient.document.content as any).type === 'doc'
      ? recipient.document.content
      : { type: 'doc', content: [] } // Padrão de documento vazio

  const contentHtml = generateHTML(documentContent, extensions) || '&nbsp;';

  const pdfResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/generate-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      documentTitle: recipient.document.title,
      documentHtml: contentHtml,
      signerName: payload.signerName,
      signerEmail: recipient.email,
      signatureUrl: signatureUrl,
      documentId: recipient.document_id,
      recipientId: recipient.id,
    }),
  });

  if (!pdfResponse.ok) {
    const errorBody = await pdfResponse.json();
    console.error('Erro detalhado da API Route (generate-pdf):', errorBody);
    return { success: false, message: 'Não foi possível gerar o documento final.' };
  }
  
  const pdfBlob = await pdfResponse.blob();
  const pdfBuffer = await pdfBlob.arrayBuffer();

  const { data: uploadData, error: pdfUploadError } = await supabase.functions.invoke(
    'upload-signed-pdf',
    {
      headers: {
        'x-document-id': recipient.document_id,
        'x-recipient-id': recipient.id,
      },
      body: pdfBuffer,
    }
  );
  
  if (pdfUploadError) {
     if (pdfUploadError instanceof FunctionsHttpError) {
      const errorBody = await pdfUploadError.context.text();
      console.error('Erro detalhado da Edge Function (upload-signed-pdf):', errorBody);
    } else {
       console.error('Erro ao salvar o PDF final:', pdfUploadError);
    }
    return { success: false, message: 'Não foi possível salvar o documento final.' };
  }

  const pdfPath = (uploadData as any).pdfPath;
  console.log('Server Action: PDF salvo com sucesso via Edge Function. Path:', pdfPath);

  const { error: updateError } = await supabase
    .from('recipients')
    .update({
      status: 'signed',
      signed_at: new Date().toISOString(),
      signed_document_path: pdfPath,
      name: payload.signerName
    })
    .eq('id', recipient.id);

  if (updateError) {
    console.error('Erro ao atualizar o destinatário:', updateError);
    return { success: false, message: 'Não foi possível finalizar o processo de assinatura.' };
  }

  const { data: otherRecipients, error: checkError } = await supabase
    .from('recipients')
    .select('status')
    .eq('document_id', recipient.document_id)
    .neq('id', recipient.id);

  if (checkError) {
    console.error('Erro ao verificar outros destinatários:', checkError);
  } else {
    const allSigned = otherRecipients.every(r => r.status === 'signed');
    if (allSigned) {
      await supabase
        .from('documents')
        .update({ status: 'completed' })
        .eq('id', recipient.document_id);
      
      console.log('Server Action: Todos os destinatários assinaram. Documento concluído.');
    }
  }

  try {
    // Etapa 1: Obter o user_id do criador a partir do documento
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .select('title, user_id')
      .eq('id', recipient.document_id)
      .single();
      
    if (docError || !docData?.user_id) {
      console.error('Erro ao buscar documento ou user_id:', docError);
      throw new Error('Não foi possível encontrar os dados do documento ou do criador.');
    }

    // Etapa 2: Usar o cliente admin para buscar os dados do criador pelo ID
    const { data: { user: owner }, error: ownerError } = await supabaseAdmin.auth.admin.getUserById(docData.user_id);

    if (ownerError || !owner) {
      console.error('Erro ao buscar criador do documento:', ownerError);
      throw new Error('Não foi possível encontrar os dados do criador do documento.');
    }
    
    // Etapa 3: Preparar dados e enviar e-mails
    const ownerName = owner.user_metadata?.full_name || owner.email;
    const documentTitle = docData.title;

    await resend.emails.send({
      from: 'Pacto Seguro <onboarding@resend.dev>',
      to: recipient.email,
      subject: `Documento Assinado: ${documentTitle}`,
      react: SignedDocumentEmail({
        documentTitle: documentTitle,
        recipientName: payload.signerName,
        ownerName: ownerName,
        isOwner: false,
      }),
      attachments: [{
        filename: `${documentTitle.replace(/\s/g, '_')}_assinado.pdf`,
        content: Buffer.from(pdfBuffer),
      }],
    });

    await resend.emails.send({
      from: 'Pacto Seguro <onboarding@resend.dev>',
      to: owner.email!, // Email do criador
      subject: `Seu Documento Foi Assinado: ${documentTitle}`,
      react: SignedDocumentEmail({
        documentTitle: documentTitle,
        recipientName: payload.signerName,
        ownerName: ownerName,
        isOwner: true,
      }),
      attachments: [{
        filename: `${documentTitle.replace(/\s/g, '_')}_assinado.pdf`,
        content: Buffer.from(pdfBuffer),
      }],
    });

    console.log('Server Action: E-mails de confirmação enviados com sucesso.');

  } catch (emailError) {
    console.error("Erro ao enviar e-mails de confirmação:", emailError);
  }

  revalidatePath(`/sign/${payload.token}`);
  
  redirect('/thank-you');
}

export async function markRecipientAsViewed(token: string) {
  try {
    const supabase = createServerClient()
    const { data: recipient, error } = await supabase
      .from('recipients')
      .select('id, status')
      .eq('access_token', token)
      .single()

    if (error || !recipient) {
      console.log(`[ViewAction] Destinatário não encontrado para o token: ${token}`, error)
      return { success: false, message: 'Destinatário não encontrado.' }
    }

    // Só atualiza se o status atual for 'pendente'
    if (recipient.status === 'pending') {
      const { error: updateError } = await supabase
        .from('recipients')
        .update({ status: 'viewed' })
        .eq('id', recipient.id)

      if (updateError) {
        console.error(`[ViewAction] Erro ao atualizar status para 'viewed' para o recipient ${recipient.id}:`, updateError)
        return { success: false, message: 'Erro ao marcar como visualizado.' }
      }
      
      console.log(`[ViewAction] Destinatário ${recipient.id} marcado como 'visualizado'.`)
      revalidatePath('/dashboard/documents') // Invalida o cache do dashboard
      return { success: true }
    }
    
    console.log(`[ViewAction] Status do destinatário ${recipient.id} já é '${recipient.status}', nenhuma ação tomada.`)
    return { success: true, message: 'Status já atualizado.' }
  } catch (e) {
    console.error('[ViewAction] Erro inesperado:', e)
    return { success: false, message: 'Ocorreu um erro inesperado.' }
  }
}

