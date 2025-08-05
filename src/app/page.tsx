// src/app/page.tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold">Bem-vindo ao Pacto Seguro</h1>
      <p className="mt-4">Sua solução para assinaturas com prova de entendimento.</p>
      <div className="mt-8 space-x-4">
        <Link href="/login" className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
          Login
        </Link>
        <Link href="/register" className="px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">
          Registrar
        </Link>
      </div>
    </div>
  );
}
