import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack for Docker compatibility
  turbo: undefined,
  
  // Docker-friendly configurations
  experimental: {
    // Disable Turbopack explicitly
    turbo: undefined,
  },
  
  // Ensure proper hot reloading in Docker
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  
  // Output configuration for better Docker support
  output: 'standalone',
};

export default nextConfig;
