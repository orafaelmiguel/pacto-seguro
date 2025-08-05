import { Suspense } from 'react'
import { createClient } from '../../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DocumentCard } from '@/components/specific/DocumentCard'
import { createDocument } from './actions'
import { Skeleton } from '@/components/ui/skeleton'
import { File } from 'lucide-react'

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meus Documentos</h1>
        <form action={createDocument}>
          <Button>Novo Documento</Button>
        </form>
      </header>
      <Suspense fallback={<DocumentsGridSkeleton />}>
        <DocumentsList />
      </Suspense>
    </div>
  )
}

async function DocumentsList() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, title, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    // TODO: Add a proper error component
    return <p className="text-destructive">Erro ao carregar documentos.</p>
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
        <File className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-xl font-semibold">
          Nenhum documento encontrado
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Crie seu primeiro documento para começar a gerenciar seus termos.
        </p>
        <form action={createDocument} className="mt-6">
          <Button>Criar Novo Documento</Button>
        </form>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          id={doc.id}
          title={doc.title}
          status={doc.status as any} // Cast because Supabase gen types might not be perfect
          createdAt={doc.created_at}
        />
      ))}
    </div>
  )
}

function DocumentsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2 rounded-lg border p-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="pt-4">
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}
