// src/app/(auth)/reset-password/actions.ts
"use server";

import { createClient } from "../../../../lib/supabase/server";
import { redirect } from 'next/navigation';

export async function updatePassword(formData: FormData) {
  const supabase = createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return { error: "As senhas não coincidem." };
  }

  const { error } = await supabase.auth.updateUser({ password: password });

  if (error) {
    console.error("Erro ao atualizar senha:", error.message);
    if (error.message.includes("Password should be at least 6 characters")) {
        return { error: "A nova senha deve ter pelo menos 6 caracteres." };
    }
    return { error: "Não foi possível redefinir a senha. O link pode ter expirado." };
  }
  
  redirect('/login?message=Senha redefinida com sucesso! Você já pode fazer o login.');
}
