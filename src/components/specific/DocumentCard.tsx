'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Loader2 } from 'lucide-react'
import { deleteDocument } from '@/app/dashboard/documents/actions'
import { useToast } from '@/hooks/use-toast'

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'

type Recipient = {
  id: string
  name: string
  email: string
  status: 'pending' | 'viewed' | 'signed'
}

interface DocumentCardProps {
  id: string
  title: string
  status: 'draft' | 'sent' | 'completed'
  createdAt: string
  recipients?: Recipient[]
}

function DeleteConfirmationButton() {
  const { pending } = useFormStatus()
  return (
    <AlertDialogAction
      type="submit"
      className="bg-red-600 hover:bg-red-700"
      disabled={pending}
    >
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Confirmar Exclusão
    </AlertDialogAction>
  )
}

export function DocumentCard({
  id,
  title,
  status,
  createdAt,
  recipients,
}: DocumentCardProps) {
  const [state, formAction] = useFormState(deleteDocument, null)
  const { toast } = useToast()

  const formattedDate = new Date(createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  useEffect(() => {
    if (state?.success) {
      toast({
        title: 'Documento excluído!',
        description: 'O documento foi removido com sucesso.',
      })
    }
    if (state?.error) {
      toast({
        title: 'Erro ao excluir',
        description: state.error,
        variant: 'destructive',
      })
    }
  }, [state, toast])

  const cardContent = (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="space-y-1">
          <Link href={`/dashboard/documents/${id}`}>
            <CardTitle className="truncate hover:underline">{title}</CardTitle>
          </Link>
          <CardDescription>Criado em: {formattedDate}</CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/documents/${id}`}>Editar</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                onSelect={(e) => e.preventDefault()}
              >
                Excluir
              </DropdownMenuItem>
            </AlertDialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardFooter>
        <Badge
          variant={
            status === 'sent'
              ? 'default'
              : status === 'completed'
                ? 'success'
                : 'secondary'
          }
          className="capitalize"
        >
          {status === 'draft' && 'Rascunho'}
          {status === 'sent' && 'Enviado'}
          {status === 'completed' && 'Concluído'}
        </Badge>
      </CardFooter>
    </Card>
  )

  const isInteractive = status === 'sent' || status === 'completed'

  return (
    <AlertDialog>
      <Drawer>
        {isInteractive ? (
          <DrawerTrigger asChild>{cardContent}</DrawerTrigger>
        ) : (
          cardContent
        )}
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>
              Acompanhe o status de visualização e assinatura de cada
              destinatário.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <ul className="space-y-2">
              {recipients?.map((recipient) => (
                <li
                  key={recipient.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{recipient.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {recipient.email}
                    </span>
                  </div>
                  <Badge
                    variant={
                      recipient.status === 'signed'
                        ? 'success'
                        : recipient.status === 'viewed'
                          ? 'warning'
                          : 'secondary'
                    }
                  >
                    {recipient.status === 'pending' && 'Pendente'}
                    {recipient.status === 'viewed' && 'Visualizado'}
                    {recipient.status === 'signed' && 'Assinado'}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        </DrawerContent>
      </Drawer>
      <AlertDialogContent>
        <form action={formAction}>
          <input type="hidden" name="documentId" value={id} />
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente este
              documento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <DeleteConfirmationButton />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
