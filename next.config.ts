import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const devConnectSrc = isDev
  ? ` ws: http://localhost:* http://127.0.0.1:* http://192.168.1.4:* ws://192.168.1.4:* http://192.168.1.9:* ws://192.168.1.9:*${
      process.env.DEV_ORIGIN
        ? (() => {
            const clean = process.env.DEV_ORIGIN.replace(/^(https?:\/\/)?/, "");
            const hostOnly = clean.split("/")[0];
            const ipOnly = hostOnly.split(":")[0];
            return ` http://${hostOnly} ws://${hostOnly} http://${ipOnly}:* ws://${ipOnly}:*`;
          })()
        : ""
    }`
  : "";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://accounts.google.com/gsi/client${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com/gsi/style",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://api.veriscribeanalytics.com https://lh3.googleusercontent.com https://checkout.razorpay.com https://storage.googleapis.com https://*.storage.googleapis.com",
  // Cloud TTS plays MP3 through an <audio> element fed a blob: URL. Without an
  // explicit media-src this falls back to default-src 'self', which blocks the
  // blob and forces the browser-speechSynthesis fallback (wrong voice for the
  // language). blob: covers the fetched-MP3 object URL.
  "media-src 'self' blob: https://api.veriscribeanalytics.com",
  `connect-src 'self' https://api.veriscribeanalytics.com https://api.razorpay.com https://accounts.google.com https://storage.googleapis.com https://*.storage.googleapis.com${devConnectSrc}`,
  "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://accounts.google.com",
].join("; ");

/**
 * AstraNavi Next.js Configuration
 * Optimized for production and security.
 */
const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: { root: process.cwd() },

  allowedDevOrigins: (() => {
    const rawOrigins = [
      "192.168.1.4",
      "192.168.1.4:3000",
      "192.168.1.4:3001",
      "192.168.1.4:3002",
      "192.168.1.4:3003",
      "192.168.1.9",
      "192.168.1.9:3000",
      "192.168.1.9:3001",
      "192.168.1.9:3002",
      "192.168.1.9:3003",
    ];
    if (process.env.DEV_ORIGIN) {
      const clean = process.env.DEV_ORIGIN.replace(/^(https?:\/\/)?/, "");
      const hostOnly = clean.split("/")[0];
      const ipOnly = hostOnly.split(":")[0];
      if (!rawOrigins.includes(clean)) rawOrigins.push(clean);
      if (!rawOrigins.includes(hostOnly)) rawOrigins.push(hostOnly);
      if (!rawOrigins.includes(ipOnly)) rawOrigins.push(ipOnly);
      if (!rawOrigins.includes(process.env.DEV_ORIGIN)) rawOrigins.push(process.env.DEV_ORIGIN);
    }
    const allOrigins: string[] = [];
    for (const o of rawOrigins) {
      allOrigins.push(o);
      if (!o.startsWith("http")) {
        allOrigins.push(`http://${o}`);
        allOrigins.push(`https://${o}`);
      }
    }
    return allOrigins;
  })(),

  // Image optimization - allow external sources if needed in future
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.veriscribeanalytics.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    minimumCacheTTL: 60,
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
