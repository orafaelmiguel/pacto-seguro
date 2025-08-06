'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import Link from 'next/link'
import { DocumentEditor } from '@/components/specific/DocumentEditor'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { SaveStatus } from '@/components/specific/SaveStatus'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { updateDocumentTitle, updateDocumentContent } from '../actions'
import { cn } from '@/lib/utils'
import debounce from 'lodash.debounce'

type SaveStatus = 'salvo' | 'salvando' | 'não salvo'

interface DocumentData {
  id: string
  title: string
  content: any | null
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

      // Usaremos Promise.all para salvar ambos em paralelo, se necessário
      const titlePromise = updateDocumentTitle(document.id, newTitle)
      const contentPromise = updateDocumentContent(document.id, newContent)

      const [titleResult, contentResult] = await Promise.all([
        titlePromise,
        contentPromise,
      ])

      if (titleResult.success && contentResult.success) {
        setSaveStatus('salvo')
        // Toast opcional para salvamento manual
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
          <div className="flex items-center gap-4">
            <SaveStatus status={saveStatus} />
            <Button onClick={handleManualSave} disabled={saveStatus !== 'não salvo' || isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar
            </Button>
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

