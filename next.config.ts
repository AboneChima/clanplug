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
    ],
  },
};

export default nextConfig;
