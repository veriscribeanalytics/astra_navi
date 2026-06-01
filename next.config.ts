import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://accounts.google.com/gsi/client${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com/gsi/style",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://api.veriscribeanalytics.com https://lh3.googleusercontent.com https://checkout.razorpay.com",
  `connect-src 'self' https://api.veriscribeanalytics.com https://api.razorpay.com https://accounts.google.com${isDev ? " ws: http://localhost:* http://127.0.0.1:*" : ""}`,
  "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://accounts.google.com",
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

  // Proxy backend static assets (e.g. avatar images) through the frontend
  // origin so `imageUrl` paths returned by /api/chat/avatars resolve without
  // the client needing to know the API host. The backend serves these from
  // /static/avatars/{NAME}_AVATAR.webp.
  async rewrites() {
    const backendUrl = process.env.AI_BACKEND_URL || 'https://api.veriscribeanalytics.com';
    return [
      {
        source: '/static/avatars/:path*',
        destination: `${backendUrl.replace(/\/$/, '')}/static/avatars/:path*`,
      },
    ];
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
