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

  const contentHtml = generateHTML(recipient.document.content, extensions);

  const { data: pdfBuffer, error: pdfError } = await supabase.functions.invoke(
    'generate-signed-pdf', 
    {
      body: {
        documentTitle: recipient.document.title,
        documentHtml: contentHtml,
        signerName: payload.signerName,
        signerEmail: recipient.email,
        signatureUrl: signatureUrl,
        documentId: recipient.document_id,
        recipientId: recipient.id,
      },
      responseType: 'arraybuffer'
    }
  );

  if (pdfError || !pdfBuffer) {
    if (pdfError instanceof FunctionsHttpError) {
      const errorBody = await pdfError.context.text();
      console.error('Erro detalhado da Edge Function (generate-signed-pdf):', errorBody);
    } else {
       console.error('Erro ao gerar o PDF:', pdfError);
    }
    return { success: false, message: 'Não foi possível gerar o documento final.' };
  }

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
    const { data: docInfo } = await supabase
      .from('documents')
      .select('title, user:users(email, user_metadata)')
      .eq('id', recipient.document_id)
      .single();

    if (!docInfo || !docInfo.user) {
      throw new Error('Não foi possível encontrar os dados do criador do documento.');
    }

    const owner = docInfo.user;
    const ownerName = owner.user_metadata?.full_name || owner.email;

    await resend.emails.send({
      from: 'Pacto Seguro <onboarding@resend.dev>',
      to: recipient.email,
      subject: `Documento Assinado: ${docInfo.title}`,
      react: SignedDocumentEmail({
        documentTitle: docInfo.title,
        recipientName: payload.signerName,
        ownerName: ownerName,
        isOwner: false,
      }),
      attachments: [{
        filename: `${docInfo.title.replace(/\s/g, '_')}_assinado.pdf`,
        content: Buffer.from(pdfBuffer),
      }],
    });

    await resend.emails.send({
      from: 'Pacto Seguro <onboarding@resend.dev>',
      to: owner.email,
      subject: `Seu Documento Foi Assinado: ${docInfo.title}`,
      react: SignedDocumentEmail({
        documentTitle: docInfo.title,
        recipientName: payload.signerName,
        ownerName: ownerName,
        isOwner: true,
      }),
      attachments: [{
        filename: `${docInfo.title.replace(/\s/g, '_')}_assinado.pdf`,
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
