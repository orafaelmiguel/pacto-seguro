// src/app/auth/callback/route.ts
import { createClient } from '../../../../lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(requestUrl.origin + next);
    }
  }

  // URL para redirecionar em caso de erro ou se não houver código
  console.error("Erro no callback de autenticação ou código não encontrado.");
  return NextResponse.redirect(requestUrl.origin + '/login?error=Nao_foi_possivel_autenticar');
}
