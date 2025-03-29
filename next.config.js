/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['ngyaqhpamypvzwcxcabe.supabase.co'],
  },
  // Asegurarnos que Next.js no tenga problemas con las políticas de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  // Configuración de redirección de Supabase
  publicRuntimeConfig: {
    site: {
      url: process.env.NEXT_PUBLIC_SITE_URL || 'https://sistema-notas-2biu5wrfo-romero-projects.vercel.app',
    },
  },
};

module.exports = nextConfig;
