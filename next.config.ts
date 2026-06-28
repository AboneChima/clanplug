import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  // Add cache control headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
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
