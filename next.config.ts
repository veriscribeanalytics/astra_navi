import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self'${isDev ? " 'unsafe-eval' 'unsafe-inline'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://api.veriscribeanalytics.com https://lh3.googleusercontent.com",
  `connect-src 'self' https://api.veriscribeanalytics.com${isDev ? " ws: http://localhost:* http://127.0.0.1:*" : ""}`,
].join("; ");

/**
 * AstraNavi Next.js Configuration
 * Optimized for production and security.
 */
const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: { root: process.cwd() },

  allowedDevOrigins: process.env.DEV_ORIGIN ? [process.env.DEV_ORIGIN] : [],

  // Image optimization - allow external sources if needed in future
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.veriscribeanalytics.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
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
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
