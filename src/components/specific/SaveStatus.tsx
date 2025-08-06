'use client'

import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'

type SaveStatus = 'salvo' | 'salvando' | 'não salvo'

interface SaveStatusProps {
  status: SaveStatus
}

export function SaveStatus({ status }: SaveStatusProps) {
  switch (status) {
    case 'salvando':
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Salvando...</span>
        </div>
      )
    case 'salvo':
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <CheckCircle className="h-4 w-4" />
          <span>Salvo</span>
        </div>
      )
    case 'não salvo':
       return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <span>Alterações não salvas</span>
        </div>
      )
    default:
      return null
  }
}
