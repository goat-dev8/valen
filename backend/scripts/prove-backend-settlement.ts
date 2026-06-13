/**
 * Phase 5.3 proof: operator API → Queue → Worker → Stylus → Settlement (no fixture metadata).
 */
import 'dotenv/config';
import { keccak256, stringToHex } from 'viem';
import { Pool } from 'pg';

const API = process.env.PROVE_API_URL ?? 'http://127.0.0.1:3000';
const ORG_ID = process.env.PROVE_ORG_ID ?? 'a98c4fa6-3bd5-469b-bf50-fac19940df78';
const AGENT_ID = process.env.PROVE_AGENT_ID ?? '6f7ff745-671f-4969-a444-e527fa196249';
const MANDATE_ID = process.env.PROVE_MANDATE_ID;
const CHAIN_ID = Number(process.env.PROVE_CHAIN_ID ?? '421614');
const DEPLOYER = '0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3';
const TARGET_ADDRESS = process.env.PROVE_TARGET_ADDRESS ?? DEPLOYER;
const ASSET =
  process.env.PROVE_ASSET_ADDRESS ??
  (CHAIN_ID === 46630
    ? '0x7E955252E15c84f5768B83c41a71F9eba181802F'
    : '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d');
const ASSET_SYMBOL = process.env.PROVE_ASSET_SYMBOL ?? (CHAIN_ID === 46630 ? 'USDG' : 'USDC');
const AMOUNT = process.env.PROVE_AMOUNT ?? '0.001';

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const operatorKey = process.env.OPERATOR_DASHBOARD_SECRET;
  if (!operatorKey) {
    throw new Error('OPERATOR_DASHBOARD_SECRET is required');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  if (!MANDATE_ID) {
    throw new Error('PROVE_MANDATE_ID is required for Phase C governed execution proof');
  }
  const idempotencyKey = `phase-c-${ASSET_SYMBOL.toLowerCase()}-${Date.now()}`;
  const payloadHash = keccak256(stringToHex(`payload-${idempotencyKey}`));

  const createRes = await fetch(`${API}/v1/operator/organizations/${ORG_ID}/executions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-operator-key': operatorKey,
    },
    body: JSON.stringify({
      agentId: AGENT_ID,
      idempotencyKey,
      actionType: 'transfer',
      targetChainId: CHAIN_ID,
      targetAddress: TARGET_ADDRESS,
      assetAddress: ASSET,
      assetSymbol: ASSET_SYMBOL,
      amount: AMOUNT,
      mandateId: MANDATE_ID,
      payloadHash,
    }),
  });

  const created = (await createRes.json()) as { id?: string; message?: string };
  if (!createRes.ok || !created.id) {
    throw new Error(`Create execution failed: ${createRes.status} ${JSON.stringify(created)}`);
  }

  const executionId = created.id;
  console.log('EXECUTION_CREATED', executionId);

  let finalExecutionStatus = 'created';
  for (let i = 0; i < 180; i++) {
    const row = await pool.query(`SELECT status, metadata FROM executions WHERE id = $1`, [
      executionId,
    ]);
    finalExecutionStatus = row.rows[0]?.status;
    const onchain = row.rows[0]?.metadata?.onchain;
    if (onchain?.complianceHash && !String(onchain.complianceHash).startsWith('0x8888')) {
      console.log('ATTESTATION_STORED', onchain.complianceHash);
    }
    if (['executed', 'failed'].includes(finalExecutionStatus)) {
      break;
    }
    await sleep(5000);
  }

  console.log('EXECUTION_STATUS', finalExecutionStatus);

  const settlement = await pool.query(
    `SELECT id, status, tx_hash, submit_tx_hash, approve_tx_hash, on_chain_settlement_id, block_number, failure_reason
     FROM settlements
     WHERE execution_id = $1
     ORDER BY
       CASE status WHEN 'confirmed' THEN 0 WHEN 'erc20_settled' THEN 0 WHEN 'prepared' THEN 1 WHEN 'pending' THEN 2 ELSE 3 END,
       created_at DESC
     LIMIT 1`,
    [executionId],
  );
  console.log('SETTLEMENT', JSON.stringify(settlement.rows[0] ?? null));

  const auditRows = await pool.query(
    `SELECT action, tx_hash, chain_id, created_at FROM audit_logs
     WHERE entity_id = $1 OR entity_id = $2
     ORDER BY created_at DESC LIMIT 10`,
    [executionId, settlement.rows[0]?.id ?? executionId],
  );
  console.log('AUDIT_LOGS', JSON.stringify(auditRows.rows));

  await pool.end();

  if (
    finalExecutionStatus !== 'executed' ||
    !['confirmed', 'erc20_settled'].includes(settlement.rows[0]?.status)
  ) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
