'use server'

interface SubmitSignaturePayload {
  token: string
  signatureDataUrl: string
  signerName: string
}

export async function submitSignature(payload: SubmitSignaturePayload) {
  console.log('Server Action chamada:', payload)

  // TODO: Implementar a lógica de verificação do token,
  // upload da assinatura para o Supabase Storage,
  // e atualização do status do recipient no banco de dados.
  
  // Por enquanto, apenas simula o sucesso.
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simula latência da rede

  return { success: true, message: 'Assinatura enviada com sucesso!' }
}
