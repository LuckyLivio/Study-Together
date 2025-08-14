import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // skip ESLint
  },
  typescript: {
    ignoreBuildErrors: true, // skip TypeScript type errors
  },
};

export default nextConfig;
