import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Transpile workspace packages
  transpilePackages: ['@dealforge/ui', '@dealforge/types', '@dealforge/database'],

  // WASM support (for future calc-engine integration)
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Handle WASM files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    return config;
  },

  // Image optimization configuration
  images: {
    remotePatterns: [
      // Add remote image patterns as needed
      // { hostname: 'avatars.githubusercontent.com' },
    ],
  },

  // Experimental features
  experimental: {
    // Type-safe routes (disabled for initial scaffolding, enable when routes are stable)
    // typedRoutes: true,
  },
};

export default nextConfig;
