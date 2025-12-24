import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: false, // ✅ stops validator.ts .js import issue
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
