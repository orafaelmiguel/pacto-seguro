import React from 'react'
import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/specific/AppSidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Menu } from 'lucide-react'
import { Toaster } from "@/components/ui/toaster"


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const userData = {
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
    email: user.email || '',
    avatarUrl: user.user_metadata?.avatar_url || null,
  }

  return (
    <SidebarProvider>
      <div className="md:grid md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)]">
        <AppSidebar user={userData} />
        <main>
          <div className="md:hidden flex items-center justify-end p-4">
            <SidebarTrigger>
              <Menu />
            </SidebarTrigger>
          </div>
          <div className="p-4 sm:p-6 md:p-8">{children}</div>
        </main>
      </div>
      <Toaster />
    </SidebarProvider>
  )
}
