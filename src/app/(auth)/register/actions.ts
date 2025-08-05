"use server";

import { createClient } from "../../../../lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function signUp(formData: unknown) {
  const supabase = createClient();

  const parsedData = registerSchema.safeParse(formData);

  if (!parsedData.success) {
    return {
      error: "Dados do formulário inválidos.",
    };
  }

  const { name, email, password } = parsedData.data;

  // O 'name' é passado no 'options.data' para que o trigger possa usá-lo
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name,
      },
    },
  });

  if (error) {
    console.error("Erro no registro:", error.message);
    if (error.message.includes("User already registered")) {
        return { error: "Este e-mail já está em uso." };
    }
    if (error.message.includes("Password should be at least 6 characters")) {
        return { error: "A senha deve ter pelo menos 6 caracteres."};
    }
    return {
      error: "Ocorreu um erro ao criar a conta. Tente novamente.",
    };
  }
  
  // Fallback: se o trigger falhar, atualizamos o perfil manualmente.
  // Em uma aplicação real, você poderia monitorar se isso acontece.
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ name: name })
      .eq('id', data.user.id);
      
    if (profileError) {
      console.error("Erro ao atualizar perfil (fallback):", profileError.message);
      // Mesmo com erro aqui, o usuário foi criado.
      // Poderia-se criar uma fila de retentativa ou notificar.
      // Por enquanto, redirecionamos mesmo assim.
    }
  }

  redirect("/login?message=Conta criada com sucesso! Faça o login.");
}
