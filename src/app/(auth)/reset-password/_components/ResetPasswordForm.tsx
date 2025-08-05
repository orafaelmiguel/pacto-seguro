// src/app/(auth)/reset-password/_components/ResetPasswordForm.tsx
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
import { updatePassword } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Redefinindo..." : "Redefinir Senha"}
    </Button>
  );
}

export function ResetPasswordForm() {
    const [error, setError] = useState("");

    const handleSubmit = async (formData: FormData) => {
        const result = await updatePassword(formData);
        if (result?.error) {
            setError(result.error)
        }
    }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Redefinir sua senha</CardTitle>
          <CardDescription className="text-center">
            Digite sua nova senha abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                />
              </div>
              {error && <p className="text-sm text-center text-red-500">{error}</p>}
              <SubmitButton />
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
