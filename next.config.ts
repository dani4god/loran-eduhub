import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Updated: Use only remotePatterns (domains is deprecated)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        pathname: '/**',
      },
    ],
  },

  // ✅ Keep experimental serverActions (this is fine)
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },

  // ✅ Environment variables exposed to browser
  env: {
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY,
  },

  // ✅ Redirects configuration (keep as is)
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard/overview',
        permanent: true,
      },
      {
        source: '/admin',
        destination: '/admin/overview',
        permanent: true,
      },
    ];
  },

  // ✅ Headers for security (keep as is)
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },

  // ✅ Turbopack config (replaces webpack)
  turbopack: {
    // For video file handling with Turbopack
    rules: {
      '*.mp4': {
        type: 'asset',
      },
      '*.webm': {
        type: 'asset',
      },
    },
  },

  // ✅ Type checking options
  typescript: {
    ignoreBuildErrors: false,
  },

  // ✅ Output configuration
  output: 'standalone',

  // ✅ Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
};

export default nextConfig;