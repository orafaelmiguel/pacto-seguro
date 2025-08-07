// src/app/api/generate-pdf/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const {
      documentTitle,
      documentHtml,
      signerName,
      signerEmail,
      signatureUrl,
      documentId,
      recipientId
    } = await request.json();
    
    const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;

    if (!BROWSERLESS_API_KEY) {
      throw new Error("A variável de ambiente BROWSERLESS_API_KEY não foi definida.");
    }
     if (!documentHtml || !signatureUrl) {
      throw new Error("HTML do documento e URL da assinatura são obrigatórios.");
    }

    const finalHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>${documentTitle}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 800px; margin: 40px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          h1 { color: #222; border-bottom: 2px solid #eee; padding-bottom: 10px; }
          .document-content { margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
          .signature-section { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; }
          .signature-box { display: flex; align-items: center; justify-content: space-between; }
          .signature-img { max-width: 250px; max-height: 100px; }
          .audit-trail { font-size: 0.8em; color: #666; margin-top: 30px; }
          .footer { text-align: center; font-size: 0.75em; color: #aaa; margin-top: 40px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${documentTitle}</h1>
          <div class="document-content">${documentHtml}</div>
          <div class="signature-section">
            <h3>Assinatura Eletrônica</h3>
            <div class="signature-box">
              <div>
                <p><strong>Signatário:</strong> ${signerName}</p>
                <p><strong>E-mail:</strong> ${signerEmail}</p>
                <p><strong>Data/Hora (UTC):</strong> ${new Date().toISOString()}</p>
              </div>
              <img src="${signatureUrl}" alt="Assinatura" class="signature-img"/>
            </div>
          </div>
          <div class="audit-trail">
            <p><strong>Documento ID:</strong> ${documentId}</p>
            <p><strong>Destinatário ID:</strong> ${recipientId}</p>
            <p><strong>IP do Signatário:</strong> ${request.headers.get("x-forwarded-for") ?? "Não disponível"}</p>
          </div>
        </div>
        <div class="footer">
          <p>Documento gerado e assinado através da plataforma Pacto Seguro.</p>
        </div>
      </body>
      </html>
    `;
    
    const BROWSERLESS_URL = `https://production-sfo.browserless.io/pdf?token=${BROWSERLESS_API_KEY}`;

    const pdfResponse = await fetch(BROWSERLESS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: finalHtml,
        options: {
          format: 'A4',
          printBackground: true,
          margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
        }
      })
    });

    if (!pdfResponse.ok) {
        const errorText = await pdfResponse.text();
        throw new Error(`Browserless API respondeu com status ${pdfResponse.status}: ${errorText}`);
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    return new Response(pdfBuffer, {
      headers: { "Content-Type": "application/pdf" },
      status: 200,
    });

  } catch (error) {
    console.error("Erro ao gerar PDF via API Route:", error);
    return NextResponse.json(
      { error: (error as Error).message }, 
      { status: 500 }
    );
  }
}
