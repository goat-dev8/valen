import type { NextConfig } from 'next';
import fs from 'node:fs';
import path from 'node:path';

function readEnvLocal(key: string): string | undefined {
  try {
    const content = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      if (trimmed.slice(0, eq).trim() === key) {
        return trimmed.slice(eq + 1).trim();
      }
    }
  } catch {
    /* .env.local optional */
  }
  return undefined;
}

const RENDER_API_URL = 'https://valen-api-m3g4.onrender.com';

function resolveRenderApiUrl(): string {
  const value =
    process.env.NEXT_PUBLIC_API_URL ??
    readEnvLocal('NEXT_PUBLIC_API_URL') ??
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    readEnvLocal('NEXT_PUBLIC_BACKEND_URL') ??
    process.env.BACKEND_URL ??
    readEnvLocal('BACKEND_URL') ??
    RENDER_API_URL;

  if (!value.startsWith(RENDER_API_URL)) {
    throw new Error(`Frontend backend URL must target Render API: ${RENDER_API_URL}`);
  }

  return value;
}

const apiUrl = resolveRenderApiUrl();
const privyAppId =
  process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? readEnvLocal('NEXT_PUBLIC_PRIVY_APP_ID') ?? '';

const monorepoRoot = path.resolve(process.cwd(), '..');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: monorepoRoot,
  eslint: {
    ignoreDuringBuilds: process.env.VALEN_BUILD_FAST === '1',
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  env: {
    NEXT_PUBLIC_API_URL: apiUrl,
    NEXT_PUBLIC_PRIVY_APP_ID: privyAppId,
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@tanstack/react-query',
      'viem',
    ],
  },
  outputFileTracingIncludes: {
    '/api/contracts': [
      './frontend/src/data/manifests/**/*',
      './contracts/deployments/**/*',
      './stylus/deployments/**/*',
    ],
  },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@stripe/crypto': false,
      '@farcaster/mini-app-solana': false,
    };
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      {
        module: /ox[\\/]_esm[\\/]tempo[\\/]internal[\\/]virtualMasterPool/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
