import { lookup } from 'dns/promises';
import { Pool, PoolConfig } from 'pg';

export async function createDatabasePool(
  connectionString: string,
): Promise<Pool> {
  const url = new URL(connectionString);
  const host = url.hostname;
  let resolvedHost = host;

  try {
    const records = await lookup(host, { all: true });
    const ipv4 = records.find((r) => r.family === 4);
    const ipv6 = records.find((r) => r.family === 6);
    resolvedHost = (ipv4 ?? ipv6)?.address ?? host;
  } catch {
    resolvedHost = host;
  }

  const config: PoolConfig = {
    host: resolvedHost,
    port: Number(url.port || 5432),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  };

  return new Pool(config);
}
