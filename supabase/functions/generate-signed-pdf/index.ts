import { corsHeaders } from '../_shared/cors.ts'

// ... (Conteúdo da função getFinalDocumentHtml permanece o mesmo) ...
function getFinalDocumentHtml(
  documentTitle: string, 
  documentHtml: string, 
  signatureUrl: string, 
  signerName: string, 
  signerEmail: string,
  documentId: string,
  ipAddress: string | null
) {
  const signatureTimestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${documentTitle}</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="font-sans">
      <div class="p-8 max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold mb-4">${documentTitle}</h1>
        <div class="prose prose-lg max-w-none border-t border-b py-8">
          ${documentHtml}
        </div>
        
        <div class="mt-12">
          <h2 class="text-xl font-semibold mb-4">Assinatura</h2>
          <div class="flex items-center gap-8 p-4 border rounded-md">
            <img src="${signatureUrl}" alt="Assinatura" class="h-20"/>
            <div>
              <p class="font-semibold">${signerName}</p>
              <p class="text-sm text-gray-600">${signerEmail}</p>
              <p class="text-sm text-gray-600">Assinado em: ${signatureTimestamp}</p>
            </div>
          </div>
        </div>

        <div class="mt-12" style="page-break-before: always;">
          <h2 class="text-xl font-semibold mb-4">Trilha de Auditoria</h2>
          <div class="p-4 border rounded-md text-sm">
            <div class="grid grid-cols-2 gap-4">
              <p><strong>Documento ID:</strong> ${documentId}</p>
              <p><strong>Signatário:</strong> ${signerName}</p>
              <p><strong>E-mail:</strong> ${signerEmail}</p>
              <p><strong>Endereço IP:</strong> ${ipAddress || 'Não disponível'}</p>
              <p><strong>Timestamp da Assinatura:</strong> ${signatureTimestamp}</p>
              <p><strong>Status:</strong> Assinado Digitalmente</p>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}


Deno.serve(async (req) => {
  // LOG DE DEPURAÇÃO 1: Primeira linha a ser executada
  console.log('[DEBUG] Edge Function generate-signed-pdf INVOCADA.');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      documentTitle, 
      documentHtml, 
      signerName,
      signerEmail,
      signatureUrl,
      documentId,
      recipientId 
    } = await req.json()
    
    // LOG DE DEPURAÇÃO 2: Confirmar que o corpo JSON foi lido
    console.log(`[DEBUG] Dados recebidos para o documento: ${documentTitle}`);
    
    const ipAddress = req.headers.get('x-forwarded-for') ?? req.headers.get('remote-addr')

    const finalHtml = getFinalDocumentHtml(
        documentTitle,
        documentHtml,
        signatureUrl,
        signerName,
        signerEmail,
        documentId,
        ipAddress
    );

    const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY')
    if (!browserlessApiKey) {
        throw new Error('BROWSERLESS_API_KEY não está configurada como secret na Supabase.')
    }
    // URL ATUALIZADA de acordo com a documentação da Browserless.io
    const browserlessUrl = `https://production-sfo.browserless.io/pdf?token=${browserlessApiKey}`

    // LOG DE DEPURAÇÃO 3: Antes de chamar a API externa
    console.log('[DEBUG] Chamando a API do Browserless.io...');

    const pdfResponse = await fetch(browserlessUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html: finalHtml,
        options: {
          format: 'A4',
          printBackground: true,
          margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
        },
      }),
    })

    // LOG DE DEPURAÇÃO 4: Após a chamada da API externa
    console.log(`[DEBUG] Resposta da Browserless.io: Status ${pdfResponse.status}`);

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text()
      throw new Error(`Erro ao gerar PDF pela Browserless.io: ${errorText}`)
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    
    console.log('[DEBUG] PDF gerado com sucesso, retornando o buffer.');
    
    return new Response(pdfBuffer, {
      headers: { ...corsHeaders, 'Content-Type': 'application/pdf' },
      status: 200,
    })

  } catch (err) {
    // LOG DE DEPURAÇÃO 5: Erro capturado no bloco catch
    console.error('[ERRO FATAL] Erro na Edge Function generate-signed-pdf:', err.message);
    return new Response(String(err?.message ?? err), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
