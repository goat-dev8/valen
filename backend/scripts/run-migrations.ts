import { lookup } from 'dns/promises';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { Client, ClientConfig } from 'pg';

const migrationsDir = join(__dirname, '../supabase/migrations');
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

async function buildClientConfig(): Promise<ClientConfig> {
  const url = new URL(databaseUrl!);
  const host = url.hostname;
  let resolvedHost = host;
  try {
    const result = await lookup(host, { all: true });
    const ipv4 = result.find((r) => r.family === 4);
    const ipv6 = result.find((r) => r.family === 6);
    resolvedHost = (ipv4 ?? ipv6)?.address ?? host;
    console.log(`resolved ${host} -> ${resolvedHost}`);
  } catch {
    console.warn(`DNS lookup failed for ${host}, using hostname directly`);
  }
  return {
    host: resolvedHost,
    port: Number(url.port || 5432),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
    ssl: { rejectUnauthorized: false },
  };
}

async function run(): Promise<void> {
  const client = new Client(await buildClientConfig());
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS _valen_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const applied = await client.query(
    'SELECT filename FROM _valen_migrations ORDER BY filename',
  );
  const appliedSet = new Set(applied.rows.map((r) => r.filename as string));

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`skip ${file}`);
      continue;
    }
    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    console.log(`apply ${file}`);
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query(
        'INSERT INTO _valen_migrations (filename) VALUES ($1)',
        [file],
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  const seedPath = join(__dirname, '../supabase/seed.sql');
  try {
    const seed = readFileSync(seedPath, 'utf8');
    console.log('apply seed.sql');
    await client.query(seed);
  } catch {
    console.log('seed.sql skipped');
  }

  await client.end();
  console.log('migrations complete');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
