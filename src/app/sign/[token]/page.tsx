import { createClient } from '../../../../lib/supabase/client'
import { notFound } from 'next/navigation'
import { generateHTML } from '@tiptap/html/server'
import StarterKit from '@tiptap/starter-kit'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Tipagem para os dados que esperamos da Edge Function
interface DocumentData {
  name: string
  email: string
  status: 'pending' | 'viewed' | 'signed'
  document: {
    title: string
    content: any // O conteúdo do TipTap é um JSON
  }
}

interface SignPageProps {
  params: {
    token: string
  }
}

// A função generateHTML precisa de uma lista de extensões do TipTap
const extensions = [StarterKit]

export default async function SignPage({ params }: SignPageProps) {
  const { token } = params
  const supabase = createClient()

  // 1. Invocar a Edge Function de forma segura
  const { data, error } = await supabase.functions.invoke<DocumentData>(
    'get-document-for-signing',
    {
      body: { accessToken: token },
    }
  )

  // 2. Se a função retornar erro ou não encontrar dados, mostrar 404
  if (error || !data) {
    console.error('Erro ao invocar a Edge Function:', error)
    notFound()
  }

  // 3. Gerar o HTML a partir do conteúdo JSON do TipTap
  const contentHtml = generateHTML(data.document.content, extensions)

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        
        <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Pacto Seguro</h1>
            <p className="text-md text-gray-600">Você foi convidado para assinar o seguinte documento.</p>
        </header>

        <Card className="shadow-lg">
          <CardHeader>
            <div className='flex justify-between items-start'>
                <div>
                    <CardTitle className="text-2xl mb-2">{data.document.title}</CardTitle>
                    <p className="text-sm text-gray-500">
                        Destinatário: {data.name || 'Não informado'} ({data.email})
                    </p>
                </div>
                 <Badge variant={data.status === 'signed' ? 'default' : 'secondary'}>
                    {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-lg max-w-none border-t border-b py-8"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-6 bg-gray-50/50 p-6">
            <h3 className="font-semibold text-lg">Confirmar Assinatura</h3>
            <p className="text-sm text-gray-600">
                Para confirmar a sua assinatura, por favor digite seu nome completo no campo abaixo.
                Este ato tem validade jurídica.
            </p>
            <div className='w-full space-y-2'>
                <Label htmlFor="signature-name">Seu Nome Completo</Label>
                <Input id="signature-name" placeholder="Digite seu nome aqui..." className="bg-white"/>
            </div>
            <Button size="lg" className="w-full">
              Assinar Documento
            </Button>
          </CardFooter>
        </Card>

        <footer className="mt-8 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Pacto Seguro. Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  )
}
