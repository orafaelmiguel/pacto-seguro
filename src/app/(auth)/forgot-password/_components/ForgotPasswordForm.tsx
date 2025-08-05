// src/app/(auth)/forgot-password/_components/ForgotPasswordForm.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useState } from "react";
import { requestPasswordReset } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Enviando..." : "Enviar link de recuperação"}
    </Button>
  );
}

export function ForgotPasswordForm() {
    const [message, setMessage] = useState("");

    const handleSubmit = async (formData: FormData) => {
        const result = await requestPasswordReset(formData);
        setMessage(result.message);
    }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Esqueceu sua senha?</CardTitle>
          <CardDescription className="text-center">
            Sem problemas. Digite seu e-mail e enviaremos um link para você
            redefinir sua senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message ? (
            <p className="text-center text-green-600 bg-green-50 p-4 rounded-md">{message}</p>
          ) : (
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <SubmitButton />
            </form>
          )}
           <div className="mt-4 text-center text-sm">
              <Link href="/login" className="underline">
                Voltar para o login
              </Link>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
