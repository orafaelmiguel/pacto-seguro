// src/app/dashboard/settings/_components/ProfileForm.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateProfile } from "../actions";
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition } from "react";

// Um componente simples para o botão de envio para lidar com o estado de pending
function SubmitButton({ isPending, text, pendingText }: { isPending: boolean, text: string, pendingText: string }) {
    return (
        <Button type="submit" disabled={isPending}>
            {isPending ? pendingText : text}
        </Button>
    )
}

export function ProfileForm({ profile }: { profile: { id: string, name: string | null, avatar_url: string | null } }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const action = (formData: FormData) => {
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result?.error) {
        toast({
          title: "Erro",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso!",
          description: result.message,
        });
      }
    });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>Atualize seu nome aqui.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" defaultValue={profile.name ?? ""} />
            </div>
            <SubmitButton isPending={isPending} text="Salvar Alterações" pendingText="Salvando..." />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Foto de Perfil</CardTitle>
          <CardDescription>Faça o upload da sua imagem de perfil.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-8">
            <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback>{profile.name?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
            </Avatar>
            <form action={action} className="flex-1 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="avatar">Nova Foto</Label>
                    <Input id="avatar" name="avatar" type="file" accept="image/*" />
                </div>
                <SubmitButton isPending={isPending} text="Salvar Foto" pendingText="Enviando..." />
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
