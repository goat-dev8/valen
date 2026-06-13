/**
 * Runs ERC-20 settlement proofs for USDC, USDG, and all Robinhood stock tokens.
 * Logs to stdout and backend/robinhood-settlement-proofs.log
 */
import 'dotenv/config';
import { appendFileSync } from 'fs';
import { join } from 'path';
import { keccak256, stringToHex } from 'viem';
import { Pool } from 'pg';

const LOG = join(__dirname, '..', 'robinhood-settlement-proofs.log');
const API = process.env.PROVE_API_URL ?? 'http://127.0.0.1:3000';
const ORG_ID = process.env.PROVE_ORG_ID ?? '702be0ea-c4cb-4f26-a37d-adaeb1b2081b';
const AGENT_ID = process.env.PROVE_AGENT_ID ?? '64f56184-eacf-4eef-bc84-f3b863d3894f';
const ARB_MANDATE = process.env.PROVE_ARB_MANDATE_ID ?? '6ef127ee-c1f2-494a-ba3a-fee940623242';
const RH_MANDATE = process.env.PROVE_MANDATE_ID ?? 'aab33461-c700-4df7-bbc2-742019d49354';
const TARGET = process.env.PROVE_TARGET_ADDRESS ?? '0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3';

const CASES = [
  { chainId: 421614, symbol: 'USDC', address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', amount: '0.001', mandateId: ARB_MANDATE, decimals: 6 },
  { chainId: 46630, symbol: 'USDG', address: '0x7E955252E15c84f5768B83c41a71F9eba181802F', amount: '0.001', mandateId: RH_MANDATE, decimals: 6 },
  { chainId: 46630, symbol: 'TSLA', address: '0xC9f9c86933092BbbfFF3CCb4b105A4A94bf3Bd4E', amount: '0.001', mandateId: RH_MANDATE, decimals: 18 },
  { chainId: 46630, symbol: 'AMZN', address: '0x5884aD2f920c162CFBbACc88C9C51AA75eC09E02', amount: '0.001', mandateId: RH_MANDATE, decimals: 18 },
  { chainId: 46630, symbol: 'PLTR', address: '0x1FBE1a0e43594b3455993B5dE5Fd0A7A266298d0', amount: '0.001', mandateId: RH_MANDATE, decimals: 18 },
  { chainId: 46630, symbol: 'NFLX', address: '0x3b8262A63d25f0477c4DDE23F83cfe22Cb768C93', amount: '0.001', mandateId: RH_MANDATE, decimals: 18 },
  { chainId: 46630, symbol: 'AMD', address: '0x71178BAc73cBeb415514eB542a8995b82669778d', amount: '0.001', mandateId: RH_MANDATE, decimals: 18 },
] as const;

function log(line: string) {
  const msg = `[${new Date().toISOString()}] ${line}`;
  console.log(msg);
  appendFileSync(LOG, `${msg}\n`);
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function proveCase(
  pool: Pool,
  operatorKey: string,
  spec: (typeof CASES)[number],
): Promise<{ ok: boolean; executionId?: string; settlement?: unknown }> {
  const idempotencyKey = `robinhood-${spec.symbol.toLowerCase()}-${Date.now()}`;
  const payloadHash = keccak256(stringToHex(`payload-${idempotencyKey}`));

  const createRes = await fetch(`${API}/v1/operator/organizations/${ORG_ID}/executions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-operator-key': operatorKey },
    body: JSON.stringify({
      agentId: AGENT_ID,
      idempotencyKey,
      actionType: 'transfer',
      targetChainId: spec.chainId,
      targetAddress: TARGET,
      assetAddress: spec.address,
      assetSymbol: spec.symbol,
      amount: spec.amount,
      mandateId: spec.mandateId,
      payloadHash,
    }),
  });

  const created = (await createRes.json()) as { id?: string; message?: string };
  if (!createRes.ok || !created.id) {
    log(`FAIL ${spec.symbol}: create ${createRes.status} ${JSON.stringify(created)}`);
    return { ok: false };
  }

  const executionId = created.id;
  log(`START ${spec.symbol} execution=${executionId}`);

  let status = 'created';
  for (let i = 0; i < 120; i++) {
    const row = await pool.query(`SELECT status FROM executions WHERE id = $1`, [executionId]);
    status = row.rows[0]?.status;
    if (['executed', 'failed', 'risk_failed', 'policy_rejected', 'compliance_failed'].includes(status)) {
      break;
    }
    await sleep(5000);
  }

  const settlement = await pool.query(
    `SELECT id, status, tx_hash, submit_tx_hash, approve_tx_hash, execute_tx_hash, failure_reason
     FROM settlements WHERE execution_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [executionId],
  );

  const ok =
    status === 'executed' &&
    ['confirmed', 'erc20_settled'].includes(settlement.rows[0]?.status ?? '');

  log(
    `${ok ? 'PASS' : 'FAIL'} ${spec.symbol} status=${status} settlement=${JSON.stringify(settlement.rows[0] ?? null)}`,
  );
  return { ok, executionId, settlement: settlement.rows[0] ?? null };
}

async function main() {
  const operatorKey = process.env.OPERATOR_DASHBOARD_SECRET;
  if (!operatorKey) throw new Error('OPERATOR_DASHBOARD_SECRET is required');

  log(`=== Robinhood settlement batch start API=${API} ===`);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const results: Array<{ symbol: string; ok: boolean; executionId?: string }> = [];

  for (const spec of CASES) {
    const result = await proveCase(pool, operatorKey, spec);
    results.push({ symbol: spec.symbol, ok: result.ok, executionId: result.executionId });
    await sleep(3000);
  }

  await pool.end();
  const passed = results.filter((r) => r.ok).length;
  log(`=== COMPLETE ${passed}/${results.length} PASS ===`);
  log(JSON.stringify(results, null, 2));

  if (passed !== results.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  log(`FATAL ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
