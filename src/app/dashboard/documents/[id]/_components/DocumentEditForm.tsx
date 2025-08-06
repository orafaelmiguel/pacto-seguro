'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import Link from 'next/link'
import { DocumentEditor } from '@/components/specific/DocumentEditor'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { SaveStatus } from '@/components/specific/SaveStatus'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { updateDocumentTitle, updateDocumentContent, saveAsTemplate } from '../actions'
import { cn } from '@/lib/utils'
import debounce from 'lodash.debounce'

type SaveStatus = 'salvo' | 'salvando' | 'não salvo'

interface DocumentData {
  id: string
  title: string
  content: any | null
}

function SaveAsTemplateDialog({ content }: { content: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const [templateTitle, setTemplateTitle] = useState('')
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleSave = () => {
    if (!templateTitle) {
      toast({
        title: 'Nome do template é obrigatório',
        variant: 'destructive',
      })
      return
    }

    startTransition(async () => {
      const result = await saveAsTemplate(templateTitle, content)
      if (result.success) {
        toast({ title: 'Template salvo com sucesso!' })
        setIsOpen(false)
        setTemplateTitle('')
      } else {
        toast({
          title: 'Erro ao salvar o template',
          description: result.error,
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Salvar como Template</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Salvar como Template</DialogTitle>
          <DialogDescription>
            Digite um nome para o seu novo template. Ele estará disponível na
            criação de novos documentos.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="template-title" className="text-right">
              Nome
            </Label>
            <Input
              id="template-title"
              value={templateTitle}
              onChange={(e) => setTemplateTitle(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


export function DocumentEditForm({ document }: { document: DocumentData }) {
  const { toast } = useToast()
  const [isSaving, startTransition] = useTransition()

  const [title, setTitle] = useState(document.title)
  const [content, setContent] = useState(document.content)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('salvo')

  const saveDocument = useCallback(async (newTitle: string, newContent: any) => {
    startTransition(async () => {
      setSaveStatus('salvando')
      
      const titlePromise = updateDocumentTitle(document.id, newTitle)
      const contentPromise = updateDocumentContent(document.id, newContent)

      const [titleResult, contentResult] = await Promise.all([
        titlePromise,
        contentPromise,
      ])

      if (titleResult.success && contentResult.success) {
        setSaveStatus('salvo')
      } else {
        setSaveStatus('não salvo')
        toast({
          title: 'Erro ao salvar',
          description: 'Não foi possível salvar suas alterações.',
          variant: 'destructive',
        })
      }
    })
  }, [document.id, toast])

  const debouncedSave = useCallback(
    debounce((newTitle: string, newContent: any) => {
      saveDocument(newTitle, newContent)
    }, 1500),
    [saveDocument]
  )

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    setSaveStatus('não salvo')
    debouncedSave(newTitle, content)
  }
  
  const handleContentUpdate = useCallback((newContent: any) => {
    setContent(newContent)
    setSaveStatus('não salvo')
    debouncedSave(title, newContent)
  }, [title, debouncedSave])

  const handleManualSave = () => {
    saveDocument(title, content)
     toast({
        title: 'Documento Salvo!',
        description: 'Suas alterações foram salvas manualmente.',
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
        <div className="flex items-center justify-between gap-4">
          <Input
            value={title}
            onChange={handleTitleChange}
            className="text-2xl font-bold !outline-none !ring-0 !border-0 focus-visible:!ring-offset-0 focus-visible:!ring-0 p-0"
            placeholder="Título do Documento"
          />
          <div className="flex items-center gap-2">
            <SaveStatus status={saveStatus} />
            <Button onClick={handleManualSave} disabled={saveStatus !== 'não salvo' || isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar
            </Button>
            <SaveAsTemplateDialog content={content} />
          </div>
        </div>
      </div>
      <DocumentEditor
        initialContent={content}
        onUpdate={handleContentUpdate}
      />
    </div>
  )
}

