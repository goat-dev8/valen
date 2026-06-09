import { lookup } from 'dns/promises';
import { Client } from 'pg';

const password = process.env.DB_PASSWORD ?? '';
const ref = process.env.SUPABASE_PROJECT_REF ?? 'rxumjewkgkxabpqustkk';
const regions = [
  'us-east-1',
  'us-west-1',
  'eu-west-1',
  'eu-central-1',
  'eu-west-2',
  'eu-west-3',
  'eu-north-1',
  'ap-southeast-1',
  'ap-northeast-1',
  'ap-south-1',
  'sa-east-1',
];

async function tryConnect(label: string, config: {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}): Promise<boolean> {
  const client = new Client({ ...config, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
  try {
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    console.log(`OK ${label}`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`FAIL ${label}: ${message}`);
    try { await client.end(); } catch { /* ignore */ }
    return false;
  }
}

async function main(): Promise<void> {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    try {
      const records = await lookup(host, { all: true });
      const hasIpv4 = records.some((r) => r.family === 4);
      if (!hasIpv4) continue;
    } catch {
      continue;
    }
    const ok = await tryConnect(`pooler-${region}`, {
      host,
      port: 6543,
      user: `postgres.${ref}`,
      password,
      database: 'postgres',
    });
    if (ok) {
      console.log(`DATABASE_URL=postgresql://postgres.${ref}:${encodeURIComponent(password)}@${host}:6543/postgres`);
      return;
    }
  }
  console.log('No working pooler endpoint found');
  process.exit(1);
}

main();
