import type { NextConfig } from "next";

/**
 * AstraNavi Next.js Configuration
 * Optimized for production and security.
 */
const nextConfig: NextConfig = {
  reactCompiler: true,

  allowedDevOrigins: ['192.168.1.4'],

  // Image optimization - allow external sources if needed in future
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Security Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
