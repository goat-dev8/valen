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

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  readEnvLocal('NEXT_PUBLIC_API_URL') ??
  'http://localhost:3000';
const privyAppId =
  process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? readEnvLocal('NEXT_PUBLIC_PRIVY_APP_ID') ?? '';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(process.cwd()),
  env: {
    NEXT_PUBLIC_API_URL: apiUrl,
    NEXT_PUBLIC_PRIVY_APP_ID: privyAppId,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-select'],
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
