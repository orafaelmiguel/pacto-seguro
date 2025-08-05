// src/app/(auth)/forgot-password/actions.ts
"use server";

import { createClient } from "../../../../lib/supabase/server";

export async function requestPasswordReset(formData: FormData) {
  const supabase = createClient();
  const email = formData.get("email") as string;

  if (!email) {
    return {
      message: "O e-mail é obrigatório.",
    };
  }
  
  // A URL base deve vir de uma variável de ambiente em produção
  const redirectUrl = `http://localhost:3000/auth/callback?next=/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });

  if (error) {
    console.error("Erro ao solicitar redefinição de senha:", error.message);
    // Não retornamos o erro para o cliente para evitar a enumeração de usuários.
  }

  return {
    message:
      "Se um usuário com este e-mail existir, um link de recuperação foi enviado.",
  };
}
