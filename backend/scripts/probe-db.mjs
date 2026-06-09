import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;
const password = process.env.DB_PASSWORD;
const ref = process.env.SUPABASE_PROJECT_REF ?? 'rxumjewkgkxabpqustkk';
if (!password) {
  console.error('Set DB_PASSWORD env var');
  process.exit(1);
}
const prefixes = ['aws-0', 'aws-1'];
const regions = [
  'us-east-1', 'us-west-1', 'eu-west-1', 'eu-central-1', 'eu-west-2',
  'eu-west-3', 'eu-north-1', 'ap-southeast-1', 'ap-northeast-1', 'ap-south-1', 'sa-east-1',
];
const ports = [6543, 5432];

for (const prefix of prefixes) {
  for (const region of regions) {
    for (const port of ports) {
      const host = `${prefix}-${region}.pooler.supabase.com`;
      const client = new Client({
        host,
        port,
        user: `postgres.${ref}`,
        password,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 6000,
      });
      try {
        await client.connect();
        await client.query('SELECT 1 AS ok');
        console.log('SUCCESS', { host, port, user: `postgres.${ref}` });
        console.log(
          `DATABASE_URL=postgresql://postgres.${ref}:${encodeURIComponent(password)}@${host}:${port}/postgres`,
        );
        await client.end();
        process.exit(0);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (!msg.includes('ENOTFOUND') && !msg.includes('ETIMEDOUT') && !msg.includes('ECONNREFUSED')) {
          console.log('HINT', host, port, msg);
        }
        try { await client.end(); } catch { /* ignore */ }
      }
    }
  }
}

console.log('No pooler match');
process.exit(1);
