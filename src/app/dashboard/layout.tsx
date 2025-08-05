// src/app/dashboard/layout.tsx
import React from 'react';
import { createClient } from '../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import { UserNav } from '@/components/specific/UserNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-800">
        <h1 className="text-2xl font-bold">Pacto Seguro</h1>
        <UserNav />
      </header>
      <main className="flex-1 p-8 bg-gray-50 dark:bg-gray-900">{children}</main>
    </div>
  );
}
