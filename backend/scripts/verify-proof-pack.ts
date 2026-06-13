import 'dotenv/config';

const API = process.env.PROVE_API_URL ?? 'http://127.0.0.1:3000';

async function check(path: string): Promise<{ ok: boolean; status: number; body?: unknown }> {
  const response = await fetch(`${API}${path}`, { headers: { Accept: 'application/json' } });
  const body = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, body };
}

async function main() {
  const pack = await check('/v1/public/proofs/pack');
  console.log('PROOF_PACK', pack.status, JSON.stringify(pack.body));

  const agent = await check('/v1/public/agents/valen');
  console.log('PUBLIC_AGENT', agent.status);

  if (!pack.ok || !agent.ok) {
    process.exitCode = 1;
    return;
  }

  const payload = pack.body as {
    proofVersion?: string;
    executions?: Array<{ id: string }>;
    refusals?: Array<{ id: string; evidenceHash?: string }>;
    payments?: Array<{ id: string; status?: string }>;
  };

  if (payload.proofVersion !== '1.0') {
    console.error('Unexpected proofVersion');
    process.exitCode = 1;
  }

  for (const execution of payload.executions ?? []) {
    const proof = await check(`/v1/public/proofs/executions/${execution.id}`);
    console.log('EXECUTION_PROOF', execution.id, proof.status);
    if (!proof.ok) process.exitCode = 1;
  }

  for (const refusal of payload.refusals ?? []) {
    const proof = await check(`/v1/public/proofs/refusals/${refusal.id}`);
    console.log('REFUSAL_PROOF', refusal.id, proof.status);
    if (!proof.ok) process.exitCode = 1;
  }

  for (const payment of payload.payments ?? []) {
    const proof = await check(`/v1/public/proofs/payments/${payment.id}`);
    console.log('PAYMENT_PROOF', payment.id, payment.status, proof.status);
    if (!proof.ok) process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
