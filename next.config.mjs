/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'standalone', // Temporarily disabled for Railway deployment
  images: {
    remotePatterns: [
      {
        hostname: 's2.googleusercontent.com',
      },
    ],
  },
  serverExternalPackages: ['pdf-parse'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle vm2's optional dependencies
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'coffee-script': false,
      };
      // Ignore vm2's bridge.js dynamic require warnings
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        { module: /vm2/ },
      ];
    }
    return config;
  },
};

export default nextConfig;
