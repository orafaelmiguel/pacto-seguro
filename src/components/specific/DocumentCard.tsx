import Link from 'next/link'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge' // Assuming you have a Badge component

interface DocumentCardProps {
  id: string
  title: string
  status: 'draft' | 'published' | 'archived' // Example statuses
  createdAt: string
}

export function DocumentCard({
  id,
  title,
  status,
  createdAt,
}: DocumentCardProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Link href={`/dashboard/documents/${id}`}>
      <Card className="hover:border-primary/80 transition-colors">
        <CardHeader>
          <CardTitle className="truncate">{title}</CardTitle>
          <CardDescription>Criado em: {formattedDate}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Badge
            variant={status === 'published' ? 'default' : 'secondary'}
            className="capitalize"
          >
            {status === 'draft' && 'Rascunho'}
            {status === 'published' && 'Publicado'}
            {status === 'archived' && 'Arquivado'}
          </Badge>
        </CardFooter>
      </Card>
    </Link>
  )
}
