'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { SignaturePad, SignaturePadRef } from '@/components/specific/SignaturePad'
import { submitSignature } from '../actions'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

// Tipagem dos dados que este componente recebe
interface DocumentData {
  name: string | null
  email: string
  status: 'pending' | 'viewed' | 'signed'
  document: {
    title: string
    content: any
  }
}

interface SignFormProps {
  token: string
  initialData: DocumentData
  contentHtml: string
}

export function SignForm({ token, initialData, contentHtml }: SignFormProps) {
  const [signerName, setSignerName] = useState(initialData.name || '')
  const [hasDrawn, setHasDrawn] = useState(false)
  const [hasConsented, setHasConsented] = useState(false)
  const [isPending, startTransition] = useTransition()
  const signaturePadRef = useRef<SignaturePadRef>(null)
  const { toast } = useToast()
  const router = useRouter()

  const isSubmitDisabled = !hasDrawn || !hasConsented || !signerName || isPending

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitDisabled) return

    const signatureDataUrl = signaturePadRef.current?.getSignatureDataUrl()
    if (!signatureDataUrl) {
      toast({
        title: 'Assinatura inválida',
        description: 'Por favor, assine no campo indicado.',
        variant: 'destructive',
      })
      return
    }

    startTransition(async () => {
      const result = await submitSignature({
        token,
        signatureDataUrl,
        signerName,
      })

      if (result.success) {
        toast({
          title: 'Documento assinado com sucesso!',
          description: 'Obrigado por utilizar o Pacto Seguro.',
        })
        // Opcional: redirecionar para uma página de agradecimento
        // router.push('/thank-you'); 
      } else {
        toast({
          title: 'Erro ao assinar',
          description: result.message || 'Não foi possível completar a assinatura.',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Pacto Seguro</h1>
        <p className="text-md text-gray-600">
          Você foi convidado para assinar o seguinte documento.
        </p>
      </header>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl mb-2">{initialData.document.title}</CardTitle>
                <p className="text-sm text-gray-500">
                  Destinatário: {initialData.name || 'Não informado'} ({initialData.email})
                </p>
              </div>
              <Badge variant={initialData.status === 'signed' ? 'default' : 'secondary'}>
                {initialData.status.charAt(0).toUpperCase() + initialData.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-lg max-w-none border-t border-b py-8"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-6 bg-gray-50/50 p-6">
            <div className="w-full space-y-2">
              <Label>Sua Assinatura Digital</Label>
              <SignaturePad ref={signaturePadRef} onEnd={() => setHasDrawn(true)} />
            </div>

            <div className='w-full space-y-2'>
              <Label htmlFor="signer-name">Seu Nome Completo (como na assinatura)</Label>
              <Input 
                id="signer-name" 
                placeholder="Digite seu nome completo aqui..." 
                className="bg-white"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="consent" checked={hasConsented} onCheckedChange={(checked) => setHasConsented(Boolean(checked))} />
              <Label htmlFor="consent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Eu li, entendi e concordo com os termos e condições apresentados neste documento.
              </Label>
            </div>

            <Button size="lg" className="w-full" type="submit" disabled={isSubmitDisabled}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assinar e Enviar
            </Button>
          </CardFooter>
        </Card>
      </form>

      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Pacto Seguro. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
