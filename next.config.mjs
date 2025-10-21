/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        hostname: 's2.googleusercontent.com',
      },
    ],
  },
  serverExternalPackages: ['pdf-parse'],
  experimental: {
    // Enable longer API route timeouts
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
