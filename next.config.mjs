/** @type {import('next').NextConfig} */
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  // Service worker source file
  swSrc: 'src/sw.ts',
  // Output path in public directory
  swDest: 'public/sw.js',
  // Disable in development for easier debugging
  disable: process.env.NODE_ENV === 'development',
  // Cache all Next.js static assets
  additionalPrecacheEntries: [],
});

const nextConfig = withSerwist({
  experimental: {
    // Required for App Router + Serwist compatibility
    serverComponentsExternalPackages: ['@serwist/next'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Headers for PWA
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },
});

export default nextConfig;
