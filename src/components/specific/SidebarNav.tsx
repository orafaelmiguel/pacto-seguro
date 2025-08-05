'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { FileText, Settings } from 'lucide-react'

const sidebarNavItems = [
  {
    title: 'Documentos',
    href: '/dashboard/documents',
    icon: <FileText className="mr-2 h-4 w-4" />,
  },
  {
    title: 'Configurações',
    href: '/dashboard/settings',
    icon: <Settings className="mr-2 h-4 w-4" />,
  },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col space-y-1">
      {sidebarNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            pathname === item.href
              ? 'bg-muted hover:bg-muted'
              : 'hover:bg-transparent hover:underline',
            'justify-start'
          )}
        >
          {item.icon}
          {item.title}
        </Link>
      ))}
    </nav>
  )
}
