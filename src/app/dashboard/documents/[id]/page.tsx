import { createClient } from '../../../../../lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { DocumentEditForm } from './_components/DocumentEditForm'

interface DocumentEditPageProps {
  params: {
    id: string
  }
}

export default async function DocumentEditPage({
  params,
}: DocumentEditPageProps) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: document } = await supabase
    .from('documents')
    .select('id, title, content')
    .eq('id', params.id)
    .eq('user_id', user.id) // RLS also enforces this, but it's good practice
    .single()

  if (!document) {
    notFound()
  }

  // A página (Server Component) busca os dados e passa para o formulário (Client Component)
  return <DocumentEditForm document={document} />
}
