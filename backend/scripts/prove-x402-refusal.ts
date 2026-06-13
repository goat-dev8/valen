import 'dotenv/config';
import { Pool } from 'pg';

const API = process.env.PROVE_API_URL ?? 'http://127.0.0.1:3000';
const ORG_ID = process.env.PROVE_ORG_ID ?? '702be0ea-c4cb-4f26-a37d-adaeb1b2081b';
const AGENT_ID = process.env.PROVE_AGENT_ID ?? '64f56184-eacf-4eef-bc84-f3b863d3894f';
const MANDATE_ID = process.env.PROVE_MANDATE_ID ?? '6ef127ee-c1f2-494a-ba3a-fee940623242';

async function main() {
  const operatorKey = process.env.OPERATOR_DASHBOARD_SECRET;
  if (!operatorKey) throw new Error('OPERATOR_DASHBOARD_SECRET is required');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const initiateRes = await fetch(`${API}/v1/operator/organizations/${ORG_ID}/x402/initiate`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-operator-key': operatorKey,
    },
    body: JSON.stringify({
      agentId: AGENT_ID,
      mandateId: MANDATE_ID,
      merchantUrl: 'https://example.com/paid-resource',
      recipient: '0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3',
      amount: '1.5',
      chainId: 421614,
    }),
  });

  const initiated = (await initiateRes.json()) as {
    paymentId?: string;
    status?: string;
    refusalReason?: string;
    proofUrl?: string;
  };
  console.log('X402_INITIATE', JSON.stringify(initiated));

  if (!initiateRes.ok || !initiated.paymentId) {
    await pool.end();
    process.exit(1);
  }

  const payment = await pool.query(
    `SELECT id, status, refusal_reason, evidence_hash FROM x402_payments WHERE id = $1`,
    [initiated.paymentId],
  );
  console.log('X402_DB', JSON.stringify(payment.rows[0] ?? null));

  const publicProof = await fetch(`${API}/v1/public/proofs/payments/${initiated.paymentId}`);
  console.log('PUBLIC_PAYMENT_PROOF_STATUS', publicProof.status);

  await pool.end();

  if (initiated.status !== 'refused' || initiated.refusalReason !== 'budget_exceeded') {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
