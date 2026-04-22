import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    // Skip type checking during production builds (handled in dev)
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    // If deployed on Vercel, proxy all /api/ requests to the Render backend
    if (process.env.RENDER_BACKEND_URL) {
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.RENDER_BACKEND_URL}/api/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;


