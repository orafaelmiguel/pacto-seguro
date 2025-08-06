import { createClient } from '../../../../lib/supabase/client'
import { notFound } from 'next/navigation'
import { generateHTML } from '@tiptap/html/server'
import StarterKit from '@tiptap/starter-kit'
import { SignForm } from './_components/SignForm'

// Tipagem para os dados que esperamos da Edge Function
interface DocumentData {
  name: string | null
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

  // 4. Renderiza o formulário do lado do cliente, passando os dados
  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <SignForm token={token} initialData={data} contentHtml={contentHtml} />
    </div>
  )
}
