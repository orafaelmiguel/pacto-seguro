"use server";

import { createClient } from "../../../../lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function signIn(formData: unknown) {
  const supabase = createClient();

  const parsedData = loginSchema.safeParse(formData);

  if (!parsedData.success) {
    return {
      error: "Dados do formulário inválidos.",
    };
  }

  const { email, password } = parsedData.data;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Erro no login:", error.message);
    return {
      error: "Credenciais inválidas. Verifique seu e-mail e senha.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard/documents");
}
