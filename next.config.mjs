/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // ATENÇÃO: Substitua 'your-project-id' pelo ID do seu projeto no Supabase.
        // Você pode encontrar isso na URL do seu dashboard do Supabase.
        hostname: 'https://sandxpwlxmourswppysg.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/avatars/**',
      },
    ],
  },
}

export default nextConfig
