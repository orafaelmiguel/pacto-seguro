import { Suspense } from 'react'
import { createClient } from '../../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import { DocumentCard } from '@/components/specific/DocumentCard'
import { NewDocumentDialog } from './_components/NewDocumentDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { File } from 'lucide-react'
import { FilterControls } from './_components/FilterControls'

type Recipient = {
  id: string
  name: string
  email: string
  status: 'pending' | 'viewed' | 'signed'
}

interface DocumentWithDetails {
  document_id: string
  title: string
  status: 'draft' | 'sent' | 'completed'
  created_at: string
  recipients: Recipient[] | null
}

export default function DocumentsPage({
  searchParams,
}: {
  searchParams?: {
    q?: string
    status?: 'draft' | 'sent' | 'completed' | 'all'
  }
}) {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meus Documentos</h1>
        <NewDocumentDialog />
      </header>
      
      <FilterControls />

      <Suspense fallback={<DocumentsGridSkeleton />}>
        <DocumentsList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function DocumentsList({
  searchParams,
}: {
  searchParams?: {
    q?: string
    status?: 'draft' | 'sent' | 'completed' | 'all'
  }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const status = searchParams?.status
  const query = searchParams?.q

  const { data: documents, error } = await supabase.rpc(
    'get_documents_with_details',
    {
      status_filter: status === 'all' ? null : status,
      search_query: query || null,
    }
  )

  if (error) {
    console.error(error)
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
          {status || query 
            ? "Tente ajustar seus filtros ou busca."
            : "Crie seu primeiro documento para começar."}
        </p>
        <div className="mt-6">
          <NewDocumentDialog />
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {(documents as DocumentWithDetails[]).map((doc) => (
        <DocumentCard
          key={doc.document_id}
          id={doc.document_id}
          title={doc.title}
          status={doc.status}
          createdAt={doc.created_at}
          recipients={doc.recipients || undefined}
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
