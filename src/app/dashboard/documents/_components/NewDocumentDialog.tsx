'use client'

import { useState, useTransition, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createDocument, getTemplates, createDocumentFromTemplate } from '../actions'
import { Loader2, File, ChevronLeft } from 'lucide-react'
import { Card, CardDescription } from '@/components/ui/card'

type Template = {
  id: string
  title: string
}

export function NewDocumentDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<'initial' | 'templates'>('initial')
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, startTransition] = useTransition()

  const handleCreateBlank = () => {
    startTransition(() => {
      createDocument()
    })
  }

  const handleCreateFromTemplate = (templateId: string) => {
    startTransition(() => {
      createDocumentFromTemplate(templateId)
    })
  }
  
  useEffect(() => {
    if (view === 'templates' && isOpen) {
      const fetchTemplates = async () => {
        setIsLoading(true)
        const result = await getTemplates()
        if (result.templates) {
          setTemplates(result.templates)
        }
        setIsLoading(false)
      }
      fetchTemplates()
    }
  }, [view, isOpen])

  const resetView = () => setView('initial')
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) {
          setTimeout(resetView, 300) // Dá tempo para a animação de fechar
        }
      }}>
      <DialogTrigger asChild>
        <Button>Novo Documento</Button>
      </DialogTrigger>
      <DialogContent>
        {view === 'initial' && (
          <>
            <DialogHeader>
              <DialogTitle>Criar Novo Documento</DialogTitle>
              <DialogDescription>
                Comece com um documento em branco ou use um de seus templates.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-around py-4">
              <Button variant="outline" size="lg" onClick={handleCreateBlank} disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar em Branco
              </Button>
              <Button size="lg" onClick={() => setView('templates')}>Usar Template</Button>
            </div>
          </>
        )}
        {view === 'templates' && (
          <>
            <DialogHeader>
               <Button variant="ghost" size="sm" className="absolute left-4 top-4" onClick={resetView}>
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </Button>
              <DialogTitle className="text-center">Escolha um Template</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-2">
              {isLoading || isCreating ? (
                <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : templates.length > 0 ? (
                templates.map(template => (
                  <Card 
                    key={template.id} 
                    className="p-4 hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleCreateFromTemplate(template.id)}
                  >
                    <CardDescription>{template.title}</CardDescription>
                  </Card>
                ))
              ) : (
                <p className="text-center text-muted-foreground">Nenhum template encontrado.</p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
