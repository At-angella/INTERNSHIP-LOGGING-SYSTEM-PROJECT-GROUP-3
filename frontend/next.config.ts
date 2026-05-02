import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Helps with paths containing spaces
  distDir: '.next',
  
  typescript: {
    ignoreBuildErrors: false,
  },
  
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Turbopack config (empty is fine)
  turbopack: {},
};

export default nextConfig;