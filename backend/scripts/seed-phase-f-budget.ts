import 'dotenv/config';
import { Pool } from 'pg';
import { createHash } from 'crypto';

const ORG_ID = process.env.PROVE_ORG_ID ?? '702be0ea-c4cb-4f26-a37d-adaeb1b2081b';
const AGENT_ID = process.env.PROVE_AGENT_ID ?? '64f56184-eacf-4eef-bc84-f3b863d3894f';
const USDC = '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d';
const CAP = process.env.PHASE_F_CAP ?? '1000000';

function hashPayload(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const resetsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const evidenceHash = hashPayload({
    agentId: AGENT_ID,
    chainId: 421614,
    assetAddress: USDC,
    cap: CAP,
    resetsAt: resetsAt.toISOString(),
  });

  const result = await pool.query(
    `INSERT INTO agent_budgets (
       organization_id, agent_id, chain_id, asset_address, asset_symbol,
       cap, spent, evidence_hash, resets_at
     )
     VALUES ($1,$2,421614,$3,'USDC',$4,0,$5,$6)
     ON CONFLICT (agent_id, chain_id, asset_address) DO UPDATE SET
       cap = EXCLUDED.cap,
       spent = 0,
       status = 'active',
       evidence_hash = EXCLUDED.evidence_hash,
       period_started_at = now(),
       resets_at = EXCLUDED.resets_at,
       updated_at = now()
     RETURNING id, cap, spent, status, evidence_hash`,
    [ORG_ID, AGENT_ID, USDC, CAP, evidenceHash, resetsAt],
  );

  console.log('BUDGET_SEEDED', JSON.stringify(result.rows[0]));
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
