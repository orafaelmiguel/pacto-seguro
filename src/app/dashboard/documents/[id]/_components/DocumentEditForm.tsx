'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DocumentEditor } from '@/components/specific/DocumentEditor'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Loader2, ChevronLeft } from 'lucide-react'
import { updateDocument } from '../actions'
import { cn } from '@/lib/utils'

interface DocumentData {
  id: string
  title: string
  content: any | null
}

export function DocumentEditForm({ document }: { document: DocumentData }) {
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [title, setTitle] = useState(document.title)
  const [content, setContent] = useState(document.content)

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateDocument({
        documentId: document.id,
        title,
        content,
      })

      if (result.success) {
        toast({
          title: 'Documento salvo!',
          description: 'Suas alterações foram salvas com sucesso.',
        })
        router.refresh()
      } else {
        toast({
          title: 'Erro ao salvar',
          description: result.error || 'Não foi possível salvar o documento.',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/dashboard/documents"
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            'mb-4'
          )}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Voltar para Documentos
        </Link>
        <div className="flex items-center justify-between">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-bold !outline-none !ring-0 !border-0 focus-visible:!ring-offset-0 focus-visible:!ring-0 p-0"
            placeholder="Título do Documento"
          />
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </div>
      </div>
      <DocumentEditor
        initialContent={content}
        onContentChange={(newContent) => setContent(newContent)}
      />
    </div>
  )
}

