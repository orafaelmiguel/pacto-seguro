// src/app/dashboard/settings/page.tsx
import { createClient } from '../../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileForm } from './_components/ProfileForm';

export default async function SettingsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    // Pode ser que o perfil ainda não foi criado pelo trigger,
    // ou houve um erro de rede.
    // Em uma app real, você poderia ter uma página de erro melhor.
    console.error('Erro ao buscar perfil:', error?.message);
    // Poderíamos redirecionar ou mostrar uma mensagem padrão.
    // Por simplicidade, vamos passar um perfil vazio.
    return <ProfileForm profile={{ id: user.id, name: '', avatar_url: '' }} />;
  }

  return <ProfileForm profile={profile} />;
}
