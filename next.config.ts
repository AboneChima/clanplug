import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force new build IDs to bust JS/CSS cache
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  // Ensure Turbopack uses the web folder as the workspace root
  turbopack: {
    root: __dirname,
  },
  reactCompiler: true,
  // Disable styled-jsx to prevent hydration mismatch
  compiler: {
    styledJsx: false,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://clanplug-brieltm9y-oracles-projects-0d30db20.vercel.app',
  },
  // Add aggressive cache control headers to prevent stale content
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'no-store',
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'no-store',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          {
            key: 'Surrogate-Control',
            value: 'no-store',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'api.clanplug.site',
      },
      {
        protocol: 'http',
        hostname: '176.57.189.248',
      },
    ],
  },
};

export default nextConfig;
