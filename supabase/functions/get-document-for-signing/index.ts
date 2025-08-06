import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Trata a requisição pre-flight OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Extrai o token de acesso do corpo da requisição
    const { accessToken } = await req.json()
    if (!accessToken) {
      throw new Error('Access Token não fornecido.')
    }

    // Cria um cliente Supabase com a role de serviço para bypassar a RLS
    // As variáveis de ambiente são injetadas automaticamente no ambiente das Edge Functions
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Busca o destinatário pelo token e faz um join com a tabela de documentos
    const { data, error } = await supabaseClient
      .from('recipients')
      .select(`
        name,
        email,
        status,
        document:documents (
          title,
          content
        )
      `)
      .eq('access_token', accessToken)
      .single()

    if (error) {
      throw error
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Token de acesso inválido ou expirado.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    // Retorna os dados do documento e do destinatário
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    return new Response(String(err?.message ?? err), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
