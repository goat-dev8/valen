import 'dotenv/config';
import { keccak256, stringToHex } from 'viem';
import { Pool } from 'pg';

const API = process.env.PROVE_API_URL ?? 'http://127.0.0.1:3000';
const ORG_ID = process.env.PROVE_ORG_ID ?? '702be0ea-c4cb-4f26-a37d-adaeb1b2081b';
const AGENT_ID = process.env.PROVE_AGENT_ID ?? '64f56184-eacf-4eef-bc84-f3b863d3894f';
const MANDATE_ID = process.env.PROVE_MANDATE_ID ?? '6ef127ee-c1f2-494a-ba3a-fee940623242';
const TARGET_ADDRESS = process.env.PROVE_TARGET_ADDRESS ?? '0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3';
const USDC = '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d';
const AMOUNT = process.env.PROVE_AMOUNT ?? '1.5';

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const operatorKey = process.env.OPERATOR_DASHBOARD_SECRET;
  if (!operatorKey) throw new Error('OPERATOR_DASHBOARD_SECRET is required');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const idempotencyKey = `phase-f-budget-refused-${Date.now()}`;
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
      targetChainId: 421614,
      targetAddress: TARGET_ADDRESS,
      assetAddress: USDC,
      assetSymbol: 'USDC',
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
  for (let i = 0; i < 90; i++) {
    const row = await pool.query(`SELECT status FROM executions WHERE id = $1`, [executionId]);
    finalExecutionStatus = row.rows[0]?.status;
    if (['risk_failed', 'policy_rejected', 'failed', 'executed'].includes(finalExecutionStatus)) {
      break;
    }
    await sleep(3000);
  }

  console.log('EXECUTION_STATUS', finalExecutionStatus);

  const risk = await pool.query(
    `SELECT score, tier, factor_summary FROM risk_scores WHERE execution_id = $1 ORDER BY calculated_at DESC LIMIT 1`,
    [executionId],
  );
  console.log('RISK', JSON.stringify(risk.rows[0] ?? null));

  const budgetEvent = await pool.query(
    `SELECT kind, amount, remaining, evidence_hash, metadata FROM budget_events WHERE execution_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [executionId],
  );
  console.log('BUDGET_EVENT', JSON.stringify(budgetEvent.rows[0] ?? null));

  const settlement = await pool.query(
    `SELECT id, status FROM settlements WHERE execution_id = $1`,
    [executionId],
  );
  console.log('SETTLEMENT_COUNT', settlement.rows.length);

  await pool.end();

  const factor = risk.rows[0]?.factor_summary as { model?: string; reasonCode?: string } | undefined;
  if (
    finalExecutionStatus !== 'risk_failed' ||
    settlement.rows.length > 0 ||
    factor?.model !== 'budget-engine'
  ) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
