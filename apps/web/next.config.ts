/**
 * Next.js configuration for the web app.
 * - Skips type/ESLint checks during build (handled separately)
 * - Enables minimal server minification
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverMinification: true,
  }
};

export default nextConfig;
