'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useTransition } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useToast } from '@/hooks/use-toast'
import { Loader2, PlusCircle, Trash2 } from 'lucide-react'
import { sendDocumentForSignature } from '../actions'

interface Recipient {
  name: string
  email: string
}

interface SendDocumentFormValues {
  recipients: Recipient[]
}

export function SendDocumentDialog({ documentId }: { documentId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<SendDocumentFormValues>({
    defaultValues: {
      recipients: [{ name: '', email: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'recipients',
  })

  const onSubmit = (data: SendDocumentFormValues) => {
    startTransition(async () => {
      const result = await sendDocumentForSignature(documentId, data.recipients)

      if (result.success) {
        toast({
          title: 'Documento enviado!',
          description: 'Os destinatários receberão um e-mail para assinatura.',
        })
        setIsOpen(false)
        reset()
      } else {
        toast({
          title: 'Erro ao enviar documento',
          description: result.error,
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Enviar para Assinatura</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Enviar para Assinatura</DialogTitle>
            <DialogDescription>
              Adicione os destinatários que devem assinar este documento. Eles
              receberão um link único por e-mail.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-2 pr-2">
                <div className="grid flex-1 gap-2">
                  <Label htmlFor={`recipients.${index}.name`}>Nome</Label>
                  <Input
                    id={`recipients.${index}.name`}
                    placeholder="Nome do destinatário"
                    {...register(`recipients.${index}.name`)}
                  />
                </div>
                <div className="grid flex-1 gap-2">
                  <Label htmlFor={`recipients.${index}.email`}>E-mail</Label>
                  <Input
                    id={`recipients.${index}.email`}
                    placeholder="email@exemplo.com"
                    type="email"
                    {...register(`recipients.${index}.email`, {
                      required: 'E-mail é obrigatório',
                    })}
                  />
                  {errors.recipients?.[index]?.email && (
                    <p className="text-sm text-red-500">
                      {errors.recipients[index].email.message}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={fields.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => append({ name: '', email: '' })}
              className="mt-2"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Destinatário
            </Button>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Documento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
