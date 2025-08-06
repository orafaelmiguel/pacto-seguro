import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // A requisição agora contém o buffer do PDF diretamente
    const pdfBuffer = await req.arrayBuffer();
    
    // Os outros dados vêm nos headers
    const documentId = req.headers.get('x-document-id');
    const recipientId = req.headers.get('x-recipient-id');

    if (!documentId || !recipientId || !pdfBuffer) {
      throw new Error('Dados insuficientes para o upload do PDF.');
    }
    
    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    const pdfPath = `signed-documents/${documentId}/${recipientId}.pdf`;
    
    const { error: pdfUploadError } = await supabaseAdminClient
      .storage
      .from('signed-documents')
      .upload(pdfPath, pdfBuffer, { contentType: 'application/pdf', upsert: true });

    if (pdfUploadError) throw pdfUploadError

    return new Response(JSON.stringify({ pdfPath }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    return new Response(String(err?.message ?? err), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
