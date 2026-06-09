import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '../../backend/supabase/migrations');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

async function run() {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS _valen_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const applied = await client.query('SELECT filename FROM _valen_migrations ORDER BY filename');
  const appliedSet = new Set(applied.rows.map((r) => r.filename));

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
      await client.query('INSERT INTO _valen_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  }

  const seedPath = join(__dirname, '../../backend/supabase/seed.sql');
  try {
    const seed = readFileSync(seedPath, 'utf8');
    console.log('apply seed.sql');
    await client.query(seed);
  } catch {
    console.log('seed.sql skipped or already applied');
  }

  await client.end();
  console.log('migrations complete');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
