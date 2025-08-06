import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function ThankYouPage() {
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mb-6" />
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Obrigado!</h1>
      <p className="text-lg text-gray-600 mb-8">
        Seu documento foi assinado com sucesso.
      </p>
      <p className="text-md text-gray-500 max-w-md">
        Uma cópia do documento final foi enviada para o seu e-mail para seus registros.
        Você pode fechar esta janela com segurança.
      </p>
      <div className="mt-10">
        <Link href="/">
          <Button>Voltar para a Página Inicial</Button>
        </Link>
      </div>
    </div>
  );
}
